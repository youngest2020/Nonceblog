/*
  # Create blog-images storage bucket

  1. Storage Setup
    - Create `blog-images` bucket for storing blog post images
    - Configure bucket for public access to serve images
    - Set up appropriate policies for authenticated users to upload
    - Allow public read access for serving images

  2. Security
    - Enable RLS on storage objects
    - Allow authenticated users to upload images
    - Allow public read access to serve images
    - Restrict delete operations to authenticated users only
*/

-- Create the blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Create policy to allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');

-- Create policy to allow authenticated users to delete blog images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Create policy to allow public read access to blog images
CREATE POLICY "Public can view blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');