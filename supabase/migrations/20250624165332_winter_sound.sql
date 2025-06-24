/*
  # Create blog-images storage bucket

  1. Purpose
    - Creates the blog-images storage bucket for blog post images
    - Sets up appropriate security policies for public read and authenticated write access

  2. Security
    - Public read access for serving images
    - Authenticated users can upload, update, and delete images
    - 10MB file size limit with restricted MIME types
*/

-- Create the blog-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;

-- Allow public read access to blog images
CREATE POLICY "Public read access for blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to delete their own blog images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Allow authenticated users to update blog images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');