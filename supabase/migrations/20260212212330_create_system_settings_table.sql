/*
  # Create system_settings table

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `setting_key` (text, unique) - Unique key for the setting (e.g., 'email_preferences')
      - `setting_value` (jsonb) - JSON object containing the setting values
      - `updated_at` (timestamptz) - Last update timestamp
      - `updated_by` (uuid) - Foreign key to auth.users who made the update
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for authenticated users to read settings
    - Add policy for authenticated users to update settings

  3. Initial Data
    - Insert default email preferences
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default email preferences
INSERT INTO system_settings (setting_key, setting_value)
VALUES (
  'email_preferences',
  '{
    "senderName": "Central Region Muslim Funeral Service",
    "emailSignature": "Central Region Muslim Funeral Service\\nFalkirk Central Mosque\\nPhone: [committee phone]\\nEmail: crmfs@kelpieai.co.uk",
    "ccCommitteeOnMemberEmails": false,
    "memberActionNotifications": true
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
