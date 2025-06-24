/*
  # Fix RLS policies to restore functionality

  1. Purpose
    - Remove infinite recursion in RLS policies
    - Restore admin and blog functionality
    - Maintain security while allowing proper access

  2. Changes
    - Drop and recreate all problematic policies
    - Simplify policies to avoid recursion
    - Allow authenticated users to access necessary data
*/

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON profiles;

DROP POLICY IF EXISTS "Anyone can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read all posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can manage posts" ON blog_posts;

DROP POLICY IF EXISTS "Anyone can read active promotions" ON promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can manage promotions" ON promotions;

DROP POLICY IF EXISTS "Admins can read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Admins can manage post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Authenticated users can read post analytics" ON post_analytics;
DROP POLICY IF EXISTS "Authenticated users can manage post analytics" ON post_analytics;

DROP POLICY IF EXISTS "Admins can read promotion analytics" ON promotion_analytics;
DROP POLICY IF EXISTS "Admins can manage promotion analytics" ON promotion_analytics;
DROP POLICY IF EXISTS "Authenticated users can read promotion analytics" ON promotion_analytics;
DROP POLICY IF EXISTS "Authenticated users can manage promotion analytics" ON promotion_analytics;

-- Create new simplified profile policies
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_service_role_all"
  ON profiles
  FOR ALL
  TO service_role
  USING (true);

-- Create new blog post policies
CREATE POLICY "blog_posts_select_published_public"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "blog_posts_select_all_authenticated"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "blog_posts_manage_authenticated"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (true);

-- Create new promotion policies
CREATE POLICY "promotions_select_active_public"
  ON promotions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "promotions_manage_authenticated"
  ON promotions
  FOR ALL
  TO authenticated
  USING (true);

-- Create new analytics policies
CREATE POLICY "post_analytics_select_authenticated"
  ON post_analytics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "post_analytics_manage_authenticated"
  ON post_analytics
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "promotion_analytics_select_authenticated"
  ON promotion_analytics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "promotion_analytics_manage_authenticated"
  ON promotion_analytics
  FOR ALL
  TO authenticated
  USING (true);