/*
  # Fix post analytics RLS policies

  1. Security Updates
    - Allow anonymous users to insert post analytics for view tracking
    - Allow authenticated users to manage all post analytics
    - Ensure proper read permissions for analytics data

  2. Changes
    - Add policy for anonymous users to insert view analytics
    - Update existing policies to be more permissive for analytics tracking
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Authenticated users can read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "post_analytics_auth_all" ON post_analytics;

-- Create new policies that allow proper analytics tracking
CREATE POLICY "Anyone can insert post analytics"
  ON post_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read post analytics"
  ON post_analytics
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update post analytics"
  ON post_analytics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete post analytics"
  ON post_analytics
  FOR DELETE
  TO authenticated
  USING (true);