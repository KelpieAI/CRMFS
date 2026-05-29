/*
  # Update application reference generation to use sequential numbering

  1. Changes
    - Update generate_application_reference() to use sequential counter per day
    - Format: APP-YYYYMMDD-XXXX where XXXX is a sequential number starting at 0001
    - Count existing applications for today and increment by 1
  
  2. Notes
    - This provides predictable, sequential reference numbers
    - The counter resets each day
*/

CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS CHARACTER VARYING
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_date_prefix TEXT;
  v_count INTEGER;
  v_reference CHARACTER VARYING;
BEGIN
  v_date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM applications_in_progress
  WHERE application_reference LIKE 'APP-' || v_date_prefix || '-%';
  
  v_reference := 'APP-' || v_date_prefix || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_reference;
END;
$$;