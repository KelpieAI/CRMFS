/*
  # Add Missing Columns to Applications in Progress Table

  1. Changes to `applications_in_progress` table
    - Add `status` column (TEXT) - tracks application status ('in_progress', 'submitted', 'abandoned')
    - Add `last_saved_at` column (TIMESTAMPTZ) - tracks when application was last saved
    - Add `app_type` column (TEXT) - stores 'single' or 'joint' membership type
    - Add `main_first_name` column (TEXT) - main applicant's first name for display
    - Add `main_last_name` column (TEXT) - main applicant's last name for display
    - Add `main_email` column (TEXT) - main applicant's email for contact
    - Add `main_mobile` column (TEXT) - main applicant's mobile for contact
    - Add `joint_first_name` column (TEXT) - joint applicant's first name (if applicable)
    - Add `joint_last_name` column (TEXT) - joint applicant's last name (if applicable)

  2. Indexes
    - Add index on `status` column for filtering
    - Add index on `last_saved_at` column for sorting

  3. Notes
    - These columns are required for the ApplicationsInProgress component to display saved applications
    - The columns enable quick display without parsing the JSONB form_data
    - Using IF NOT EXISTS to safely add columns without errors
*/

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'status'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned'));
  END IF;
END $$;

-- Add last_saved_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'last_saved_at'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN last_saved_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Add app_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'app_type'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN app_type TEXT CHECK (app_type IN ('single', 'joint'));
  END IF;
END $$;

-- Add main_first_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'main_first_name'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN main_first_name TEXT;
  END IF;
END $$;

-- Add main_last_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'main_last_name'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN main_last_name TEXT;
  END IF;
END $$;

-- Add main_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'main_email'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN main_email TEXT;
  END IF;
END $$;

-- Add main_mobile column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'main_mobile'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN main_mobile TEXT;
  END IF;
END $$;

-- Add joint_first_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'joint_first_name'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN joint_first_name TEXT;
  END IF;
END $$;

-- Add joint_last_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications_in_progress' AND column_name = 'joint_last_name'
  ) THEN
    ALTER TABLE applications_in_progress ADD COLUMN joint_last_name TEXT;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications_in_progress(status);
CREATE INDEX IF NOT EXISTS idx_applications_last_saved_at ON applications_in_progress(last_saved_at);

-- Update existing records to set last_saved_at to updated_at if null
UPDATE applications_in_progress
SET last_saved_at = updated_at
WHERE last_saved_at IS NULL;
