/*
  # Complete Database Reset Migration

  This migration safely drops all custom database objects while avoiding
  system catalog column reference errors.
*/

-- Drop all triggers first to avoid dependency issues
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers on public schema tables
    FOR r IN (
        SELECT n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND NOT t.tgisinternal
    ) 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.schema_name) || '.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if there are issues with trigger dropping
        NULL;
END $$;

-- Drop all custom functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS increment_post_views(uuid) CASCADE;
DROP FUNCTION IF EXISTS increment_promotion_views(uuid) CASCADE;
DROP FUNCTION IF EXISTS increment_promotion_clicks(uuid) CASCADE;
DROP FUNCTION IF EXISTS track_post_engagement(uuid, text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS track_promotion_engagement(uuid, text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS create_user_session(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_post_analytics_summary() CASCADE;
DROP FUNCTION IF EXISTS get_promotion_analytics_summary() CASCADE;
DROP FUNCTION IF EXISTS calculate_reading_time() CASCADE;
DROP FUNCTION IF EXISTS create_post_analytics() CASCADE;
DROP FUNCTION IF EXISTS update_comments_count() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_promotion_analytics() CASCADE;

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

-- Drop storage bucket contents and buckets
DO $$
BEGIN
    -- Delete all objects from buckets
    DELETE FROM storage.objects WHERE bucket_id = 'blog-images';
    DELETE FROM storage.objects WHERE bucket_id = 'avatars';
    
    -- Delete the buckets themselves
    DELETE FROM storage.buckets WHERE id = 'blog-images';
    DELETE FROM storage.buckets WHERE id = 'avatars';
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if storage tables don't exist or other errors
        NULL;
END $$;

-- Drop all custom policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all custom policies on public schema tables using correct system catalog
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if there are issues with policy dropping
        NULL;
END $$;

-- Drop any custom types
DROP TYPE IF EXISTS user_role CASCADE;

-- Drop any custom sequences
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) 
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if there are issues with sequence dropping
        NULL;
END $$;

-- Drop any custom views
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    ) 
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if there are issues with view dropping
        NULL;
END $$;

-- Clean up any remaining custom indexes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE 'pg_%'
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_key'
    ) 
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE';
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Continue if there are issues with index dropping
        NULL;
END $$;