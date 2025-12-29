/*
  # Add Medical Consent and Final Declaration Fields

  1. Changes to declarations table
    - Add main_medical_consent (boolean)
    - Add main_medical_signature (text)
    - Add main_medical_consent_date (timestamptz)
    - Add main_final_declaration (boolean)
    - Add main_final_signature (text)
    - Add main_final_declaration_date (timestamptz)
    - Add joint_medical_consent (boolean)
    - Add joint_medical_signature (text)
    - Add joint_medical_consent_date (timestamptz)
    - Add joint_final_declaration (boolean)
    - Add joint_final_signature (text)
    - Add joint_final_declaration_date (timestamptz)

  2. Notes
    - These fields support the new CRMFS declaration and medical consent sections
    - Medical consent includes GP authorization
    - Final declaration includes terms and conditions acceptance
    - Electronic signatures captured as full names
*/

-- Add medical consent fields for main member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_consent'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_consent BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_signature TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_medical_consent_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_medical_consent_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add final declaration fields for main member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_declaration'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_declaration BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_signature TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'main_final_declaration_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN main_final_declaration_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add medical consent fields for joint member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_consent'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_consent BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_signature TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_medical_consent_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_medical_consent_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add final declaration fields for joint member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_declaration'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_declaration BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_signature'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_signature TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'declarations' AND column_name = 'joint_final_declaration_date'
  ) THEN
    ALTER TABLE declarations ADD COLUMN joint_final_declaration_date TIMESTAMPTZ;
  END IF;
END $$;
