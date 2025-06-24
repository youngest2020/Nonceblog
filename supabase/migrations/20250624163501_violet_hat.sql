/*
  # Create avatars storage bucket

  1. Purpose
    - Creates the avatars storage bucket for profile pictures
    - Sets up basic bucket configuration without direct table policies

  2. What it does
    - Creates the avatars bucket with proper configuration
    - Relies on Supabase's default storage security model
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
    -- Bucket already exists, do nothing
    NULL;
END $$;