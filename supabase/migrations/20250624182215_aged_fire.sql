/*
  # Fix Storage RLS Policies for Blog Images

  1. Storage Policies
    - Enable proper RLS policies for storage.buckets table
    - Enable proper RLS policies for storage.objects table
    - Allow authenticated users to create and manage blog-images bucket
    - Allow authenticated users to upload/download images

  2. Security
    - Authenticated users can create blog-images bucket
    - Authenticated users can upload images to blog-images bucket
    - Public can read images from blog-images bucket
    - Only authenticated users can delete images
*/

-- Enable RLS on storage.buckets if not already enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Enable RLS on storage.objects if not already enabled  
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to create the blog-images bucket
CREATE POLICY "Allow authenticated users to create blog-images bucket"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (id = 'blog-images');

-- Policy to allow authenticated users to view the blog-images bucket
CREATE POLICY "Allow authenticated users to view blog-images bucket"
ON storage.buckets
FOR SELECT
TO authenticated, anon
USING (id = 'blog-images');

-- Policy to allow authenticated users to update the blog-images bucket
CREATE POLICY "Allow authenticated users to update blog-images bucket"
ON storage.buckets
FOR UPDATE
TO authenticated
USING (id = 'blog-images');

-- Policy to allow authenticated users to upload images to blog-images bucket
CREATE POLICY "Allow authenticated users to upload to blog-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Policy to allow everyone to view images in blog-images bucket (for public access)
CREATE POLICY "Allow public to view blog-images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'blog-images');

-- Policy to allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update blog-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');

-- Policy to allow authenticated users to delete images from blog-images bucket
CREATE POLICY "Allow authenticated users to delete from blog-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Create the blog-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;