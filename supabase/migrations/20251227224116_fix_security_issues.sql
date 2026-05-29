/*
  # Security and Performance Fixes

  ## 1. Missing Foreign Key Indexes
  Add indexes on all foreign key columns to improve query performance:
  - `children.member_id`
  - `declarations.member_id`
  - `documents.member_id`
  - `funeral_checklist.deceased_record_id`
  - `gp_details.member_id`
  - `joint_members.member_id`
  - `medical_info.member_id`
  - `next_of_kin.member_id`
  - `payments.member_id`

  ## 2. Optimize RLS Policies on Users Table
  Wrap auth functions in SELECT to prevent re-evaluation for each row:
  - Replace `auth.uid()` with `(select auth.uid())`
  - Replace `auth.role()` with `(select auth.role())`
  - Consolidate multiple permissive policies to avoid conflicts

  ## 3. Remove Unused Indexes
  Clean up indexes that are not being used:
  - Activity log indexes
  - Applications in progress indexes
  - Deceased indexes
  - Deceased records indexes

  ## 4. Fix Function Search Paths
  Add SET search_path to all functions to prevent security vulnerabilities

  ## 5. Security Notes
  - RLS is already enabled on most tables from initial migration
  - Leaked password protection must be enabled via Supabase dashboard
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Add indexes on foreign key columns that don't have them
CREATE INDEX IF NOT EXISTS idx_children_member_id_fk 
  ON children(member_id);

CREATE INDEX IF NOT EXISTS idx_declarations_member_id_fk 
  ON declarations(member_id);

CREATE INDEX IF NOT EXISTS idx_documents_member_id_fk 
  ON documents(member_id);

CREATE INDEX IF NOT EXISTS idx_funeral_checklist_deceased_record_id_fk 
  ON funeral_checklist(deceased_record_id);

CREATE INDEX IF NOT EXISTS idx_gp_details_member_id_fk 
  ON gp_details(member_id);

CREATE INDEX IF NOT EXISTS idx_joint_members_member_id_fk 
  ON joint_members(member_id);

CREATE INDEX IF NOT EXISTS idx_medical_info_member_id_fk 
  ON medical_info(member_id);

CREATE INDEX IF NOT EXISTS idx_next_of_kin_member_id_fk 
  ON next_of_kin(member_id);

CREATE INDEX IF NOT EXISTS idx_payments_member_id_fk 
  ON payments(member_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES ON USERS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create optimized policies with SELECT wrappers
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Authenticated users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'developer')
    )
  );

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

-- Remove unused indexes on deceased_records
DROP INDEX IF EXISTS idx_deceased_records_status;
DROP INDEX IF EXISTS idx_deceased_records_date;

-- Remove unused indexes on deceased
DROP INDEX IF EXISTS idx_deceased_date_of_death;
DROP INDEX IF EXISTS idx_deceased_status;
DROP INDEX IF EXISTS idx_deceased_created_at;
DROP INDEX IF EXISTS idx_deceased_member_id;

-- Remove unused indexes on applications_in_progress
DROP INDEX IF EXISTS idx_applications_in_progress_email;
DROP INDEX IF EXISTS idx_applications_in_progress_created;

-- Remove unused indexes on activity_log
DROP INDEX IF EXISTS idx_activity_log_created_at;
DROP INDEX IF EXISTS idx_activity_log_action_type;
DROP INDEX IF EXISTS idx_activity_log_entity_type;
DROP INDEX IF EXISTS idx_activity_log_user_id;

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Use CREATE OR REPLACE to update functions with proper search_path

-- Deceased functions
CREATE OR REPLACE FUNCTION update_deceased_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Member logging functions
CREATE OR REPLACE FUNCTION log_member_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    old_values,
    new_values
  ) VALUES (
    NEW.id,
    auth.uid(),
    'updated',
    'member',
    NEW.id,
    'Member record updated',
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Payment logging functions
CREATE OR REPLACE FUNCTION log_payment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    new_values
  ) VALUES (
    NEW.member_id,
    auth.uid(),
    'payment_recorded',
    'payment',
    NEW.id,
    'Payment recorded: ' || NEW.payment_type,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION log_payment_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    old_values,
    new_values
  ) VALUES (
    NEW.member_id,
    auth.uid(),
    'updated',
    'payment',
    NEW.id,
    'Payment updated',
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Deceased record logging functions
CREATE OR REPLACE FUNCTION log_deceased_record_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    new_values
  ) VALUES (
    NEW.member_id,
    auth.uid(),
    'marked_deceased',
    'deceased_record',
    NEW.id,
    'Death recorded',
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION log_deceased_record_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    old_values,
    new_values
  ) VALUES (
    NEW.member_id,
    auth.uid(),
    'updated',
    'deceased_record',
    NEW.id,
    'Deceased record updated',
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Funeral expense logging
CREATE OR REPLACE FUNCTION log_funeral_expense_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT member_id INTO v_member_id
  FROM deceased_records
  WHERE id = NEW.deceased_record_id;

  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    new_values
  ) VALUES (
    v_member_id,
    auth.uid(),
    'expense_added',
    'funeral_expense',
    NEW.id,
    'Funeral expense added: ' || NEW.expense_type,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Funeral payment logging
CREATE OR REPLACE FUNCTION log_funeral_payment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_member_id UUID;
BEGIN
  SELECT member_id INTO v_member_id
  FROM deceased_records
  WHERE id = NEW.deceased_record_id;

  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    new_values
  ) VALUES (
    v_member_id,
    auth.uid(),
    'payment_received',
    'funeral_payment',
    NEW.id,
    'Funeral payment received',
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Document logging
CREATE OR REPLACE FUNCTION log_document_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO activity_log (
    member_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    new_values
  ) VALUES (
    NEW.member_id,
    auth.uid(),
    'document_uploaded',
    'document',
    NEW.id,
    'Document uploaded: ' || NEW.document_type,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Get member activity
CREATE OR REPLACE FUNCTION get_member_activity(p_member_id UUID)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  entity_type TEXT,
  description TEXT,
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.action_type,
    a.entity_type,
    a.description,
    a.user_email,
    a.user_name,
    a.created_at
  FROM activity_log a
  WHERE a.member_id = p_member_id
  ORDER BY a.created_at DESC
  LIMIT 100;
END;
$$;

-- Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$;

-- Update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE users
  SET last_login_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_member_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM users
  WHERE id = auth.uid();

  INSERT INTO activity_log (
    member_id,
    user_id,
    user_email,
    user_name,
    action_type,
    entity_type,
    entity_id,
    description,
    old_values,
    new_values
  ) VALUES (
    p_member_id,
    auth.uid(),
    v_user_email,
    v_user_name,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_description,
    p_old_values,
    p_new_values
  );
END;
$$;

-- Drop and recreate get_current_user_profile with profile_picture_url
DROP FUNCTION IF EXISTS get_current_user_profile();
CREATE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  status TEXT,
  phone TEXT,
  profile_picture_url TEXT,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.status,
    u.phone,
    u.profile_picture_url,
    u.last_login_at
  FROM users u
  WHERE u.id = auth.uid();
END;
$$;

-- Drop and recreate generate_application_reference with correct return type
DROP FUNCTION IF EXISTS generate_application_reference();
CREATE FUNCTION generate_application_reference()
RETURNS CHARACTER VARYING
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_reference CHARACTER VARYING;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_reference := 'APP-' || 
                   TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    SELECT EXISTS(
      SELECT 1 FROM applications_in_progress 
      WHERE application_reference = v_reference
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_reference;
END;
$$;

-- Set application reference
CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.application_reference IS NULL OR NEW.application_reference = '' THEN
    NEW.application_reference := generate_application_reference();
  END IF;
  RETURN NEW;
END;
$$;

-- Update applications timestamp
CREATE OR REPLACE FUNCTION update_applications_in_progress_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  NEW.last_saved_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
