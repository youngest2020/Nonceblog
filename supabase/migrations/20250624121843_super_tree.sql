/*
  # Add view counter functionality

  1. New Functions
    - `increment_post_views` function to safely increment view counts
  
  2. Changes
    - Add view tracking capability for blog posts
*/

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the post analytics views count
  INSERT INTO post_analytics (post_id, views, last_viewed)
  VALUES (post_id, 1, now())
  ON CONFLICT (post_id)
  DO UPDATE SET 
    views = post_analytics.views + 1,
    last_viewed = now(),
    updated_at = now();
END;
$$;