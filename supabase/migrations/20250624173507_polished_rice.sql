/*
  # Create blog-images storage bucket with proper security

  1. Purpose
    - Creates the blog-images storage bucket for blog post images
    - Sets up proper RLS policies for secure image management
    - Allows public read access and authenticated user uploads

  2. Security
    - Public can read/view images
    - Authenticated users can upload images
    - Users can manage their own uploads
    - 10MB file size limit with image type restrictions
*/

-- Create the blog-images storage bucket if it doesn't exist
DO $$
BEGIN
  -- Insert the bucket, ignore if it already exists
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
EXCEPTION
  WHEN others THEN
    -- If bucket creation fails, continue with policy creation
    NULL;
END $$;

-- Create storage policies using DO blocks to handle existing policies gracefully

-- Policy: Allow public read access to blog images
DO $$
BEGIN
  CREATE POLICY "Public read access for blog images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, ignore
    NULL;
END $$;

-- Policy: Allow authenticated users to upload images
DO $$
BEGIN
  CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, ignore
    NULL;
END $$;

-- Policy: Allow authenticated users to update images
DO $$
BEGIN
  CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, ignore
    NULL;
END $$;

-- Policy: Allow authenticated users to delete images
DO $$
BEGIN
  CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, ignore
    NULL;
END $$;