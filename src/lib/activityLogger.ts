import { supabase } from './supabase';

/**
 * Log an activity to the activity_log table with the current user
 * The performed_by field is automatically set to auth.uid() in the database function
 * 
 * @param memberId - UUID of the member this activity relates to
 * @param action - Description of the action (e.g., "Member created", "Payment updated")
 * @param details - Optional JSON details about the action
 */
export async function logActivity(
  memberId: string,
  action: string,
  details?: Record<string, any>
) {
  try {
    const { error } = await supabase.rpc('log_activity', {
      member_id_param: memberId,
      action_param: action,
      details_param: details || null,
    });

    if (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - we don't want activity logging to break the main flow
    }
  } catch (err) {
    console.error('Exception logging activity:', err);
    // Don't throw - we don't want activity logging to break the main flow
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