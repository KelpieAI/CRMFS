/*
  # Create Deceased Records Table

  1. New Tables
    - `deceased_records` - Records of deceased members and funeral arrangements
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key to members)
      - `date_of_death` (date, required)
      - `time_of_death` (time)
      - `place_of_death` (text, required)
      - `hospital_mortuary` (text)
      - `cause_of_death` (text)
      - `death_certificate_number` (text)
      - `death_certificate_obtained` (boolean, default false)
      - `next_of_kin_notified` (boolean, default false)
      - `assigned_committee_member` (text)
      - `burial_location` (text)
      - `burial_plot_number` (text)
      - `burial_date` (date)
      - `burial_time` (time)
      - `imam_name` (text)
      - `funeral_director` (text)
      - `funeral_director_phone` (text)
      - `estimated_attendees` (integer)
      - `estimated_total_cost` (decimal)
      - `cemetery_plot_fee` (decimal)
      - `imam_fee` (decimal)
      - `coffin_shroud_cost` (decimal)
      - `transport_cost` (decimal)
      - `other_costs` (decimal)
      - `payment_responsibility` (text)
      - `primary_contact_name` (text)
      - `primary_contact_relation` (text)
      - `primary_contact_phone` (text)
      - `primary_contact_email` (text)
      - `secondary_contact_name` (text)
      - `secondary_contact_phone` (text)
      - `notes` (text)
      - `status` (text, check constraint: 'pending', 'reported', 'arranged', 'completed')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `deceased_records` table
    - Add policies for authenticated users to manage deceased records

  3. Important Notes
    - When a death is recorded, the member's status in the members table should be set to 'deceased'
    - Status 'pending' means a death was reported but no full record was created
    - Status 'reported' means basic death information was recorded
    - Status 'arranged' means funeral arrangements are in progress
    - Status 'completed' means all funeral arrangements are complete
    - All member data is preserved in the members table for audit purposes
*/

-- Create deceased_records table
CREATE TABLE IF NOT EXISTS deceased_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  date_of_death DATE NOT NULL,
  time_of_death TIME,
  place_of_death TEXT NOT NULL,
  hospital_mortuary TEXT,
  cause_of_death TEXT,
  death_certificate_number TEXT,
  death_certificate_obtained BOOLEAN DEFAULT false,
  next_of_kin_notified BOOLEAN DEFAULT false,
  assigned_committee_member TEXT,
  burial_location TEXT,
  burial_plot_number TEXT,
  burial_date DATE,
  burial_time TIME,
  imam_name TEXT,
  funeral_director TEXT,
  funeral_director_phone TEXT,
  estimated_attendees INTEGER,
  estimated_total_cost DECIMAL(10, 2),
  cemetery_plot_fee DECIMAL(10, 2),
  imam_fee DECIMAL(10, 2),
  coffin_shroud_cost DECIMAL(10, 2),
  transport_cost DECIMAL(10, 2),
  other_costs DECIMAL(10, 2),
  payment_responsibility TEXT CHECK (payment_responsibility IN ('family', 'mosque', 'split')),
  primary_contact_name TEXT,
  primary_contact_relation TEXT,
  primary_contact_phone TEXT,
  primary_contact_email TEXT,
  secondary_contact_name TEXT,
  secondary_contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'arranged', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_deceased_records_member_id ON deceased_records(member_id);
CREATE INDEX IF NOT EXISTS idx_deceased_records_status ON deceased_records(status);
CREATE INDEX IF NOT EXISTS idx_deceased_records_date_of_death ON deceased_records(date_of_death);

-- Enable Row Level Security
ALTER TABLE deceased_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deceased_records table
CREATE POLICY "Authenticated users can view deceased records"
  ON deceased_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deceased records"
  ON deceased_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deceased records"
  ON deceased_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deceased records"
  ON deceased_records FOR DELETE
  TO authenticated
  USING (true);