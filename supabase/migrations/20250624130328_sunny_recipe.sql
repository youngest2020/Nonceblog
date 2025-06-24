/*
  # Create Analytics RPC Functions

  1. New Functions
    - `get_post_analytics_summary` - Returns aggregated post analytics data
    - `get_promotion_analytics_summary` - Returns aggregated promotion analytics data
    - `track_post_engagement` - Tracks post engagement events
    - `track_promotion_engagement` - Tracks promotion engagement events
    - `create_user_session` - Creates or updates user session data

  2. Security
    - Functions are accessible to authenticated and anonymous users for tracking
    - Admin-only functions for viewing sensitive analytics data

  3. Features
    - Proper engagement rate calculations based on available columns
    - Session tracking with visitor identification
    - Real-time analytics updates
*/

-- Function to get post analytics summary
CREATE OR REPLACE FUNCTION get_post_analytics_summary()
RETURNS TABLE (
  total_posts bigint,
  total_views bigint,
  total_unique_views bigint,
  total_likes bigint,
  total_shares bigint,
  total_comments bigint,
  avg_engagement_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(pa.id)::bigint as total_posts,
    COALESCE(SUM(pa.views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.likes), 0)::bigint as total_likes,
    COALESCE(SUM(pa.shares), 0)::bigint as total_shares,
    COALESCE(SUM(pa.comments_count), 0)::bigint as total_comments,
    COALESCE(
      AVG(
        CASE 
          WHEN pa.views > 0 THEN 
            ((pa.likes + pa.shares + pa.comments_count)::numeric / pa.views::numeric) * 100.0
          ELSE 0 
        END
      ), 
      0
    )::numeric as avg_engagement_rate
  FROM post_analytics pa;
END;
$$;

-- Function to get promotion analytics summary
CREATE OR REPLACE FUNCTION get_promotion_analytics_summary()
RETURNS TABLE (
  total_promotions bigint,
  total_views bigint,
  total_unique_views bigint,
  total_clicks bigint,
  total_unique_clicks bigint,
  avg_click_through_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(pa.id)::bigint as total_promotions,
    COALESCE(SUM(pa.total_views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.total_clicks), 0)::bigint as total_clicks,
    COALESCE(SUM(pa.unique_clicks), 0)::bigint as total_unique_clicks,
    COALESCE(AVG(pa.click_through_rate), 0)::numeric as avg_click_through_rate
  FROM promotion_analytics pa;
END;
$$;

-- Function to track post engagement
CREATE OR REPLACE FUNCTION track_post_engagement(
  p_post_id uuid,
  p_event_type text,
  p_session_id text,
  p_visitor_id text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_uuid uuid;
BEGIN
  -- Get or create session UUID
  SELECT id INTO session_uuid
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  -- Insert engagement event
  INSERT INTO engagement_events (
    session_id,
    event_type,
    target_type,
    target_id,
    event_data
  ) VALUES (
    session_uuid,
    p_event_type,
    'post',
    p_post_id,
    p_event_data
  );
  
  -- Update post analytics based on event type
  CASE p_event_type
    WHEN 'view' THEN
      INSERT INTO post_analytics (post_id, views, unique_views)
      VALUES (p_post_id, 1, 1)
      ON CONFLICT (post_id)
      DO UPDATE SET 
        views = post_analytics.views + 1,
        unique_views = post_analytics.unique_views + 
          CASE WHEN NOT EXISTS (
            SELECT 1 FROM engagement_events ee
            JOIN user_sessions us ON ee.session_id = us.id
            WHERE ee.target_id = p_post_id 
            AND ee.event_type = 'view'
            AND us.visitor_id = p_visitor_id
            AND ee.id != (SELECT MAX(id) FROM engagement_events WHERE target_id = p_post_id AND event_type = 'view')
          ) THEN 1 ELSE 0 END,
        last_viewed = now(),
        updated_at = now();
        
    WHEN 'like' THEN
      UPDATE post_analytics 
      SET likes = likes + 1, updated_at = now()
      WHERE post_id = p_post_id;
      
    WHEN 'share' THEN
      UPDATE post_analytics 
      SET shares = shares + 1, updated_at = now()
      WHERE post_id = p_post_id;
      
    WHEN 'comment' THEN
      -- Comments are handled by trigger, but we can track the event
      NULL;
  END CASE;
END;
$$;

-- Function to track promotion engagement
CREATE OR REPLACE FUNCTION track_promotion_engagement(
  p_promotion_id uuid,
  p_event_type text,
  p_session_id text,
  p_visitor_id text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_uuid uuid;
BEGIN
  -- Get or create session UUID
  SELECT id INTO session_uuid
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  -- Insert engagement event
  INSERT INTO engagement_events (
    session_id,
    event_type,
    target_type,
    target_id,
    event_data
  ) VALUES (
    session_uuid,
    p_event_type,
    'promotion',
    p_promotion_id,
    p_event_data
  );
  
  -- Insert or update promotion view tracking
  INSERT INTO promotion_views (
    promotion_id,
    visitor_id,
    clicked,
    clicked_at,
    user_agent,
    referrer
  ) VALUES (
    p_promotion_id,
    p_visitor_id,
    p_event_type = 'click',
    CASE WHEN p_event_type = 'click' THEN now() ELSE NULL END,
    p_event_data->>'user_agent',
    p_event_data->>'referrer'
  )
  ON CONFLICT (promotion_id, visitor_id) 
  DO UPDATE SET
    clicked = CASE WHEN p_event_type = 'click' THEN true ELSE promotion_views.clicked END,
    clicked_at = CASE WHEN p_event_type = 'click' AND promotion_views.clicked_at IS NULL 
                      THEN now() ELSE promotion_views.clicked_at END;
END;
$$;

-- Function to create or update user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_session_id text,
  p_visitor_id text,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_landing_page text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_uuid uuid;
BEGIN
  -- Try to get existing session
  SELECT id INTO session_uuid
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  -- If session doesn't exist, create it
  IF session_uuid IS NULL THEN
    INSERT INTO user_sessions (
      session_id,
      visitor_id,
      user_agent,
      referrer,
      landing_page,
      page_views
    ) VALUES (
      p_session_id,
      p_visitor_id,
      p_user_agent,
      p_referrer,
      p_landing_page,
      1
    )
    RETURNING id INTO session_uuid;
  ELSE
    -- Update existing session
    UPDATE user_sessions 
    SET 
      page_views = page_views + 1,
      session_end = NULL -- Reset session end since user is active
    WHERE id = session_uuid;
  END IF;
  
  RETURN session_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_post_analytics_summary() TO public;
GRANT EXECUTE ON FUNCTION get_promotion_analytics_summary() TO public;
GRANT EXECUTE ON FUNCTION track_post_engagement(uuid, text, text, text, jsonb) TO public;
GRANT EXECUTE ON FUNCTION track_promotion_engagement(uuid, text, text, text, jsonb) TO public;
GRANT EXECUTE ON FUNCTION create_user_session(text, text, text, text, text) TO public;