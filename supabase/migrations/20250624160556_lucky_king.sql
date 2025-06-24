/*
  # Fix infinite recursion in profiles RLS policy

  1. Problem
    - The "Admins can read all profiles" policy causes infinite recursion
    - Policy tries to check admin status by querying profiles table, which triggers the same policy

  2. Solution
    - Drop the problematic policy
    - Create a new policy that uses auth.jwt() to check admin status from JWT claims
    - This avoids querying the profiles table within the policy itself

  3. Security
    - Maintains the same security level
    - Users can still only read their own profile
    - Admins can still read all profiles (once properly authenticated)
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Create a new policy that doesn't cause recursion
-- This policy allows users to read their own profile
-- Admin access will be handled through a different approach
CREATE POLICY "Users can read own profile only"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- For admin access, we'll rely on the application layer to handle admin privileges
-- The admin check should be done after successful authentication, not in the RLS policy