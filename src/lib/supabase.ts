import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types (based on your schema)
export interface Member {
  id: string;
  app_type: 'single' | 'joint';
  title?: string;
  first_name: string;
  last_name: string;
  dob?: string;
  member_since?: string;
  address_line_1?: string;
  town?: string;
  city?: string;
  postcode?: string;
  mobile?: string;
  home_phone?: string;
  work_phone?: string;
  email?: string;
  status: 'pending' | 'active' | 'inactive' | 'deceased';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JointMember {
  id: string;
  member_id: string;
  title?: string;
  first_name: string;
  last_name: string;
  dob?: string;
  address_line_1?: string;
  town?: string;
  city?: string;
  postcode?: string;
  mobile?: string;
  home_phone?: string;
  work_phone?: string;
  email?: string;
  created_at: string;
}

export interface Child {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  dob?: string;
  relation?: string;
  created_at: string;
}

export interface NextOfKin {
  id: string;
  member_id: string;
  title?: string;
  first_name: string;
  last_name: string;
  relationship?: string;
  address_line_1?: string;
  town?: string;
  city?: string;
  postcode?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  payment_type?: string;
  payment_method?: string;
  main_joining_fee: number;
  main_membership_fee: number;
  main_misc: number;
  joint_joining_fee: number;
  joint_membership_fee: number;
  joint_misc: number;
  late_fee: number;
  total_amount: number;
  payment_date?: string;
  renewal_date?: string;
  join_date?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_no?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
}

export interface FeeStructure {
  id: string;
  age_min: number;
  age_max: number;
  joining_fee: number;
  membership_fee: number;
  created_at: string;
}

export interface GPDetails {
  id: string;
  member_id: string;
  gp_name_surgery?: string;
  address_line_1?: string;
  town?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  declaration_sig_1: boolean;
  declaration_sig_2: boolean;
  medical_sig_1: boolean;
  medical_sig_2: boolean;
  created_at: string;
}

export interface MedicalInfo {
  id: string;
  member_id: string;
  member_type: 'main' | 'joint';
  disclaimer?: string;
  conditions?: string;
  created_at: string;
}

export interface Document {
  id: string;
  member_id: string;
  document_type: string;
  file_path: string;
  uploaded_at: string;
}

export interface Declaration {
  id: string;
  member_id: string;
  agreement_sig_1: boolean;
  agreement_sig_2: boolean;
  funding_sig_1: boolean;
  funding_sig_2: boolean;
  declaration_sig_1: boolean;
  declaration_sig_2: boolean;
  signed_at: string;
}
