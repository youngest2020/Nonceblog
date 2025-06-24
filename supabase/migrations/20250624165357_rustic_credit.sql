/*
  # Create blog-images storage bucket and policies

  1. New Storage Bucket
    - `blog-images` bucket for storing blog post images
    - Public read access
    - 10MB file size limit
    - Allowed image formats: JPEG, PNG, WebP, GIF

  2. Security Policies
    - Public read access for all blog images
    - Authenticated users can upload images
    - Authenticated users can manage their uploads
*/

-- Create the blog-images storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'blog-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'blog-images',
      'blog-images', 
      true,
      10485760, -- 10MB limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  END IF;
END $$;

-- Create storage policies for blog images
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for blog images'
  ) THEN
    DROP POLICY "Public read access for blog images" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload blog images'
  ) THEN
    DROP POLICY "Authenticated users can upload blog images" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete blog images'
  ) THEN
    DROP POLICY "Authenticated users can delete blog images" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update blog images'
  ) THEN
    DROP POLICY "Authenticated users can update blog images" ON storage.objects;
  END IF;

  -- Create new policies
  CREATE POLICY "Public read access for blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');

  CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

  CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images');

  CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images');
END $$;