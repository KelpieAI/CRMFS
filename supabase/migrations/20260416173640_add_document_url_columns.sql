/*
  # Add document URL columns for manual document upload workflow

  ## Summary
  Adds storage URL columns to support the new manual document upload step in the
  registration wizard. Committee members now upload all documents during registration
  instead of sending email links to members.

  ## Changes

  ### members table
  - `joint_photo_id_url` (text, nullable) - Supabase Storage URL for joint member photo ID
  - `joint_proof_of_address_url` (text, nullable) - Supabase Storage URL for joint member proof of address

  ### children table
  - `birth_certificate_url` (text, nullable) - Supabase Storage URL for child's birth certificate

  ## Notes
  - photo_id_url and proof_of_address_url columns already exist on the members table (created by prior migrations)
  - All new columns are nullable to allow backwards compatibility with existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'joint_photo_id_url'
  ) THEN
    ALTER TABLE members ADD COLUMN joint_photo_id_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'joint_proof_of_address_url'
  ) THEN
    ALTER TABLE members ADD COLUMN joint_proof_of_address_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'birth_certificate_url'
  ) THEN
    ALTER TABLE children ADD COLUMN birth_certificate_url text;
  END IF;
END $$;
