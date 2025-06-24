/*
  # Create blog-images storage bucket

  1. Purpose
    - Creates the blog-images bucket for storing blog post images
    - Sets up proper RLS policies for blog image uploads
    - Ensures authenticated users can upload and manage blog images

  2. Security
    - Public read access for published blog images
    - Authenticated users can upload, update, and delete blog images
    - File size limit of 10MB
    - Restricted to image file types only
*/

-- Create the blog-images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'blog-images',
    'blog-images', 
    true,
    10485760, -- 10MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, update its properties
    UPDATE storage.buckets 
    SET 
      public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    WHERE id = 'blog-images';
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;

-- Allow public read access to blog images
CREATE POLICY "Blog images are publicly accessible" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to update blog images
CREATE POLICY "Authenticated users can update blog images" ON storage.objects
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to delete blog images
CREATE POLICY "Authenticated users can delete blog images" ON storage.objects
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'blog-images');