/*
  # Fix Analytics Database Issues

  1. Database Schema Updates
    - Add unique constraint to user_sessions.session_id
    - Create missing RPC functions for analytics

  2. New Functions
    - `increment_post_views` - Safely increment post view counts
    - `increment_promotion_views` - Safely increment promotion view counts  
    - `increment_promotion_clicks` - Safely increment promotion click counts

  3. Security
    - Functions are accessible to public for analytics tracking
    - Proper error handling and conflict resolution
*/

-- Add unique constraint to user_sessions.session_id if it doesn't exist
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

-- Create function to safely increment post views
CREATE OR REPLACE FUNCTION increment_post_views(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update post analytics
  INSERT INTO post_analytics (post_id, views, unique_views, last_viewed, updated_at)
  VALUES (target_post_id, 1, 1, now(), now())
  ON CONFLICT (post_id)
  DO UPDATE SET 
    views = post_analytics.views + 1,
    last_viewed = now(),
    updated_at = now();
    
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request
    RAISE WARNING 'Failed to increment post views for post_id %: %', target_post_id, SQLERRM;
END;
$$;

-- Create function to safely increment promotion views
CREATE OR REPLACE FUNCTION increment_promotion_views(target_promotion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update promotion analytics
  INSERT INTO promotion_analytics (promotion_id, total_views, unique_views, updated_at)
  VALUES (target_promotion_id, 1, 1, now())
  ON CONFLICT (promotion_id)
  DO UPDATE SET 
    total_views = promotion_analytics.total_views + 1,
    updated_at = now();
    
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request
    RAISE WARNING 'Failed to increment promotion views for promotion_id %: %', target_promotion_id, SQLERRM;
END;
$$;

-- Create function to safely increment promotion clicks
CREATE OR REPLACE FUNCTION increment_promotion_clicks(target_promotion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update promotion analytics
  INSERT INTO promotion_analytics (promotion_id, total_clicks, unique_clicks, updated_at)
  VALUES (target_promotion_id, 1, 1, now())
  ON CONFLICT (promotion_id)
  DO UPDATE SET 
    total_clicks = promotion_analytics.total_clicks + 1,
    click_through_rate = CASE 
      WHEN promotion_analytics.total_views > 0 
      THEN ROUND(((promotion_analytics.total_clicks + 1)::numeric / promotion_analytics.total_views::numeric) * 100, 2)
      ELSE 0 
    END,
    updated_at = now();
    
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request
    RAISE WARNING 'Failed to increment promotion clicks for promotion_id %: %', target_promotion_id, SQLERRM;
END;
$$;

-- Grant execute permissions to public (for analytics tracking)
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO public;
GRANT EXECUTE ON FUNCTION increment_promotion_views(uuid) TO public;
GRANT EXECUTE ON FUNCTION increment_promotion_clicks(uuid) TO public;