/*
  # Add status_note column to payments table

  1. Changes
    - `payments` table: new `status_note` column (text, nullable)
      - Stores a free-text reason for outstanding/overdue/failed payment status
      - Optional field, max 500 characters enforced at the application level
      - No changes to existing records (nullable, no default)

  2. Notes
    - No data migration needed - field is nullable
    - No RLS changes needed - inherits existing payments table policies
*/

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS status_note text;
