/*
  # Add change_reason column to activity_log

  1. Schema Changes
    - Add `change_reason` column (text, nullable) to `activity_log` table
    - This stores the reason for changes when users edit member records

  2. Notes
    - Existing records will have NULL for change_reason
    - Future updates can optionally include a reason
*/

ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS change_reason text;