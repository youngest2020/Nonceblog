/*
  # Create blog-images storage bucket

  1. Purpose
    - Creates the blog-images storage bucket for blog post image uploads
    - Sets up proper RLS policies for secure access

  2. What it does
    - Creates the blog-images bucket with proper configuration
    - Allows public read access to blog images
    - Allows authenticated users to upload, update, and delete blog images
    - Handles conflicts gracefully
*/

-- Create the blog-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies safely to avoid conflicts
DO $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Check and drop upload policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload blog images'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        DROP POLICY "Authenticated users can upload blog images" ON storage.objects;
    END IF;

    -- Check and drop read policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public can view blog images'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        DROP POLICY "Public can view blog images" ON storage.objects;
    END IF;

    -- Check and drop delete policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can delete blog images'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        DROP POLICY "Authenticated users can delete blog images" ON storage.objects;
    END IF;

    -- Check and drop update policy
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can update blog images'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        DROP POLICY "Authenticated users can update blog images" ON storage.objects;
    END IF;
END $$;

-- Allow public read access to blog images
CREATE POLICY "Public can view blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to delete images (for cleanup)
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Allow authenticated users to update image metadata
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');