/*
  # Fix Storage RLS Policies for Blog Images

  1. Storage Policies
    - Enable RLS on storage.buckets and storage.objects
    - Create policies for blog-images bucket operations
    - Allow authenticated users to create, read, update, delete
    - Allow public read access for images

  2. Bucket Creation
    - Create blog-images bucket with proper configuration
    - Set file size limit to 10MB
    - Allow common image MIME types
    - Make bucket public for image serving
*/

-- Enable RLS on storage tables if not already enabled
DO $$ 
BEGIN
  -- Enable RLS on buckets table
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on objects table  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to create blog-images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to view blog-images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to update blog-images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to upload to blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update blog-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from blog-images" ON storage.objects;

-- Create bucket policies
CREATE POLICY "Allow authenticated users to create blog-images bucket"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (id = 'blog-images');

CREATE POLICY "Allow authenticated users to view blog-images bucket"
ON storage.buckets
FOR SELECT
TO authenticated, anon
USING (id = 'blog-images');

CREATE POLICY "Allow authenticated users to update blog-images bucket"
ON storage.buckets
FOR UPDATE
TO authenticated
USING (id = 'blog-images');

-- Create object policies for blog-images bucket
CREATE POLICY "Allow authenticated users to upload to blog-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Allow public to view blog-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'blog-images');

CREATE POLICY "Allow authenticated users to update blog-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');

CREATE POLICY "Allow authenticated users to delete from blog-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Create the blog-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();