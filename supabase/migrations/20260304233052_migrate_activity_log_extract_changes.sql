/*
  # Migrate activity_log data to extract only changed fields

  1. Purpose
    - Clean up existing activity log entries that store entire member records
    - Extract only the fields that actually changed between old_values and new_values
    - Remove logs where only last_accessed_date changed (no meaningful changes)
    - Delete logs where old_values equals new_values completely

  2. Changes Made
    - Updates old_values and new_values to contain only changed fields
    - Deletes activity log entries with no meaningful changes
    - Fields like last_accessed_date, updated_at are excluded from change tracking

  3. Notes
    - This is a one-time data cleanup migration
    - Future logs will be created with only changed fields from the application
*/

DO $$
DECLARE
  log_record RECORD;
  old_json jsonb;
  new_json jsonb;
  changed_old jsonb;
  changed_new jsonb;
  key_name text;
  has_real_changes boolean;
  excluded_fields text[] := ARRAY['last_accessed_date', 'updated_at', 'created_at'];
BEGIN
  FOR log_record IN 
    SELECT id, old_values, new_values 
    FROM activity_log 
    WHERE old_values IS NOT NULL 
      AND new_values IS NOT NULL
      AND description = 'Member record updated'
  LOOP
    old_json := log_record.old_values;
    new_json := log_record.new_values;
    changed_old := '{}'::jsonb;
    changed_new := '{}'::jsonb;
    has_real_changes := false;
    
    FOR key_name IN SELECT jsonb_object_keys(old_json)
    LOOP
      IF NOT (key_name = ANY(excluded_fields)) THEN
        IF (old_json->key_name)::text IS DISTINCT FROM (new_json->key_name)::text THEN
          changed_old := changed_old || jsonb_build_object(key_name, old_json->key_name);
          changed_new := changed_new || jsonb_build_object(key_name, new_json->key_name);
          has_real_changes := true;
        END IF;
      END IF;
    END LOOP;
    
    IF has_real_changes THEN
      UPDATE activity_log 
      SET old_values = changed_old, new_values = changed_new
      WHERE id = log_record.id;
    ELSE
      DELETE FROM activity_log WHERE id = log_record.id;
    END IF;
  END LOOP;
END $$;