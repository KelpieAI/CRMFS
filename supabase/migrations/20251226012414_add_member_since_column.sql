/*
  # Add Member Since Column

  This migration adds an optional "Member Since" field to track when existing members
  originally joined, separate from their record creation date.

  1. Changes
    - Add `member_since` column to `members` table
      - Type: DATE (nullable)
      - No default value - allows NULL for existing records
      - Separate from created_at to track actual membership start date
    
  2. Performance
    - Add index on `member_since` for efficient filtering and sorting
  
  3. Notes
    - Existing members will have NULL for member_since (backward compatible)
    - UI will fall back to created_at when member_since is NULL
    - Only for main members, not required field
*/

-- Add member_since column to members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'member_since'
  ) THEN
    ALTER TABLE members ADD COLUMN member_since DATE;
  END IF;
END $$;

-- Add index for performance on member_since queries
CREATE INDEX IF NOT EXISTS idx_members_member_since ON members(member_since);