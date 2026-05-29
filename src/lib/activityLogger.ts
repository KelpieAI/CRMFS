import { supabase } from './supabase';

export interface ActivityLogOptions {
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changeReason?: string;
}

export async function logActivity(
  memberId: string,
  action: string,
  options?: ActivityLogOptions
) {
  try {
    const { error } = await supabase.rpc('log_activity', {
      member_id_param: memberId,
      action_param: action,
      old_values_param: options?.oldValues || null,
      new_values_param: options?.newValues || null,
      change_reason_param: options?.changeReason || null,
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Exception logging activity:', err);
  }
}

/**
 * Common activity types for consistency
 */
export const ActivityTypes = {
  // Member actions
  MEMBER_CREATED: 'Member created',
  MEMBER_UPDATED: 'Member updated',
  MEMBER_DELETED: 'Member deleted',
  MEMBER_STATUS_CHANGED: 'Member status changed',
  
  // Application actions
  APPLICATION_SUBMITTED: 'Application submitted',
  APPLICATION_APPROVED: 'Application approved',
  APPLICATION_REJECTED: 'Application rejected',
  
  // Payment actions
  PAYMENT_RECORDED: 'Payment recorded',
  PAYMENT_UPDATED: 'Payment updated',
  PAYMENT_REFUNDED: 'Payment refunded',
  
  // Joint member actions
  JOINT_MEMBER_ADDED: 'Joint member added',
  JOINT_MEMBER_UPDATED: 'Joint member updated',
  JOINT_MEMBER_REMOVED: 'Joint member removed',
  
  // Children actions
  CHILD_ADDED: 'Child added',
  CHILD_UPDATED: 'Child updated',
  CHILD_REMOVED: 'Child removed',
  
  // Document actions
  DOCUMENT_UPLOADED: 'Document uploaded',
  DOCUMENT_DELETED: 'Document deleted',
  
  // Next of kin actions
  NEXT_OF_KIN_ADDED: 'Next of kin added',
  NEXT_OF_KIN_UPDATED: 'Next of kin updated',
  NEXT_OF_KIN_REMOVED: 'Next of kin removed',
  
  // GP actions
  GP_ADDED: 'GP details added',
  GP_UPDATED: 'GP details updated',
  
  // Medical info actions
  MEDICAL_INFO_UPDATED: 'Medical information updated',
  
  // Declaration actions
  DECLARATION_SIGNED: 'Declaration signed',
  
  // Data access (GDPR)
  DATA_ACCESSED: 'Member data accessed',
  DATA_EXPORTED: 'Member data exported',
  DELETION_REQUESTED: 'Deletion requested',
  DELETION_APPROVED: 'Deletion approved',
  DELETION_REJECTED: 'Deletion rejected',
} as const;

/**
 * Get formatted user info for activity log display
 */
export async function getCurrentUserInfo() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown User',
      role: profile?.role || 'user',
    };
  } catch (err) {
    console.error('Failed to get current user info:', err);
    return null;
  }
}
