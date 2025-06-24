/*
  # Complete fix for RLS policies and infinite loading

  1. Purpose
    - Remove all problematic policies causing infinite recursion
    - Create simple, working policies that don't cause conflicts
    - Ensure public blog access works without authentication
    - Fix admin authentication flow

  2. Changes
    - Drop ALL existing policies to start fresh
    - Create minimal, non-recursive policies
    - Allow public access to published blog posts
    - Simplify authentication requirements
*/

-- Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_analytics DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
    
    -- Drop all policies on blog_posts
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'blog_posts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON blog_posts';
    END LOOP;
    
    -- Drop all policies on promotions
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'promotions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON promotions';
    END LOOP;
    
    -- Drop all policies on post_analytics
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'post_analytics') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON post_analytics';
    END LOOP;
    
    -- Drop all policies on promotion_analytics
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'promotion_analytics') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON promotion_analytics';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_analytics ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies

-- Profiles: Users can only see their own profile
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Blog posts: Public can read published posts, authenticated users can manage
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT TO public
  USING (is_published = true);

CREATE POLICY "blog_posts_auth_all" ON blog_posts
  FOR ALL TO authenticated
  USING (true);

-- Promotions: Public can read active promotions, authenticated users can manage
CREATE POLICY "promotions_public_read" ON promotions
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "promotions_auth_all" ON promotions
  FOR ALL TO authenticated
  USING (true);

-- Analytics: Only authenticated users can access
CREATE POLICY "post_analytics_auth_all" ON post_analytics
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "promotion_analytics_auth_all" ON promotion_analytics
  FOR ALL TO authenticated
  USING (true);