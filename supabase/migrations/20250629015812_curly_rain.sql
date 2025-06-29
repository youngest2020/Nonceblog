/*
  # Create Storage Buckets and Policies

  1. Storage Buckets
    - Create 'avatars' bucket for profile pictures (5MB limit)
    - Create 'blog-images' bucket for blog post images (10MB limit)
    - Both buckets are public for serving images

  2. Security Policies
    - Avatar policies: Users can only manage their own avatars in user-specific folders
    - Blog image policies: Authenticated users can upload/manage, public can read
    - Service role has full access for admin operations

  3. Note
    - RLS is already enabled on storage tables by Supabase
    - We only create buckets and policies, not modify table settings
*/

-- Create avatars bucket if it doesn't exist
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

-- Create blog-images bucket if it doesn't exist
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

-- Safely drop existing storage policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop existing avatar policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (policyname ILIKE '%avatar%' OR policyname ILIKE '%blog%')
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON storage.objects';
        EXCEPTION
            WHEN OTHERS THEN
                -- Continue if policy doesn't exist or can't be dropped
                NULL;
        END;
    END LOOP;
END $$;

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