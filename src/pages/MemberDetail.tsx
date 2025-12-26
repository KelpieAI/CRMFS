import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';  // Add to existing react-router-dom import
import {
  ArrowLeft,
  User,
  Users,
  Baby,
  Heart,
  Stethoscope,
  FileText,
  Upload,
  CheckSquare,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Trash2,
  Pause,
  Skull,
  History,
  AlertTriangle,
} from 'lucide-react';

export default function MemberDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const queryClient = useQueryClient();

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
      const updates = [];

      if (data.member) {
        updates.push(
          supabase.from('members').update(data.member).eq('id', id)
        );
      }

      if (data.jointMember && memberData?.jointMember) {
        updates.push(
          supabase.from('joint_members').update(data.jointMember).eq('member_id', id)
        );
      }

      if (data.nextOfKin && memberData?.nextOfKin?.[0]) {
        updates.push(
          supabase.from('next_of_kin').update(data.nextOfKin).eq('member_id', id)
        );
      }

      if (data.gpDetails && memberData?.gpDetails) {
        updates.push(
          supabase.from('gp_details').update(data.gpDetails).eq('member_id', id)
        );
      }

      if (data.children) {
        for (const child of data.children) {
          if (child.id) {
            updates.push(
              supabase.from('children').update(child).eq('id', child.id)
            );
          }
        }
      }

      if (data.deletedChildren && data.deletedChildren.length > 0) {
        for (const childId of data.deletedChildren) {
          updates.push(
            supabase.from('children').delete().eq('id', childId)
          );
        }
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
      setIsEditing(false);
      setEditedData(null);
    },
  });

  const handleEdit = () => {
    setEditedData({
      member: { ...memberData?.member },
      jointMember: memberData?.jointMember ? { ...memberData.jointMember } : null,
      nextOfKin: memberData?.nextOfKin?.[0] ? { ...memberData.nextOfKin[0] } : null,
      gpDetails: memberData?.gpDetails ? { ...memberData.gpDetails } : null,
      children: memberData?.children ? memberData.children.map((child: any) => ({ ...child })) : [],
      deletedChildren: [],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const updateField = (section: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateChild = (childIndex: number, field: string, value: any) => {
    setEditedData((prev: any) => {
      const updatedChildren = [...prev.children];
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        [field]: value,
      };
      return {
        ...prev,
        children: updatedChildren,
      };
    });
  };

  const removeChild = (childIndex: number) => {
    setEditedData((prev: any) => {
      const childToRemove = prev.children[childIndex];
      const updatedChildren = prev.children.filter((_: any, index: number) => index !== childIndex);
      const updatedDeletedChildren = childToRemove.id
        ? [...prev.deletedChildren, childToRemove.id]
        : prev.deletedChildren;

      return {
        ...prev,
        children: updatedChildren,
        deletedChildren: updatedDeletedChildren,
      };
    });
  };

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      deceased: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'joint', label: 'Joint Member', icon: Users, show: memberData?.member?.app_type === 'joint' },
    { id: 'children', label: 'Children', icon: Baby, count: memberData?.children?.length },
    { id: 'nok', label: 'Next of Kin', icon: Heart },
    { id: 'gp', label: 'GP Details', icon: Stethoscope },
    { id: 'medical', label: 'Medical Info', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Upload, count: memberData?.documents?.length },
    { id: 'declarations', label: 'Declarations', icon: CheckSquare },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: memberData?.payments?.length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!memberData?.member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  const { member, jointMember, children, nextOfKin, gpDetails, medicalInfo, documents, declarations, payments } = memberData;
  const mainAge = calculateAge(member.dob);
  const jointAge = jointMember?.dob ? calculateAge(jointMember.dob) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/members" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {member.title} {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Member ID: {member.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(member.status)}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Membership Type</p>
              <p className="text-sm font-semibold text-gray-900">{member.app_type === 'joint' ? 'Joint' : 'Single'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Age</p>
              <p className="text-sm font-semibold text-gray-900">{mainAge} years old</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(member.member_since || member.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Phone className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Mobile</p>
              <p className="text-sm font-semibold text-gray-900">{member.mobile || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-sm font-semibold text-gray-900">
                £{payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + Number(p.total_amount), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 px-4">
            {tabs.filter(tab => tab.show !== false).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && (
            <PersonalInfoTab
              member={isEditing ? editedData?.member : member}
              age={mainAge}
              isEditing={isEditing}
              updateField={(field: string, value: any) => updateField('member', field, value)}
            />
          )}
          {activeTab === 'joint' && (
            <JointMemberTab
              jointMember={isEditing ? editedData?.jointMember : jointMember}
              age={jointAge}
              isEditing={isEditing}
              updateField={(field: string, value: any) => updateField('jointMember', field, value)}
            />
          )}
          {activeTab === 'children' && (
            <ChildrenTab
              children={isEditing ? editedData?.children : children}
              isEditing={isEditing}
              updateChild={updateChild}
              removeChild={removeChild}
              calculateAge={calculateAge}
            />
          )}
          {activeTab === 'nok' && (
            <NextOfKinTab
              nextOfKin={isEditing && editedData?.nextOfKin ? [editedData.nextOfKin] : nextOfKin}
              isEditing={isEditing}
              updateField={(field: string, value: any) => updateField('nextOfKin', field, value)}
            />
          )}
          {activeTab === 'gp' && (
            <GPDetailsTab
              gpDetails={isEditing ? editedData?.gpDetails : gpDetails}
              isEditing={isEditing}
              updateField={(field: string, value: any) => updateField('gpDetails', field, value)}
            />
          )}
          {activeTab === 'medical' && <MedicalInfoTab medicalInfo={medicalInfo} appType={member.app_type} />}
          {activeTab === 'documents' && <DocumentsTab documents={documents} />}
          {activeTab === 'declarations' && <DeclarationsTab declarations={declarations} />}
          {activeTab === 'payments' && <PaymentsTab payments={payments} />}
        </div>
      </div>
    </div>
  );
}

// Tab Components

function PersonalInfoTab({ member, age, isEditing, updateField }: any) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EditableField
          label="Title"
          value={member?.title}
          isEditing={isEditing}
          type="select"
          options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']}
          onChange={(value: any) => updateField?.('title', value)}
        />
        <EditableField
          label="First Name"
          value={member?.first_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('first_name', value)}
        />
        <EditableField
          label="Last Name"
          value={member?.last_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('last_name', value)}
        />
        <EditableField
          label="Date of Birth"
          value={member?.dob}
          displayValue={member?.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}
          isEditing={isEditing}
          type="date"
          max={today}
          onChange={(value: any) => updateField?.('dob', value)}
        />
        <EditableField
          label="Member Since"
          value={member?.member_since}
          displayValue={member?.member_since ? new Date(member.member_since).toLocaleDateString() : (member?.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A')}
          isEditing={isEditing}
          type="date"
          max={today}
          onChange={(value: any) => updateField?.('member_since', value)}
        />
        <InfoField label="Current Age" value={`${age} years old`} highlight />
        <EditableField
          label="Status"
          value={member?.status}
          isEditing={isEditing}
          type="select"
          options={['active', 'pending', 'inactive', 'deceased']}
          onChange={(value: any) => updateField?.('status', value)}
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Mobile Phone"
            value={member?.mobile}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('mobile', value)}
          />
          <EditableField
            label="Home Phone"
            value={member?.home_phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('home_phone', value)}
          />
          <EditableField
            label="Work Phone"
            value={member?.work_phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('work_phone', value)}
          />
          <EditableField
            label="Email"
            value={member?.email}
            isEditing={isEditing}
            type="email"
            icon={Mail}
            onChange={(value: any) => updateField?.('email', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <EditableField
              label="Address Line 1"
              value={member?.address_line_1}
              isEditing={isEditing}
              icon={MapPin}
              onChange={(value: any) => updateField?.('address_line_1', value)}
            />
          </div>
          <EditableField
            label="Town"
            value={member?.town}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('town', value)}
          />
          <EditableField
            label="City"
            value={member?.city}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('city', value)}
          />
          <EditableField
            label="Postcode"
            value={member?.postcode}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('postcode', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
        {isEditing ? (
          <textarea
            value={member?.notes || ''}
            onChange={(e) => updateField?.('notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
            placeholder="Add notes..."
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{member?.notes || 'No notes'}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoField
            label="Member Since"
            value={member?.member_since ? new Date(member.member_since).toLocaleDateString() : 'Not set'}
          />
          <InfoField label="Created On" value={new Date(member?.created_at).toLocaleString()} />
          <InfoField label="Last Updated" value={new Date(member?.updated_at).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}

function JointMemberTab({ jointMember, age, isEditing, updateField }: any) {
  const today = new Date().toISOString().split('T')[0];

  if (!jointMember) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No joint member information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EditableField
          label="Title"
          value={jointMember?.title}
          isEditing={isEditing}
          type="select"
          options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']}
          onChange={(value: any) => updateField?.('title', value)}
        />
        <EditableField
          label="First Name"
          value={jointMember?.first_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('first_name', value)}
        />
        <EditableField
          label="Last Name"
          value={jointMember?.last_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('last_name', value)}
        />
        <EditableField
          label="Date of Birth"
          value={jointMember?.dob}
          displayValue={jointMember?.dob ? new Date(jointMember.dob).toLocaleDateString() : 'N/A'}
          isEditing={isEditing}
          type="date"
          max={today}
          onChange={(value: any) => updateField?.('dob', value)}
        />
        {age && <InfoField label="Current Age" value={`${age} years old`} highlight />}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Mobile Phone"
            value={jointMember?.mobile}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('mobile', value)}
          />
          <EditableField
            label="Home Phone"
            value={jointMember?.home_phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('home_phone', value)}
          />
          <EditableField
            label="Work Phone"
            value={jointMember?.work_phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('work_phone', value)}
          />
          <EditableField
            label="Email"
            value={jointMember?.email}
            isEditing={isEditing}
            type="email"
            icon={Mail}
            onChange={(value: any) => updateField?.('email', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <EditableField
              label="Address Line 1"
              value={jointMember?.address_line_1}
              isEditing={isEditing}
              icon={MapPin}
              onChange={(value: any) => updateField?.('address_line_1', value)}
            />
          </div>
          <EditableField
            label="Town"
            value={jointMember?.town}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('town', value)}
          />
          <EditableField
            label="City"
            value={jointMember?.city}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('city', value)}
          />
          <EditableField
            label="Postcode"
            value={jointMember?.postcode}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('postcode', value)}
          />
        </div>
      </div>
    </div>
  );
}

function ChildrenTab({ children, isEditing, updateChild, removeChild, calculateAge }: any) {
  const today = new Date().toISOString().split('T')[0];

  if (!children || children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Baby className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No children registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children.map((child: any, index: number) => {
        const childAge = child.dob ? calculateAge(child.dob) : 0;

        return (
          <div key={child.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
            {isEditing && (
              <button
                onClick={() => removeChild?.(index)}
                className="absolute top-3 right-3 p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remove child"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <h3 className="font-semibold text-gray-900 mb-3">Child {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="First Name"
                value={child.first_name}
                isEditing={isEditing}
                onChange={(value: any) => updateChild?.(index, 'first_name', value)}
              />
              <EditableField
                label="Last Name"
                value={child.last_name}
                isEditing={isEditing}
                onChange={(value: any) => updateChild?.(index, 'last_name', value)}
              />
              <EditableField
                label="Date of Birth"
                value={child.dob}
                displayValue={child.dob ? new Date(child.dob).toLocaleDateString() : 'N/A'}
                isEditing={isEditing}
                type="date"
                max={today}
                onChange={(value: any) => updateChild?.(index, 'dob', value)}
              />
              <InfoField label="Current Age" value={child.dob ? `${childAge} years old` : 'N/A'} highlight />
              <EditableField
                label="Relation"
                value={child.relation}
                isEditing={isEditing}
                type="select"
                options={['son', 'daughter', 'stepson', 'stepdaughter']}
                onChange={(value: any) => updateChild?.(index, 'relation', value)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NextOfKinTab({ nextOfKin, isEditing, updateField }: any) {
  if (nextOfKin.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No next of kin information</p>
      </div>
    );
  }

  const nok = nextOfKin[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EditableField
          label="Title"
          value={nok?.title}
          isEditing={isEditing}
          type="select"
          options={['Mr', 'Mrs', 'Miss', 'Ms', 'Dr']}
          onChange={(value: any) => updateField?.('title', value)}
        />
        <EditableField
          label="First Name"
          value={nok?.first_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('first_name', value)}
        />
        <EditableField
          label="Last Name"
          value={nok?.last_name}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('last_name', value)}
        />
        <EditableField
          label="Relationship"
          value={nok?.relationship}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('relationship', value)}
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Mobile Phone"
            value={nok?.mobile}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('mobile', value)}
          />
          <EditableField
            label="Home Phone"
            value={nok?.phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('phone', value)}
          />
          <EditableField
            label="Email"
            value={nok?.email}
            isEditing={isEditing}
            type="email"
            icon={Mail}
            onChange={(value: any) => updateField?.('email', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <EditableField
              label="Address Line 1"
              value={nok?.address_line_1}
              isEditing={isEditing}
              icon={MapPin}
              onChange={(value: any) => updateField?.('address_line_1', value)}
            />
          </div>
          <EditableField
            label="Town"
            value={nok?.town}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('town', value)}
          />
          <EditableField
            label="City"
            value={nok?.city}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('city', value)}
          />
          <EditableField
            label="Postcode"
            value={nok?.postcode}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('postcode', value)}
          />
        </div>
      </div>
    </div>
  );
}

function GPDetailsTab({ gpDetails, isEditing, updateField }: any) {
  if (!gpDetails) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No GP details registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <EditableField
            label="GP Name / Surgery"
            value={gpDetails?.gp_name_surgery}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('gp_name_surgery', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Phone"
            value={gpDetails?.phone}
            isEditing={isEditing}
            icon={Phone}
            onChange={(value: any) => updateField?.('phone', value)}
          />
          <EditableField
            label="Email"
            value={gpDetails?.email}
            isEditing={isEditing}
            type="email"
            icon={Mail}
            onChange={(value: any) => updateField?.('email', value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <EditableField
              label="Address Line 1"
              value={gpDetails?.address_line_1}
              isEditing={isEditing}
              icon={MapPin}
              onChange={(value: any) => updateField?.('address_line_1', value)}
            />
          </div>
          <EditableField
            label="Town"
            value={gpDetails?.town}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('town', value)}
          />
          <EditableField
            label="City"
            value={gpDetails?.city}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('city', value)}
          />
          <EditableField
            label="Postcode"
            value={gpDetails?.postcode}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('postcode', value)}
          />
        </div>
      </div>
    </div>
  );
}

function MedicalInfoTab({ medicalInfo, appType }: any) {
  const mainMedical = medicalInfo.find((m: any) => m.member_type === 'main');
  const jointMedical = medicalInfo.find((m: any) => m.member_type === 'joint');

  if (medicalInfo.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No medical information registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mainMedical && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Member</h3>
          <div className="space-y-4">
            <InfoField label="Disclaimer" value={mainMedical.disclaimer} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{mainMedical.conditions || 'None listed'}</p>
            </div>
          </div>
        </div>
      )}

      {appType === 'joint' && jointMedical && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Joint Member</h3>
          <div className="space-y-4">
            <InfoField label="Disclaimer" value={jointMedical.disclaimer} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{jointMedical.conditions || 'None listed'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ documents }: any) {
  return (
    <div className="text-center py-12">
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-500">Document management coming soon</p>
      <p className="text-sm text-gray-400 mt-2">
        {documents.length} document(s) registered in the system
      </p>
    </div>
  );
}

function DeclarationsTab({ declarations }: any) {
  if (!declarations) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No declarations registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Agreement Signatures</h3>
        <div className="space-y-2">
          <DeclarationItem label="Main Member Agreement" checked={declarations.agreement_sig_1} />
          <DeclarationItem label="Joint Member Agreement" checked={declarations.agreement_sig_2} />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Funding Signatures</h3>
        <div className="space-y-2">
          <DeclarationItem label="Main Member Funding" checked={declarations.funding_sig_1} />
          <DeclarationItem label="Joint Member Funding" checked={declarations.funding_sig_2} />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Declaration Signatures</h3>
        <div className="space-y-2">
          <DeclarationItem label="Main Member Declaration" checked={declarations.declaration_sig_1} />
          <DeclarationItem label="Joint Member Declaration" checked={declarations.declaration_sig_2} />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <InfoField label="Signed At" value={new Date(declarations.signed_at).toLocaleString()} />
      </div>
    </div>
  );
}

function PaymentsTab({ payments }: any) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No payment records</p>
      </div>
    );
  }

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {payments.map((payment: any) => (
        <div key={payment.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Payment #{payment.id.slice(0, 8)}</h3>
              <p className="text-sm text-gray-500">
                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : new Date(payment.created_at).toLocaleDateString()}
              </p>
            </div>
            {getPaymentStatusBadge(payment.payment_status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InfoField label="Payment Type" value={payment.payment_type} />
            <InfoField label="Payment Method" value={payment.payment_method} />
            {payment.reference_no && <InfoField label="Reference No" value={payment.reference_no} />}
            {payment.processed_by && <InfoField label="Processed By" value={payment.processed_by} />}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Fee Breakdown</h4>
            <div className="space-y-2 text-sm">
              {payment.main_joining_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Main Member - Joining Fee</span>
                  <span className="font-medium">£{Number(payment.main_joining_fee).toFixed(2)}</span>
                </div>
              )}
              {payment.main_membership_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Main Member - Membership Fee</span>
                  <span className="font-medium">£{Number(payment.main_membership_fee).toFixed(2)}</span>
                </div>
              )}
              {payment.joint_joining_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Joint Member - Joining Fee</span>
                  <span className="font-medium">£{Number(payment.joint_joining_fee).toFixed(2)}</span>
                </div>
              )}
              {payment.joint_membership_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Joint Member - Membership Fee</span>
                  <span className="font-medium">£{Number(payment.joint_membership_fee).toFixed(2)}</span>
                </div>
              )}
              {payment.late_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Fee</span>
                  <span className="font-medium">£{Number(payment.late_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-semibold text-gray-900">Total Amount</span>
                <span className="font-bold text-emerald-600">£{Number(payment.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{payment.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper Components

function EditableField({ label, value, displayValue, isEditing, type = 'text', icon: Icon, options, max, onChange }: any) {
  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        <div className="flex items-center">
          {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
          <p className={`text-gray-900 ${!value || value === 'N/A' ? 'text-gray-400' : ''}`}>
            {displayValue || value || 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Select {label}</option>
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
        <input
          type={type}
          value={value || ''}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon, highlight }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
        <p className={`text-gray-900 ${highlight ? 'font-semibold text-emerald-600' : ''} ${!value || value === 'N/A' ? 'text-gray-400' : ''}`}>
          {value || 'N/A'}
        </p>
      </div>
    </div>
  );
}

function DeclarationItem({ label, checked }: any) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      {checked ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckSquare className="h-3 w-3 mr-1" />
          Signed
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          Not Signed
        </span>
      )}
    </div>
  );
}