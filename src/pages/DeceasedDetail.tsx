import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  FileHeart,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  DollarSign,
  FileText,
  CheckSquare,
  Plus,
  Edit,
  Save,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';

export default function DeceasedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch deceased member with all related data
  const { data: deceasedData, isLoading } = useQuery({
  queryKey: ['deceased-detail', id],
  queryFn: async () => {
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (!member) return null;

    const { data: record } = await supabase
      .from('deceased_records')
      .select('*')
      .eq('member_id', id)
      .maybeSingle();

    // Only fetch related data if record exists
    if (!record) {
      return {
        member,
        record: null,
        expenses: [],
        payments: [],
        contacts: [],
        checklist: [],
      };
    }

    const [
      { data: expenses },
      { data: payments },
      { data: contacts },
      { data: checklist },
    ] = await Promise.all([
      supabase.from('funeral_expenses').select('*').eq('deceased_record_id', record.id),
      supabase.from('funeral_payments').select('*').eq('deceased_record_id', record.id),
      supabase.from('funeral_contacts').select('*').eq('deceased_record_id', record.id),
      supabase.from('funeral_checklist').select('*').eq('deceased_record_id', record.id),
    ]);

    return {
      member,
      record,
      expenses: expenses || [],
      payments: payments || [],
      contacts: contacts || [],
      checklist: checklist || [],
    };
  },
});

  const updateRecordMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('deceased_records')
        .update(data)
        .eq('id', deceasedData?.record?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deceased-detail', id] });
      setIsEditing(false);
      setEditedData(null);
    },
  });

  const handleEdit = () => {
    setEditedData({ ...deceasedData?.record });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateRecordMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      reported: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      arranged: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
    };

    const style = styles[status as keyof typeof styles] || styles.reported;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style.bg} ${style.text}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const tabs = [
    { id: 'details', label: 'Death Details', icon: FileHeart },
    { id: 'funeral', label: 'Funeral Process', icon: Calendar },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, count: deceasedData?.expenses?.length },
    { id: 'payments', label: 'Payments', icon: DollarSign, count: deceasedData?.payments?.length },
    { id: 'contacts', label: 'Family Contacts', icon: Users, count: deceasedData?.contacts?.length },
    { id: 'checklist', label: 'Process Checklist', icon: CheckSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!deceasedData?.member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  const { member, record, expenses, payments, contacts, checklist } = deceasedData;

  // Calculate financial summary
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalPayments = payments.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const balance = totalExpenses - totalPayments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/deceased" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {member.title} {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {record && getStatusBadge(record.status)}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={updateRecordMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateRecordMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {updateRecordMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </>
          ) : (
            record && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      {record && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date of Death</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(record.date_of_death).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Burial Location</p>
                <p className="text-sm font-semibold text-gray-900">
                  {record.burial_location || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-sm font-semibold text-gray-900">
                  £{totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <DollarSign className={`h-5 w-5 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`text-sm font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  £{Math.abs(balance).toFixed(2)} {balance > 0 ? 'owed' : 'paid'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Record Warning */}
      {!record && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Deceased Record</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This member is marked as deceased but has no funeral record. Create one to track the funeral process.
              </p>
              <button
                onClick={() => navigate(`/deceased/record?member_id=${id}`)}
                className="mt-3 inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Funeral Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {record && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-1 px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-gray-700 text-gray-700'
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
            {activeTab === 'details' && (
              <DeathDetailsTab
                record={isEditing ? editedData : record}
                member={member}
                isEditing={isEditing}
                updateField={updateField}
              />
            )}
            {activeTab === 'funeral' && (
              <FuneralProcessTab
                record={isEditing ? editedData : record}
                isEditing={isEditing}
                updateField={updateField}
              />
            )}
            {activeTab === 'expenses' && (
              <ExpensesTab
                expenses={expenses}
                recordId={record.id}
              />
            )}
            {activeTab === 'payments' && (
              <PaymentsTab
                payments={payments}
                recordId={record.id}
                totalExpenses={totalExpenses}
              />
            )}
            {activeTab === 'contacts' && (
              <ContactsTab
                contacts={contacts}
                recordId={record.id}
              />
            )}
            {activeTab === 'checklist' && (
              <ChecklistTab
                checklist={checklist}
                recordId={record.id}
              />
            )}
            {activeTab === 'notes' && (
              <NotesTab
                record={isEditing ? editedData : record}
                isEditing={isEditing}
                updateField={updateField}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Components
function DeathDetailsTab({ record, member, isEditing, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EditableField
          label="Date of Death"
          value={record?.date_of_death}
          displayValue={record?.date_of_death ? new Date(record.date_of_death).toLocaleDateString() : 'N/A'}
          isEditing={isEditing}
          type="date"
          onChange={(value: any) => updateField?.('date_of_death', value)}
        />
        <EditableField
          label="Time of Death"
          value={record?.time_of_death}
          isEditing={isEditing}
          type="time"
          onChange={(value: any) => updateField?.('time_of_death', value)}
        />
        <EditableField
          label="Place of Death"
          value={record?.place_of_death}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('place_of_death', value)}
        />
        <EditableField
          label="Cause of Death"
          value={record?.cause_of_death}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('cause_of_death', value)}
        />
        <EditableField
          label="Death Certificate Number"
          value={record?.death_certificate_number}
          isEditing={isEditing}
          onChange={(value: any) => updateField?.('death_certificate_number', value)}
        />
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Notified By"
            value={record?.notified_by}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('notified_by', value)}
          />
          <EditableField
            label="Relationship"
            value={record?.notified_by_relationship}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('notified_by_relationship', value)}
          />
          <EditableField
            label="Contact Number"
            value={record?.notified_by_contact}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('notified_by_contact', value)}
          />
          <InfoField
            label="Notification Date"
            value={record?.notification_date ? new Date(record.notification_date).toLocaleString() : 'N/A'}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Full Name" value={`${member.title} ${member.first_name} ${member.last_name}`} />
          <InfoField label="Date of Birth" value={member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'} />
          <InfoField label="Age at Death" value={member.dob && record?.date_of_death ? 
            `${Math.floor((new Date(record.date_of_death).getTime() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years` : 
            'N/A'
          } />
          <InfoField label="Member Since" value={member.member_since ? new Date(member.member_since).toLocaleDateString() : 'N/A'} />
        </div>
      </div>
    </div>
  );
}

function FuneralProcessTab({ record, isEditing, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Funeral Arrangements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funeral Arrangements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Funeral Date"
            value={record?.funeral_date}
            displayValue={record?.funeral_date ? new Date(record.funeral_date).toLocaleDateString() : 'N/A'}
            isEditing={isEditing}
            type="date"
            onChange={(value: any) => updateField?.('funeral_date', value)}
          />
          <EditableField
            label="Funeral Time"
            value={record?.funeral_time}
            isEditing={isEditing}
            type="time"
            onChange={(value: any) => updateField?.('funeral_time', value)}
          />
          <div className="md:col-span-2">
            <EditableField
              label="Funeral Location"
              value={record?.funeral_location}
              isEditing={isEditing}
              onChange={(value: any) => updateField?.('funeral_location', value)}
            />
          </div>
        </div>
      </div>

      {/* Islamic Process */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Islamic Funeral Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Ghusl Performed By"
            value={record?.ghusl_performed_by}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('ghusl_performed_by', value)}
          />
          <EditableField
            label="Ghusl Date"
            value={record?.ghusl_performed_date}
            displayValue={record?.ghusl_performed_date ? new Date(record.ghusl_performed_date).toLocaleString() : 'N/A'}
            isEditing={isEditing}
            type="datetime-local"
            onChange={(value: any) => updateField?.('ghusl_performed_date', value)}
          />
          <EditableField
            label="Kafan Cost"
            value={record?.kafan_cost}
            isEditing={isEditing}
            type="number"
            onChange={(value: any) => updateField?.('kafan_cost', value)}
          />
          {isEditing ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kafan Provided</label>
              <select
                value={record?.kafan_provided ? 'true' : 'false'}
                onChange={(e) => updateField?.('kafan_provided', e.target.value === 'true')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          ) : (
            <InfoField label="Kafan Provided" value={record?.kafan_provided ? 'Yes' : 'No'} />
          )}
        </div>
      </div>

      {/* Janazah Prayer */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Janazah Prayer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Led By (Imam)"
            value={record?.janazah_led_by}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('janazah_led_by', value)}
          />
          <EditableField
            label="Location"
            value={record?.janazah_location}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('janazah_location', value)}
          />
          <EditableField
            label="Approximate Attendees"
            value={record?.janazah_attendees}
            isEditing={isEditing}
            type="number"
            onChange={(value: any) => updateField?.('janazah_attendees', value)}
          />
        </div>
      </div>

      {/* Burial Details */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Burial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Burial Date"
            value={record?.burial_date}
            displayValue={record?.burial_date ? new Date(record.burial_date).toLocaleDateString() : 'N/A'}
            isEditing={isEditing}
            type="date"
            onChange={(value: any) => updateField?.('burial_date', value)}
          />
          <EditableField
            label="Burial Time"
            value={record?.burial_time}
            isEditing={isEditing}
            type="time"
            onChange={(value: any) => updateField?.('burial_time', value)}
          />
          <EditableField
            label="Cemetery/Location"
            value={record?.burial_location}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('burial_location', value)}
          />
          <EditableField
            label="Plot Number"
            value={record?.burial_plot_number}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('burial_plot_number', value)}
          />
          <EditableField
            label="Grave Number"
            value={record?.grave_number}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('grave_number', value)}
          />
          <EditableField
            label="Burial Authority"
            value={record?.burial_authority}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('burial_authority', value)}
          />
        </div>
      </div>

      {/* Transportation */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transportation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Hearse Company"
            value={record?.hearse_company}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('hearse_company', value)}
          />
          <EditableField
            label="Hearse Cost"
            value={record?.hearse_cost}
            isEditing={isEditing}
            type="number"
            onChange={(value: any) => updateField?.('hearse_cost', value)}
          />
          <EditableField
            label="Transport From"
            value={record?.transport_from}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('transport_from', value)}
          />
          <div className="md:col-span-2">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Notes</label>
                <textarea
                  value={record?.transport_notes || ''}
                  onChange={(e) => updateField?.('transport_notes', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-h-[80px]"
                  placeholder="Any special transport arrangements..."
                />
              </div>
            ) : (
              <InfoField label="Transport Notes" value={record?.transport_notes || 'No notes'} />
            )}
          </div>
        </div>
      </div>

      {/* Administrative */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label="Handled By"
            value={record?.handled_by}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('handled_by', value)}
          />
          <EditableField
            label="Coordinator Name"
            value={record?.coordinator_name}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('coordinator_name', value)}
          />
          <EditableField
            label="Coordinator Phone"
            value={record?.coordinator_phone}
            isEditing={isEditing}
            onChange={(value: any) => updateField?.('coordinator_phone', value)}
          />
          <EditableField
            label="Status"
            value={record?.status}
            isEditing={isEditing}
            type="select"
            options={['reported', 'arranged', 'in_progress', 'completed', 'closed']}
            onChange={(value: any) => updateField?.('status', value)}
          />
        </div>
      </div>
    </div>
  );
}

