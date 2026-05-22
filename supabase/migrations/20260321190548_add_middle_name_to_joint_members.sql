/*
  # Add middle name column to joint_members table

  1. Changes
    - Add `middle_name` column to joint_members table (nullable text)
  
  2. Notes
    - Column is optional and nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'joint_members' AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE joint_members ADD COLUMN middle_name text;
  END IF;
END $$;