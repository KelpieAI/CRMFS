// src/pages/RecordDeath.tsx
// Wizard to record a member's death and create funeral record

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface DeathFormData {
  // Step 1: Member Selection
  member_id: string;
  
  // Step 2: Death Details
  date_of_death: string;
  time_of_death?: string;
  place_of_death: string;
  hospital_mortuary?: string;
  cause_of_death?: string;
  death_certificate_number?: string;
  death_certificate_obtained: boolean;
  next_of_kin_notified: boolean;
  assigned_committee_member?: string;
  
  // Step 3: Funeral Arrangements
  burial_location?: string;
  burial_plot_number?: string;
  burial_date?: string;
  burial_time?: string;
  imam_name?: string;
  funeral_director?: string;
  funeral_director_phone?: string;
  estimated_attendees?: number;
  
  // Step 4: Costs & Expenses
  estimated_total_cost?: number;
  cemetery_plot_fee?: number;
  imam_fee?: number;
  coffin_shroud_cost?: number;
  transport_cost?: number;
  other_costs?: number;
  payment_responsibility?: 'family' | 'mosque' | 'split';
  
  // Step 5: Family Contacts
  primary_contact_name?: string;
  primary_contact_relation?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  
  // General
  notes?: string;
}

export default function RecordDeath() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberId } = useParams();
  const [step, setStep] = useState(memberId ? 2 : 1); // Skip to step 2 if memberId provided
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState<DeathFormData>({
    member_id: memberId || '',
    date_of_death: new Date().toISOString().split('T')[0],
    place_of_death: '',
    next_of_kin_notified: false,
    death_certificate_obtained: false,
    payment_responsibility: 'family',
  });

  // Fetch active members only
  const { data: members, isLoading } = useQuery({
    queryKey: ['active-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, mobile, status')
        .eq('status', 'active')
        .order('last_name');

      return data || [];
    },
  });

  // Load member if memberId provided in URL
  useEffect(() => {
    if (memberId && members) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setSelectedMember(member);
        setFormData(prev => ({ ...prev, member_id: memberId }));
      }
    }
  }, [memberId, members]);

  // Create death record mutation
  const createDeathRecord = useMutation({
    mutationFn: async (data: DeathFormData) => {
      // 1. Create deceased record
      const { data: deceasedRecord, error: recordError} = await supabase
        .from('deceased')
        .insert({
          member_id: data.member_id,
          deceased_name: `${selectedMember.first_name} ${selectedMember.last_name}`,
          
          // Death Details
          date_of_death: data.date_of_death,
          time_of_death: data.time_of_death,
          place_of_death: data.place_of_death,
          cause_of_death: data.cause_of_death,
          death_certificate_obtained: data.death_certificate_obtained,
          next_of_kin_notified: data.next_of_kin_notified,
          
          // Funeral Arrangements
          burial_location: data.burial_location,
          burial_date: data.burial_date,
          burial_time: data.burial_time,
          imam_name: data.imam_name,
          
          // Status and Notes
          status: 'reported',
          notes: data.notes,
        })
        .select()
        .single();

      if (recordError) {
        console.error('❌ Error creating deceased record:', recordError);
        throw recordError;
      }

      console.log('✅ Deceased record created:', deceasedRecord);

      // 2. Update member status to deceased
      const { error: memberError } = await supabase
        .from('members')
        .update({ 
          status: 'deceased',
        })
        .eq('id', data.member_id);

      if (memberError) {
        console.error('❌ Error updating member status:', memberError);
        throw memberError;
      }

      console.log('✅ Member status updated to deceased');

      return deceasedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deceased-members'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', formData.member_id] });

      console.log('✅ Navigating to deceased detail page');
      // Navigate to deceased detail page instead of member page
      navigate(`/deceased/${formData.member_id}`);
    },
    onError: (error) => {
      console.error('❌ Mutation failed:', error);
      alert(`Failed to record death: ${error.message}\n\nPlease check if you've run the database migration.`);
    },
  });

  // Filter members by search
  const filteredMembers = members?.filter((m: any) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || m.email?.toLowerCase().includes(search);
  });

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setFormData({ ...formData, member_id: member.id });
    setStep(2);
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/deceased');
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    createDeathRecord.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {step === 1 ? 'Back to Deceased Members' : 'Back'}
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Record Death</h1>
              <p className="mt-2 text-gray-600">
                إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
              </p>
            </div>
            
            {/* Progress Steps */}
            <div className="hidden md:flex items-center space-x-4">
              {[
                { num: 1, label: 'Select' },
                { num: 2, label: 'Death' },
                { num: 3, label: 'Funeral' },
                { num: 4, label: 'Costs' },
                { num: 5, label: 'Contacts' },
                { num: 6, label: 'Review' }
              ].map((s) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        s.num === step
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : s.num < step
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s.num < step ? <CheckCircle className="h-5 w-5" /> : s.num}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      s.num === step ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {s.num < 6 && (
                    <ChevronRight className={`h-4 w-4 mx-2 ${s.num < step ? 'text-emerald-600' : 'text-gray-400'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Select Member */}
        {step === 1 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select Member
              </h2>
              <p className="text-sm text-gray-600">
                Search and select the member who has passed away
              </p>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Member List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <p className="text-center text-gray-500 py-8">Loading members...</p>
                ) : filteredMembers?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No members found</p>
                ) : (
                  filteredMembers?.map((member: any) => (
                    <button
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Death Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Death Details
              </h2>
              <p className="text-sm text-gray-600">
                Recording death for: <span className="font-medium">{selectedMember.first_name} {selectedMember.last_name}</span>
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date of Death */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Death *
                </label>
                <input
                  type="date"
                  value={formData.date_of_death}
                  onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Time of Death */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of Death
                </label>
                <input
                  type="time"
                  value={formData.time_of_death || ''}
                  onChange={(e) => setFormData({ ...formData, time_of_death: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Place of Death */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of Death *
                </label>
                <input
                  type="text"
                  value={formData.place_of_death}
                  onChange={(e) => setFormData({ ...formData, place_of_death: e.target.value })}
                  placeholder="e.g., Hospital, Home, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Cause of Death */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cause of Death
                </label>
                <textarea
                  value={formData.cause_of_death || ''}
                  onChange={(e) => setFormData({ ...formData, cause_of_death: e.target.value })}
                  placeholder="Optional details..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Hospital/Mortuary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital / Mortuary Name
                </label>
                <input
                  type="text"
                  value={formData.hospital_mortuary || ''}
                  onChange={(e) => setFormData({ ...formData, hospital_mortuary: e.target.value })}
                  placeholder="e.g., Forth Valley Royal Hospital"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Death Certificate Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Death Certificate Number
                </label>
                <input
                  type="text"
                  value={formData.death_certificate_number || ''}
                  onChange={(e) => setFormData({ ...formData, death_certificate_number: e.target.value })}
                  placeholder="e.g., 2026/001234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Assigned Committee Member */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Committee Member
                </label>
                <select
                  value={formData.assigned_committee_member || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_committee_member: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select committee member</option>
                  <option value="Imam Ahmed">Imam Ahmed</option>
                  <option value="Brother Yusuf">Brother Yusuf</option>
                  <option value="Sister Fatima">Sister Fatima</option>
                  <option value="Brother Ibrahim">Brother Ibrahim</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.next_of_kin_notified}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_notified: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Next of kin notified</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.death_certificate_obtained}
                    onChange={(e) => setFormData({ ...formData, death_certificate_obtained: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Death certificate obtained</span>
                </label>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.date_of_death || !formData.place_of_death}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Funeral Arrangements
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Funeral Arrangements */}
        {step === 3 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Funeral Arrangements
              </h2>
              <p className="text-sm text-gray-600">
                Burial and funeral service details
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Burial Location Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Burial Location
                </label>
                <select
                  value={formData.burial_location || ''}
                  onChange={(e) => setFormData({ ...formData, burial_location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select cemetery</option>
                  <option value="Falkirk Cemetery">Falkirk Cemetery</option>
                  <option value="Grangemouth Cemetery">Grangemouth Cemetery</option>
                  <option value="Stirling Cemetery">Stirling Cemetery</option>
                  <option value="Glasgow Central Mosque Cemetery">Glasgow Central Mosque Cemetery</option>
                  <option value="Edinburgh Islamic Cemetery">Edinburgh Islamic Cemetery</option>
                  <option value="Other">Other (specify in notes)</option>
                </select>
              </div>

              {/* Burial Plot Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Burial Plot Number
                </label>
                <input
                  type="text"
                  value={formData.burial_plot_number || ''}
                  onChange={(e) => setFormData({ ...formData, burial_plot_number: e.target.value })}
                  placeholder="e.g., Section A, Plot 123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Burial Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Burial Date
                  </label>
                  <input
                    type="date"
                    value={formData.burial_date || ''}
                    onChange={(e) => setFormData({ ...formData, burial_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Burial Time
                  </label>
                  <input
                    type="time"
                    value={formData.burial_time || ''}
                    onChange={(e) => setFormData({ ...formData, burial_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Imam Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imam Name
                </label>
                <input
                  type="text"
                  value={formData.imam_name || ''}
                  onChange={(e) => setFormData({ ...formData, imam_name: e.target.value })}
                  placeholder="Name of imam conducting funeral prayer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Funeral Director */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funeral Director
                  </label>
                  <input
                    type="text"
                    value={formData.funeral_director || ''}
                    onChange={(e) => setFormData({ ...formData, funeral_director: e.target.value })}
                    placeholder="Company/person name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funeral Director Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.funeral_director_phone || ''}
                    onChange={(e) => setFormData({ ...formData, funeral_director_phone: e.target.value })}
                    placeholder="07XXX XXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Estimated Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Attendees
                </label>
                <input
                  type="number"
                  value={formData.estimated_attendees || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_attendees: Number(e.target.value) })}
                  placeholder="Approximate number of people expected"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Continue to Costs
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Costs & Expenses */}
        {step === 4 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Costs & Expenses
              </h2>
              <p className="text-sm text-gray-600">
                Estimated funeral costs and payment arrangements
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Responsibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Responsibility
                </label>
                <select
                  value={formData.payment_responsibility || 'family'}
                  onChange={(e) => setFormData({ ...formData, payment_responsibility: e.target.value as 'family' | 'mosque' | 'split' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="family">Family Responsible</option>
                  <option value="mosque">Mosque Responsible</option>
                  <option value="split">Split Between Family & Mosque</option>
                </select>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Cost Breakdown (Optional)</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Cemetery Plot Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.cemetery_plot_fee || ''}
                        onChange={(e) => setFormData({ ...formData, cemetery_plot_fee: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Imam Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.imam_fee || ''}
                        onChange={(e) => setFormData({ ...formData, imam_fee: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Coffin / Shroud
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.coffin_shroud_cost || ''}
                        onChange={(e) => setFormData({ ...formData, coffin_shroud_cost: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Transport
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.transport_cost || ''}
                        onChange={(e) => setFormData({ ...formData, transport_cost: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Other Costs
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.other_costs || ''}
                        onChange={(e) => setFormData({ ...formData, other_costs: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Estimated Total
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={formData.estimated_total_cost || ''}
                        onChange={(e) => setFormData({ ...formData, estimated_total_cost: Number(e.target.value) })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-calculate total */}
                {(formData.cemetery_plot_fee || formData.imam_fee || formData.coffin_shroud_cost || formData.transport_cost || formData.other_costs) && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Calculated Total: <span className="font-semibold text-gray-900">
                        £{(
                          (formData.cemetery_plot_fee || 0) +
                          (formData.imam_fee || 0) +
                          (formData.coffin_shroud_cost || 0) +
                          (formData.transport_cost || 0) +
                          (formData.other_costs || 0)
                        ).toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Continue to Family Contacts
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Family Contacts */}
        {step === 5 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Family Contacts
              </h2>
              <p className="text-sm text-gray-600">
                Primary contacts for funeral coordination
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Primary Contact */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Primary Contact</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.primary_contact_name || ''}
                        onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                        placeholder="Contact person name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Relation to Deceased
                      </label>
                      <select
                        value={formData.primary_contact_relation || ''}
                        onChange={(e) => setFormData({ ...formData, primary_contact_relation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select relation</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.primary_contact_phone || ''}
                        onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                        placeholder="07XXX XXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.primary_contact_email || ''}
                        onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Contact */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Secondary Contact (Optional)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.secondary_contact_name || ''}
                      onChange={(e) => setFormData({ ...formData, secondary_contact_name: e.target.value })}
                      placeholder="Contact person name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.secondary_contact_phone || ''}
                      onChange={(e) => setFormData({ ...formData, secondary_contact_phone: e.target.value })}
                      placeholder="07XXX XXXXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information or special requirements..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.primary_contact_name || !formData.primary_contact_phone}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Review & Submit */}
        {step === 6 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review & Confirm
              </h2>
              <p className="text-sm text-gray-600">
                Please review all information before submitting
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Member Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Member</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-medium text-lg">{selectedMember.first_name} {selectedMember.last_name}</p>
                  <p className="text-sm text-gray-600">{selectedMember.email}</p>
                </div>
              </div>

              {/* Death Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Death Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date of Death:</span>
                    <span className="text-sm font-medium">{new Date(formData.date_of_death).toLocaleDateString()}</span>
                  </div>
                  {formData.time_of_death && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm font-medium">{formData.time_of_death}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Place:</span>
                    <span className="text-sm font-medium">{formData.place_of_death}</span>
                  </div>
                  {formData.hospital_mortuary && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hospital/Mortuary:</span>
                      <span className="text-sm font-medium">{formData.hospital_mortuary}</span>
                    </div>
                  )}
                  {formData.cause_of_death && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cause:</span>
                      <span className="text-sm font-medium">{formData.cause_of_death}</span>
                    </div>
                  )}
                  {formData.death_certificate_number && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cert Number:</span>
                      <span className="text-sm font-medium">{formData.death_certificate_number}</span>
                    </div>
                  )}
                  {formData.assigned_committee_member && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Assigned To:</span>
                      <span className="text-sm font-medium">{formData.assigned_committee_member}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Funeral Arrangements */}
              {(formData.burial_location || formData.burial_date) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Funeral Arrangements</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    {formData.burial_location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cemetery:</span>
                        <span className="text-sm font-medium">{formData.burial_location}</span>
                      </div>
                    )}
                    {formData.burial_plot_number && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Plot Number:</span>
                        <span className="text-sm font-medium">{formData.burial_plot_number}</span>
                      </div>
                    )}
                    {formData.burial_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium">{new Date(formData.burial_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {formData.burial_time && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="text-sm font-medium">{formData.burial_time}</span>
                      </div>
                    )}
                    {formData.imam_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Imam:</span>
                        <span className="text-sm font-medium">{formData.imam_name}</span>
                      </div>
                    )}
                    {formData.funeral_director && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Funeral Director:</span>
                        <span className="text-sm font-medium">{formData.funeral_director}</span>
                      </div>
                    )}
                    {formData.funeral_director_phone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Director Phone:</span>
                        <span className="text-sm font-medium">{formData.funeral_director_phone}</span>
                      </div>
                    )}
                    {formData.estimated_attendees && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Est. Attendees:</span>
                        <span className="text-sm font-medium">{formData.estimated_attendees}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Costs */}
              {(formData.estimated_total_cost || formData.cemetery_plot_fee) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Costs & Expenses</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Responsibility:</span>
                      <span className="text-sm font-medium capitalize">{formData.payment_responsibility?.replace('_', ' ')}</span>
                    </div>
                    {formData.cemetery_plot_fee && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cemetery Plot:</span>
                        <span className="text-sm font-medium">£{formData.cemetery_plot_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.imam_fee && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Imam Fee:</span>
                        <span className="text-sm font-medium">£{formData.imam_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.coffin_shroud_cost && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Coffin/Shroud:</span>
                        <span className="text-sm font-medium">£{formData.coffin_shroud_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.transport_cost && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transport:</span>
                        <span className="text-sm font-medium">£{formData.transport_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.other_costs && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Other:</span>
                        <span className="text-sm font-medium">£{formData.other_costs.toFixed(2)}</span>
                      </div>
                    )}
                    {formData.estimated_total_cost && (
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-sm font-semibold text-gray-900">Total:</span>
                        <span className="text-sm font-semibold text-gray-900">£{formData.estimated_total_cost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Family Contacts */}
              {formData.primary_contact_name && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Family Contacts</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Primary Contact</p>
                      <p className="font-medium">{formData.primary_contact_name}</p>
                      {formData.primary_contact_relation && (
                        <p className="text-sm text-gray-600">{formData.primary_contact_relation}</p>
                      )}
                      <p className="text-sm text-gray-600">{formData.primary_contact_phone}</p>
                      {formData.primary_contact_email && (
                        <p className="text-sm text-gray-600">{formData.primary_contact_email}</p>
                      )}
                    </div>
                    {formData.secondary_contact_name && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Secondary Contact</p>
                        <p className="font-medium">{formData.secondary_contact_name}</p>
                        <p className="text-sm text-gray-600">{formData.secondary_contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Checklist</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex items-center">
                    {formData.next_of_kin_notified ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm">Next of kin notified</span>
                  </div>
                  <div className="flex items-center">
                    {formData.death_certificate_obtained ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm">Death certificate obtained</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {formData.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Additional Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                disabled={createDeathRecord.isPending}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={createDeathRecord.isPending}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createDeathRecord.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Record Death
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}