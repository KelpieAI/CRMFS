/*
  # Add Paper Form Tracking for GDPR Compliance

  1. Changes
    - Add `consent_obtained_via` column to track consent method (paper_form or online_form)
    - Add `paper_form_version` column to track which form version was used
    - Add `paper_form_date` column to record when paper form was signed
    - Add `paper_form_filed` column to confirm physical form is retained
    - Add `main_signature` column to record main member's signature from paper form
    - Add `main_signature_date` column for signature date
    - Add `joint_signature` column for joint member's signature
    - Add `joint_signature_date` column for joint signature date
    - Add `data_entered_by` column to track which committee member entered data
    - Add `data_entry_date` column for audit trail
  
  2. Purpose
    - GDPR compliance: Record that consents were obtained via paper form
    - Audit trail: Track who entered data and when
    - Record keeping: Confirm paper forms are filed for 7 years
    - Legal compliance: Maintain evidence of consent
  
  3. Security
    - No RLS changes needed (inherits from members table)
*/

-- Add paper form tracking columns to members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'consent_obtained_via'
  ) THEN
    ALTER TABLE members ADD COLUMN consent_obtained_via TEXT DEFAULT 'paper_form';
    COMMENT ON COLUMN members.consent_obtained_via IS 'How consents were obtained: paper_form or online_form';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'paper_form_version'
  ) THEN
    ALTER TABLE members ADD COLUMN paper_form_version TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'paper_form_date'
  ) THEN
    ALTER TABLE members ADD COLUMN paper_form_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'paper_form_filed'
  ) THEN
    ALTER TABLE members ADD COLUMN paper_form_filed BOOLEAN DEFAULT true;
    COMMENT ON COLUMN members.paper_form_filed IS 'Confirmation that signed paper form is filed for records';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'main_signature'
  ) THEN
    ALTER TABLE members ADD COLUMN main_signature TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'main_signature_date'
  ) THEN
    ALTER TABLE members ADD COLUMN main_signature_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'joint_signature'
  ) THEN
    ALTER TABLE members ADD COLUMN joint_signature TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'joint_signature_date'
  ) THEN
    ALTER TABLE members ADD COLUMN joint_signature_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'data_entered_by'
  ) THEN
    ALTER TABLE members ADD COLUMN data_entered_by TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'data_entry_date'
  ) THEN
    ALTER TABLE members ADD COLUMN data_entry_date TIMESTAMPTZ;
  END IF;
END $$;