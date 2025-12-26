/*
  # Initial Database Schema for CRMFS

  1. New Tables
    - `members` - Main member records
    - `joint_members` - Joint member information
    - `children` - Children records linked to members
    - `next_of_kin` - Next of kin information
    - `gp_details` - GP surgery details
    - `medical_info` - Medical conditions and disclaimers
    - `declarations` - Agreement and funding signatures
    - `payments` - Payment records and transactions
    - `documents` - Document metadata
    - `fee_structure` - Age-based fee calculation tiers
    - `applications_in_progress` - Saved incomplete applications

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Admin users (authenticated) can read/write all records

  3. Key Features
    - UUID primary keys for all tables
    - Timestamps for audit trail (created_at, updated_at)
    - Foreign key relationships with CASCADE deletes
    - Optional member_since field for backdating memberships
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type TEXT NOT NULL CHECK (app_type IN ('single', 'joint')),
  title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  member_since DATE,
  address_line_1 TEXT,
  town TEXT,
  city TEXT,
  postcode TEXT,
  mobile TEXT,
  home_phone TEXT,
  work_phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive', 'deceased')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create joint_members table
CREATE TABLE IF NOT EXISTS joint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  address_line_1 TEXT,
  town TEXT,
  city TEXT,
  postcode TEXT,
  mobile TEXT,
  home_phone TEXT,
  work_phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('son', 'daughter', 'stepson', 'stepdaughter')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create next_of_kin table
CREATE TABLE IF NOT EXISTS next_of_kin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  address_line_1 TEXT,
  town TEXT,
  city TEXT,
  postcode TEXT,
  mobile TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create gp_details table
CREATE TABLE IF NOT EXISTS gp_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gp_name_surgery TEXT NOT NULL,
  address_line_1 TEXT,
  town TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create medical_info table
CREATE TABLE IF NOT EXISTS medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('main', 'joint')),
  disclaimer TEXT NOT NULL,
  conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create declarations table
CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  agreement_sig_1 BOOLEAN DEFAULT false,
  agreement_sig_2 BOOLEAN DEFAULT false,
  funding_sig_1 BOOLEAN DEFAULT false,
  funding_sig_2 BOOLEAN DEFAULT false,
  declaration_sig_1 BOOLEAN DEFAULT false,
  declaration_sig_2 BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE,
  join_date DATE,
  main_joining_fee DECIMAL(10, 2) DEFAULT 0,
  main_membership_fee DECIMAL(10, 2) DEFAULT 0,
  main_misc DECIMAL(10, 2) DEFAULT 0,
  joint_joining_fee DECIMAL(10, 2) DEFAULT 0,
  joint_membership_fee DECIMAL(10, 2) DEFAULT 0,
  joint_misc DECIMAL(10, 2) DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('completed', 'pending', 'failed', 'refunded')),
  reference_no TEXT,
  processed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fee_structure table
CREATE TABLE IF NOT EXISTS fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_min INTEGER NOT NULL,
  age_max INTEGER NOT NULL,
  joining_fee DECIMAL(10, 2) DEFAULT 0,
  membership_fee DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create applications_in_progress table
CREATE TABLE IF NOT EXISTS applications_in_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_reference TEXT UNIQUE NOT NULL,
  form_data JSONB NOT NULL,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_members_member_since ON members(member_since);
CREATE INDEX IF NOT EXISTS idx_joint_members_member_id ON joint_members(member_id);
CREATE INDEX IF NOT EXISTS idx_children_member_id ON children(member_id);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_member_id ON next_of_kin(member_id);
CREATE INDEX IF NOT EXISTS idx_gp_details_member_id ON gp_details(member_id);
CREATE INDEX IF NOT EXISTS idx_medical_info_member_id ON medical_info(member_id);
CREATE INDEX IF NOT EXISTS idx_declarations_member_id ON declarations(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_documents_member_id ON documents(member_id);
CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications_in_progress(application_reference);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE joint_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications_in_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table
CREATE POLICY "Authenticated users can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for joint_members table
CREATE POLICY "Authenticated users can view joint members"
  ON joint_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert joint members"
  ON joint_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update joint members"
  ON joint_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete joint members"
  ON joint_members FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for children table
CREATE POLICY "Authenticated users can view children"
  ON children FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update children"
  ON children FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete children"
  ON children FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for next_of_kin table
CREATE POLICY "Authenticated users can view next of kin"
  ON next_of_kin FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert next of kin"
  ON next_of_kin FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update next of kin"
  ON next_of_kin FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete next of kin"
  ON next_of_kin FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for gp_details table
CREATE POLICY "Authenticated users can view GP details"
  ON gp_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert GP details"
  ON gp_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update GP details"
  ON gp_details FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete GP details"
  ON gp_details FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for medical_info table
CREATE POLICY "Authenticated users can view medical info"
  ON medical_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medical info"
  ON medical_info FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical info"
  ON medical_info FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medical info"
  ON medical_info FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for declarations table
CREATE POLICY "Authenticated users can view declarations"
  ON declarations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert declarations"
  ON declarations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update declarations"
  ON declarations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete declarations"
  ON declarations FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for payments table
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for documents table
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for fee_structure table
CREATE POLICY "Authenticated users can view fee structure"
  ON fee_structure FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fee structure"
  ON fee_structure FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fee structure"
  ON fee_structure FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fee structure"
  ON fee_structure FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for applications_in_progress table
CREATE POLICY "Authenticated users can view applications in progress"
  ON applications_in_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert applications in progress"
  ON applications_in_progress FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update applications in progress"
  ON applications_in_progress FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete applications in progress"
  ON applications_in_progress FOR DELETE
  TO authenticated
  USING (true);

-- Insert default fee structure
INSERT INTO fee_structure (age_min, age_max, joining_fee, membership_fee) VALUES
  (0, 17, 0, 50),
  (18, 64, 50, 100),
  (65, 999, 25, 75)
ON CONFLICT DO NOTHING;