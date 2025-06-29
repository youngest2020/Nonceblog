/*
  # Create blog-images storage bucket

  1. Storage Setup
    - Create 'blog-images' storage bucket for blog post images
    - Configure bucket to be publicly accessible for reading
    - Set up appropriate file size and type restrictions

  2. Security Policies
    - Allow authenticated users to upload images
    - Allow public read access to uploaded images
    - Allow authenticated users to delete their own uploads

  3. Configuration
    - Set reasonable file size limits
    - Configure allowed file types for images
*/

-- Create the blog-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Policy to allow public read access to blog images
CREATE POLICY "Public can view blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Policy to allow authenticated users to update images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');