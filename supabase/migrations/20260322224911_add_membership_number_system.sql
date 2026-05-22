/*
  # Add Human-Readable Membership Number System

  1. New Columns
    - `membership_number` (varchar(12), unique) on `members` table
      - Format: FCM-XXXXX (e.g., FCM-32614)
      - Sequential but starts from random offset for privacy

  2. New Tables
    - `membership_sequence`
      - `id` (integer, primary key, constrained to 1)
      - `next_number` (integer) - tracks next membership number
      - `prefix` (varchar(10)) - mosque prefix (FCM for Falkirk Central Mosque)

  3. New Functions
    - `get_next_membership_number(prefix_value TEXT)` - atomically generates next membership number

  4. Security
    - Enable RLS on membership_sequence table
    - Only authenticated users can read/update sequence

  5. Notes
    - UUID remains as primary key for internal use
    - membership_number is for display purposes only
    - Random starting point (10000-99999) prevents guessing member count
*/

-- Add membership_number column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_number VARCHAR(12) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_membership_number ON members(membership_number);

-- Create membership_sequence table
CREATE TABLE IF NOT EXISTS membership_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1,
  next_number INTEGER NOT NULL DEFAULT 10000,
  prefix VARCHAR(10) NOT NULL DEFAULT 'FCM',
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS on membership_sequence
ALTER TABLE membership_sequence ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read sequence
CREATE POLICY "Authenticated users can read sequence"
  ON membership_sequence
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update sequence
CREATE POLICY "Authenticated users can update sequence"
  ON membership_sequence
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Initialize sequence with random starting number between 10000-99999
INSERT INTO membership_sequence (id, next_number, prefix)
VALUES (1, FLOOR(RANDOM() * 90000 + 10000)::INTEGER, 'FCM')
ON CONFLICT (id) DO NOTHING;

-- Create function to generate next membership number atomically
CREATE OR REPLACE FUNCTION get_next_membership_number(prefix_value TEXT DEFAULT 'FCM')
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  membership_id TEXT;
BEGIN
  UPDATE membership_sequence
  SET next_number = next_number + 1
  WHERE id = 1
  RETURNING next_number - 1 INTO next_num;
  
  membership_id := prefix_value || '-' || next_num::TEXT;
  
  RETURN membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing members with membership numbers (ordered by created_at)
DO $$
DECLARE
  member_record RECORD;
  current_num INTEGER;
  prefix_val VARCHAR(10);
BEGIN
  SELECT next_number, prefix INTO current_num, prefix_val 
  FROM membership_sequence WHERE id = 1;
  
  FOR member_record IN 
    SELECT id FROM members 
    WHERE membership_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    UPDATE members 
    SET membership_number = prefix_val || '-' || current_num::TEXT
    WHERE id = member_record.id;
    
    current_num := current_num + 1;
  END LOOP;
  
  UPDATE membership_sequence SET next_number = current_num WHERE id = 1;
END $$;
