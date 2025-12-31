import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
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

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
      setIsEditing(false);
      setEditedData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
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
        await supabase.from('access_log').insert({
          member_id: memberData.member.id,
          accessed_by: 'Committee Member',
          access_type: 'view',
          accessed_data: ['personal_data', 'contact_info'],
          accessed_at: new Date().toISOString(),
        });
        console.log('Access logged');
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
        />
      }
    >
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/members"
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {member.title} {member.first_name} {member.last_name}
              </h1>
              <p className="text-sm text-gray-500">#{id?.slice(0, 8)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Payments</span>
                </button>
                {member.status === 'paused' ? (
                  <button
                    onClick={() => {
                      calculateUnpauseFees();
                      setShowUnpauseModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Unpause</span>
                  </button>
                ) : member.status === 'active' ? (
                  <button
                    onClick={() => {
                      updateStatus.mutate({
                        memberId: id!,
                        newStatus: 'inactive',
                      });
                    }}
                    disabled={updateStatus.isPending}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">
                      {updateStatus.isPending ? 'Pausing...' : 'Pause'}
                    </span>
                  </button>
                ) : member.status === 'inactive' && (
                  <button
                    onClick={() => {
                      updateStatus.mutate({
                        memberId: id!,
                        newStatus: 'active',
                      });
                    }}
                    disabled={updateStatus.isPending}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">
                      {updateStatus.isPending ? 'Activating...' : 'Activate'}
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Paused Member Warning */}
        {member.status === 'paused' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
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

        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Member Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{member.app_type}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Age</p>
                <p className="text-sm font-semibold text-gray-900">{age ? `${age} years` : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm font-semibold text-gray-900">
                  {member.join_date ? new Date(member.join_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <PoundSterling className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="text-sm font-semibold text-gray-900">£{totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* GDPR Data Rights (Committee Actions) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-mosque-green-600" />
            GDPR Data Rights (Committee Actions)
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              Use these tools when members contact committee to request their data or account deletion.
              All actions are logged for audit purposes.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportMemberData}
              className="px-4 py-2 border border-mosque-green-600 text-mosque-green-600 rounded-lg hover:bg-mosque-green-50 flex items-center text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Member Data
            </button>

            <button
              onClick={() => setShowDeletionRequestModal(true)}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center text-sm font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Create Deletion Request
            </button>

            <button
              onClick={() => setShowAccessLog(true)}
              className="px-4 py-2 border border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center text-sm font-medium"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Access Log
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'personal' && (
          <PersonalInfoTab
            member={isEditing ? editedData : member}
            isEditing={isEditing}
            updateField={updateField}
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
          <GPDetailsTab gpDetails={memberData?.gpDetails} />
        )}

        {activeTab === 'declarations' && (
          <DeclarationsTab declarations={memberData?.declarations} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab member={memberData?.member} />
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
function PersonalInfoTab({ member, isEditing, updateField }: any) {
  return (
    <div className="space-y-4">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            Personal Details
          </h3>
          <dl className="space-y-2">
            <InfoRow
              label="Title"
              value={member?.title}
              isEditing={isEditing}
              type="select"
              options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']}
              onChange={(val: any) => updateField?.('title', val)}
            />
            <InfoRow
              label="First Name"
              value={member?.first_name}
              isEditing={isEditing}
              onChange={(val: any) => updateField?.('first_name', val)}
            />
            <InfoRow
              label="Last Name"
              value={member?.last_name}
              isEditing={isEditing}
              onChange={(val: any) => updateField?.('last_name', val)}
            />
            <InfoRow
              label="Date of Birth"
              value={member?.dob}
              displayValue={member?.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}
              isEditing={isEditing}
              type="date"
              onChange={(val: any) => updateField?.('dob', val)}
            />
            <InfoRow
              label="Status"
              value={member?.status}
              isEditing={isEditing}
              type="select"
              options={['pending', 'active', 'inactive']}
              onChange={(val: any) => updateField?.('status', val)}
            />
          </dl>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            Contact Information
          </h3>
          <dl className="space-y-2">
            <InfoRow
              label="Mobile"
              value={member?.mobile}
              isEditing={isEditing}
              onChange={(val: any) => updateField?.('mobile', val)}
            />
            <InfoRow
              label="Home Phone"
              value={member?.home_phone}
              isEditing={isEditing}
              onChange={(val: any) => updateField?.('home_phone', val)}
            />
            <InfoRow
              label="Work Phone"
              value={member?.work_phone}
              isEditing={isEditing}
              onChange={(val: any) => updateField?.('work_phone', val)}
            />
            <InfoRow
              label="Email"
              value={member?.email}
              isEditing={isEditing}
              type="email"
              onChange={(val: any) => updateField?.('email', val)}
            />
          </dl>
        </div>
      </div>

      {/* Address Card - Full Width */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          Address
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <InfoRow
            label="Address Line 1"
            value={member?.address_line_1}
            isEditing={isEditing}
            onChange={(val: any) => updateField?.('address_line_1', val)}
          />
          <InfoRow
            label="Town"
            value={member?.town}
            isEditing={isEditing}
            onChange={(val: any) => updateField?.('town', val)}
          />
          <InfoRow
            label="City"
            value={member?.city}
            isEditing={isEditing}
            onChange={(val: any) => updateField?.('city', val)}
          />
          <InfoRow
            label="Postcode"
            value={member?.postcode}
            isEditing={isEditing}
            onChange={(val: any) => updateField?.('postcode', val)}
          />
        </dl>
      </div>

      {/* Notes Card */}
      {(member?.notes || isEditing) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes</h3>
          {isEditing ? (
            <textarea
              value={member?.notes || ''}
              onChange={(e) => updateField?.('notes', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={4}
              placeholder="Add any additional notes..."
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{member?.notes || 'No notes'}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoRow({ label, value, displayValue, isEditing, type = 'text', options, onChange }: any) {
  if (!isEditing) {
    return (
      <div className="flex justify-between items-start py-1">
        <dt className="text-xs text-gray-500 font-medium">{label}</dt>
        <dd className="text-sm text-gray-900 text-right">{displayValue || value || 'N/A'}</dd>
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
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Title</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.title || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">First Name</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.first_name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Last Name</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.last_name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Date of Birth</dt>
              <dd className="text-sm text-gray-900 text-right">
                {jointMember.dob ? new Date(jointMember.dob).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Relationship</dt>
              <dd className="text-sm text-gray-900 text-right capitalize">{jointMember.relationship || 'N/A'}</dd>
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
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Mobile</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.mobile || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Home Phone</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.home_phone || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Work Phone</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.work_phone || 'N/A'}</dd>
            </div>
            <div className="flex justify-between items-start py-1">
              <dt className="text-xs text-gray-500 font-medium">Email</dt>
              <dd className="text-sm text-gray-900 text-right">{jointMember.email || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// GP Details Tab Component
function GPDetailsTab({ gpDetails }: any) {
  if (!gpDetails) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No GP details recorded</p>
          <p className="text-sm text-gray-400 mt-1">
            GP information hasn't been added yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GP Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
          GP Practice Information
        </h3>
        <dl className="space-y-2">
          <div className="flex justify-between items-start py-1">
            <dt className="text-xs text-gray-500 font-medium">Practice Name</dt>
            <dd className="text-sm text-gray-900 text-right">{gpDetails.gp_name_surgery || 'N/A'}</dd>
          </div>
          <div className="flex justify-between items-start py-1">
            <dt className="text-xs text-gray-500 font-medium">Address</dt>
            <dd className="text-sm text-gray-900 text-right max-w-xs">
              {gpDetails.address_line_1 || 'N/A'}
            </dd>
          </div>
          <div className="flex justify-between items-start py-1">
            <dt className="text-xs text-gray-500 font-medium">Postcode</dt>
            <dd className="text-sm text-gray-900 text-right">{gpDetails.postcode || 'N/A'}</dd>
          </div>
          <div className="flex justify-between items-start py-1">
            <dt className="text-xs text-gray-500 font-medium">Phone</dt>
            <dd className="text-sm text-gray-900 text-right">{gpDetails.phone || 'N/A'}</dd>
          </div>
          <div className="flex justify-between items-start py-1">
            <dt className="text-xs text-gray-500 font-medium">Email</dt>
            <dd className="text-sm text-gray-900 text-right">{gpDetails.email || 'N/A'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// Declarations Tab Component
function DeclarationsTab({ declarations }: any) {
  if (!declarations) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 font-medium">No declarations recorded</p>
          <p className="text-sm text-gray-400 mt-1">
            Declarations haven't been completed yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      <div className="space-y-3">
        {nextOfKin.map((contact: any, index: number) => (
          <div
            key={contact.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-base font-semibold text-gray-900">
                    {contact.name}
                  </h4>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      Primary
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Relationship</dt>
                    <dd className="text-gray-900 capitalize">
                      {contact.relationship || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{contact.phone || 'N/A'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-gray-900">{contact.email || 'N/A'}</dd>
                  </div>
                  {contact.address && (
                    <div className="col-span-2">
                      <dt className="text-xs text-gray-500">Address</dt>
                      <dd className="text-gray-900">{contact.address}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => setEditingContact(contact)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(contact.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
function DocumentsTab({ member }: any) {
  const hasAnyDocuments = member?.main_photo_id_url ||
    member?.main_proof_address_url ||
    member?.joint_photo_id_url ||
    member?.joint_proof_address_url ||
    (member?.children_documents && Object.keys(member.children_documents).length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Uploaded Documents
        </h3>
        <span className="text-sm text-gray-500">
          Required for membership approval
        </span>
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
  );
}

function PaymentsTab({ payments }: any) {
  const totalPaid = payments
    .filter((p: any) => p.payment_status === 'completed')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);

  const pendingAmount = payments
    .filter((p: any) => p.payment_status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);

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
          {payments.map((payment: any) => (
            <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      £{Number(payment.total_amount).toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        payment.payment_status === 'completed'
                          ? 'bg-mosque-gold-100 text-mosque-gold-800'
                          : payment.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="capitalize">{payment.payment_type}</span>
                    <span>•</span>
                    <span className="capitalize">{payment.payment_method}</span>
                    <span>•</span>
                    <span>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {payment.notes && (
                    <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityLogTab({ memberId }: any) {
  const { data: activityLog, isLoading } = useQuery({
    queryKey: ['activity-log', memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      return data || [];
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
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action_type)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
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
    name: contact?.name || '',
    relationship: contact?.relationship || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    address: contact?.address || '',
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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
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
              {contact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship *
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={3}
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