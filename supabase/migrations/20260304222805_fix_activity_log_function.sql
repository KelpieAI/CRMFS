/*
  # Fix Activity Log Function

  1. Changes
    - Drop conflicting log_activity functions
    - Create new log_activity function that properly populates user_id, user_email, and user_name
    - Function fetches current user details and inserts them into activity_log
    - Handles authenticated users by looking up their profile
    - Falls back gracefully if user info not found

  2. Security
    - Function uses SECURITY DEFINER to access auth.uid()
    - Properly sets search_path for security
*/

-- Drop existing conflicting log_activity functions
DROP FUNCTION IF EXISTS public.log_activity(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.log_activity();

-- Create new log_activity function aligned with actual schema
CREATE OR REPLACE FUNCTION public.log_activity(
  member_id_param uuid,
  action_param text,
  details_param jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  -- Get current authenticated user ID
  v_user_id := auth.uid();

  -- If user is authenticated, fetch their details
  IF v_user_id IS NOT NULL THEN
    SELECT email, full_name 
    INTO v_user_email, v_user_name
    FROM users
    WHERE id = v_user_id;
  END IF;

  -- Insert activity log with user information
  INSERT INTO activity_log (
    member_id,
    action_type,
    entity_type,
    description,
    user_id,
    user_email,
    user_name
  ) VALUES (
    member_id_param,
    'system_action',  -- default action_type
    'member',         -- default entity_type
    action_param,     -- action text goes in description
    v_user_id,
    v_user_email,
    v_user_name
  );
END;
$$;