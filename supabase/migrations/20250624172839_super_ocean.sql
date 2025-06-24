/*
  # Create blog-images storage bucket with policies

  1. Storage Setup
    - Creates blog-images bucket if it doesn't exist
    - Sets up public access and file size limits
    - Configures allowed image MIME types

  2. Security Policies
    - Public read access for viewing images
    - Authenticated users can upload, update, and delete images
    - Uses DROP IF EXISTS to avoid conflicts with existing policies
*/

-- Create the blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;

-- Allow public read access to images
CREATE POLICY "Public read access for blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');