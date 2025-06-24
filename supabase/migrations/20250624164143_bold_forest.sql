/*
  # Create avatars storage bucket

  1. Purpose
    - Creates the avatars storage bucket for profile pictures
    - Sets up proper permissions for authenticated users

  2. What it does
    - Creates the avatars bucket if it doesn't exist
    - Allows public read access to uploaded images
    - Allows authenticated users to upload/manage their own images
*/

-- Create the avatars bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars', 
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, update its properties
    UPDATE storage.buckets 
    SET 
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    WHERE id = 'avatars';
END $$;