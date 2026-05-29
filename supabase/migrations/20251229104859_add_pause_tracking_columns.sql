/*
  # Add Membership Pause Tracking

  1. Changes
    - Add `late_warnings_count` column to track late payment warnings
    - Add `paused_date` column to record when membership was paused
    - Add `paused_reason` column to store reason for pausing
    - Add 'paused' status to existing status checks
  
  2. Purpose
    - Track late payment warnings (auto-pause after 3 warnings)
    - Record when and why memberships are paused
    - Enable reactivation workflow with proper fee calculation
  
  3. Security
    - No RLS changes needed (inherits from members table)
*/

-- Add pause tracking columns to members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'late_warnings_count'
  ) THEN
    ALTER TABLE members ADD COLUMN late_warnings_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'paused_date'
  ) THEN
    ALTER TABLE members ADD COLUMN paused_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'paused_reason'
  ) THEN
    ALTER TABLE members ADD COLUMN paused_reason TEXT;
  END IF;
END $$;