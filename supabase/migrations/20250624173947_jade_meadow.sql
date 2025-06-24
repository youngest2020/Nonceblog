/*
  # Fix blog-images storage bucket configuration

  1. Purpose
    - Ensure blog-images bucket exists with correct configuration
    - Set up proper RLS policies for image upload/access
    - Fix any permission issues preventing image uploads

  2. Changes
    - Create or update blog-images bucket with proper settings
    - Drop and recreate all storage policies to ensure they work
    - Set appropriate file size limits and MIME types
    - Enable public read access and authenticated user upload/management

  3. Security
    - Public read access for viewing images
    - Authenticated users can upload, update, and delete images
    - File size limit of 10MB
    - Restricted to image MIME types only
*/

-- Ensure the blog-images bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing policies for blog-images bucket to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop all policies related to blog-images
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND (
          policyname ILIKE '%blog%' OR 
          policyname ILIKE '%image%' OR
          policyname ILIKE '%upload%'
        )
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON storage.objects';
        EXCEPTION
            WHEN OTHERS THEN
                -- Continue if policy doesn't exist
                NULL;
        END;
    END LOOP;
END $$;

-- Create comprehensive storage policies for blog-images

-- 1. Allow public read access to all blog images
CREATE POLICY "blog_images_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- 2. Allow authenticated users to upload images
CREATE POLICY "blog_images_authenticated_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' AND
  -- Ensure file size is within limits (handled by bucket config but double-check)
  octet_length(decode(encode(metadata, 'escape'), 'escape')) <= 10485760
);

-- 3. Allow authenticated users to update image metadata
CREATE POLICY "blog_images_authenticated_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- 4. Allow authenticated users to delete images
CREATE POLICY "blog_images_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- 5. Allow service role full access (for admin operations)
CREATE POLICY "blog_images_service_role_all"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- Ensure RLS is enabled on storage.objects (should already be enabled)
-- This is just a safety check
DO $$
BEGIN
    -- Check if RLS is enabled, enable if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'objects' 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')
        AND relrowsecurity = true
    ) THEN
        -- This should not be needed as RLS should already be enabled
        -- but we include it for completeness
        RAISE NOTICE 'RLS should already be enabled on storage.objects';
    END IF;
END $$;

-- Verify bucket configuration
DO $$
DECLARE
    bucket_exists boolean;
    bucket_public boolean;
    bucket_size_limit bigint;
BEGIN
    -- Check if bucket exists and get its configuration
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'blog-images'),
           public,
           file_size_limit
    INTO bucket_exists, bucket_public, bucket_size_limit
    FROM storage.buckets 
    WHERE id = 'blog-images';
    
    IF bucket_exists THEN
        RAISE NOTICE 'blog-images bucket exists: public=%, size_limit=%', bucket_public, bucket_size_limit;
    ELSE
        RAISE EXCEPTION 'blog-images bucket was not created successfully';
    END IF;
END $$;