function ExpensesTab({ expenses }: any) {
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Funeral Expenses</h3>
          <p className="text-sm text-gray-600">Total: £{totalExpenses.toFixed(2)}</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No expenses recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense: any) => (
            <div key={expense.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{expense.description}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                      {expense.expense_type}
                    </span>
                  </div>
                  {expense.paid_by && (
                    <p className="text-sm text-gray-600 mt-1">Paid by: {expense.paid_by}</p>
                  )}
                  {expense.receipt_number && (
                    <p className="text-xs text-gray-500 mt-1">Receipt: {expense.receipt_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">£{Number(expense.amount).toFixed(2)}</p>
                  {expense.paid_date && (
                    <p className="text-xs text-gray-500">{new Date(expense.paid_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ payments, totalExpenses }: any) {
  const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const balance = totalExpenses - totalPaid;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">£{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">£{totalPaid.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-lg ${balance > 0 ? 'bg-red-50' : 'bg-blue-50'}`}>
          <p className="text-sm text-gray-600">Balance</p>
          <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-blue-600'}`}>
            £{Math.abs(balance).toFixed(2)} {balance > 0 ? 'owed' : 'credit'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment: any) => (
            <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Payment from {payment.payer_name || 'Family'}</span>
                    {payment.payment_method && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {payment.payment_method}
                      </span>
                    )}
                  </div>
                  {payment.payer_relationship && (
                    <p className="text-sm text-gray-600 mt-1">Relationship: {payment.payer_relationship}</p>
                  )}
                  {payment.receipt_number && (
                    <p className="text-xs text-gray-500 mt-1">Receipt: {payment.receipt_number}</p>
                  )}
                  {payment.received_by && (
                    <p className="text-xs text-gray-500">Received by: {payment.received_by}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">£{Number(payment.amount).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactsTab({ contacts }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Family Contacts</h3>
        <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No family contacts recorded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact: any) => (
            <div key={contact.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{contact.contact_name}</h4>
                      {contact.is_primary_contact && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Primary</span>
                      )}
                    </div>
                    {contact.relationship && (
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                    )}
                    {contact.phone && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone}
                      </p>
                    )}
                    {contact.email && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {contact.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ checklist }: any) {
  const completedCount = checklist.filter((item: any) => item.completed).length;
  const totalCount = checklist.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Funeral Process Checklist</h3>
          <p className="text-sm text-gray-600">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      )}

      {checklist.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No checklist items yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checklist.map((item: any) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${
                item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={item.completed}
                  className="h-5 w-5 text-green-600 rounded mt-0.5"
                  readOnly
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${item.completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                      {item.task_name}
                    </p>
                    {item.task_category && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {item.task_category}
                      </span>
                    )}
                  </div>
                  {item.completed && item.completed_by && (
                    <p className="text-sm text-green-700 mt-1">
                      Completed by {item.completed_by}
                      {item.completed_at && ` on ${new Date(item.completed_at).toLocaleDateString()}`}
                    </p>
                  )}
                  {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ record, isEditing, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Wishes</h3>
        {isEditing ? (
          <textarea
            value={record?.family_wishes || ''}
            onChange={(e) => updateField?.('family_wishes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-h-[100px]"
            placeholder="Any special requests from the family..."
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{record?.family_wishes || 'No special wishes recorded'}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complications</h3>
        {isEditing ? (
          <textarea
            value={record?.complications || ''}
            onChange={(e) => updateField?.('complications', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-h-[100px]"
            placeholder="Any issues or complications during the process..."
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{record?.complications || 'No complications recorded'}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Notes</h3>
        {isEditing ? (
          <textarea
            value={record?.notes || ''}
            onChange={(e) => updateField?.('notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-h-[150px]"
            placeholder="Any additional notes or information..."
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{record?.notes || 'No additional notes'}</p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Notes</h3>
        {isEditing ? (
          <textarea
            value={record?.payment_notes || ''}
            onChange={(e) => updateField?.('payment_notes', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-h-[100px]"
            placeholder="Payment arrangements, subsidies, insurance details..."
          />
        ) : (
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{record?.payment_notes || 'No payment notes'}</p>
        )}
      </div>
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        >
          <option value="">Select {label}</option>
          {options?.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1).replace('_', ' ')}
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
          step={type === 'number' ? '0.01' : undefined}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center">
        {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
        <p className={`text-gray-900 ${!value || value === 'N/A' ? 'text-gray-400' : ''}`}>
          {value || 'N/A'}
        </p>
      </div>
    </div>
  );
}