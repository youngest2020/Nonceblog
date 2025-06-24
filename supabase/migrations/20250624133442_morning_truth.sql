/*
  # Erase all database tables and policies

  1. Drop all custom tables
  2. Drop all custom functions
  3. Drop all custom policies
  4. Clean up storage buckets
  
  This migration will completely reset the database while keeping the UI/UX intact.
*/

-- Drop all custom functions first
DROP FUNCTION IF EXISTS increment_post_views(uuid);
DROP FUNCTION IF EXISTS increment_promotion_views(uuid);
DROP FUNCTION IF EXISTS increment_promotion_clicks(uuid);
DROP FUNCTION IF EXISTS track_post_engagement(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS track_promotion_engagement(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS create_user_session(text, text, text, text, text);
DROP FUNCTION IF EXISTS get_post_analytics_summary();
DROP FUNCTION IF EXISTS get_promotion_analytics_summary();
DROP FUNCTION IF EXISTS calculate_reading_time();
DROP FUNCTION IF EXISTS create_post_analytics();
DROP FUNCTION IF EXISTS update_comments_count();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_promotion_analytics();

-- Drop all custom tables (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS engagement_events CASCADE;
DROP TABLE IF EXISTS promotion_views CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS promotion_analytics CASCADE;
DROP TABLE IF EXISTS post_analytics CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop storage bucket and policies
DELETE FROM storage.objects WHERE bucket_id = 'blog-images';
DELETE FROM storage.buckets WHERE id = 'blog-images';
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Drop any remaining custom policies on auth tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all custom policies
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Clean up any custom types
DROP TYPE IF EXISTS user_role CASCADE;

-- Reset sequences if any exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') 
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
END $$;