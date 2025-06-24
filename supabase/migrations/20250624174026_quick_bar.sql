/*
  # Fix blog-images storage bucket configuration

  1. Purpose
    - Ensure blog-images bucket exists with proper configuration
    - Set up correct RLS policies for image uploads
    - Allow public read access and authenticated user uploads

  2. Changes
    - Create/update blog-images bucket with 10MB limit
    - Remove any conflicting policies
    - Create simple, working policies for storage access
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
WITH CHECK (bucket_id = 'blog-images');

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