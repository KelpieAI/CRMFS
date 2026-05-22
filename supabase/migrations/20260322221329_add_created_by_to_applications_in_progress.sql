/*
  # Add created_by column to applications_in_progress

  1. Changes
    - Add `created_by` column (UUID) to track which user created the draft
    - Add index on created_by for faster lookups
    - Add index on created_at for date-based queries (reference number generation)
  
  2. Notes
    - created_by references auth.users to identify the committee member who started the application
    - Existing rows will have NULL for created_by
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_in_progress_created_by ON applications_in_progress(created_by);
CREATE INDEX IF NOT EXISTS idx_applications_in_progress_created_at ON applications_in_progress(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_in_progress_application_reference ON applications_in_progress(application_reference);