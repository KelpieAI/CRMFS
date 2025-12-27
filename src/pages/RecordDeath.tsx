// src/pages/RecordDeath.tsx
// Wizard to record a member's death and create funeral record

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  member_id: string;
  date_of_death: string;
  time_of_death?: string;
  place_of_death: string;
  cause_of_death?: string;
  burial_location?: string;
  burial_date?: string;
  burial_time?: string;
  imam_name?: string;
  next_of_kin_notified: boolean;
  death_certificate_obtained: boolean;
  notes?: string;
}

export default function RecordDeath() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: Select Member, 2: Death Details, 3: Burial Details, 4: Confirmation
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [formData, setFormData] = useState<DeathFormData>({
    member_id: '',
    date_of_death: new Date().toISOString().split('T')[0],
    place_of_death: '',
    next_of_kin_notified: false,
    death_certificate_obtained: false,
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

      console.log('Members query result:', { data, error, count: data?.length });

      return data || [];
    },
  });

  // Create death record mutation
  const createDeathRecord = useMutation({
    mutationFn: async (data: DeathFormData) => {
      // 1. Create deceased record
      const { data: deceasedRecord, error: recordError } = await supabase
        .from('deceased')
        .insert({
          member_id: data.member_id,
          deceased_name: `${selectedMember.first_name} ${selectedMember.last_name}`,
          date_of_death: data.date_of_death,
          time_of_death: data.time_of_death,
          place_of_death: data.place_of_death,
          cause_of_death: data.cause_of_death,
          burial_location: data.burial_location,
          burial_date: data.burial_date,
          burial_time: data.burial_time,
          imam_name: data.imam_name,
          next_of_kin_notified: data.next_of_kin_notified,
          death_certificate_obtained: data.death_certificate_obtained,
          status: 'reported',
          notes: data.notes,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // 2. Update member status to deceased
      const { error: memberError } = await supabase
        .from('members')
        .update({ 
          status: 'deceased',
        })
        .eq('id', data.member_id);

      if (memberError) throw memberError;

      return deceasedRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deceased-members'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', formData.member_id] });

      console.log('Created deceased record:', data); // Debug
      
      navigate(`/deceased`);
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
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s === step
                        ? 'bg-emerald-600 text-white'
                        : s < step
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && (
                    <ChevronRight className={`h-4 w-4 mx-2 ${s < step ? 'text-emerald-600' : 'text-gray-400'}`} />
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
                Continue to Burial Details
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Burial Details */}
        {step === 3 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Burial Details
              </h2>
              <p className="text-sm text-gray-600">
                Optional funeral arrangement information
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Burial Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Burial Location
                </label>
                <input
                  type="text"
                  value={formData.burial_location || ''}
                  onChange={(e) => setFormData({ ...formData, burial_location: e.target.value })}
                  placeholder="Cemetery name and location"
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
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
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review & Confirm
              </h2>
              <p className="text-sm text-gray-600">
                Please review the information before submitting
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Member</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{selectedMember.first_name} {selectedMember.last_name}</p>
                  <p className="text-sm text-gray-600">{selectedMember.email}</p>
                </div>
              </div>

              {/* Death Details */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Death Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date of Death:</span>
                    <span className="text-sm font-medium">{new Date(formData.date_of_death).toLocaleDateString()}</span>
                  </div>
                  {formData.time_of_death && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time of Death:</span>
                      <span className="text-sm font-medium">{formData.time_of_death}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Place of Death:</span>
                    <span className="text-sm font-medium">{formData.place_of_death}</span>
                  </div>
                  {formData.cause_of_death && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cause of Death:</span>
                      <span className="text-sm font-medium">{formData.cause_of_death}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Burial Details */}
              {(formData.burial_location || formData.burial_date) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Burial Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {formData.burial_location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="text-sm font-medium">{formData.burial_location}</span>
                      </div>
                    )}
                    {formData.burial_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Burial Date:</span>
                        <span className="text-sm font-medium">{new Date(formData.burial_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {formData.burial_time && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Burial Time:</span>
                        <span className="text-sm font-medium">{formData.burial_time}</span>
                      </div>
                    )}
                    {formData.imam_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Imam:</span>
                        <span className="text-sm font-medium">{formData.imam_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Checklist</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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