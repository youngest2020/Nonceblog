/*
  # Fix promotion analytics functions and constraints

  1. Database Changes
    - Add unique constraint to promotion_views table for proper upsert operations
    - Create missing RPC functions for analytics tracking
    - Add missing RPC functions for analytics summaries

  2. Functions Created
    - track_promotion_engagement: Track promotion views and clicks
    - track_post_engagement: Track post engagement events
    - create_user_session: Create or update user sessions
    - get_post_analytics_summary: Get aggregated post analytics
    - get_promotion_analytics_summary: Get aggregated promotion analytics

  3. Security
    - All functions are accessible to public for tracking
    - Proper error handling included
*/

-- Add unique constraint to promotion_views for proper upsert operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'promotion_views_unique_engagement' 
    AND table_name = 'promotion_views'
  ) THEN
    ALTER TABLE promotion_views 
    ADD CONSTRAINT promotion_views_unique_engagement 
    UNIQUE (promotion_id, visitor_id, viewed_at::date);
  END IF;
END $$;

-- Create track_promotion_engagement function
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
BEGIN
  IF p_event_type = 'view' THEN
    -- Insert or update promotion view
    INSERT INTO promotion_views (
      promotion_id,
      visitor_id,
      viewed_at,
      user_agent,
      referrer
    )
    VALUES (
      p_promotion_id,
      p_visitor_id,
      now(),
      COALESCE(p_event_data->>'user_agent', ''),
      COALESCE(p_event_data->>'referrer', '')
    )
    ON CONFLICT (promotion_id, visitor_id, viewed_at::date)
    DO UPDATE SET
      viewed_at = now(),
      user_agent = COALESCE(EXCLUDED.user_agent, promotion_views.user_agent),
      referrer = COALESCE(EXCLUDED.referrer, promotion_views.referrer);
      
  ELSIF p_event_type = 'click' THEN
    -- Update existing view record to mark as clicked
    UPDATE promotion_views 
    SET 
      clicked = true,
      clicked_at = now()
    WHERE promotion_id = p_promotion_id 
      AND visitor_id = p_visitor_id 
      AND viewed_at::date = now()::date
      AND clicked = false;
  END IF;
END;
$$;

-- Create track_post_engagement function
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
BEGIN
  -- Insert engagement event
  INSERT INTO engagement_events (
    session_id,
    event_type,
    target_type,
    target_id,
    event_data,
    timestamp
  )
  SELECT 
    us.id,
    p_event_type,
    'post',
    p_post_id,
    p_event_data,
    now()
  FROM user_sessions us
  WHERE us.session_id = p_session_id
  LIMIT 1;

  -- Update post analytics based on event type
  IF p_event_type = 'view' THEN
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
            AND ee.timestamp < now() - interval '1 minute'
        ) THEN 1 ELSE 0 END,
      last_viewed = now(),
      updated_at = now();
      
  ELSIF p_event_type = 'like' THEN
    UPDATE post_analytics 
    SET likes = likes + 1, updated_at = now()
    WHERE post_id = p_post_id;
    
  ELSIF p_event_type = 'share' THEN
    UPDATE post_analytics 
    SET shares = shares + 1, updated_at = now()
    WHERE post_id = p_post_id;
  END IF;
END;
$$;

-- Create create_user_session function
CREATE OR REPLACE FUNCTION create_user_session(
  p_session_id text,
  p_visitor_id text,
  p_user_agent text DEFAULT '',
  p_referrer text DEFAULT '',
  p_landing_page text DEFAULT '/'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_sessions (
    session_id,
    visitor_id,
    user_agent,
    referrer,
    landing_page,
    session_start
  )
  VALUES (
    p_session_id,
    p_visitor_id,
    p_user_agent,
    p_referrer,
    p_landing_page,
    now()
  )
  ON CONFLICT (session_id) 
  DO UPDATE SET
    page_views = user_sessions.page_views + 1,
    session_end = now();
END;
$$;

-- Add unique constraint to user_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_sessions_session_id_key' 
    AND table_name = 'user_sessions'
  ) THEN
    ALTER TABLE user_sessions 
    ADD CONSTRAINT user_sessions_session_id_key 
    UNIQUE (session_id);
  END IF;
END $$;

-- Create get_post_analytics_summary function
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
    COUNT(*)::bigint as total_posts,
    COALESCE(SUM(pa.views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.likes), 0)::bigint as total_likes,
    COALESCE(SUM(pa.shares), 0)::bigint as total_shares,
    COALESCE(SUM(pa.comments_count), 0)::bigint as total_comments,
    COALESCE(AVG(
      CASE 
        WHEN pa.views > 0 THEN 
          ((pa.likes + pa.shares + pa.comments_count)::numeric / pa.views::numeric) * 100
        ELSE 0 
      END
    ), 0) as avg_engagement_rate
  FROM blog_posts bp
  LEFT JOIN post_analytics pa ON bp.id = pa.post_id
  WHERE bp.is_published = true;
END;
$$;

-- Create get_promotion_analytics_summary function
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
    COUNT(*)::bigint as total_promotions,
    COALESCE(SUM(pa.total_views), 0)::bigint as total_views,
    COALESCE(SUM(pa.unique_views), 0)::bigint as total_unique_views,
    COALESCE(SUM(pa.total_clicks), 0)::bigint as total_clicks,
    COALESCE(SUM(pa.unique_clicks), 0)::bigint as total_unique_clicks,
    COALESCE(AVG(pa.click_through_rate), 0) as avg_click_through_rate
  FROM promotions p
  LEFT JOIN promotion_analytics pa ON p.id = pa.promotion_id
  WHERE p.is_active = true;
END;
$$;

-- Grant execute permissions to public for all functions
GRANT EXECUTE ON FUNCTION track_promotion_engagement TO public;
GRANT EXECUTE ON FUNCTION track_post_engagement TO public;
GRANT EXECUTE ON FUNCTION create_user_session TO public;
GRANT EXECUTE ON FUNCTION get_post_analytics_summary TO public;
GRANT EXECUTE ON FUNCTION get_promotion_analytics_summary TO public;