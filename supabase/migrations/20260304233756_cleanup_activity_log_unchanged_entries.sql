/*
  # Cleanup activity log entries with no real changes

  1. Purpose
    - Remove activity log entries where old_values equals new_values (no real changes)
    - Re-run the extraction to only keep changed fields
    - Exclude system fields: last_accessed_date, updated_at, created_at

  2. Notes
    - This cleans up entries that only had system timestamp changes
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
  excluded_fields text[] := ARRAY['last_accessed_date', 'updated_at', 'created_at', 'id', 'member_id'];
BEGIN
  FOR log_record IN 
    SELECT id, old_values, new_values 
    FROM activity_log 
    WHERE old_values IS NOT NULL 
      AND new_values IS NOT NULL
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