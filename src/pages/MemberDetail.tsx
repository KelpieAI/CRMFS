import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logActivity, ActivityTypes, getCurrentUserInfo } from '../lib/activityLogger';
import CompactLayout from '../components/CompactLayout';
import MemberSubNav from '../components/MemberSubNav';
import { ProfileHeaderSkeleton, FormSkeleton } from '../components/SkeletonComponents';
import { useMemberStatusUpdate } from '../hooks/useOptimisticUpdates';
import {
  ArrowLeft,
  User,
  Users,
  Baby,
  Heart,
  Calendar,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Trash2,
  Pause,
  CreditCard,
  AlertTriangle,
  PoundSterling,
  Stethoscope,
  CheckSquare,
  CheckCircle,
  FileText,
  Upload,
  AlertCircle,
  Eye,
  Download,
  Info,
  PlayCircle,
  Shield,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showUnpauseModal, setShowUnpauseModal] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);

  // GDPR Admin Tools
  const [showDeletionRequestModal, setShowDeletionRequestModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionRequestedBy, setDeletionRequestedBy] = useState('');
  const [deletionConfirmation, setDeletionConfirmation] = useState('');
  const [showAccessLog, setShowAccessLog] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [unpauseCalculation, setUnpauseCalculation] = useState({
    joiningFee: 0,
    membershipFee: 100,
    total: 0
  });
  
  // Actions menu dropdown
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Tabs that support inline editing via the Edit Member button
  // Other tabs (children, nok, medical, gp, declarations) use their own modals
  // Non-editable tabs: documents (upload only), payments (audit trail), activity (read-only)
  const EDITABLE_TABS = ['personal'];
  const isEditableTab = EDITABLE_TABS.includes(activeTab);

  // Fetch member with all related data
  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member-detail', id],
    queryFn: async () => {
      const [
        { data: member },
        { data: jointMember },
        { data: children },
        { data: nextOfKin },
        { data: gpDetails },
        { data: medicalInfo },
        { data: documents },
        { data: declarations },
        { data: payments },
      ] = await Promise.all([
        supabase.from('members').select('*').eq('id', id).single(),
        supabase.from('joint_members').select('*').eq('member_id', id).maybeSingle(),
        supabase.from('children').select('*').eq('member_id', id),
        supabase.from('next_of_kin').select('*').eq('member_id', id),
        supabase.from('gp_details').select('*').eq('member_id', id).maybeSingle(),
        supabase.from('medical_info').select('*').eq('member_id', id),
        supabase.from('documents').select('*').eq('member_id', id),
        supabase.from('declarations').select('*').eq('member_id', id).maybeSingle(),
        supabase.from('payments').select('*').eq('member_id', id).order('created_at', { ascending: false }),
      ]);

      return {
        member,
        jointMember,
        children: children || [],
        nextOfKin: nextOfKin || [],
        gpDetails,
        medicalInfo: medicalInfo || [],
        documents: documents || [],
        declarations,
        payments: payments || [],
      };
    },
  });

  // Fetch last update info for audit display
  const { data: lastUpdateInfo } = useQuery({
    queryKey: ['member-last-update', id],
    queryFn: async () => {
      // Get the most recent update activity
      const { data: lastActivity } = await supabase
        .from('activity_log')
        .select('*')
        .eq('member_id', id)
        .in('action_type', ['updated', 'member_edited', 'Member updated'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastActivity?.performed_by) return null;

      // Get user info for the performer
      const { data: user } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', lastActivity.performed_by)
        .single();

      return {
        updated_at: lastActivity.created_at,
        updated_by: user?.full_name || user?.email?.split('@')[0] || 'Unknown User',
      };
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      
      // Log the update
      await logActivity(
        id!,
        ActivityTypes.MEMBER_UPDATED,
        {
          fields_updated: Object.keys(data),
          member_name: `${memberData?.member?.first_name} ${memberData?.member?.last_name}`,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
      setIsEditing(false);
      setEditedData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Log the deletion BEFORE deleting (so we still have the member ID in activity_log)
      await logActivity(
        id!,
        ActivityTypes.MEMBER_DELETED,
        {
          member_name: `${memberData?.member?.first_name} ${memberData?.member?.last_name}`,
          member_email: memberData?.member?.email,
          deletion_reason: 'Manual deletion by committee member',
        }
      );

      // Delete all related records first
      await Promise.all([
        supabase.from('payments').delete().eq('member_id', id),
        supabase.from('documents').delete().eq('member_id', id),
        supabase.from('declarations').delete().eq('member_id', id),
        supabase.from('medical_info').delete().eq('member_id', id),
        supabase.from('gp_details').delete().eq('member_id', id),
        supabase.from('next_of_kin').delete().eq('member_id', id),
        supabase.from('children').delete().eq('member_id', id),
        supabase.from('joint_members').delete().eq('member_id', id),
      ]);
      
      // Then delete member
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate('/members');
    },
  });

  const updateStatus = useMemberStatusUpdate();

  const pauseMembershipMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'inactive' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
      setShowPauseConfirm(false);
    },
  });

  const handleEdit = () => {
    setEditedData({ ...memberData?.member });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  // Cancel editing when switching away from editable tabs + scroll to top
  useEffect(() => {
    if (isEditing && !EDITABLE_TABS.includes(activeTab)) {
      setIsEditing(false);
      setEditedData(null);
    }
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, isEditing]);

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Calculate age
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate unpause fees
  const calculateUnpauseFees = () => {
    if (!memberData?.member) return;

    const age = calculateAge(memberData.member.date_of_birth);
    if (!age) return;

    let joiningFee = 0;

    // Age-based joining fee
    if (age >= 18 && age <= 25) joiningFee = 75;
    else if (age >= 26 && age <= 35) joiningFee = 100;
    else if (age >= 36 && age <= 45) joiningFee = 200;
    else if (age >= 46 && age <= 55) joiningFee = 300;
    else if (age >= 56) joiningFee = 500;

    const total = joiningFee + 100;

    setUnpauseCalculation({
      joiningFee,
      membershipFee: 100,
      total
    });
  };

  // Log access when member detail page is opened
  useEffect(() => {
    if (!memberData?.member?.id) return;

    const logAccess = async () => {
      try {
        // Get current user info
        const userInfo = await getCurrentUserInfo();
        const userName = userInfo?.full_name || userInfo?.email || 'Unknown User';

        // Log to access_log table (GDPR compliance)
        await supabase.from('access_log').insert({
          member_id: memberData.member.id,
          accessed_by: userName,
          access_type: 'view',
          accessed_data: ['personal_data', 'contact_info'],
          accessed_at: new Date().toISOString(),
        });

        // Log to activity_log for audit trail
        await logActivity(
          memberData.member.id,
          ActivityTypes.DATA_ACCESSED,
          {
            accessed_by: userName,
            member_name: `${memberData.member.first_name} ${memberData.member.last_name}`,
          }
        );
      } catch (error) {
        console.error('Failed to log access:', error);
      }
    };

    logAccess();
  }, [memberData?.member?.id]);

  // GDPR: Export member data
  const exportMemberData = async () => {
    const { member, jointMember, children, nextOfKin, gpDetails, medicalInfo, payments } = memberData || {};
    const activities = memberData?.activities || [];
    if (!member) return;

    try {
      const exportData = {
        export_info: {
          exported_at: new Date().toISOString(),
          exported_by_committee: true,
          member_request_date: new Date().toISOString(),
          data_controller: 'Falkirk Central Mosque - Central Region Muslim Funeral Service',
          purpose: 'GDPR Right to Access (Article 15)',
        },
        personal_data: {
          title: member.title,
          first_name: member.first_name,
          last_name: member.last_name,
          date_of_birth: member.date_of_birth ?? member.dob,
          email: member.email,
          mobile: member.mobile,
          phone_home: member.phone_home ?? member.home_phone,
          phone_work: member.phone_work ?? member.work_phone,
          address: member.address ?? member.address_line_1,
          town: member.town,
          city: member.city,
          postcode: member.postcode,
          status: member.status,
          created_at: member.created_at,
          updated_at: member.updated_at,
        },
        joint_member: member.app_type === 'joint' && jointMember ? {
          title: jointMember.title,
          first_name: jointMember.first_name,
          last_name: jointMember.last_name,
          date_of_birth: jointMember.date_of_birth ?? jointMember.dob,
          email: jointMember.email,
          mobile: jointMember.mobile,
          relation: jointMember.relation,
        } : null,
        children: children || [],
        next_of_kin: nextOfKin || [],
        gp_details: gpDetails || null,
        medical_info: medicalInfo || null,
        consents: {
          consent_obtained_via: member.consent_obtained_via,
          paper_form_version: member.paper_form_version,
          paper_form_date: member.paper_form_date,
        },
        signatures: {
          main_signature: member.main_signature,
          main_signature_date: member.main_signature_date,
          joint_signature: member.joint_signature,
        },
        payments: payments || [],
        activity_log: activities || [],
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CRMFS_Data_${member.first_name}_${member.last_name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await supabase.from('activity_log').insert({
        member_id: member.id,
        action_type: 'data_export',
        entity_type: 'member',
        description: 'Committee exported member data for GDPR Right to Access request',
      });

      await supabase.from('access_log').insert({
        member_id: member.id,
        accessed_by: 'Committee Member',
        access_type: 'export',
        accessed_data: ['all_data'],
        accessed_at: new Date().toISOString(),
      });

      alert('Data exported successfully. Send this file to the member via email or post.');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // GDPR: Load access logs
  const loadAccessLogs = async () => {
    if (!memberData?.member) return;

    try {
      const { data, error } = await supabase
        .from('access_log')
        .select('*')
        .eq('member_id', memberData.member.id)
        .order('accessed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAccessLogs(data || []);
    } catch (error) {
      console.error('Failed to load access logs:', error);
    }
  };

  useEffect(() => {
    if (showAccessLog) {
      loadAccessLogs();
    }
  }, [showAccessLog, memberData?.member?.id]);

  // Calculate total paid
  const totalPaid = memberData?.payments
    ?.filter((p: any) => p.payment_status === 'completed')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;

  if (isLoading) {
    return (
      <CompactLayout>
        <div className="space-y-4">
          <ProfileHeaderSkeleton />
          <FormSkeleton />
        </div>
      </CompactLayout>
    );
  }

  if (!memberData?.member) {
    return (
      <CompactLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Member not found</p>
        </div>
      </CompactLayout>
    );
  }

  const { member, children, payments } = memberData;
  const age = calculateAge(member.dob);

  return (
    <CompactLayout
      showSubNav={true}
      subNav={
        <MemberSubNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            children: children.length,
            documents: memberData.documents.length,
            payments: payments.length,
          }}
          showJointMember={member.app_type === 'joint'}
          quickActions={{
            onPrint: () => window.print(),
            onExport: exportMemberData,
            onEmail: () => window.location.href = `mailto:${member.email}`,
            onDeleteRequest: () => setShowDeletionRequestModal(true),
          }}
        />
      }
    >
      <div className="space-y-6">
        {/* Hero Section with Green Gradient */}
        <div className="bg-gradient-to-r from-[#2d5016] to-[#3d6622] rounded-lg shadow-lg p-8 text-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Link>

            {/* Actions Menu */}
            <div className="relative">
              {isEditing && isEditableTab ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center px-4 py-2 text-sm bg-white text-[#2d5016] rounded-lg hover:bg-white/90 transition-colors font-semibold"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2d5016] mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="inline-flex items-center px-4 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 mr-1" />
                    Actions
                  </button>

                  {showActionsMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActionsMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        {isEditableTab ? (
                          <button
                            onClick={() => {
                              handleEdit();
                              setShowActionsMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-400" />
                            Edit Member
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveTab('personal');
                              setShowActionsMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-300" />
                            Edit Personal Info
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveTab('payments');
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <CreditCard className="h-4 w-4 mr-3 text-gray-400" />
                          Record Payment
                        </button>

                        <button
                          onClick={() => {
                            window.print();
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-3 text-gray-400" />
                          Print Summary
                        </button>

                        <button
                          onClick={() => {
                            window.location.href = `mailto:${member.email}`;
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <Upload className="h-4 w-4 mr-3 text-gray-400" />
                          Send Email
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        {member.status === 'paused' ? (
                          <button
                            onClick={() => {
                              calculateUnpauseFees();
                              setShowUnpauseModal(true);
                              setShowActionsMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center"
                          >
                            <PlayCircle className="h-4 w-4 mr-3" />
                            Unpause Member
                          </button>
                        ) : member.status === 'active' ? (
                          <button
                            onClick={() => {
                              updateStatus.mutate({
                                memberId: id!,
                                newStatus: 'inactive',
                              });
                              setShowActionsMenu(false);
                            }}
                            disabled={updateStatus.isPending}
                            className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center disabled:opacity-50"
                          >
                            <Pause className="h-4 w-4 mr-3" />
                            {updateStatus.isPending ? 'Pausing...' : 'Pause Member'}
                          </button>
                        ) : member.status === 'inactive' && (
                          <button
                            onClick={() => {
                              updateStatus.mutate({
                                memberId: id!,
                                newStatus: 'active',
                              });
                              setShowActionsMenu(false);
                            }}
                            disabled={updateStatus.isPending}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-3" />
                            {updateStatus.isPending ? 'Activating...' : 'Activate Member'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true);
                            setShowActionsMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Delete Member
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Member Name & Status */}
          <div className="flex items-center gap-4 mb-5">
            <h1 className="text-3xl font-bold text-white">
              {member.title} {member.first_name} {member.last_name}
            </h1>
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                member.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : member.status === 'paused'
                  ? 'bg-red-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              {member.status}
            </span>
          </div>

          {/* Member ID */}
          <p className="text-[#D4AF37] text-sm font-medium mb-6">
            #{id?.slice(0, 8)}
          </p>

          {/* Quick Info Strip */}
          <div className="flex flex-wrap gap-6 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{member.mobile}</span>
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>{member.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{age ? `${age} years old` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              <span>£{totalPaid.toFixed(2)} Total Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{member.city}, {member.postcode}</span>
            </div>
          </div>

          {/* Last Updated Info */}
          {lastUpdateInfo && (
            <div className="mt-4 pt-4 border-t border-white/20 text-xs text-white/70">
              <span>Last updated: </span>
              <span className="text-[#D4AF37] font-medium">
                {new Date(lastUpdateInfo.updated_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span> by </span>
              <span className="text-white font-medium">{lastUpdateInfo.updated_by}</span>
            </div>
          )}
        </div>

        {/* Paused Member Warning */}
        {member.status === 'paused' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900">
                  Membership Suspended
                </h4>
                <p className="text-sm text-red-800 mt-1">
                  This membership was paused{member.paused_date && ` on ${new Date(member.paused_date).toLocaleDateString()}`}
                  {member.paused_reason && ` - ${member.paused_reason}`}
                </p>
                <p className="text-sm text-red-800 mt-2">
                  <strong>To reactivate:</strong> Member must pay joining fee (£{unpauseCalculation.joiningFee})
                  + annual membership fee (£100) = <strong>£{unpauseCalculation.total}</strong>
                </p>
                <p className="text-xs text-red-700 mt-2">
                  Note: Late fees are waived upon reactivation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'personal' && (
          <PersonalInfoTab
            member={isEditing ? editedData : member}
            isEditing={isEditing}
            updateField={updateField}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'joint' && (
          <JointMemberTab jointMember={memberData?.jointMember} />
        )}

        {activeTab === 'children' && (
          <ChildrenTab children={memberData?.children || []} memberId={id!} />
        )}

        {activeTab === 'nok' && (
          <NextOfKinTab nextOfKin={memberData?.nextOfKin || []} memberId={id!} />
        )}

        {activeTab === 'medical' && (
          <MedicalInfoTab medicalInfo={memberData?.medicalInfo || []} memberId={id!} />
        )}

        {activeTab === 'gp' && (
          <GPDetailsTab gpDetails={memberData?.gpDetails} memberId={id!} member={memberData?.member} />
        )}

        {activeTab === 'declarations' && (
          <DeclarationsTab declarations={memberData?.declarations} memberId={id!} member={memberData?.member} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab member={memberData?.member} memberId={id!} />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab payments={memberData?.payments || []} memberId={id!} />
        )}

        {activeTab === 'activity' && (
          <ActivityLogTab memberId={id!} />
        )}

        {!['personal', 'joint', 'children', 'nok', 'medical', 'gp', 'declarations', 'documents', 'payments', 'activity'].includes(activeTab) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500">Content for {activeTab} tab coming soon...</p>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Delete Member
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Warning: This action cannot be undone!
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      All member data, payment history, and records will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                You are about to delete: <strong>{memberData?.member?.first_name} {memberData?.member?.last_name}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter password to confirm deletion:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword) {
                      e.preventDefault();
                      document.getElementById('delete-confirm-btn')?.click();
                    }
                  }}
                />
                {deleteError && (
                  <p className="text-sm text-red-600 mt-2">{deleteError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                id="delete-confirm-btn"
                onClick={async () => {
                  // Check password - CHANGE THIS PASSWORD TO YOUR SECURE PASSWORD
                  if (deletePassword !== 'Test123!') {
                    setDeleteError('Incorrect password');
                    return;
                  }

                  // Delete member
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={!deletePassword || deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPauseConfirm && (
        <ConfirmModal
          title="Pause Membership"
          message="This will change the member's status to inactive. You can reactivate them later by editing their status."
          confirmText="Pause"
          confirmColor="yellow"
          onConfirm={() => pauseMembershipMutation.mutate()}
          onCancel={() => setShowPauseConfirm(false)}
          isLoading={pauseMembershipMutation.isPending}
        />
      )}

      {/* Unpause Membership Modal */}
      {showUnpauseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PlayCircle className="h-5 w-5 mr-2 text-emerald-600" />
                Unpause Membership
              </h3>
              <button
                onClick={() => setShowUnpauseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Member Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {member?.first_name} {member?.last_name}
              </p>
              <p className="text-xs text-gray-600">
                Membership No: {member?.membership_number || id?.slice(0, 8)}
              </p>
              <p className="text-xs text-gray-600">
                Age: {calculateAge(member?.date_of_birth)} years
              </p>
            </div>

            {/* Fee Breakdown */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Reactivation Fees
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Joining Fee (age-based):</span>
                  <span className="font-medium text-blue-900">
                    £{unpauseCalculation.joiningFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Annual Membership Fee:</span>
                  <span className="font-medium text-blue-900">
                    £{unpauseCalculation.membershipFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Late Fees (waived):</span>
                  <span className="font-medium line-through">£0.00</span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Total Due:</span>
                    <span className="text-lg">£{unpauseCalculation.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-yellow-900 mb-2">
                Important Information:
              </h5>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Member must pay full reactivation fee to unpause</li>
                <li>• Previous late fees are waived as a one-time courtesy</li>
                <li>• Membership will be active from payment date</li>
                <li>• Next renewal: January 1st, {new Date().getFullYear() + 1}</li>
              </ul>
            </div>

            {/* Payment Status Toggle */}
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentReceived}
                  onChange={(e) => setPaymentReceived(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Payment received (£{unpauseCalculation.total.toFixed(2)})
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUnpauseModal(false);
                  setPaymentReceived(false);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!paymentReceived) {
                    alert('Please confirm payment has been received');
                    return;
                  }

                  try {
                    // Record payment
                    const { error: paymentError } = await supabase
                      .from('payments')
                      .insert({
                        member_id: member?.id,
                        amount: unpauseCalculation.total,
                        payment_type: 'reactivation',
                        payment_method: 'cash',
                        payment_status: 'completed',
                        payment_date: new Date().toISOString(),
                        total_amount: unpauseCalculation.total,
                        notes: `Membership reactivation - Joining fee £${unpauseCalculation.joiningFee} + Annual fee £100`
                      });

                    if (paymentError) throw paymentError;

                    // Update member status
                    const { error: memberError } = await supabase
                      .from('members')
                      .update({
                        status: 'active',
                        late_warnings_count: 0,
                        paused_date: null,
                        paused_reason: null,
                        last_payment_date: new Date().toISOString()
                      })
                      .eq('id', member?.id);

                    if (memberError) throw memberError;

                    // Success
                    setShowUnpauseModal(false);
                    setPaymentReceived(false);
                    queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
                    alert('Membership successfully reactivated!');
                  } catch (error) {
                    console.error('Unpause error:', error);
                    alert('Failed to reactivate membership. Please try again.');
                  }
                }}
                disabled={!paymentReceived}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reactivate Membership
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Request Modal */}
      {showDeletionRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                Create Deletion Request
              </h3>
              <button
                onClick={() => {
                  setShowDeletionRequestModal(false);
                  setDeletionReason('');
                  setDeletionRequestedBy('');
                  setDeletionConfirmation('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Committee Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Create this request when a member contacts you to delete their account</li>
                <li>• Member request can be via email, phone, or letter</li>
                <li>• Committee must review and approve/reject within 30 days</li>
              </ul>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did member request deletion? *
                </label>
                <select
                  value={deletionRequestedBy}
                  onChange={(e) => setDeletionRequestedBy(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select method</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone call</option>
                  <option value="letter">Letter/Post</option>
                  <option value="in_person">In person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member's Reason for Deletion *
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="E.g., 'Moving abroad', 'No longer need service'..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type member's full name to confirm *
                </label>
                <input
                  type="text"
                  value={deletionConfirmation}
                  onChange={(e) => setDeletionConfirmation(e.target.value)}
                  required
                  placeholder={`${member?.first_name} ${member?.last_name}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeletionRequestModal(false);
                  setDeletionReason('');
                  setDeletionRequestedBy('');
                  setDeletionConfirmation('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deletionReason.trim() || !deletionRequestedBy) {
                    alert('Please complete all fields');
                  return;
                }

                const expectedName = `${member?.first_name} ${member?.last_name}`;
                if (deletionConfirmation.trim().toLowerCase() !== expectedName.toLowerCase()) {
                  alert(`Please type the member's full name exactly: ${expectedName}`);
                  return;
                }

                try {
                  const { error } = await supabase
                    .from('deletion_requests')
                    .insert({
                      member_id: member?.id,
                      requester_name: expectedName,
                      requester_email: member?.email || 'Not provided',
                      reason: deletionReason,
                      status: 'pending',
                      requested_at: new Date().toISOString(),
                        metadata: {
                          requested_via: deletionRequestedBy,
                          created_by_committee: true,
                        },
                      });

                  if (error) throw error;

                  await supabase.from('activity_log').insert({
                    member_id: member?.id,
                    action_type: 'deletion_request',
                    entity_type: 'member',
                    description: `Committee created deletion request on behalf of member (requested via ${deletionRequestedBy})`,
                  });

                  setShowDeletionRequestModal(false);
                  setDeletionReason('');
                  setDeletionRequestedBy('');
                  setDeletionConfirmation('');
                  
                  // Success - modal closes silently
                } catch (error) {
                  console.error('Deletion request error:', error);
                  alert('Failed to create deletion request. Please try again.');
                }
              }}
              disabled={deletionConfirmation.trim().toLowerCase() !== `${member?.first_name} ${member?.last_name}`.toLowerCase()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Deletion Request
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Log Modal */}
      {showAccessLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-gray-600" />
                Access Log - {memberData?.member?.first_name} {memberData?.member?.last_name}
              </h3>
              <button
                onClick={() => setShowAccessLog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                This log shows who accessed this member's data and when. Required for GDPR Article 30 compliance.
              </p>
            </div>

            <div className="space-y-2">
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No access logs yet
                </div>
              ) : (
                accessLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {log.accessed_by}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.access_type === 'view' ? 'bg-blue-100 text-blue-800' :
                            log.access_type === 'edit' ? 'bg-green-100 text-green-800' :
                            log.access_type === 'export' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.access_type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.accessed_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {log.accessed_data && log.accessed_data.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            Data accessed: {log.accessed_data.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAccessLog(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CompactLayout>
  );
}

// Personal Info Tab Component
function PersonalInfoTab({ member, isEditing, updateField, setActiveTab }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Details Card - Featured */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#D4AF37]">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-emerald-50">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <User className="h-5 w-5 text-[#2d5016]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Title
              </label>
              {isEditing ? (
                <select
                  value={member?.title || ''}
                  onChange={(e) => updateField?.('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select...</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              ) : (
                <p className="text-base font-medium text-gray-900">{member?.title || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Member Type
              </label>
              <p className="text-base font-semibold text-[#2d5016] capitalize">
                {member?.app_type}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={member?.first_name || ''}
                  onChange={(e) => updateField?.('first_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-900">{member?.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={member?.last_name || ''}
                  onChange={(e) => updateField?.('last_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-900">{member?.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={member?.dob || ''}
                  onChange={(e) => updateField?.('dob', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-900">
                  {member?.dob ? (
                    <>
                      {new Date(member.dob).toLocaleDateString()}{' '}
                      <span className="text-gray-500 text-sm">
                        ({calculateAge(member.dob)} years)
                      </span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  value={member?.status || ''}
                  onChange={(e) => updateField?.('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="paused">Paused</option>
                </select>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    member?.status === 'active'
                      ? 'text-emerald-600'
                      : member?.status === 'paused'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {member?.status?.charAt(0).toUpperCase() + member?.status?.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={() => {}}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d5016] text-white rounded-lg hover:bg-[#1f3810] transition-all duration-200 font-semibold text-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Edit className="h-4 w-4" />
              Edit Details
            </button>
          </div>
        )}
      </div>

      {/* Contact Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-emerald-50">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Phone className="h-5 w-5 text-[#2d5016]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-emerald-50/30 rounded-lg border border-emerald-100">
            <Phone className="h-5 w-5 text-[#2d5016] mt-0.5" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Mobile
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={member?.mobile || ''}
                  onChange={(e) => updateField?.('mobile', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-900">{member?.mobile}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50/30 rounded-lg border border-emerald-100">
            <Upload className="h-5 w-5 text-[#2d5016] mt-0.5" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={member?.email || ''}
                  onChange={(e) => updateField?.('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-900">{member?.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Home Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={member?.home_phone || ''}
                  onChange={(e) => updateField?.('home_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-400">{member?.home_phone || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Work Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={member?.work_phone || ''}
                  onChange={(e) => updateField?.('work_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              ) : (
                <p className="text-base font-medium text-gray-400">{member?.work_phone || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="mt-6 pt-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => window.location.href = `mailto:${member?.email}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
            >
              <Upload className="h-4 w-4" />
              Send Email
            </button>
            <button
              onClick={() => window.location.href = `tel:${member?.mobile}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
            >
              <Phone className="h-4 w-4" />
              Call Member
            </button>
          </div>
        )}
      </div>

      {/* Address Card - Full Width */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-emerald-50">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <MapPin className="h-5 w-5 text-[#2d5016]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Address</h3>
        </div>

        {!isEditing && (
          <div className="flex items-start gap-4 p-4 bg-emerald-50/30 rounded-lg border-l-4 border-l-[#D4AF37] mb-5">
            <MapPin className="h-8 w-8 text-[#2d5016] flex-shrink-0" />
            <div>
              <p className="text-base font-medium text-gray-900 leading-relaxed">
                {member?.address_line_1}
              </p>
              <p className="text-base font-medium text-gray-900 leading-relaxed">
                {member?.town}{member?.town && member?.city && ', '}{member?.city}
              </p>
              <p className="text-base font-semibold text-[#2d5016] leading-relaxed">
                {member?.postcode}
              </p>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={member?.address_line_1 || ''}
                onChange={(e) => updateField?.('address_line_1', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Town
              </label>
              <input
                type="text"
                value={member?.town || ''}
                onChange={(e) => updateField?.('town', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                City
              </label>
              <input
                type="text"
                value={member?.city || ''}
                onChange={(e) => updateField?.('city', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={member?.postcode || ''}
                onChange={(e) => updateField?.('postcode', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="pt-5 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${member?.address_line_1}, ${member?.city}, ${member?.postcode}`)}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
            >
              <MapPin className="h-4 w-4" />
              View on Map
            </button>
            <button
              onClick={() => {}}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
            >
              <Edit className="h-4 w-4" />
              Edit Address
            </button>
          </div>
        )}
      </div>

      {/* Membership Info Card - Full Width */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#D4AF37]">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-emerald-50">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Shield className="h-5 w-5 text-[#2d5016]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Membership Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Member ID
            </label>
            <p className="text-base font-bold text-[#D4AF37]">#{member?.id?.slice(0, 8)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Member Since
            </label>
            <p className="text-base font-medium text-gray-900">
              {member?.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Next Renewal
            </label>
            <p className="text-base font-semibold text-[#2d5016]">
              {member?.next_renewal_date ? new Date(member.next_renewal_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total Paid
            </label>
            <p className="text-xl font-bold text-[#2d5016]">
              £{calculateTotalPaid(member).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => setActiveTab('payments')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d5016] text-white rounded-lg hover:bg-[#1f3810] transition-all duration-200 font-semibold text-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <CreditCard className="h-4 w-4" />
            View Payments
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
          >
            <PoundSterling className="h-4 w-4" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Notes Card (if exists) */}
      {(member?.notes || isEditing) && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-emerald-50">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <FileText className="h-5 w-5 text-[#2d5016]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
          </div>

          {isEditing ? (
            <textarea
              value={member?.notes || ''}
              onChange={(e) => updateField?.('notes', e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              placeholder="Add any additional notes about this member..."
            />
          ) : (
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {member?.notes || 'No notes'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function for calculating total paid
function calculateTotalPaid(member: any): number {
  // Use existing payments data from member if available
  if (member?.payments && Array.isArray(member.payments)) {
    return member.payments.reduce((sum: number, payment: any) =>
      sum + (payment.total_amount || 0), 0
    );
  }
  return 0;
}

// Helper function for calculating age from DOB
function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper Components
function InfoRow({ label, value, displayValue, isEditing, type = 'text', options, onChange }: any) {
  // Helper to capitalize first letter (for status display)
  const capitalizeValue = (val: string) => {
    if (!val) return val;
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  if (!isEditing) {
    return (
      <div className="py-1">
        <span className="text-xs text-gray-500 font-medium">{label}: </span>
        <span className="text-sm text-gray-900">
          {label === 'Status' ? capitalizeValue(displayValue || value) : (displayValue || value || 'N/A')}
        </span>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div className="flex justify-between items-center py-1">
        <dt className="text-xs text-gray-500 font-medium">{label}</dt>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select</option>
          {options?.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center py-1">
      <dt className="text-xs text-gray-500 font-medium">{label}</dt>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-48"
      />
    </div>
  );
}

function ConfirmModal({ title, message, confirmText, confirmColor, onConfirm, onCancel, isLoading }: any) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${colorClasses[confirmColor as keyof typeof colorClasses]}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Joint Member Tab Component
function JointMemberTab({ jointMember }: any) {
  if (!jointMember) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No joint member registered</p>
          <p className="text-sm text-gray-400 mt-1">
            This is a single membership or joint member details haven't been added yet.
          </p>
        </div>
      </div>
    );
  }

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(jointMember.dob);

  return (
    <div className="space-y-4">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            Partner Details
          </h3>
          <dl className="space-y-2">
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Title: </span>
              <span className="text-sm text-gray-900">{jointMember.title || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">First Name: </span>
              <span className="text-sm text-gray-900">{jointMember.first_name || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Last Name: </span>
              <span className="text-sm text-gray-900">{jointMember.last_name || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Date of Birth: </span>
              <span className="text-sm text-gray-900">
                {jointMember.dob ? new Date(jointMember.dob).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Age: </span>
              <span className="text-sm text-gray-900">{age ? `${age} years` : 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Relationship: </span>
              <span className="text-sm text-gray-900 capitalize">{jointMember.relation || 'N/A'}</span>
            </div>
          </dl>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            Contact Information
          </h3>
          <dl className="space-y-2">
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Mobile: </span>
              <span className="text-sm text-gray-900">{jointMember.mobile || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Home Phone: </span>
              <span className="text-sm text-gray-900">{jointMember.home_phone || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Work Phone: </span>
              <span className="text-sm text-gray-900">{jointMember.work_phone || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Email: </span>
              <span className="text-sm text-gray-900">{jointMember.email || 'N/A'}</span>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// GP Details Tab Component
function GPDetailsTab({ gpDetails, memberId, member }: any) {
  const [showGPModal, setShowGPModal] = useState(false);
  
  if (!gpDetails) {
    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium">No GP details recorded</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              GP information hasn't been added yet.
            </p>
            <button
              onClick={() => setShowGPModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Add GP Details
            </button>
          </div>
        </div>

        {showGPModal && (
          <GPDetailsModal
            isOpen={showGPModal}
            onClose={() => setShowGPModal(false)}
            memberId={memberId}
            gpDetails={null}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">GP Practice Information</h3>
          <button
            onClick={() => setShowGPModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit GP Details
          </button>
        </div>

        {/* GP Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
            GP Practice Information
          </h3>
          <dl className="space-y-2">
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Practice Name: </span>
              <span className="text-sm text-gray-900">{gpDetails.gp_name_surgery || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Address: </span>
              <span className="text-sm text-gray-900">{gpDetails.address_line_1 || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Town: </span>
              <span className="text-sm text-gray-900">{gpDetails.town || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">City: </span>
              <span className="text-sm text-gray-900">{gpDetails.city || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Postcode: </span>
              <span className="text-sm text-gray-900">{gpDetails.postcode || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Phone: </span>
              <span className="text-sm text-gray-900">{gpDetails.phone || 'N/A'}</span>
            </div>
            <div className="py-1">
              <span className="text-xs text-gray-500 font-medium">Email: </span>
              <span className="text-sm text-gray-900">{gpDetails.email || 'N/A'}</span>
            </div>
          </dl>
        </div>
      </div>

      {showGPModal && (
        <GPDetailsModal
          isOpen={showGPModal}
          onClose={() => setShowGPModal(false)}
          memberId={memberId}
          gpDetails={gpDetails}
        />
      )}
    </>
  );
}

// Declarations Tab Component
function DeclarationsTab({ declarations, memberId, member }: any) {
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  if (!declarations) {
    return (
      <>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium">No declarations recorded</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Declarations haven't been completed yet.
            </p>
            <button
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Sign Declarations
            </button>
          </div>
        </div>

        {showSignatureModal && (
          <DeclarationsSignatureModal
            isOpen={showSignatureModal}
            onClose={() => setShowSignatureModal(false)}
            memberId={memberId}
            member={member}
            declarations={null}
          />
        )}
      </>
    );
  }

  const hasMainSignatures = declarations.main_medical_signature || declarations.main_final_signature;
  const hasJointSignatures = declarations.joint_medical_signature || declarations.joint_final_signature;
  const isComplete = declarations.main_medical_signature && declarations.main_final_signature;

  return (
    <>
      <div className="space-y-4">
        {/* Header with Sign Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Declaration Signatures</h3>
          {!isComplete && (
            <button
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {hasMainSignatures ? 'Update Signatures' : 'Sign Declarations'}
            </button>
          )}
        </div>

        {/* Medical Consent - Main Member */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Section 6: Medical Consent - Applicant 1
            </h3>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Consent Given</dt>
              <dd className="text-sm text-gray-900 text-right">
                {declarations.main_medical_consent ? (
                  <span className="inline-flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Yes
                  </span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </dd>
            </div>
            {declarations.main_medical_signature && (
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Signature</dt>
                <dd className="text-lg text-gray-900 text-right font-serif italic">
                  {declarations.main_medical_signature}
                </dd>
              </div>
            )}
            {declarations.main_medical_consent_date && (
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Date Signed</dt>
                <dd className="text-sm text-gray-900 text-right">
                  {new Date(declarations.main_medical_consent_date).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Final Declaration - Main Member */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-1">
              Section 7: Final Declaration - Applicant 1
            </h3>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Declaration Accepted</dt>
              <dd className="text-sm text-gray-900 text-right">
                {declarations.main_final_declaration ? (
                  <span className="inline-flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Yes
                  </span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </dd>
            </div>
            {declarations.main_final_signature && (
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Signature</dt>
                <dd className="text-lg text-gray-900 text-right font-serif italic">
                  {declarations.main_final_signature}
                </dd>
              </div>
            )}
            {declarations.main_final_declaration_date && (
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Date Signed</dt>
                <dd className="text-sm text-gray-900 text-right">
                  {new Date(declarations.main_final_declaration_date).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Medical Consent - Joint Member */}
        {declarations.joint_medical_consent !== undefined && declarations.joint_medical_consent !== null && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Section 6: Medical Consent - Applicant 2
              </h3>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Consent Given</dt>
                <dd className="text-sm text-gray-900 text-right">
                  {declarations.joint_medical_consent ? (
                    <span className="inline-flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </dd>
              </div>
              {declarations.joint_medical_signature && (
                <div className="flex justify-between items-start py-1">
                  <dt className="text-xs text-gray-500 font-medium">Signature</dt>
                  <dd className="text-lg text-gray-900 text-right font-serif italic">
                    {declarations.joint_medical_signature}
                  </dd>
                </div>
              )}
              {declarations.joint_medical_consent_date && (
                <div className="flex justify-between items-start py-1">
                  <dt className="text-xs text-gray-500 font-medium">Date Signed</dt>
                  <dd className="text-sm text-gray-900 text-right">
                    {new Date(declarations.joint_medical_consent_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Final Declaration - Joint Member */}
        {declarations.joint_final_declaration !== undefined && declarations.joint_final_declaration !== null && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Section 7: Final Declaration - Applicant 2
              </h3>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between items-start py-1">
                <dt className="text-xs text-gray-500 font-medium">Declaration Accepted</dt>
                <dd className="text-sm text-gray-900 text-right">
                  {declarations.joint_final_declaration ? (
                    <span className="inline-flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </dd>
              </div>
              {declarations.joint_final_signature && (
                <div className="flex justify-between items-start py-1">
                  <dt className="text-xs text-gray-500 font-medium">Signature</dt>
                  <dd className="text-lg text-gray-900 text-right font-serif italic">
                    {declarations.joint_final_signature}
                  </dd>
                </div>
              )}
              {declarations.joint_final_declaration_date && (
                <div className="flex justify-between items-start py-1">
                  <dt className="text-xs text-gray-500 font-medium">Date Signed</dt>
                  <dd className="text-sm text-gray-900 text-right">
                    {new Date(declarations.joint_final_declaration_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {showSignatureModal && (
        <DeclarationsSignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          memberId={memberId}
          member={member}
          declarations={declarations}
        />
      )}
    </>
  );
}
// ============================================
// BATCH 2 TAB COMPONENTS
// Add these to the end of MemberDetail.tsx
// ============================================

// Children Tab Component
function ChildrenTab({ children, memberId }: any) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      setShowDeleteConfirm(null);
    },
  });

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Baby className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No children registered</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Add children to this membership
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Baby className="h-4 w-4 mr-2" />
            Add Child
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Children ({children.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Baby className="h-4 w-4 mr-1" />
          Add Child
        </button>
      </div>

      {/* Children List */}
      <div className="space-y-3">
        {children.map((child: any) => {
          const age = child.dob
            ? Math.floor(
                (new Date().getTime() - new Date(child.dob).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )
            : null;

          return (
            <div
              key={child.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-base font-semibold text-gray-900">
                      {child.first_name} {child.last_name}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {child.gender || 'N/A'}
                    </span>
                    {age !== null && (
                      <span className="text-sm text-gray-500">
                        {age} year{age !== 1 ? 's' : ''} old
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <dt className="text-xs text-gray-500">Date of Birth</dt>
                      <dd className="text-gray-900">
                        {child.dob
                          ? new Date(child.dob).toLocaleDateString()
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingChild(child)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(child.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Modals */}
      {showAddModal && (
        <ChildModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          memberId={memberId}
        />
      )}

      {editingChild && (
        <ChildModal
          isOpen={!!editingChild}
          onClose={() => setEditingChild(null)}
          memberId={memberId}
          child={editingChild}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Child"
          message="Are you sure you want to remove this child from the membership?"
          confirmText="Delete"
          confirmColor="red"
          onConfirm={() => deleteChildMutation.mutate(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          isLoading={deleteChildMutation.isPending}
        />
      )}
    </div>
  );
}

// Next of Kin Tab Component
function NextOfKinTab({ nextOfKin, memberId }: any) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('next_of_kin')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      setShowDeleteConfirm(null);
    },
  });

  if (nextOfKin.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No emergency contacts</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Add emergency contacts for this member
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Heart className="h-4 w-4 mr-2" />
            Add Contact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Emergency Contacts ({nextOfKin.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Heart className="h-4 w-4 mr-1" />
          Add Contact
        </button>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {nextOfKin.map((contact: any, index: number) => (
          <div
            key={contact.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Name and Badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Heart className="h-5 w-5 text-[#2d5016]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {contact.title} {contact.first_name} {contact.last_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#2d5016] font-medium capitalize">
                        {contact.relationship || 'N/A'}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#D4AF37] text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-[#2d5016] mt-0.5" />
                    <div>
                      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</dt>
                      <dd className="text-sm font-medium text-gray-900 mt-0.5">{contact.mobile || 'N/A'}</dd>
                    </div>
                  </div>

                  {/* Home Phone */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Home Phone</dt>
                      <dd className="text-sm font-medium text-gray-900 mt-0.5">{contact.phone || 'N/A'}</dd>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                    <Upload className="h-4 w-4 text-[#2d5016] mt-0.5" />
                    <div>
                      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</dt>
                      <dd className="text-sm font-medium text-gray-900 mt-0.5">{contact.email || 'N/A'}</dd>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-lg border-l-4 border-l-[#D4AF37] md:col-span-2">
                    <MapPin className="h-4 w-4 text-[#2d5016] mt-0.5" />
                    <div>
                      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</dt>
                      <dd className="text-sm font-medium text-gray-900 mt-0.5">
                        {contact.address_line_1 && (
                          <>
                            {contact.address_line_1}
                            <br />
                          </>
                        )}
                        {(contact.town || contact.city) && (
                          <>
                            {contact.town}{contact.town && contact.city && ', '}{contact.city}
                            <br />
                          </>
                        )}
                        {contact.postcode && (
                          <span className="font-semibold text-[#2d5016]">{contact.postcode}</span>
                        )}
                        {!contact.address_line_1 && !contact.town && !contact.city && !contact.postcode && 'N/A'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => setEditingContact(contact)}
                  className="p-2 text-gray-400 hover:text-[#2d5016] hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(contact.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real Modals */}
      {showAddModal && (
        <NextOfKinModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          memberId={memberId}
        />
      )}

      {editingContact && (
        <NextOfKinModal
          isOpen={!!editingContact}
          onClose={() => setEditingContact(null)}
          memberId={memberId}
          contact={editingContact}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Contact"
          message="Are you sure you want to remove this emergency contact?"
          confirmText="Delete"
          confirmColor="red"
          onConfirm={() => deleteContactMutation.mutate(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          isLoading={deleteContactMutation.isPending}
        />
      )}
    </div>
  );
}

// Medical Info Tab Component
function MedicalInfoTab({ medicalInfo, memberId }: any) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInfo, setEditingInfo] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const deleteInfoMutation = useMutation({
    mutationFn: async (infoId: string) => {
      const { error } = await supabase
        .from('medical_info')
        .delete()
        .eq('id', infoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      setShowDeleteConfirm(null);
    },
  });

  // Group by type
  const conditions = medicalInfo.filter((m: any) => m.type === 'condition');
  const allergies = medicalInfo.filter((m: any) => m.type === 'allergy');
  const medications = medicalInfo.filter((m: any) => m.type === 'medication');

  if (medicalInfo.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No medical information</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Add medical conditions, allergies, or medications
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Add Information
          </button>
        </div>
      </div>
    );
  }

  const MedicalSection = ({ title, items, color }: any) => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
        <ul className="space-y-2">
          {items.map((item: any) => (
            <li
              key={item.id}
              className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${color}`}></span>
                  <p className="text-sm font-medium text-gray-900">
                    {item.description}
                  </p>
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-1 ml-4">{item.notes}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setEditingInfo(item)}
                  className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Medical Information ({medicalInfo.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <FileText className="h-4 w-4 mr-1" />
          Add Information
        </button>
      </div>

      {/* Sections */}
      <MedicalSection
        title="Conditions"
        items={conditions}
        color="bg-blue-500"
      />
      <MedicalSection
        title="Allergies"
        items={allergies}
        color="bg-red-500"
      />
      <MedicalSection
        title="Medications"
        items={medications}
        color="bg-green-500"
      />

      {/* Real Modals */}
      {showAddModal && (
        <MedicalInfoModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          memberId={memberId}
        />
      )}

      {editingInfo && (
        <MedicalInfoModal
          isOpen={!!editingInfo}
          onClose={() => setEditingInfo(null)}
          memberId={memberId}
          info={editingInfo}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Medical Information"
          message="Are you sure you want to remove this medical information?"
          confirmText="Delete"
          confirmColor="red"
          onConfirm={() => deleteInfoMutation.mutate(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          isLoading={deleteInfoMutation.isPending}
        />
      )}
    </div>
  );
}

// Documents Tab Component (Simple placeholder)
function DocumentsTab({ member, memberId }: any) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const hasAnyDocuments = member?.main_photo_id_url ||
    member?.main_proof_address_url ||
    member?.joint_photo_id_url ||
    member?.joint_proof_address_url ||
    (member?.children_documents && Object.keys(member.children_documents).length > 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Documents
          </h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Upload className="h-4 w-4 mr-1" />
            {hasAnyDocuments ? 'Manage Documents' : 'Upload Documents'}
          </button>
        </div>

      {/* Main Member Documents */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-4 w-4 mr-2 text-emerald-600" />
          Main Member Documents
        </h4>

        <div className="space-y-4">
          {/* Photo ID */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center flex-1">
              <div className={`p-2 rounded-lg mr-3 ${
                member?.main_photo_id_url
                  ? 'bg-emerald-100'
                  : 'bg-gray-100'
              }`}>
                <FileText className={`h-6 w-6 ${
                  member?.main_photo_id_url
                    ? 'text-emerald-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Photo ID (Passport / Driving Licence)
                </p>
                {member?.main_photo_id_url ? (
                  <p className="text-xs text-gray-500">
                    Uploaded • Required
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    Not uploaded • Required
                  </p>
                )}
              </div>
            </div>

            {member?.main_photo_id_url ? (
              <div className="flex items-center space-x-2">
                <a
                  href={member.main_photo_id_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="View document"
                >
                  <Eye className="h-4 w-4 text-emerald-600" />
                </a>
                <a
                  href={member.main_photo_id_url}
                  download
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Download document"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                </a>
              </div>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Missing
              </span>
            )}
          </div>

          {/* Proof of Address */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center flex-1">
              <div className={`p-2 rounded-lg mr-3 ${
                member?.main_proof_address_url
                  ? 'bg-emerald-100'
                  : 'bg-gray-100'
              }`}>
                <FileText className={`h-6 w-6 ${
                  member?.main_proof_address_url
                    ? 'text-emerald-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Proof of Address (Utility Bill / Council Tax)
                </p>
                {member?.main_proof_address_url ? (
                  <p className="text-xs text-gray-500">
                    Uploaded • Required
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    Not uploaded • Required
                  </p>
                )}
              </div>
            </div>

            {member?.main_proof_address_url ? (
              <div className="flex items-center space-x-2">
                <a
                  href={member.main_proof_address_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="View document"
                >
                  <Eye className="h-4 w-4 text-emerald-600" />
                </a>
                <a
                  href={member.main_proof_address_url}
                  download
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Download document"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                </a>
              </div>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                Missing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Joint Member Documents (if applicable) */}
      {member?.has_joint_member && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2 text-emerald-600" />
            Joint Member Documents
          </h4>

          <div className="space-y-4">
            {/* Joint Photo ID */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center flex-1">
                <div className={`p-2 rounded-lg mr-3 ${
                  member?.joint_photo_id_url
                    ? 'bg-emerald-100'
                    : 'bg-gray-100'
                }`}>
                  <FileText className={`h-6 w-6 ${
                    member?.joint_photo_id_url
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Photo ID (Passport / Driving Licence)
                  </p>
                  {member?.joint_photo_id_url ? (
                    <p className="text-xs text-gray-500">
                      Uploaded • Required
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      Not uploaded • Required
                    </p>
                  )}
                </div>
              </div>

              {member?.joint_photo_id_url ? (
                <div className="flex items-center space-x-2">
                  <a
                    href={member.joint_photo_id_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4 text-emerald-600" />
                  </a>
                  <a
                    href={member.joint_photo_id_url}
                    download
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </a>
                </div>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Missing
                </span>
              )}
            </div>

            {/* Joint Proof of Address */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center flex-1">
                <div className={`p-2 rounded-lg mr-3 ${
                  member?.joint_proof_address_url
                    ? 'bg-emerald-100'
                    : 'bg-gray-100'
                }`}>
                  <FileText className={`h-6 w-6 ${
                    member?.joint_proof_address_url
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Proof of Address (Utility Bill / Council Tax)
                  </p>
                  {member?.joint_proof_address_url ? (
                    <p className="text-xs text-gray-500">
                      Uploaded • Required
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      Not uploaded • Required
                    </p>
                  )}
                </div>
              </div>

              {member?.joint_proof_address_url ? (
                <div className="flex items-center space-x-2">
                  <a
                    href={member.joint_proof_address_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4 text-emerald-600" />
                  </a>
                  <a
                    href={member.joint_proof_address_url}
                    download
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </a>
                </div>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  Missing
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Children Documents (if applicable) */}
      {member?.children_documents && Object.keys(member.children_documents).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Baby className="h-4 w-4 mr-2 text-emerald-600" />
            Children's Documents
          </h4>

          <div className="space-y-4">
            {Object.entries(member.children_documents).map(([key, url]: [string, any], index: number) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center flex-1">
                  <div className="p-2 rounded-lg mr-3 bg-emerald-100">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Child {index + 1} - Birth Certificate / Passport
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded • Required
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4 text-emerald-600" />
                  </a>
                  <a
                    href={url}
                    download
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Document Information
        </h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• All documents are stored securely in encrypted storage</li>
          <li>• Click the eye icon to view documents in new tab</li>
          <li>• Click the download icon to save documents locally</li>
          <li>• Documents are required before membership can be approved</li>
          <li>• Contact admin to upload missing documents</li>
        </ul>
      </div>

      {/* Empty State (if no documents) */}
      {!hasAnyDocuments && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            This member has not uploaded any documents yet.
          </p>
        </div>
      )}
    </div>

    {showUploadModal && (
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        memberId={memberId}
        member={member}
      />
    )}
  </>
  );
}

function PaymentsTab({ payments, memberId }: any) {
  const queryClient = useQueryClient();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [showPaymentMenu, setShowPaymentMenu] = useState<string | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());

  const togglePaymentExpanded = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  const totalPaid = payments
    .filter((p: any) => p.payment_status === 'completed')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);

  const pendingAmount = payments
    .filter((p: any) => p.payment_status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);

  const exportPayment = (payment: any) => {
    const dataStr = JSON.stringify(payment, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-${payment.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPayment = (payment: any) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const hasJointFees = payment.joint_joining_fee || payment.joint_membership_fee;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #065f46; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f3f4f6; font-weight: 600; }
            .total { font-size: 18px; font-weight: bold; background-color: #ecfdf5; }
            .header { margin-bottom: 30px; }
            .status { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: 600;
              ${payment.payment_status === 'completed' ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #fef3c7; color: #92400e;'}
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Falkirk Central Mosque - Payment Receipt</h1>
            <p><strong>Payment ID:</strong> ${payment.id}</p>
            <p><strong>Date:</strong> ${new Date(payment.payment_date || payment.created_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span class="status">${payment.payment_status.toUpperCase()}</span></p>
            <p><strong>Payment Method:</strong> ${payment.payment_method?.replace('_', ' ')}</p>
            ${payment.reference_no ? `<p><strong>Reference:</strong> ${payment.reference_no}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payment.main_joining_fee ? `<tr><td>Main Member - Joining Fee</td><td style="text-align: right;">£${Number(payment.main_joining_fee).toFixed(2)}</td></tr>` : ''}
              ${payment.main_membership_fee ? `<tr><td>Main Member - Membership Fee</td><td style="text-align: right;">£${Number(payment.main_membership_fee).toFixed(2)}</td></tr>` : ''}
              ${payment.main_misc ? `<tr><td>Main Member - Miscellaneous</td><td style="text-align: right;">£${Number(payment.main_misc).toFixed(2)}</td></tr>` : ''}
              ${payment.joint_joining_fee ? `<tr><td>Joint Member - Joining Fee</td><td style="text-align: right;">£${Number(payment.joint_joining_fee).toFixed(2)}</td></tr>` : ''}
              ${payment.joint_membership_fee ? `<tr><td>Joint Member - Membership Fee</td><td style="text-align: right;">£${Number(payment.joint_membership_fee).toFixed(2)}</td></tr>` : ''}
              ${payment.joint_misc ? `<tr><td>Joint Member - Miscellaneous</td><td style="text-align: right;">£${Number(payment.joint_misc).toFixed(2)}</td></tr>` : ''}
              ${payment.late_fee ? `<tr><td>Late Fee</td><td style="text-align: right;">£${Number(payment.late_fee).toFixed(2)}</td></tr>` : ''}
              <tr class="total">
                <td><strong>TOTAL</strong></td>
                <td style="text-align: right;"><strong>£${Number(payment.total_amount).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
          
          <p style="margin-top: 40px; font-size: 12px; color: #6b7280;">
            This is a computer-generated receipt. For queries, contact Falkirk Central Mosque.
          </p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No payments recorded</p>
          <p className="text-sm text-gray-400 mt-1">
            Payment history will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-1">
            <PoundSterling className="h-4 w-4 text-green-600" />
            <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          </div>
          <p className="text-2xl font-bold text-green-600">£{totalPaid.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-gray-500 font-medium">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">£{pendingAmount.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Total Payments</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {payments.map((payment: any) => {
            const hasJointFees = payment.joint_joining_fee || payment.joint_membership_fee || payment.joint_misc;
            
            return (
              <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Clickable Header to Expand/Collapse */}
                    <div 
                      onClick={() => togglePaymentExpanded(payment.id)}
                      className="cursor-pointer"
                    >
                      {/* Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          £{Number(payment.total_amount).toFixed(2)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            payment.payment_status === 'completed'
                              ? 'bg-mosque-gold-100 text-mosque-gold-800'
                              : payment.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.payment_status}
                        </span>
                        {expandedPayments.has(payment.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {/* Payment Info */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <span className="capitalize">{payment.payment_type?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">{payment.payment_method?.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>
                          {payment.payment_date 
                            ? new Date(payment.payment_date).toLocaleDateString()
                            : new Date(payment.created_at).toLocaleDateString()}
                        </span>
                        {payment.reference_no && (
                          <>
                            <span>•</span>
                            <span>Ref: {payment.reference_no}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Breakdown - Only shown when expanded */}
                    {expandedPayments.has(payment.id) && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 mt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Payment Breakdown:</p>
                        
                        {payment.main_joining_fee && Number(payment.main_joining_fee) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Main Member - Joining Fee:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.main_joining_fee).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.main_membership_fee && Number(payment.main_membership_fee) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Main Member - Membership Fee:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.main_membership_fee).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.main_misc && Number(payment.main_misc) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Main Member - Miscellaneous:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.main_misc).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.joint_joining_fee && Number(payment.joint_joining_fee) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Joint Member - Joining Fee:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.joint_joining_fee).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.joint_membership_fee && Number(payment.joint_membership_fee) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Joint Member - Membership Fee:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.joint_membership_fee).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.joint_misc && Number(payment.joint_misc) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Joint Member - Miscellaneous:</span>
                            <span className="text-gray-900 font-medium">£{Number(payment.joint_misc).toFixed(2)}</span>
                          </div>
                        )}
                        
                        {payment.late_fee && Number(payment.late_fee) > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 text-red-600">Late Fee:</span>
                            <span className="text-red-600 font-medium">£{Number(payment.late_fee).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs pt-2 mt-2 border-t border-gray-200">
                          <span className="text-gray-900 font-semibold">Total:</span>
                          <span className="text-gray-900 font-bold">£{Number(payment.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {payment.notes && expandedPayments.has(payment.id) && (
                      <p className="text-xs text-gray-600 mt-2 italic">Note: {payment.notes}</p>
                    )}
                  </div>

                  {/* 3-Dot Menu */}
                  <div className="relative ml-4">
                    <button
                      onClick={() => setShowPaymentMenu(showPaymentMenu === payment.id ? null : payment.id)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>

                    {showPaymentMenu === payment.id && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowPaymentMenu(null)}
                        />
                        
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => {
                              setEditingPayment(payment);
                              setShowAdjustModal(true);
                              setShowPaymentMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-400" />
                            Adjust Payment
                          </button>
                          
                          <button
                            onClick={() => {
                              exportPayment(payment);
                              setShowPaymentMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-3 text-gray-400" />
                            Export Payment
                          </button>
                          
                          <button
                            onClick={() => {
                              printPayment(payment);
                              setShowPaymentMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-3 text-gray-400" />
                            Print Invoice/Receipt
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adjust Payment Modal */}
      {showAdjustModal && editingPayment && (
        <AdjustPaymentModal
          payment={editingPayment}
          onClose={() => {
            setShowAdjustModal(false);
            setEditingPayment(null);
          }}
          memberId={memberId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
            setShowAdjustModal(false);
            setEditingPayment(null);
          }}
        />
      )}
    </div>
  );
}

function ActivityLogTab({ memberId }: any) {
  const { data: activityLog, isLoading } = useQuery({
    queryKey: ['activity-log', memberId],
    queryFn: async () => {
      // Fetch activity logs
      const { data: logs } = await supabase
        .from('activity_log')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!logs || logs.length === 0) return [];

      // Get unique user IDs from logs
      const userIds = [...new Set(logs.map((log: any) => log.performed_by).filter(Boolean))];

      // Fetch user details for all users
      let userMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        if (users) {
          userMap = users.reduce((acc: any, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      // Attach user info to each log
      return logs.map((log: any) => ({
        ...log,
        performed_by_user: userMap[log.performed_by] || null,
      }));
    },
  });

  const getActionIcon = (actionType: string) => {
    const icons: any = {
      created: CheckCircle,
      updated: Edit,
      member_edited: Edit,
      status_changed: AlertTriangle,
      payment_received: PoundSterling,
      payment_recorded: PoundSterling,
      document_uploaded: Upload,
      marked_deceased: AlertTriangle,
      funeral_arranged: Heart,
      expense_added: PoundSterling,
      contact_added: User,
      note_added: FileText,
    };
    
    return icons[actionType] || FileText;
  };

  const getActionColor = (actionType: string) => {
    const colors: any = {
      created: 'bg-mosque-gold-100 text-mosque-gold-800 border-mosque-gold-200',
      updated: 'bg-blue-100 text-blue-800 border-blue-200',
      member_edited: 'bg-blue-100 text-blue-800 border-blue-200',
      status_changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      payment_received: 'bg-mosque-gold-100 text-mosque-gold-800 border-mosque-gold-200',
      payment_recorded: 'bg-mosque-gold-100 text-mosque-gold-800 border-mosque-gold-200',
      document_uploaded: 'bg-blue-100 text-blue-800 border-blue-200',
      marked_deceased: 'bg-gray-100 text-gray-800 border-gray-200',
      funeral_arranged: 'bg-gray-100 text-gray-800 border-gray-200',
      expense_added: 'bg-orange-100 text-orange-800 border-orange-200',
      contact_added: 'bg-blue-100 text-blue-800 border-blue-200',
      note_added: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    return colors[actionType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No activity recorded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            All changes to this member will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-1">Total Events</p>
          <p className="text-xl font-bold text-gray-900">{activityLog.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-1">Payments</p>
          <p className="text-xl font-bold text-green-600">
            {activityLog.filter((a: any) => a.action_type.includes('payment')).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-1">Updates</p>
          <p className="text-xl font-bold text-blue-600">
            {activityLog.filter((a: any) => a.action_type === 'updated' || a.action_type === 'member_edited').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 mb-1">Last Activity</p>
          <p className="text-xs font-semibold text-gray-900">
            {formatRelativeTime(activityLog[0].created_at)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Timeline</h3>
        <div className="space-y-3">
          {activityLog.map((activity: any) => {
            const Icon = getActionIcon(activity.action_type);
            const performedByName = activity.performed_by_user?.full_name ||
                                    activity.performed_by_user?.email?.split('@')[0] ||
                                    'System';

            return (
              <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action_type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-medium text-[#2d5016]">
                      by {performedByName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  child?: any;
}

function ChildModal({ isOpen, onClose, memberId, child }: ChildModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: child?.first_name || '',
    last_name: child?.last_name || '',
    dob: child?.dob || '',
    gender: child?.gender || '',
  });
  const [errors, setErrors] = useState<any>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (child) {
        const { error } = await supabase
          .from('children')
          .update(data)
          .eq('id', child.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('children')
          .insert({ ...data, member_id: memberId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: any = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {child ? 'Edit Child' : 'Add Child'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.first_name ? 'border-red-300' : 'border-gray-300'
              }`}
              autoFocus
            />
            {errors.first_name && (
              <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.last_name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.last_name && (
              <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.dob ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.dob && (
              <p className="text-xs text-red-600 mt-1">{errors.dob}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.gender ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                child ? 'Update Child' : 'Add Child'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Next of Kin Modal Component
interface NextOfKinModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  contact?: any;
}

function NextOfKinModal({ isOpen, onClose, memberId, contact }: NextOfKinModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: contact?.title || '',
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    relationship: contact?.relationship || '',
    mobile: contact?.mobile || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    address_line_1: contact?.address_line_1 || '',
    town: contact?.town || '',
    city: contact?.city || '',
    postcode: contact?.postcode || '',
  });
  const [errors, setErrors] = useState<any>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (contact) {
        const { error } = await supabase
          .from('next_of_kin')
          .update(data)
          .eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('next_of_kin')
          .insert({ ...data, member_id: memberId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: any = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Details Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[#2d5016]" />
              Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Title
                </label>
                <select
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select...</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.relationship ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
              {errors.relationship && <p className="text-xs text-red-600 mt-1">{errors.relationship}</p>}
            </div>
          </div>

          {/* Contact Details Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#2d5016]" />
              Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Mobile *
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    errors.mobile ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="07xxxxxxxxx"
                />
                {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Home Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2d5016]" />
              Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Town
                </label>
                <input
                  type="text"
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-[#2d5016] text-white rounded-lg hover:bg-[#1f3810] disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                contact ? 'Update Contact' : 'Add Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Medical Info Modal Component
interface MedicalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  info?: any;
}

function MedicalInfoModal({ isOpen, onClose, memberId, info }: MedicalInfoModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: info?.type || 'condition',
    description: info?.description || '',
    notes: info?.notes || '',
  });
  const [errors, setErrors] = useState<any>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (info) {
        const { error } = await supabase
          .from('medical_info')
          .update(data)
          .eq('id', info.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_info')
          .insert({ ...data, member_id: memberId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: any = {};
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {info ? 'Edit Medical Information' : 'Add Medical Information'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
              autoFocus
            >
              <option value="condition">Condition</option>
              <option value="allergy">Allergy</option>
              <option value="medication">Medication</option>
            </select>
            {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Diabetes Type 2"
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                info ? 'Update Information' : 'Add Information'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Adjust Payment Modal Component
function AdjustPaymentModal({ payment, onClose, memberId, onSuccess }: any) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    main_joining_fee: payment.main_joining_fee || 0,
    main_membership_fee: payment.main_membership_fee || 0,
    main_misc: payment.main_misc || 0,
    joint_joining_fee: payment.joint_joining_fee || 0,
    joint_membership_fee: payment.joint_membership_fee || 0,
    joint_misc: payment.joint_misc || 0,
    late_fee: payment.late_fee || 0,
    payment_method: payment.payment_method || '',
    payment_status: payment.payment_status || '',
    reference_no: payment.reference_no || '',
    notes: payment.notes || '',
  });

  const calculateTotal = () => {
    return (
      Number(formData.main_joining_fee || 0) +
      Number(formData.main_membership_fee || 0) +
      Number(formData.main_misc || 0) +
      Number(formData.joint_joining_fee || 0) +
      Number(formData.joint_membership_fee || 0) +
      Number(formData.joint_misc || 0) +
      Number(formData.late_fee || 0)
    );
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('payments')
        .update({
          ...data,
          total_amount: calculateTotal(),
        })
        .eq('id', payment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Adjust Payment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Member Fees */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Main Member Fees</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Joining Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.main_joining_fee}
                    onChange={(e) => setFormData({ ...formData, main_joining_fee: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Membership Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.main_membership_fee}
                    onChange={(e) => setFormData({ ...formData, main_membership_fee: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Miscellaneous
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.main_misc}
                    onChange={(e) => setFormData({ ...formData, main_misc: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Joint Member Fees */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Joint Member Fees</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Joining Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.joint_joining_fee}
                    onChange={(e) => setFormData({ ...formData, joint_joining_fee: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Membership Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.joint_membership_fee}
                    onChange={(e) => setFormData({ ...formData, joint_membership_fee: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Miscellaneous
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.joint_misc}
                    onChange={(e) => setFormData({ ...formData, joint_misc: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Late Fee */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Fees</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Late Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.late_fee}
                    onChange={(e) => setFormData({ ...formData, late_fee: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total (Read-only) */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-emerald-600">£{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
                <option value="standing_order">Standing Order</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference_no}
              onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Optional reference number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Additional notes about this payment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// GPDetailsModal Component
interface GPDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  gpDetails: any;
}

function GPDetailsModal({ isOpen, onClose, memberId, gpDetails }: GPDetailsModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    gp_name_surgery: gpDetails?.gp_name_surgery || '',
    address_line_1: gpDetails?.address_line_1 || '',
    town: gpDetails?.town || '',
    city: gpDetails?.city || '',
    postcode: gpDetails?.postcode || '',
    phone: gpDetails?.phone || '',
    email: gpDetails?.email || '',
  });
  const [errors, setErrors] = useState<any>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (gpDetails) {
        // Update existing GP details
        const { error } = await supabase
          .from('members')
          .update({
            gp_name_surgery: data.gp_name_surgery,
            gp_address_line_1: data.address_line_1,
            gp_town: data.town,
            gp_city: data.city,
            gp_postcode: data.postcode,
            gp_phone: data.phone,
            gp_email: data.email,
          })
          .eq('id', memberId);
        if (error) throw error;
      } else {
        // Add new GP details
        const { error } = await supabase
          .from('members')
          .update({
            gp_name_surgery: data.gp_name_surgery,
            gp_address_line_1: data.address_line_1,
            gp_town: data.town,
            gp_city: data.city,
            gp_postcode: data.postcode,
            gp_phone: data.phone,
            gp_email: data.email,
          })
          .eq('id', memberId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: any = {};
    if (!formData.gp_name_surgery.trim()) newErrors.gp_name_surgery = 'Practice name is required';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {gpDetails ? 'Edit GP Details' : 'Add GP Details'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Practice Name *
            </label>
            <input
              type="text"
              value={formData.gp_name_surgery}
              onChange={(e) => setFormData({ ...formData, gp_name_surgery: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.gp_name_surgery ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Central Medical Practice"
            />
            {errors.gp_name_surgery && <p className="text-xs text-red-600 mt-1">{errors.gp_name_surgery}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              value={formData.address_line_1}
              onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Town
              </label>
              <input
                type="text"
                value={formData.town}
                onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Falkirk"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Falkirk"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postcode *
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value.toUpperCase() })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.postcode ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., FK1 1AB"
            />
            {errors.postcode && <p className="text-xs text-red-600 mt-1">{errors.postcode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 01324 123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., reception@practice.nhs.uk"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                gpDetails ? 'Update GP Details' : 'Add GP Details'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DeclarationsSignatureModal Component
interface DeclarationsSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  member: any;
  declarations: any;
}

function DeclarationsSignatureModal({ isOpen, onClose, memberId, member, declarations }: DeclarationsSignatureModalProps) {
  const queryClient = useQueryClient();
  const hasJointMember = member?.app_type === 'joint';
  
  const [formData, setFormData] = useState({
    main_medical_consent: declarations?.main_medical_consent || false,
    main_medical_signature: declarations?.main_medical_signature || '',
    main_final_declaration: declarations?.main_final_declaration || false,
    main_final_signature: declarations?.main_final_signature || '',
    joint_medical_consent: declarations?.joint_medical_consent || false,
    joint_medical_signature: declarations?.joint_medical_signature || '',
    joint_final_declaration: declarations?.joint_final_declaration || false,
    joint_final_signature: declarations?.joint_final_signature || '',
  });
  const [errors, setErrors] = useState<any>({});

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const today = new Date().toISOString();
      
      const updateData: any = {
        main_medical_consent: data.main_medical_consent,
        main_medical_signature: data.main_medical_signature,
        main_medical_consent_date: data.main_medical_consent ? today : null,
        main_final_declaration: data.main_final_declaration,
        main_final_signature: data.main_final_signature,
        main_final_declaration_date: data.main_final_declaration ? today : null,
      };

      if (hasJointMember) {
        updateData.joint_medical_consent = data.joint_medical_consent;
        updateData.joint_medical_signature = data.joint_medical_signature;
        updateData.joint_medical_consent_date = data.joint_medical_consent ? today : null;
        updateData.joint_final_declaration = data.joint_final_declaration;
        updateData.joint_final_signature = data.joint_final_signature;
        updateData.joint_final_declaration_date = data.joint_final_declaration ? today : null;
      }

      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    },
  });

  const validate = () => {
    const newErrors: any = {};
    
    if (formData.main_medical_consent && !formData.main_medical_signature.trim()) {
      newErrors.main_medical_signature = 'Signature is required when consent is given';
    }
    if (formData.main_final_declaration && !formData.main_final_signature.trim()) {
      newErrors.main_final_signature = 'Signature is required for declaration';
    }

    if (hasJointMember) {
      if (formData.joint_medical_consent && !formData.joint_medical_signature.trim()) {
        newErrors.joint_medical_signature = 'Signature is required when consent is given';
      }
      if (formData.joint_final_declaration && !formData.joint_final_signature.trim()) {
        newErrors.joint_final_signature = 'Signature is required for declaration';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      saveMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Sign Declarations</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Member */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 pb-2 border-b">Main Member ({member?.first_name} {member?.last_name})</h4>
            
            {/* Medical Consent */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h5 className="text-sm font-semibold text-blue-900">Section 6: Medical Consent</h5>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.main_medical_consent}
                  onChange={(e) => setFormData({ ...formData, main_medical_consent: e.target.checked })}
                  className="mt-1 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  I consent to my GP being contacted in the event of my death to obtain relevant medical information.
                </span>
              </label>

              {formData.main_medical_consent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature *
                  </label>
                  <input
                    type="text"
                    value={formData.main_medical_signature}
                    onChange={(e) => setFormData({ ...formData, main_medical_signature: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-serif italic ${
                      errors.main_medical_signature ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Full name as signature"
                  />
                  {errors.main_medical_signature && <p className="text-xs text-red-600 mt-1">{errors.main_medical_signature}</p>}
                </div>
              )}
            </div>

            {/* Final Declaration */}
            <div className="bg-purple-50 rounded-lg p-4 space-y-3">
              <h5 className="text-sm font-semibold text-purple-900">Section 7: Final Declaration</h5>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.main_final_declaration}
                  onChange={(e) => setFormData({ ...formData, main_final_declaration: e.target.checked })}
                  className="mt-1 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  I accept the terms and conditions, agree to contribute to the emergency fund, and confirm all information is accurate.
                </span>
              </label>

              {formData.main_final_declaration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature *
                  </label>
                  <input
                    type="text"
                    value={formData.main_final_signature}
                    onChange={(e) => setFormData({ ...formData, main_final_signature: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-serif italic ${
                      errors.main_final_signature ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Full name as signature"
                  />
                  {errors.main_final_signature && <p className="text-xs text-red-600 mt-1">{errors.main_final_signature}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Joint Member */}
          {hasJointMember && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 pb-2 border-b">Joint Member</h4>
              
              {/* Medical Consent */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-semibold text-blue-900">Section 6: Medical Consent</h5>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.joint_medical_consent}
                    onChange={(e) => setFormData({ ...formData, joint_medical_consent: e.target.checked })}
                    className="mt-1 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to my GP being contacted in the event of my death to obtain relevant medical information.
                  </span>
                </label>

                {formData.joint_medical_consent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signature *
                    </label>
                    <input
                      type="text"
                      value={formData.joint_medical_signature}
                      onChange={(e) => setFormData({ ...formData, joint_medical_signature: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-serif italic ${
                        errors.joint_medical_signature ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Full name as signature"
                    />
                    {errors.joint_medical_signature && <p className="text-xs text-red-600 mt-1">{errors.joint_medical_signature}</p>}
                  </div>
                )}
              </div>

              {/* Final Declaration */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-semibold text-purple-900">Section 7: Final Declaration</h5>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.joint_final_declaration}
                    onChange={(e) => setFormData({ ...formData, joint_final_declaration: e.target.checked })}
                    className="mt-1 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the terms and conditions, agree to contribute to the emergency fund, and confirm all information is accurate.
                  </span>
                </label>

                {formData.joint_final_declaration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signature *
                    </label>
                    <input
                      type="text"
                      value={formData.joint_final_signature}
                      onChange={(e) => setFormData({ ...formData, joint_final_signature: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-serif italic ${
                        errors.joint_final_signature ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Full name as signature"
                    />
                    {errors.joint_final_signature && <p className="text-xs text-red-600 mt-1">{errors.joint_final_signature}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Sign & Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// DocumentUploadModal Component
interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  member: any;
}

function DocumentUploadModal({ isOpen, onClose, memberId, member }: DocumentUploadModalProps) {
  const queryClient = useQueryClient();
  const hasJointMember = member?.app_type === 'joint';
  
  const [files, setFiles] = useState<{
    main_photo_id?: File;
    main_proof_address?: File;
    joint_photo_id?: File;
    joint_proof_address?: File;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('member-documents')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('member-documents')
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const updates: any = {};

      // Upload main member documents
      if (files.main_photo_id) {
        const url = await uploadFile(files.main_photo_id, `${memberId}/main_photo_id`);
        updates.main_photo_id_url = url;
      }
      if (files.main_proof_address) {
        const url = await uploadFile(files.main_proof_address, `${memberId}/main_proof_address`);
        updates.main_proof_address_url = url;
      }

      // Upload joint member documents
      if (hasJointMember) {
        if (files.joint_photo_id) {
          const url = await uploadFile(files.joint_photo_id, `${memberId}/joint_photo_id`);
          updates.joint_photo_id_url = url;
        }
        if (files.joint_proof_address) {
          const url = await uploadFile(files.joint_proof_address, `${memberId}/joint_proof_address`);
          updates.joint_proof_address_url = url;
        }
      }

      // Update member record
      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const FileUploadBox = ({ field, label, currentUrl }: { field: string; label: string; currentUrl?: string }) => (
    <div
      onDrop={(e) => handleDrop(e, field)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(field); }}
      onDragLeave={() => setDragOver(null)}
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        dragOver === field
          ? 'border-emerald-500 bg-emerald-50'
          : files[field as keyof typeof files]
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <div className="text-center">
        <Upload className={`h-8 w-8 mx-auto mb-2 ${
          files[field as keyof typeof files] ? 'text-emerald-600' : 'text-gray-400'
        }`} />
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
        
        {files[field as keyof typeof files] ? (
          <p className="text-xs text-emerald-600 mb-2">
            ✓ {files[field as keyof typeof files]!.name}
          </p>
        ) : currentUrl ? (
          <p className="text-xs text-gray-500 mb-2">Current file uploaded</p>
        ) : (
          <p className="text-xs text-gray-500 mb-2">Drag & drop or click to browse</p>
        )}
        
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => handleFileSelect(e, field)}
          className="hidden"
          id={field}
        />
        <label
          htmlFor={field}
          className="inline-block px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
        >
          Browse Files
        </label>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Member Documents */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-4 w-4 mr-2 text-emerald-600" />
              Main Member Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUploadBox 
                field="main_photo_id" 
                label="Photo ID *" 
                currentUrl={member?.main_photo_id_url}
              />
              <FileUploadBox 
                field="main_proof_address" 
                label="Proof of Address *" 
                currentUrl={member?.main_proof_address_url}
              />
            </div>
          </div>

          {/* Joint Member Documents */}
          {hasJointMember && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-4 w-4 mr-2 text-emerald-600" />
                Joint Member Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadBox 
                  field="joint_photo_id" 
                  label="Photo ID *" 
                  currentUrl={member?.joint_photo_id_url}
                />
                <FileUploadBox 
                  field="joint_proof_address" 
                  label="Proof of Address *" 
                  currentUrl={member?.joint_proof_address_url}
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Accepted formats:</strong> Images (JPG, PNG) or PDF files
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || Object.keys(files).length === 0}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </span>
              ) : (
                'Upload Documents'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}