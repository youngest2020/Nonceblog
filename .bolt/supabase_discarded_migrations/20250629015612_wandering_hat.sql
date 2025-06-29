/*
  # Create Storage Buckets and Policies

  1. Storage Buckets
    - `avatars` bucket for user profile pictures
    - `blog-images` bucket for blog post images
    - Both buckets configured with proper file size limits and MIME types

  2. Security Policies
    - Enable RLS on storage.objects and storage.buckets
    - Allow authenticated users to upload/manage their own files
    - Allow public read access for serving images
    - Proper folder-based access control for avatars

  3. Configuration
    - 5MB limit for avatars
    - 10MB limit for blog images
    - Restricted to image MIME types only
*/

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing storage policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename IN ('objects', 'buckets')
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON storage.' || 
                    CASE 
                        WHEN policy_record.policyname LIKE '%bucket%' THEN 'buckets'
                        ELSE 'objects'
                    END;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Bucket policies
CREATE POLICY "Allow public to view buckets"
ON storage.buckets
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Blog images storage policies
CREATE POLICY "Blog images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can update blog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Service role policies for admin operations
CREATE POLICY "Service role can manage all storage objects"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all buckets"
ON storage.buckets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);