/*
  # Create avatars storage bucket

  1. New Storage Bucket
    - `avatars` bucket for storing user profile pictures
    - Public bucket with appropriate size limits
    - Configured for image file types

  2. Security
    - Enable RLS on the bucket
    - Allow authenticated users to upload their own avatars
    - Allow public read access to avatar images
    - Restrict file types to images only
    - Set file size limit to 5MB

  3. Policies
    - Users can upload files to their own folder (user_id/)
    - Users can update their own avatar files
    - Users can delete their own avatar files
    - Public read access for all avatar images
*/

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
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

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );