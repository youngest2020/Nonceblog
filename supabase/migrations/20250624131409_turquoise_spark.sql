/*
  # Add Simple Analytics Functions

  1. Functions
    - `increment_post_views` - Simple function to increment post view count
    - `increment_promotion_views` - Simple function to increment promotion view count  
    - `increment_promotion_clicks` - Simple function to increment promotion click count

  2. Security
    - Functions are accessible to all users for analytics tracking
*/

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update post analytics
  INSERT INTO post_analytics (post_id, views, unique_views, likes, shares, comments_count)
  VALUES (post_id, 1, 1, 0, 0, 0)
  ON CONFLICT (post_id) 
  DO UPDATE SET 
    views = post_analytics.views + 1,
    unique_views = post_analytics.unique_views + 1,
    last_viewed = now(),
    updated_at = now();
END;
$$;

-- Function to increment promotion views
CREATE OR REPLACE FUNCTION increment_promotion_views(promotion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update promotion analytics
  INSERT INTO promotion_analytics (promotion_id, total_views, unique_views, total_clicks, unique_clicks)
  VALUES (promotion_id, 1, 1, 0, 0)
  ON CONFLICT (promotion_id) 
  DO UPDATE SET 
    total_views = promotion_analytics.total_views + 1,
    unique_views = promotion_analytics.unique_views + 1,
    updated_at = now();
END;
$$;

-- Function to increment promotion clicks
CREATE OR REPLACE FUNCTION increment_promotion_clicks(promotion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update promotion analytics
  INSERT INTO promotion_analytics (promotion_id, total_views, unique_views, total_clicks, unique_clicks)
  VALUES (promotion_id, 0, 0, 1, 1)
  ON CONFLICT (promotion_id) 
  DO UPDATE SET 
    total_clicks = promotion_analytics.total_clicks + 1,
    unique_clicks = promotion_analytics.unique_clicks + 1,
    click_through_rate = CASE 
      WHEN promotion_analytics.total_views > 0 
      THEN (promotion_analytics.total_clicks + 1)::numeric / promotion_analytics.total_views * 100
      ELSE 0 
    END,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_post_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_promotion_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_promotion_clicks(uuid) TO anon, authenticated;