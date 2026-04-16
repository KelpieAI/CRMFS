/*
  # Add Medical Consent and Final Declaration fields to declarations table

  ## Summary
  Adds medical consent and final declaration fields to the existing declarations table
  so that consent and signature data captured during the registration wizard can be
  stored alongside the existing declaration records.

  ## Changes

  ### Modified Table: declarations
  - `main_medical_consent` (boolean) — Whether main member confirmed medical consent checkbox
  - `main_medical_signature` (text) — Typed full-name signature for main member medical consent
  - `main_medical_consent_date` (timestamptz) — Timestamp when main member signed medical consent
  - `main_final_declaration` (boolean) — Whether main member accepted T&Cs and final declaration
  - `main_final_signature` (text) — Typed full-name signature for main member final declaration
  - `main_final_declaration_date` (timestamptz) — Timestamp when main member completed final declaration
  - `joint_medical_consent` (boolean) — Same fields for joint member
  - `joint_medical_signature` (text)
  - `joint_medical_consent_date` (timestamptz)
  - `joint_final_declaration` (boolean)
  - `joint_final_signature` (text)
  - `joint_final_declaration_date` (timestamptz)

  ## Notes
  - All columns are nullable to support cases where the joint member does not exist
  - Main member fields default to false for booleans and null for text/timestamps
  - No destructive operations — only additive column additions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_consent'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_consent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_signature text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_consent_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_consent_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_declaration'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_declaration boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_signature text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_declaration_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_declaration_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_consent'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_consent boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_signature text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_consent_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_consent_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_declaration'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_declaration boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_signature text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_declaration_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_declaration_date timestamptz;
  END IF;
END $$;
