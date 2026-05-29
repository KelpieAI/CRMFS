/*
  # Update log_activity function to support change tracking

  1. Changes
    - Drop the old log_activity function (3 parameter version)
    - Create new log_activity function that accepts:
      - member_id_param: UUID of the member
      - action_param: Description of the action
      - old_values_param: JSONB of old field values (only changed fields)
      - new_values_param: JSONB of new field values (only changed fields)
      - change_reason_param: Optional text explaining why changes were made

  2. Notes
    - The function automatically captures user info from auth context
    - Only changed fields should be passed, not entire records
*/

DROP FUNCTION IF EXISTS log_activity(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION log_activity(
  member_id_param uuid,
  action_param text,
  old_values_param jsonb DEFAULT NULL,
  new_values_param jsonb DEFAULT NULL,
  change_reason_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT email, full_name 
    INTO v_user_email, v_user_name
    FROM users
    WHERE id = v_user_id;
  END IF;

  INSERT INTO activity_log (
    member_id,
    action_type,
    entity_type,
    description,
    user_id,
    user_email,
    user_name,
    old_values,
    new_values,
    change_reason
  ) VALUES (
    member_id_param,
    'member_edited',
    'member',
    action_param,
    v_user_id,
    v_user_email,
    v_user_name,
    old_values_param,
    new_values_param,
    change_reason_param
  );
END;
$$;