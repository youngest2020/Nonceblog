/*
  # Add unique_views column to post_analytics table

  1. Changes
    - Add `unique_views` column to `post_analytics` table with default value of 0
    - This column will track unique views for each post, separate from total views

  2. Notes
    - The column is added as integer type with default value 0 to match existing analytics columns
    - This resolves the database error where the get_post_analytics_summary function references a non-existent column
*/

-- Add unique_views column to post_analytics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_analytics' AND column_name = 'unique_views'
  ) THEN
    ALTER TABLE post_analytics ADD COLUMN unique_views integer DEFAULT 0;
  END IF;
END $$;