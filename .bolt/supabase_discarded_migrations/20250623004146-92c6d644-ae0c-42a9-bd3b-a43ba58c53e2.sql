
-- First, let's check if your profile exists and update it to have admin privileges
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'noncefirewall@gmail.com';

-- If the profile doesn't exist yet, let's also make sure we handle that case
-- This will insert the profile if it doesn't exist, or update it if it does
INSERT INTO public.profiles (id, email, display_name, is_admin)
SELECT 
    auth.users.id,
    'noncefirewall@gmail.com',
    'Admin User',
    true
FROM auth.users 
WHERE auth.users.email = 'noncefirewall@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET is_admin = true;
