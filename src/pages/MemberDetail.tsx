import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import CompactLayout from '../components/CompactLayout';
import MemberSubNav from '../components/MemberSubNav';
import {
  ArrowLeft,
  User,
  Users,
  Baby,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  Trash2,
  Pause,
  CreditCard,
  AlertTriangle,
  PoundSterling,
} from 'lucide-react';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

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

  const markDeceasedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('members')
        .update({ status: 'deceased' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
      setShowDeceasedConfirm(false);
    },
  });

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

  // Calculate total paid
  const totalPaid = memberData?.payments
    ?.filter((p: any) => p.payment_status === 'completed')
    .reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;

  if (isLoading) {
    return (
      <CompactLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
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

  const { member, jointMember, children, payments } = memberData;
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
              <h1 className="text-2xl font-bold text-gray-900">
                {member.title} {member.first_name} {member.last_name}
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-base font-normal text-gray-500">{member.status}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-base font-normal text-gray-500 capitalize">{member.app_type}</span>
                {age && (
                  <>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-base font-normal text-gray-500">{age} years old</span>
                  </>
                )}
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
                {member.status === 'active' && (
                  <button
                    onClick={() => setShowPauseConfirm(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Pause</span>
                  </button>
                )}
                {member.status !== 'deceased' && (
                  <button
                    onClick={() => setShowDeceasedConfirm(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Deceased</span>
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

        {/* Content Area */}
        {activeTab === 'personal' && (
          <PersonalInfoTab
            member={isEditing ? editedData : member}
            isEditing={isEditing}
            updateField={updateField}
          />
        )}

        {/* Other tabs will go here */}
        {activeTab !== 'personal' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500">Content for {activeTab} tab coming soon...</p>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Member"
          message="Are you sure you want to delete this member? This will also delete all related data including payments, documents, and declarations. This action cannot be undone."
          confirmText="Delete"
          confirmColor="red"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {showDeceasedConfirm && (
        <ConfirmModal
          title="Mark as Deceased"
          message="This will change the member's status to deceased. You can then create a funeral record for them."
          confirmText="Mark Deceased"
          confirmColor="gray"
          onConfirm={() => markDeceasedMutation.mutate()}
          onCancel={() => setShowDeceasedConfirm(false)}
          isLoading={markDeceasedMutation.isPending}
        />
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
              onChange={(val) => updateField?.('title', val)}
            />
            <InfoRow
              label="First Name"
              value={member?.first_name}
              isEditing={isEditing}
              onChange={(val) => updateField?.('first_name', val)}
            />
            <InfoRow
              label="Last Name"
              value={member?.last_name}
              isEditing={isEditing}
              onChange={(val) => updateField?.('last_name', val)}
            />
            <InfoRow
              label="Date of Birth"
              value={member?.dob}
              displayValue={member?.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}
              isEditing={isEditing}
              type="date"
              onChange={(val) => updateField?.('dob', val)}
            />
            <InfoRow
              label="Status"
              value={member?.status}
              isEditing={isEditing}
              type="select"
              options={['pending', 'active', 'inactive', 'deceased']}
              onChange={(val) => updateField?.('status', val)}
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
              onChange={(val) => updateField?.('mobile', val)}
            />
            <InfoRow
              label="Home Phone"
              value={member?.home_phone}
              isEditing={isEditing}
              onChange={(val) => updateField?.('home_phone', val)}
            />
            <InfoRow
              label="Work Phone"
              value={member?.work_phone}
              isEditing={isEditing}
              onChange={(val) => updateField?.('work_phone', val)}
            />
            <InfoRow
              label="Email"
              value={member?.email}
              isEditing={isEditing}
              type="email"
              onChange={(val) => updateField?.('email', val)}
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
            onChange={(val) => updateField?.('address_line_1', val)}
          />
          <InfoRow
            label="Town"
            value={member?.town}
            isEditing={isEditing}
            onChange={(val) => updateField?.('town', val)}
          />
          <InfoRow
            label="City"
            value={member?.city}
            isEditing={isEditing}
            onChange={(val) => updateField?.('city', val)}
          />
          <InfoRow
            label="Postcode"
            value={member?.postcode}
            isEditing={isEditing}
            onChange={(val) => updateField?.('postcode', val)}
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