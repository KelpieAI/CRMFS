import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log('✅ Supabase connected to:', supabaseUrl.substring(0, 40) + '...');

// Type definitions for database tables
export interface Member {
  id: string;
  app_type: 'single' | 'joint';
  title?: string;
  first_name: string;
  last_name: string;
  dob?: string;
  member_since?: string;
  join_date?: string;
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
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'overdue';
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

export interface DeceasedRecord {
  id: string;
  member_id: string;
  
  // Death details
  date_of_death: string;
  time_of_death?: string;
  place_of_death?: string;
  cause_of_death?: string;
  death_certificate_number?: string;
  
  // Notification
  notified_by?: string;
  notified_by_relationship?: string;
  notified_by_contact?: string;
  notification_date: string;
  
  // Funeral arrangements
  funeral_date?: string;
  funeral_time?: string;
  funeral_location?: string;
  
  // Islamic process
  ghusl_performed_by?: string;
  ghusl_performed_date?: string;
  kafan_provided: boolean;
  kafan_cost: number;
  
  // Janazah
  janazah_led_by?: string;
  janazah_location?: string;
  janazah_attendees?: number;
  
  // Burial
  burial_date?: string;
  burial_time?: string;
  burial_location?: string;
  burial_plot_number?: string;
  grave_number?: string;
  burial_authority?: string;
  
  // Transportation
  hearse_company?: string;
  hearse_cost: number;
  transport_from?: string;
  transport_notes?: string;
  
  // Financial
  total_cost: number;
  amount_paid: number;
  amount_outstanding: number;
  payment_status: 'pending' | 'partial' | 'completed';
  payment_notes?: string;
  
  // Administrative
  handled_by?: string;
  coordinator_name?: string;
  coordinator_phone?: string;
  
  // Additional
  family_wishes?: string;
  complications?: string;
  notes?: string;
  
  // Status
  status: 'reported' | 'arranged' | 'in_progress' | 'completed' | 'closed';
  completed_date?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FuneralExpense {
  id: string;
  deceased_record_id: string;
  expense_type: string;
  description: string;
  amount: number;
  paid_by?: string;
  receipt_number?: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

export interface FuneralPayment {
  id: string;
  deceased_record_id: string;
  amount: number;
  payment_method?: string;
  payment_date: string;
  received_by?: string;
  receipt_number?: string;
  payer_name?: string;
  payer_relationship?: string;
  notes?: string;
  created_at: string;
}

export interface FuneralContact {
  id: string;
  deceased_record_id: string;
  contact_name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_primary_contact: boolean;
  notes?: string;
  created_at: string;
}

export interface FuneralChecklist {
  id: string;
  deceased_record_id: string;
  task_name: string;
  task_category: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  member_id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action_type: 'created' | 'updated' | 'deleted' | 'status_changed' | 
                'payment_received' | 'payment_recorded' | 'document_uploaded' | 
                'document_deleted' | 'marked_deceased' | 'funeral_arranged' |
                'expense_added' | 'contact_added' | 'checklist_completed' |
                'note_added' | 'member_edited';
  entity_type: 'member' | 'joint_member' | 'child' | 'next_of_kin' | 
               'payment' | 'document' | 'gp_details' | 'medical_info' |
               'deceased_record' | 'funeral_expense' | 'funeral_payment' |
               'funeral_contact' | 'funeral_checklist' | 'declaration';
  entity_id?: string;
  description: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
