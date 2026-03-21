/*
  # Add middle name columns to members table

  1. Changes
    - Add `middle_name` column for main member (nullable text)
    - Add `joint_middle_name` column for joint member (nullable text)
  
  2. Notes
    - Both columns are optional and nullable
    - No data migration needed as this is a new field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE members ADD COLUMN middle_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'joint_middle_name'
  ) THEN
    ALTER TABLE members ADD COLUMN joint_middle_name text;
  END IF;
END $$;