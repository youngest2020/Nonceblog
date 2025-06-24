/*
  # Create missing profiles for existing auth users

  1. Purpose
    - Creates profile records for users who exist in auth.users but not in profiles table
    - Ensures all authenticated users have corresponding profile records

  2. What it does
    - Inserts missing profile records for existing auth users
    - Sets default values for missing fields
    - Maintains data integrity between auth.users and profiles tables
*/

-- Insert missing profiles for existing auth users
INSERT INTO profiles (id, email, display_name, is_admin)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email),
  false
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;