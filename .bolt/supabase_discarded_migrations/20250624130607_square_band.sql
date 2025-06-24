/*
  # Fix Analytics Database Constraints and Functions

  1. Database Schema Updates
    - Add unique constraint on user_sessions table for session_id
    - Ensure proper constraints for analytics tracking

  2. RPC Functions
    - create_user_session: Create or update user session data
    - track_post_engagement: Track post engagement events
    - track_promotion_engagement: Track promotion engagement events
    - get_post_analytics_summary: Get aggregated post analytics
    - get_promotion_analytics_summary: Get aggregated promotion analytics

  3. Security
    - Maintain existing RLS policies
    - Ensure proper access controls for analytics functions
*/

-- Add unique constraint to user_sessions table for session_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_sessions' 
    AND constraint_name = 'user_sessions_session_id_key'
  ) THEN
    ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_session_id_key UNIQUE (session_id);
  END IF;
END $$;

-- Create or replace the create_user_session function
CREATE OR REPLACE FUNCTION create_user_session(
  p_session_id TEXT,
  p_visitor_id TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  INSERT INTO user_sessions (
    session_id,
    visitor_id,
    user_agent,
    referrer,
    landing_page,
    session_start,
    page_views,
    total_time_spent
  ) VALUES (
    p_session_id,
    p_visitor_id,
    p_user_agent,
    p_referrer,
    p_landing_page,
    NOW(),
    1,
    0
  )
  ON CONFLICT (session_id) 
  DO UPDATE SET
    page_views = user_sessions.page_views + 1,
    updated_at = NOW()
  RETURNING id INTO session_uuid;
  
  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the track_post_engagement function
CREATE OR REPLACE FUNCTION track_post_engagement(
  p_post_id UUID,
  p_event_type TEXT,
  p_session_id TEXT,
  p_visitor_id TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  -- Get or create session
  SELECT id INTO session_uuid 
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  -- Insert engagement event
  INSERT INTO engagement_events (
    session_id,
    event_type,
    target_type,
    target_id,
    event_data,
    timestamp
  ) VALUES (
    session_uuid,
    p_event_type,
    'post',
    p_post_id,
    p_event_data,
    NOW()
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
            AND ee.timestamp < NOW() - INTERVAL '1 minute'
          ) THEN 1 ELSE 0 END,
        last_viewed = NOW(),
        updated_at = NOW();
    
    WHEN 'like' THEN
      UPDATE post_analytics 
      SET likes = likes + 1, updated_at = NOW()
      WHERE post_id = p_post_id;
    
    WHEN 'share' THEN
      UPDATE post_analytics 
      SET shares = shares + 1, updated_at = NOW()
      WHERE post_id = p_post_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the track_promotion_engagement function
CREATE OR REPLACE FUNCTION track_promotion_engagement(
  p_promotion_id UUID,
  p_event_type TEXT,
  p_session_id TEXT,
  p_visitor_id TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  -- Get or create session
  SELECT id INTO session_uuid 
  FROM user_sessions 
  WHERE session_id = p_session_id;
  
  -- Insert engagement event
  INSERT INTO engagement_events (
    session_id,
    event_type,
    target_type,
    target_id,
    event_data,
    timestamp
  ) VALUES (
    session_uuid,
    p_event_type,
    'promotion',
    p_promotion_id,
    p_event_data,
    NOW()
  );
  
  -- Track promotion view/click
  INSERT INTO promotion_views (
    promotion_id,
    visitor_id,
    viewed_at,
    clicked,
    clicked_at,
    user_agent,
    referrer
  ) VALUES (
    p_promotion_id,
    p_visitor_id,
    NOW(),
    p_event_type = 'click',
    CASE WHEN p_event_type = 'click' THEN NOW() ELSE NULL END,
    p_event_data->>'user_agent',
    p_event_data->>'referrer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the get_post_analytics_summary function
CREATE OR REPLACE FUNCTION get_post_analytics_summary()
RETURNS TABLE (
  total_posts BIGINT,
  total_views BIGINT,
  total_unique_views BIGINT,
  total_likes BIGINT,
  total_shares BIGINT,
  total_comments BIGINT,
  avg_engagement_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pa.post_id)::BIGINT as total_posts,
    COALESCE(SUM(pa.views), 0)::BIGINT as total_views,
    COALESCE(SUM(pa.unique_views), 0)::BIGINT as total_unique_views,
    COALESCE(SUM(pa.likes), 0)::BIGINT as total_likes,
    COALESCE(SUM(pa.shares), 0)::BIGINT as total_shares,
    COALESCE(SUM(pa.comments_count), 0)::BIGINT as total_comments,
    COALESCE(
      CASE 
        WHEN SUM(pa.views) > 0 THEN 
          (SUM(pa.likes + pa.shares + pa.comments_count)::NUMERIC / SUM(pa.views)::NUMERIC) * 100
        ELSE 0 
      END, 
      0
    ) as avg_engagement_rate
  FROM post_analytics pa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the get_promotion_analytics_summary function
CREATE OR REPLACE FUNCTION get_promotion_analytics_summary()
RETURNS TABLE (
  total_promotions BIGINT,
  total_views BIGINT,
  total_unique_views BIGINT,
  total_clicks BIGINT,
  total_unique_clicks BIGINT,
  avg_click_through_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pa.promotion_id)::BIGINT as total_promotions,
    COALESCE(SUM(pa.total_views), 0)::BIGINT as total_views,
    COALESCE(SUM(pa.unique_views), 0)::BIGINT as total_unique_views,
    COALESCE(SUM(pa.total_clicks), 0)::BIGINT as total_clicks,
    COALESCE(SUM(pa.unique_clicks), 0)::BIGINT as total_unique_clicks,
    COALESCE(AVG(pa.click_through_rate), 0) as avg_click_through_rate
  FROM promotion_analytics pa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION create_user_session TO PUBLIC;
GRANT EXECUTE ON FUNCTION track_post_engagement TO PUBLIC;
GRANT EXECUTE ON FUNCTION track_promotion_engagement TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_post_analytics_summary TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_promotion_analytics_summary TO PUBLIC;