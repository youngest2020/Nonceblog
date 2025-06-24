/*
  # Create blog-images storage bucket

  1. Storage Setup
    - Create 'blog-images' storage bucket
    - Configure bucket settings for image uploads
    - Set appropriate file size limits and MIME types

  2. Security
    - Enable RLS on storage.objects
    - Add policy for authenticated users to upload images
    - Add policy for public read access to images
    - Add policy for users to delete their own uploads

  3. Configuration
    - Public bucket for easy image access
    - 10MB file size limit
    - Image MIME types only
*/

-- Create the blog-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload images to blog-images bucket
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' AND
  (storage.foldername(name))[1] = '' -- Allow uploads to root of bucket
);

-- Policy: Allow public read access to blog images
CREATE POLICY "Public read access for blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Policy: Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their own blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'blog-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);