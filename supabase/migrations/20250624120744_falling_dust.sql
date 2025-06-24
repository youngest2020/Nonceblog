/*
  # Create blog images storage bucket

  1. Storage Setup
    - Create blog-images bucket for storing blog post images
    - Configure public access and file size limits
    - Set allowed MIME types for images

  2. Security Policies
    - Public read access for all blog images
    - Authenticated users can upload, update, and delete images
    - Images must be uploaded to 'uploads' folder
*/

-- Create the storage bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'blog-images';

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Public read access for blog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN
    -- Policy doesn't exist, continue
    NULL;
END $$;

-- Policy for public read access to blog images
CREATE POLICY "Public read access for blog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Policy for authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images' 
  AND (storage.foldername(name))[1] = 'uploads'
);

-- Policy for authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- Policy for authenticated users to delete blog images
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');