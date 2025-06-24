/*
  # Create avatars storage bucket

  1. New Storage Bucket
    - `avatars` bucket for storing user profile pictures
    - Public read access for profile pictures
    - Authenticated users can upload their own avatars

  2. Security Policies
    - Public can view all avatars (for profile pictures to be visible)
    - Authenticated users can upload files to their own folder
    - Authenticated users can update their own avatar files
    - Authenticated users can delete their own avatar files

  3. Configuration
    - File size limit: 5MB
    - Allowed file types: Images only
    - Public access for reading
*/

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to view avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Policy: Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );