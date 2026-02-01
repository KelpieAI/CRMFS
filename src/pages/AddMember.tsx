import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logActivity, ActivityTypes } from '../lib/activityLogger';
import DateInput from '../components/DateInput';
import RegistrationSidebar from '../components/RegistrationSidebar';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  User,
  Baby,
  FileText,
  Upload,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Copy,
  Shield,
  Info,
} from 'lucide-react';


// Reusable Info Tooltip Component
function InfoTooltip({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-[#2d5016] hover:bg-emerald-50 rounded-full transition-colors"
        aria-label={`Info: ${title}`}
      >
        <Info className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 left-6 top-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-left">
          <div className="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
          <div className="absolute -left-[9px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-200"></div>
          <h5 className="text-sm font-semibold text-gray-900 mb-2">{title}</h5>
          <div className="text-xs text-gray-600 space-y-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface Child {
  first_name: string;
  last_name: string;
  dob: string;
  relation: string;
}

interface FormData {
  app_type: 'single' | 'joint';
  title: string;
  first_name: string;
  last_name: string;
  dob: string;
  address_line_1: string;
  town: string;
  city: string;
  postcode: string;
  mobile: string;
  home_phone: string;
  work_phone: string;
  email: string;
  joint_title: string;
  joint_first_name: string;
  joint_last_name: string;
  joint_dob: string;
  joint_address_line_1: string;
  joint_town: string;
  joint_city: string;
  joint_postcode: string;
  joint_mobile: string;
  joint_home_phone: string;
  joint_work_phone: string;
  joint_email: string;
  joint_relation: string;
  children: Child[];
  nok_title: string;
  nok_first_name: string;
  nok_last_name: string;
  nok_relationship: string;
  nok_address_line_1: string;
  nok_town: string;
  nok_city: string;
  nok_postcode: string;
  nok_mobile: string;
  nok_phone: string;
  nok_email: string;
  gp_name_surgery: string;
  gp_address_line_1: string;
  gp_town: string;
  gp_city: string;
  gp_postcode: string;
  gp_phone: string;
  gp_email: string;
  main_disclaimer: string;
  main_conditions: string;
  joint_disclaimer: string;
  joint_conditions: string;
  documents_acknowledged: boolean;
  agreement_sig_1: boolean;
  agreement_sig_2: boolean;
  funding_sig_1: boolean;
  funding_sig_2: boolean;
  declaration_sig_1: boolean;
  declaration_sig_2: boolean;
  main_joining_fee: number;
  main_membership_fee: number;
  joint_joining_fee: number;
  joint_membership_fee: number;
  total_amount: number;
  payment_method: string;
}

// Helper function to calculate age from date of birth
function calculateAge(dob: string): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function AddMember() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const savedApplication = location.state?.savedApplication;

  const [currentStep, setCurrentStep] = useState(savedApplication?.current_step || 0);
  const [highestStepReached, setHighestStepReached] = useState(savedApplication?.current_step || 0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [childValidationErrors, setChildValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [saveMessage, setSaveMessage] = useState('');
  const [applicationReference, setApplicationReference] = useState<string | null>(savedApplication?.application_reference || null);
  const [mainHasMedicalCondition, setMainHasMedicalCondition] = useState(false);
  const [jointHasMedicalCondition, setJointHasMedicalCondition] = useState(false);
  const [membershipType, setMembershipType] = useState('new');
  const [signupDate, setSignupDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [mainDob, setMainDob] = useState(savedApplication?.form_data?.dob || '');

  // Medical Consent
  const [mainMedicalConsent, setMainMedicalConsent] = useState(false);
  const [mainMedicalSignature, setMainMedicalSignature] = useState('');
  const [jointMedicalConsent, setJointMedicalConsent] = useState(false);
  const [jointMedicalSignature, setJointMedicalSignature] = useState('');

  // Final Declaration
  const [mainFinalDeclaration, setMainFinalDeclaration] = useState(false);
  const [mainFinalSignature, setMainFinalSignature] = useState('');
  const [jointFinalDeclaration, setJointFinalDeclaration] = useState(false);
  const [jointFinalSignature, setJointFinalSignature] = useState('');

  // Paper form tracking
  const [paperFormVersion, setPaperFormVersion] = useState('v01.25');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [mainSignature, setMainSignature] = useState('');
  const [jointSignature, setJointSignature] = useState('');
  const [paperFormConfirmed, setPaperFormConfirmed] = useState(false);
  const [dataEnteredBy, setDataEnteredBy] = useState('');

  // GP Details (shared for both applicants)
  const [gpPracticeName, setGpPracticeName] = useState('');
  const [gpPracticeAddress, setGpPracticeAddress] = useState('');
  const [gpPostcode, setGpPostcode] = useState('');
  const [gpTelephone, setGpTelephone] = useState('');
  const [gpEmail, setGpEmail] = useState('');
  
  const [formData, setFormData] = useState<FormData>(savedApplication?.form_data || {
    app_type: 'single',
    title: '',
    first_name: '',
    last_name: '',
    dob: '',
    address_line_1: '',
    town: '',
    city: '',
    postcode: '',
    mobile: '',
    home_phone: '',
    work_phone: '',
    email: '',
    joint_title: '',
    joint_first_name: '',
    joint_last_name: '',
    joint_dob: '',
    joint_address_line_1: '',
    joint_town: '',
    joint_city: '',
    joint_postcode: '',
    joint_mobile: '',
    joint_home_phone: '',
    joint_work_phone: '',
    joint_email: '',
    joint_relation: 'Spouse',
    children: [],
    nok_title: '',
    nok_first_name: '',
    nok_last_name: '',
    nok_relationship: '',
    nok_address_line_1: '',
    nok_town: '',
    nok_city: '',
    nok_postcode: '',
    nok_mobile: '',
    nok_phone: '',
    nok_email: '',
    gp_name_surgery: '',
    gp_address_line_1: '',
    gp_town: '',
    gp_city: '',
    gp_postcode: '',
    gp_phone: '',
    gp_email: '',
    main_disclaimer: '',
    main_conditions: '',
    joint_disclaimer: '',
    joint_conditions: '',
    documents_acknowledged: false,
    agreement_sig_1: false,
    agreement_sig_2: false,
    funding_sig_1: false,
    funding_sig_2: false,
    declaration_sig_1: false,
    declaration_sig_2: false,
    main_joining_fee: 0,
    main_membership_fee: 100,
    joint_joining_fee: 0,
    joint_membership_fee: 100,
    total_amount: 0,
    payment_method: '',
  });

  const [mainPhotoId, setMainPhotoId] = useState<File | null>(null);
  const [mainPhotoIdUrl, setMainPhotoIdUrl] = useState<string>('');
  const [mainProofAddress, setMainProofAddress] = useState<File | null>(null);
  const [mainProofAddressUrl, setMainProofAddressUrl] = useState<string>('');

  const [jointPhotoId, setJointPhotoId] = useState<File | null>(null);
  const [jointPhotoIdUrl, setJointPhotoIdUrl] = useState<string>('');
  const [jointProofAddress, setJointProofAddress] = useState<File | null>(null);
  const [jointProofAddressUrl, setJointProofAddressUrl] = useState<string>('');

  const [childrenDocuments, setChildrenDocuments] = useState<Record<string, File | null>>({});
  const [childrenDocumentUrls, setChildrenDocumentUrls] = useState<Record<string, string>>({});

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const { data: feeStructure } = useQuery({
    queryKey: ['fee-structure'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_structure').select('*').order('age_min', { ascending: true });
      return data || [];
    },
  });

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

  const calculateJoiningFee = (dob: string, isLegacy: boolean): number => {
    if (isLegacy) return 0;
    if (!dob) return 0;

    const age = calculateAge(dob);

    if (age >= 18 && age <= 25) return 75;
    if (age >= 26 && age <= 35) return 100;
    if (age >= 36 && age <= 45) return 200;
    if (age >= 46 && age <= 55) return 300;
    if (age >= 56) return 500;

    return 0;
  };

  const calculateProRataFee = (signupDate: string): number => {
    if (!signupDate) return 100;

    const signup = new Date(signupDate);
    const yearEnd = new Date(signup.getFullYear(), 11, 31);

    if (signup.getMonth() === 0 && signup.getDate() === 1) {
      return 100;
    }

    const daysRemaining = Math.ceil((yearEnd.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInYear = 365;

    const proRataFee = (100 / daysInYear) * daysRemaining;

    return Math.round(proRataFee * 100) / 100;
  };

  const getCoverageEndDate = (signupDate: string, adjustmentValue: number): string => {
    if (!signupDate) return '';

    const signup = new Date(signupDate);
    const firstRenewal = new Date(signup.getFullYear(), 11, 31);

    if (adjustmentValue >= 100) {
      return new Date(signup.getFullYear() + 1, 11, 31).toLocaleDateString('en-GB');
    }

    return firstRenewal.toLocaleDateString('en-GB');
  };

  const calculateFees = (dob: string) => {
    const age = calculateAge(dob);
    if (!feeStructure || age === 0) return { joining: 0, membership: 100 };
    const tier = feeStructure.find((fee: any) => age >= fee.age_min && age <= fee.age_max);
    return { joining: tier ? tier.joining_fee : 0, membership: tier ? tier.membership_fee : 100 };
  };

  const uploadDocument = async (file: File, category: string, applicantType: string) => {
    if (!file) return null;

    try {
      setUploadingDoc(`${applicantType}-${category}`);

      const timestamp = Date.now();
      const filename = `${applicantType}_${category}_${timestamp}_${file.name}`;
      const filePath = `documents/${filename}`;

      const { error } = await supabase.storage
        .from('member-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('member-documents')
        .getPublicUrl(filePath);

      setUploadingDoc(null);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
      setUploadingDoc(null);
      return null;
    }
  };

  const deleteDocument = async (url: string) => {
    if (!url) return;

    try {
      const urlParts = url.split('/');
      const filePath = `documents/${urlParts[urlParts.length - 1]}`;

      const { error } = await supabase.storage
        .from('member-documents')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  useEffect(() => {
    if (formData.dob) {
      const mainFees = calculateFees(formData.dob);
      setFormData((prev) => ({ ...prev, main_joining_fee: mainFees.joining, main_membership_fee: mainFees.membership }));
    }
  }, [formData.dob, feeStructure]);

  useEffect(() => {
    if (formData.app_type === 'joint' && formData.joint_dob) {
      const jointFees = calculateFees(formData.joint_dob);
      setFormData((prev) => ({ ...prev, joint_joining_fee: jointFees.joining, joint_membership_fee: jointFees.membership }));
    }
  }, [formData.joint_dob, formData.app_type, feeStructure]);

  useEffect(() => {
    const total = formData.main_joining_fee + formData.main_membership_fee +
      (formData.app_type === 'joint' ? formData.joint_joining_fee + formData.joint_membership_fee : 0);
    setFormData((prev) => ({ ...prev, total_amount: total }));
  }, [formData.main_joining_fee, formData.main_membership_fee, formData.joint_joining_fee, formData.joint_membership_fee, formData.app_type]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const mainJoiningFee = calculateJoiningFee(mainDob, membershipType === 'legacy');
  const jointJoiningFee = formData.app_type === 'joint' && formData.joint_dob
    ? calculateJoiningFee(formData.joint_dob, membershipType === 'legacy')
    : 0;
  const joiningFee = mainJoiningFee + jointJoiningFee;

  const mainProRataFee = calculateProRataFee(signupDate);
  const jointProRataFee = formData.app_type === 'joint' && formData.joint_dob
    ? calculateProRataFee(signupDate)
    : 0;
  const proRataAnnualFee = mainProRataFee + jointProRataFee;

  const adjustmentValue = adjustmentAmount ? parseFloat(adjustmentAmount) : 0;
  const totalDue = joiningFee + proRataAnnualFee + adjustmentValue;
  const coverageEndDate = getCoverageEndDate(signupDate, adjustmentValue);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Calculate the correct fees for submission
      const submitMainJoiningFee = calculateJoiningFee(mainDob, membershipType === 'legacy');
      const submitJointJoiningFee = formData.app_type === 'joint' && formData.joint_dob
        ? calculateJoiningFee(formData.joint_dob, membershipType === 'legacy')
        : 0;
      const submitMainProRataFee = calculateProRataFee(signupDate);
      const submitJointProRataFee = formData.app_type === 'joint' && formData.joint_dob
        ? calculateProRataFee(signupDate)
        : 0;
      const submitAdjustmentValue = adjustmentAmount ? parseFloat(adjustmentAmount) : 0;
      const submitTotalDue = submitMainJoiningFee + submitJointJoiningFee + submitMainProRataFee + submitJointProRataFee + submitAdjustmentValue;

      // Status based on payment toggle
      const memberStatus = paymentReceived ? 'active' : 'pending';
      const paymentStatus = paymentReceived ? 'completed' : 'pending';

      const memberInsert: any = {
        app_type: formData.app_type, title: formData.title, first_name: formData.first_name, last_name: formData.last_name,
        dob: formData.dob, address_line_1: formData.address_line_1, town: formData.town, city: formData.city,
        postcode: formData.postcode, mobile: formData.mobile, home_phone: formData.home_phone, work_phone: formData.work_phone,
        email: formData.email, status: memberStatus,
        // Paper form tracking and GDPR consents
        consent_obtained_via: 'paper_form',
        paper_form_version: paperFormVersion,
        paper_form_date: applicationDate,
        paper_form_filed: true,
        // All consents obtained via paper form = true
        consent_personal_data: true,
        consent_personal_data_date: applicationDate,
        consent_medical_data: true,
        consent_medical_data_date: applicationDate,
        consent_gp_data: true,
        consent_gp_data_date: applicationDate,
        consent_data_sharing: true,
        consent_data_sharing_date: applicationDate,
        consent_data_retention: true,
        consent_data_retention_date: applicationDate,
        consent_international_transfer: true,
        consent_international_transfer_date: applicationDate,
        privacy_policy_version: 'v1.0',
        // Signatures from paper form
        main_signature: mainSignature,
        main_signature_date: applicationDate,
        joint_signature: formData.app_type === 'joint' ? jointSignature : null,
        joint_signature_date: formData.app_type === 'joint' ? applicationDate : null,
        // Audit trail
        data_entered_by: dataEnteredBy,
        data_entry_date: new Date().toISOString(),
      };

      const { data: member, error: memberError } = await supabase.from('members').insert(memberInsert).select().single();

      if (memberError) throw memberError;
      const memberId = member.id;

      if (formData.app_type === 'joint') {
        await supabase.from('joint_members').insert({
          member_id: memberId, title: formData.joint_title, first_name: formData.joint_first_name,
          last_name: formData.joint_last_name, dob: formData.joint_dob, relation: formData.joint_relation,
          address_line_1: formData.joint_address_line_1,
          town: formData.joint_town, city: formData.joint_city, postcode: formData.joint_postcode,
          mobile: formData.joint_mobile, home_phone: formData.joint_home_phone, work_phone: formData.joint_work_phone, email: formData.joint_email,
        });
      }

      if (formData.children.length > 0) {
        await supabase.from('children').insert(formData.children.map((child) => ({ member_id: memberId, ...child })));
      }

      await supabase.from('next_of_kin').insert({
        member_id: memberId, title: formData.nok_title, first_name: formData.nok_first_name, last_name: formData.nok_last_name,
        relationship: formData.nok_relationship, address_line_1: formData.nok_address_line_1, town: formData.nok_town,
        city: formData.nok_city, postcode: formData.nok_postcode, mobile: formData.nok_mobile, phone: formData.nok_phone, email: formData.nok_email,
      });

      await supabase.from('gp_details').insert({
        member_id: memberId,
        gp_name_surgery: gpPracticeName,
        address_line_1: gpPracticeAddress,
        postcode: gpPostcode,
        phone: gpTelephone,
        email: gpEmail || null,
      });

      await supabase.from('medical_info').insert({ member_id: memberId, member_type: 'main', disclaimer: formData.main_disclaimer, conditions: formData.main_conditions });

      if (formData.app_type === 'joint') {
        await supabase.from('medical_info').insert({ member_id: memberId, member_type: 'joint', disclaimer: formData.joint_disclaimer, conditions: formData.joint_conditions });
      }

      await supabase.from('declarations').insert({
        member_id: memberId,
        main_medical_consent: mainMedicalConsent,
        main_medical_signature: mainMedicalSignature,
        main_medical_consent_date: new Date().toISOString(),
        main_final_declaration: mainFinalDeclaration,
        main_final_signature: mainFinalSignature,
        main_final_declaration_date: new Date().toISOString(),
        ...(formData.app_type === 'joint' && {
          joint_medical_consent: jointMedicalConsent,
          joint_medical_signature: jointMedicalSignature,
          joint_medical_consent_date: new Date().toISOString(),
          joint_final_declaration: jointFinalDeclaration,
          joint_final_signature: jointFinalSignature,
          joint_final_declaration_date: new Date().toISOString(),
        }),
      });

            // Paper Form validation (Step 9)
      if (currentStep === 9) {
        const errors: string[] = [];
  
        if (!applicationDate) errors.push('Application date is required');
        if (!mainSignature.trim()) errors.push('Main member signature is required');
        if (!dataEnteredBy.trim()) errors.push('Data entered by field is required');
        if (!paperFormConfirmed) errors.push('Please confirm the paper form has been completed and filed');
  
        if (formData.app_type === 'joint' && !jointSignature.trim()) {
          errors.push('Joint member signature is required');
        }
  
        if (errors.length > 0) {
          alert(errors.join('\n'));
          return;
        }
      }

      await supabase.from('payments').insert({
        member_id: memberId, 
        payment_type: 'registration', 
        payment_method: formData.payment_method,
        main_joining_fee: submitMainJoiningFee, 
        main_membership_fee: submitMainProRataFee, 
        main_misc: submitAdjustmentValue,
        joint_joining_fee: submitJointJoiningFee, 
        joint_membership_fee: submitJointProRataFee, 
        joint_misc: 0,
        late_fee: 0, 
        total_amount: submitTotalDue, 
        payment_status: paymentStatus,
        join_date: signupDate,
        notes: adjustmentReason ? `Adjustment: ${adjustmentReason}` : null,
      });

      // Log the application submission with details
      await logActivity(
        memberId,
        ActivityTypes.APPLICATION_SUBMITTED,
        {
          application_type: formData.app_type,
          member_name: `${formData.first_name} ${formData.last_name}`,
          joint_member_name: formData.app_type === 'joint' ? `${formData.joint_first_name} ${formData.joint_last_name}` : null,
          total_amount: submitTotalDue,
          payment_status: paymentStatus,
          payment_received: paymentReceived,
          data_entered_by: dataEnteredBy,
          paper_form_version: paperFormVersion,
          application_date: applicationDate,
        }
      );

      return memberId;
    },
    onSuccess: async (memberId) => {
      if (applicationReference) {
        try {
          const { error: deleteError } = await supabase
            .from('applications_in_progress')
            .delete()
            .eq('application_reference', applicationReference);

          if (deleteError) {
            console.error('Failed to delete saved application:', deleteError);
          } else {
            queryClient.invalidateQueries({ queryKey: ['applications-in-progress'] });
          }
        } catch (error) {
          console.error('Error deleting saved application:', error);
        }
      }

      const memberName = formData.app_type === 'joint'
        ? `${formData.first_name} ${formData.last_name} & ${formData.joint_first_name} ${formData.joint_last_name}`
        : `${formData.first_name} ${formData.last_name}`;

      navigate('/registration-success', {
        state: {
          memberId,
          memberName,
          applicationReference,
          paymentReceived,
        },
      });
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async () => {

      if (applicationReference) {
        const { error } = await supabase
          .from('applications_in_progress')
          .update({
            form_data: formData,
            current_step: currentStep,
            app_type: formData.app_type,
            main_first_name: formData.first_name,
            main_last_name: formData.last_name,
            main_email: formData.email,
            main_mobile: formData.mobile,
            joint_first_name: formData.joint_first_name,
            joint_last_name: formData.joint_last_name,
            last_saved_at: new Date().toISOString(),
          })
          .eq('application_reference', applicationReference);

        if (error) throw error;
        return applicationReference;
      } else {
        const { data, error } = await supabase
          .from('applications_in_progress')
          .insert({
            form_data: formData,
            current_step: currentStep,
            app_type: formData.app_type,
            main_first_name: formData.first_name,
            main_last_name: formData.last_name,
            main_email: formData.email,
            main_mobile: formData.mobile,
            joint_first_name: formData.joint_first_name,
            joint_last_name: formData.joint_last_name,
            status: 'in_progress',
            last_saved_at: new Date().toISOString(),
          })
          .select('application_reference')
          .single();

        if (error) throw error;
        return data.application_reference;
      }
    },
    onSuccess: (reference) => {
      setApplicationReference(reference);
      setSaveMessage(`✓ Progress saved! Reference: ${reference}`);
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Save error:', error);
      setSaveMessage('✗ Failed to save progress');
      setTimeout(() => setSaveMessage(''), 3000);
    },
  });

  const handleSaveProgress = () => {
    saveProgressMutation.mutate();
  };

  const steps = ['Membership Type', 'Main Member', 'Joint Member', 'Children', 'Next of Kin', 'Medical Info', 'Documents', 'Declarations', 'GDPR Compliance', 'Payment'];

  const validateMainMemberStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title) errors.title = 'Title is required';
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';
    if (!formData.dob) errors.dob = 'Date of birth is required';
    if (!formData.address_line_1) errors.address_line_1 = 'Address is required';
    if (!formData.town) errors.town = 'Town is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.postcode) errors.postcode = 'Postcode is required';
    if (!formData.mobile) errors.mobile = 'Mobile phone is required';
    if (!formData.email) errors.email = 'Email is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateJointMemberStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.joint_title) errors.joint_title = 'Title is required';
    if (!formData.joint_relation) errors.joint_relation = 'Relationship is required';
    if (!formData.joint_first_name) errors.joint_first_name = 'First name is required';
    if (!formData.joint_last_name) errors.joint_last_name = 'Last name is required';
    if (!formData.joint_dob) errors.joint_dob = 'Date of birth is required';
    if (!formData.joint_address_line_1) errors.joint_address_line_1 = 'Address is required';
    if (!formData.joint_town) errors.joint_town = 'Town is required';
    if (!formData.joint_city) errors.joint_city = 'City is required';
    if (!formData.joint_postcode) errors.joint_postcode = 'Postcode is required';
    if (!formData.joint_mobile) errors.joint_mobile = 'Mobile phone is required';
    if (!formData.joint_email) errors.joint_email = 'Email is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateChildAge = (dob: string): boolean => {
    if (!dob) return true;
    const age = calculateAge(dob);
    const today = new Date();
    const dobDate = new Date(dob);
    
    // Check if date is in the future
    if (dobDate > today) return false;
    
    // Check if child is 18 or older
    return age < 18;
  };

  const validateChildrenStep = (): boolean => {
    if (formData.children.length === 0) return true;

    const childErrors: Record<number, Record<string, string>> = {};
    let hasErrors = false;

    formData.children.forEach((child, index) => {
      const errors: Record<string, string> = {};

      if (!child.first_name) errors.first_name = 'First name is required';
      if (!child.last_name) errors.last_name = 'Last name is required';
      if (!child.dob) {
        errors.dob = 'Date of birth is required';
      } else if (!validateChildAge(child.dob)) {
        errors.dob = 'Child must be under 18 years old and DOB cannot be in the future';
      }
      if (!child.relation) errors.relation = 'Relation is required';

      if (Object.keys(errors).length > 0) {
        childErrors[index] = errors;
        hasErrors = true;
      }
    });

    setChildValidationErrors(childErrors);
    return !hasErrors;
  };

  const validateNextOfKinStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nok_first_name) errors.nok_first_name = 'First name is required';
    if (!formData.nok_last_name) errors.nok_last_name = 'Last name is required';
    if (!formData.nok_relationship) errors.nok_relationship = 'Relationship is required';
    if (!formData.nok_mobile) errors.nok_mobile = 'Mobile phone is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDeclarationsStep = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate GP Details
    if (!gpPracticeName) errors.gpPracticeName = 'GP practice name is required';
    if (!gpPracticeAddress) errors.gpPracticeAddress = 'GP practice address is required';
    if (!gpPostcode) errors.gpPostcode = 'GP postcode is required';
    if (!gpTelephone) errors.gpTelephone = 'GP telephone is required';

    // Validate Main Member Medical Consent
    if (!mainMedicalConsent) errors.mainMedicalConsent = 'Medical consent is required';
    if (!mainMedicalSignature) errors.mainMedicalSignature = 'Medical consent signature is required';

    // Validate Main Member Final Declaration
    if (!mainFinalDeclaration) errors.mainFinalDeclaration = 'Final declaration is required';
    if (!mainFinalSignature) errors.mainFinalSignature = 'Final declaration signature is required';

    // Validate Joint Member Declarations (if applicable)
    if (formData.app_type === 'joint') {
      if (!jointMedicalConsent) errors.jointMedicalConsent = 'Joint member medical consent is required';
      if (!jointMedicalSignature) errors.jointMedicalSignature = 'Joint member medical consent signature is required';
      if (!jointFinalDeclaration) errors.jointFinalDeclaration = 'Joint member final declaration is required';
      if (!jointFinalSignature) errors.jointFinalSignature = 'Joint member final declaration signature is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePaperFormStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!paperFormVersion) errors.paperFormVersion = 'Paper form version is required';
    if (!applicationDate) errors.applicationDate = 'Application date is required';
    if (!mainSignature) errors.mainSignature = 'Main member signature is required';
    if (!dataEnteredBy) errors.dataEnteredBy = 'Data entered by is required';
    if (!paperFormConfirmed) errors.paperFormConfirmed = 'Paper form confirmation is required';

    if (formData.app_type === 'joint' && !jointSignature) {
      errors.jointSignature = 'Joint member signature is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePaymentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.payment_method) errors.payment_method = 'Payment method is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedFromStep = (): boolean => {
    if (currentStep === 1) {
      return validateMainMemberStep();
    }
    if (currentStep === 2) {
      return validateJointMemberStep();
    }
    if (currentStep === 3) {
      return validateChildrenStep();
    }
    if (currentStep === 4) {
      return validateNextOfKinStep();
    }
    if (currentStep === 7) {
      return validateDeclarationsStep();
    }
    if (currentStep === 8) {
      return validatePaperFormStep();
    }
    if (currentStep === 9) {
      return validatePaymentStep();
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceedFromStep()) {
      return;
    }

    setValidationErrors({});
    setChildValidationErrors({});

    if (currentStep === 1 && formData.app_type === 'single') {
      const nextStep = 3;
      setCurrentStep(nextStep);
      setHighestStepReached((prev: number) => Math.max(prev, nextStep));
    } else {
      const nextStep = Math.min(currentStep + 1, steps.length - 1);
      setCurrentStep(nextStep);
      setHighestStepReached((prev: number) => Math.max(prev, nextStep));
    }
  };

  const handleBack = () => {
    setValidationErrors({});
    setChildValidationErrors({});
    
    if (currentStep === 3 && formData.app_type === 'single') {
      setCurrentStep(1);
    } else {
      setCurrentStep((prev: number) => Math.max(prev - 1, 0));
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'dob') {
      setMainDob(value);
    }
  };

  const addChild = () => {
    setFormData((prev) => ({ ...prev, children: [...prev.children, { first_name: '', last_name: '', dob: '', relation: '' }] }));
  };

  const removeChild = (index: number) => {
    setFormData((prev) => ({ ...prev, children: prev.children.filter((_, i) => i !== index) }));
    // Clear validation errors for this child
    setChildValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      // Reindex remaining errors
      const reindexed: Record<number, Record<string, string>> = {};
      Object.keys(newErrors).forEach((key) => {
        const idx = parseInt(key);
        if (idx > index) {
          reindexed[idx - 1] = newErrors[idx];
        } else {
          reindexed[idx] = newErrors[idx];
        }
      });
      return reindexed;
    });
  };

  const updateChild = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.map((child, i) => (i === index ? { ...child, [field]: value } : child)),
    }));
  };

  const visibleSteps = formData.app_type === 'single'
    ? steps.filter((_, index) => index !== 2)
    : steps;

  const stepIndexMap = formData.app_type === 'single'
    ? [0, 1, 3, 4, 5, 6, 7, 8, 9]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const currentVisibleStepIndex = stepIndexMap.indexOf(currentStep);

  // Map sidebar step IDs (1-9) to internal step indices
  const sidebarStepToIndex: Record<number, number> = {
    1: 0,  // Membership Type
    2: 1,  // Main Member
    3: 3,  // Children (skip joint member step 2)
    4: 4,  // Next of Kin
    5: 5,  // Medical Info
    6: 6,  // Documents
    7: 7,  // Declarations
    8: 8,  // GDPR Compliance (Paper Form)
    9: 9,  // Payment
  };

  // Get reachable steps for sidebar (convert internal indices to sidebar IDs)
  // A step is reachable if it has been reached before (i.e., <= highestStepReached)
  const getReachableSteps = (): number[] => {
    const reachable: number[] = [];
    Object.entries(sidebarStepToIndex).forEach(([sidebarId, internalIndex]) => {
      if (internalIndex <= highestStepReached && internalIndex !== currentStep) {
        reachable.push(parseInt(sidebarId));
      }
    });
    return reachable;
  };

  // Get current sidebar step ID from internal step index
  const getCurrentSidebarStep = (): number => {
    const entry = Object.entries(sidebarStepToIndex).find(([_, idx]) => idx === currentStep);
    return entry ? parseInt(entry[0]) : 1;
  };

  // Handle sidebar step change
  const handleSidebarStepChange = (sidebarStepId: number) => {
    const internalIndex = sidebarStepToIndex[sidebarStepId];
    if (internalIndex !== undefined && internalIndex <= highestStepReached) {
      setValidationErrors({});
      setChildValidationErrors({});
      setCurrentStep(internalIndex);
    }
  };

  return (
    <div className="flex min-h-screen -m-6">
      {/* Sidebar */}
      <div className="fixed top-0 left-16 h-screen z-30">
        <RegistrationSidebar
          currentStep={getCurrentSidebarStep()}
          completedSteps={getReachableSteps()}
          onStepChange={handleSidebarStepChange}
          onSaveProgress={handleSaveProgress}
          onBack={() => navigate('/members')}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[352px] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Member Registration</h1>
            <p className="mt-1 text-sm text-gray-600">Complete all steps to register a new funeral service member</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        {currentStep === 0 && <StepMembershipType formData={formData} updateFormData={updateFormData} />}
        {currentStep === 1 && <StepMainMember formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 2 && <StepJointMember formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 3 && <StepChildren formData={formData} addChild={addChild} removeChild={removeChild} updateChild={updateChild} childValidationErrors={childValidationErrors} />}
        {currentStep === 4 && <StepNextOfKin formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 5 && <StepMedicalInfo formData={formData} updateFormData={updateFormData} mainHasMedicalCondition={mainHasMedicalCondition} setMainHasMedicalCondition={setMainHasMedicalCondition} jointHasMedicalCondition={jointHasMedicalCondition} setJointHasMedicalCondition={setJointHasMedicalCondition} />}
        {currentStep === 6 && <StepDocuments
          formData={formData}
          mainPhotoId={mainPhotoId} setMainPhotoId={setMainPhotoId}
          mainPhotoIdUrl={mainPhotoIdUrl} setMainPhotoIdUrl={setMainPhotoIdUrl}
          mainProofAddress={mainProofAddress} setMainProofAddress={setMainProofAddress}
          mainProofAddressUrl={mainProofAddressUrl} setMainProofAddressUrl={setMainProofAddressUrl}
          jointPhotoId={jointPhotoId} setJointPhotoId={setJointPhotoId}
          jointPhotoIdUrl={jointPhotoIdUrl} setJointPhotoIdUrl={setJointPhotoIdUrl}
          jointProofAddress={jointProofAddress} setJointProofAddress={setJointProofAddress}
          jointProofAddressUrl={jointProofAddressUrl} setJointProofAddressUrl={setJointProofAddressUrl}
          childrenDocuments={childrenDocuments} setChildrenDocuments={setChildrenDocuments}
          childrenDocumentUrls={childrenDocumentUrls} setChildrenDocumentUrls={setChildrenDocumentUrls}
          uploadingDoc={uploadingDoc}
          uploadDocument={uploadDocument}
          deleteDocument={deleteDocument}
          calculateAge={calculateAge}
        />}
        {currentStep === 7 && <StepDeclarations
          formData={formData}
          gpPracticeName={gpPracticeName} setGpPracticeName={setGpPracticeName}
          gpPracticeAddress={gpPracticeAddress} setGpPracticeAddress={setGpPracticeAddress}
          gpPostcode={gpPostcode} setGpPostcode={setGpPostcode}
          gpTelephone={gpTelephone} setGpTelephone={setGpTelephone}
          gpEmail={gpEmail} setGpEmail={setGpEmail}
          mainMedicalConsent={mainMedicalConsent} setMainMedicalConsent={setMainMedicalConsent}
          mainMedicalSignature={mainMedicalSignature} setMainMedicalSignature={setMainMedicalSignature}
          jointMedicalConsent={jointMedicalConsent} setJointMedicalConsent={setJointMedicalConsent}
          jointMedicalSignature={jointMedicalSignature} setJointMedicalSignature={setJointMedicalSignature}
          mainFinalDeclaration={mainFinalDeclaration} setMainFinalDeclaration={setMainFinalDeclaration}
          mainFinalSignature={mainFinalSignature} setMainFinalSignature={setMainFinalSignature}
          jointFinalDeclaration={jointFinalDeclaration} setJointFinalDeclaration={setJointFinalDeclaration}
          jointFinalSignature={jointFinalSignature} setJointFinalSignature={setJointFinalSignature}
          validationErrors={validationErrors}
        />}
        {currentStep === 8 && <StepPaperForm
          formData={formData}
          paperFormVersion={paperFormVersion} setPaperFormVersion={setPaperFormVersion}
          applicationDate={applicationDate} setApplicationDate={setApplicationDate}
          mainSignature={mainSignature} setMainSignature={setMainSignature}
          jointSignature={jointSignature} setJointSignature={setJointSignature}
          paperFormConfirmed={paperFormConfirmed} setPaperFormConfirmed={setPaperFormConfirmed}
          dataEnteredBy={dataEnteredBy} setDataEnteredBy={setDataEnteredBy}
          validationErrors={validationErrors}
        />}
        {currentStep === 9 && <StepPayment formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} membershipType={membershipType} setMembershipType={setMembershipType} signupDate={signupDate} setSignupDate={setSignupDate} adjustmentAmount={adjustmentAmount} setAdjustmentAmount={setAdjustmentAmount} adjustmentReason={adjustmentReason} setAdjustmentReason={setAdjustmentReason} paymentReceived={paymentReceived} setPaymentReceived={setPaymentReceived} mainDob={mainDob} calculateAge={calculateAge} joiningFee={joiningFee} mainJoiningFee={mainJoiningFee} jointJoiningFee={jointJoiningFee} proRataAnnualFee={proRataAnnualFee} mainProRataFee={mainProRataFee} jointProRataFee={jointProRataFee} adjustmentValue={adjustmentValue} totalDue={totalDue} coverageEndDate={coverageEndDate} />}
      </div>

          <div className="flex justify-between items-center bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} disabled={currentStep === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </button>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-600">Step {currentVisibleStepIndex + 1} of {visibleSteps.length}</span>
              {saveMessage && (
                <span className={`text-xs mt-1 ${saveMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </span>
              )}
              {applicationReference && (
                <span className="text-xs text-gray-500 mt-1">Ref: {applicationReference}</span>
              )}
            </div>

            {currentStep < steps.length - 1 ? (
              <button onClick={handleNext}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Submit Registration</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components Below

function StepMembershipType({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Type</h2>
        <p className="text-sm text-gray-600">Choose between single or joint membership</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button type="button" onClick={() => updateFormData('app_type', 'single')}
          className={`relative p-6 rounded-xl border-2 transition-all ${formData.app_type === 'single' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
          <div className="flex flex-col items-center text-center">
            <User className="h-12 w-12 mb-3 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Single Membership</h3>
            <p className="text-sm text-gray-600 mt-2">For individual membership</p>
          </div>
          {formData.app_type === 'single' && (
            <div className="absolute top-3 right-3">
              <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </button>
        <button type="button" onClick={() => updateFormData('app_type', 'joint')}
          className={`relative p-6 rounded-xl border-2 transition-all ${formData.app_type === 'joint' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
          <div className="flex flex-col items-center text-center">
            <Users className="h-12 w-12 mb-3 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Joint Membership</h3>
            <p className="text-sm text-gray-600 mt-2">For couples/spouses</p>
          </div>
          {formData.app_type === 'joint' && (
            <div className="absolute top-3 right-3">
              <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function StepMainMember({ formData, updateFormData, validationErrors }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Main Member Details</h2>
        <p className="text-sm text-gray-600">Enter the primary member's personal information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
          <select value={formData.title} onChange={(e) => updateFormData('title', e.target.value)} required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">Select title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Miss">Miss</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
          {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.first_name} onChange={(e) => updateFormData('first_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
          {validationErrors.first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.last_name} onChange={(e) => updateFormData('last_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
          {validationErrors.last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>}
        </div>
        <div>
          <DateInput
            label={`Date of Birth${formData.dob ? ` (${calculateAge(formData.dob)} years old)` : ''}`}
            required
            value={formData.dob}
            onChange={(value) => updateFormData('dob', value)}
          />
          {validationErrors.dob && <p className="text-red-500 text-xs mt-1">{validationErrors.dob}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.address_line_1} onChange={(e) => updateFormData('address_line_1', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter street address" />
          {validationErrors.address_line_1 && <p className="text-red-500 text-xs mt-1">{validationErrors.address_line_1}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.town} onChange={(e) => updateFormData('town', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.town ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter town" />
          {validationErrors.town && <p className="text-red-500 text-xs mt-1">{validationErrors.town}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.city} onChange={(e) => updateFormData('city', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.city ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter city" />
          {validationErrors.city && <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.postcode} onChange={(e) => updateFormData('postcode', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.postcode ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter postcode" />
          {validationErrors.postcode && <p className="text-red-500 text-xs mt-1">{validationErrors.postcode}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
          <input type="tel" required pattern="[0-9]{11}" value={formData.mobile} onChange={(e) => updateFormData('mobile', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.mobile ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Mobile number (11 digits)"
            title="Mobile number must be exactly 11 digits" />
          {validationErrors.mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.mobile}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
          <input type="tel" value={formData.home_phone} onChange={(e) => updateFormData('home_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter home phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Phone</label>
          <input type="tel" value={formData.work_phone} onChange={(e) => updateFormData('work_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter work phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.email} onChange={(e) => updateFormData('email', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter email address" />
          {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
        </div>
      </div>
    </div>
  );
}

function StepJointMember({ formData, updateFormData, validationErrors }: any) {
  const copyMainAddress = () => {
    updateFormData('joint_address_line_1', formData.address_line_1);
    updateFormData('joint_town', formData.town);
    updateFormData('joint_city', formData.city);
    updateFormData('joint_postcode', formData.postcode);
  };

  const mainMemberName = formData.first_name && formData.last_name
    ? `${formData.first_name} ${formData.last_name}`
    : 'the main member';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joint Member Details</h2>
        <p className="text-sm text-gray-600">Enter the spouse/partner's information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
          <select value={formData.joint_title} onChange={(e) => updateFormData('joint_title', e.target.value)} required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_title ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">Select title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Miss">Miss</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
          {validationErrors.joint_title && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Main Member <span className="text-red-500">*</span></label>
          <select value={formData.joint_relation} onChange={(e) => updateFormData('joint_relation', e.target.value)} required
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_relation ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="Spouse">Spouse</option>
            <option value="Partner">Partner</option>
            <option value="Sibling">Sibling</option>
            <option value="Parent">Parent</option>
            <option value="Child">Child</option>
            <option value="Other">Other</option>
          </select>
          {validationErrors.joint_relation && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_relation}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_first_name} onChange={(e) => updateFormData('joint_first_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
          {validationErrors.joint_first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_last_name} onChange={(e) => updateFormData('joint_last_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
          {validationErrors.joint_last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_last_name}</p>}
        </div>
        <div>
          <DateInput
            label={`Date of Birth${formData.joint_dob ? ` (${calculateAge(formData.joint_dob)} years old)` : ''}`}
            required
            value={formData.joint_dob}
            onChange={(value) => updateFormData('joint_dob', value)}
          />
          {validationErrors.joint_dob && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_dob}</p>}
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            onClick={copyMainAddress}
            className="mb-4 inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            <Copy className="h-4 w-4 mr-2" />
            Does this member live at the same address as {mainMemberName}?
          </button>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_address_line_1} onChange={(e) => updateFormData('joint_address_line_1', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_address_line_1 ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter street address" />
          {validationErrors.joint_address_line_1 && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_address_line_1}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_town} onChange={(e) => updateFormData('joint_town', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_town ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter town" />
          {validationErrors.joint_town && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_town}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_city} onChange={(e) => updateFormData('joint_city', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_city ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter city" />
          {validationErrors.joint_city && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_postcode} onChange={(e) => updateFormData('joint_postcode', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_postcode ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter postcode" />
          {validationErrors.joint_postcode && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_postcode}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
          <input type="tel" required pattern="[0-9]{11}" value={formData.joint_mobile} onChange={(e) => updateFormData('joint_mobile', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_mobile ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Mobile number (11 digits)"
            title="Mobile number must be exactly 11 digits" />
          {validationErrors.joint_mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_mobile}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
          <input type="tel" value={formData.joint_home_phone} onChange={(e) => updateFormData('joint_home_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter home phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Phone</label>
          <input type="tel" value={formData.joint_work_phone} onChange={(e) => updateFormData('joint_work_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter work phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.joint_email} onChange={(e) => updateFormData('joint_email', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_email ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter email address" />
          {validationErrors.joint_email && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_email}</p>}
        </div>
      </div>
    </div>
  );
}

function StepChildren({ formData, addChild, removeChild, updateChild, childValidationErrors }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Children</h2>
          <p className="text-sm text-gray-600">Add children covered under this membership (optional)</p>
        </div>
        <button type="button" onClick={addChild}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="h-4 w-4 mr-2" /> Add Child
        </button>
      </div>

      {formData.children.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Baby className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No children added yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "Add Child" to include children in this membership</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.children.map((child: any, index: number) => {
            const errors = childValidationErrors[index] || {};
            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                <button type="button" onClick={() => removeChild(index)}
                  className="absolute top-3 right-3 p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="h-5 w-5" />
                </button>
                <h3 className="font-medium text-gray-900 mb-3">Child {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={child.first_name} onChange={(e) => updateChild(index, 'first_name', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={child.last_name} onChange={(e) => updateChild(index, 'last_name', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                  </div>
                  <div>
                    <DateInput
                      label="Date of Birth"
                      required
                      value={child.dob}
                      onChange={(value) => updateChild(index, 'dob', value)}
                      minDate={(() => {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() - 18);
                        date.setDate(date.getDate() + 1);
                        return date.toISOString().split('T')[0];
                      })()}
                      maxDate={new Date().toISOString().split('T')[0]}
                      errorMessage="Child must be under 18 years old and DOB cannot be in the future"
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relation <span className="text-red-500">*</span></label>
                    <select required value={child.relation} onChange={(e) => updateChild(index, 'relation', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.relation ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="">Select relation</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="stepson">Stepson</option>
                      <option value="stepdaughter">Stepdaughter</option>
                    </select>
                    {errors.relation && <p className="text-red-500 text-xs mt-1">{errors.relation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepNextOfKin({ formData, updateFormData, validationErrors }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Next of Kin</h2>
        <p className="text-sm text-gray-600">Emergency contact information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <select value={formData.nok_title} onChange={(e) => updateFormData('nok_title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">Select title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Miss">Miss</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_first_name} onChange={(e) => updateFormData('nok_first_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
          {validationErrors.nok_first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_last_name} onChange={(e) => updateFormData('nok_last_name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
          {validationErrors.nok_last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_last_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship <span className="text-red-500">*</span></label>
          <select required value={formData.nok_relationship} onChange={(e) => updateFormData('nok_relationship', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-mosque-green-600 focus:border-transparent ${validationErrors.nok_relationship ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">Select relationship...</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Other">Other</option>
          </select>
          {validationErrors.nok_relationship && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_relationship}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_address_line_1} onChange={(e) => updateFormData('nok_address_line_1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter street address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_town} onChange={(e) => updateFormData('nok_town', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter town" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_city} onChange={(e) => updateFormData('nok_city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter city" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_postcode} onChange={(e) => updateFormData('nok_postcode', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter postcode" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
          <input type="tel" required pattern="[0-9]{11}" value={formData.nok_mobile} onChange={(e) => updateFormData('nok_mobile', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_mobile ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Mobile number (11 digits)"
            title="Mobile number must be exactly 11 digits" />
          {validationErrors.nok_mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_mobile}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
          <input type="tel" value={formData.nok_phone} onChange={(e) => updateFormData('nok_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-emerald-500 focus:border-emerald-500" placeholder="Enter home phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.nok_email} onChange={(e) => updateFormData('nok_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter email address" />
        </div>
      </div>
    </div>
  );
}

function StepMedicalInfo({ formData, updateFormData, mainHasMedicalCondition, setMainHasMedicalCondition, jointHasMedicalCondition, setJointHasMedicalCondition }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Information</h2>
        <p className="text-sm text-gray-600">Please provide any relevant medical information</p>
      </div>

      <div className="space-y-6">
        {/* Main Member Medical Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {formData.first_name && formData.last_name
              ? `${formData.first_name} ${formData.last_name}`
              : 'Main Member'}
          </h3>

          {/* Medical Condition Question */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Do you have any medical condition or undergoing any medical treatment for any short/long term illness? *
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="main_has_medical_condition"
                  value="yes"
                  checked={mainHasMedicalCondition === true}
                  onChange={() => setMainHasMedicalCondition(true)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="main_has_medical_condition"
                  value="no"
                  checked={mainHasMedicalCondition === false}
                  onChange={() => {
                    setMainHasMedicalCondition(false);
                    updateFormData('main_conditions', '');
                  }}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Conditional Medical Conditions Text Box */}
          {mainHasMedicalCondition && (
            <div className="mt-4 animate-in slide-in-from-top duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide details of your medical condition(s) *
              </label>
              <textarea
                value={formData.main_conditions}
                onChange={(e) => updateFormData('main_conditions', e.target.value)}
                required={mainHasMedicalCondition}
                rows={4}
                placeholder="Please describe your medical condition(s), treatment, and any medications..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Include any medications, ongoing treatments, or conditions that may be relevant.
              </p>
            </div>
          )}
        </div>

        {/* Joint Member Medical Information */}
        {formData.app_type === 'joint' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {formData.joint_first_name && formData.joint_last_name
                ? `${formData.joint_first_name} ${formData.joint_last_name}`
                : 'Joint Member'}
            </h3>

            {/* Medical Condition Question */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Does the joint member have any medical condition or undergoing any medical treatment for any short/long term illness? *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="joint_has_medical_condition"
                    value="yes"
                    checked={jointHasMedicalCondition === true}
                    onChange={() => setJointHasMedicalCondition(true)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="joint_has_medical_condition"
                    value="no"
                    checked={jointHasMedicalCondition === false}
                    onChange={() => {
                      setJointHasMedicalCondition(false);
                      updateFormData('joint_conditions', '');
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Conditional Medical Conditions Text Box */}
            {jointHasMedicalCondition && (
              <div className="mt-4 animate-in slide-in-from-top duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide details of joint member's medical condition(s) *
                </label>
                <textarea
                  value={formData.joint_conditions}
                  onChange={(e) => updateFormData('joint_conditions', e.target.value)}
                  required={jointHasMedicalCondition}
                  rows={4}
                  placeholder="Please describe medical condition(s), treatment, and any medications..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Include any medications, ongoing treatments, or conditions that may be relevant.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepDocuments({
  formData,
  mainPhotoId, setMainPhotoId,
  mainPhotoIdUrl, setMainPhotoIdUrl,
  mainProofAddress, setMainProofAddress,
  mainProofAddressUrl, setMainProofAddressUrl,
  jointPhotoId, setJointPhotoId,
  jointPhotoIdUrl, setJointPhotoIdUrl,
  jointProofAddress, setJointProofAddress,
  jointProofAddressUrl, setJointProofAddressUrl,
  childrenDocuments, setChildrenDocuments,
  childrenDocumentUrls, setChildrenDocumentUrls,
  uploadingDoc,
  uploadDocument,
  deleteDocument,
  calculateAge
}: any) {
  const hasJointMember = formData.app_type === 'joint';
  const children = formData.children || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <InfoTooltip title="Upload Requirements">
            <ul className="space-y-1">
              <li>• Accepted formats: JPG, PNG, PDF</li>
              <li>• Maximum file size: 5MB per file</li>
              <li>• Documents must be clear and readable</li>
              <li>• Photo ID: Passport or Driving Licence</li>
              <li>• Proof of Address: Utility bill, Council tax, Bank statement (within last 3 months)</li>
              <li>• Children: Birth certificate or Passport required</li>
            </ul>
          </InfoTooltip>
        </div>
        <p className="text-sm text-gray-600">
          Please upload the required documents. Accepted formats: JPG, PNG, PDF (Max 5MB per file)
        </p>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-4 w-4 mr-2 text-emerald-600" />
          Main Member Documents
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo ID (Passport, Driving Licence) *
            </label>

            {mainPhotoIdUrl ? (
              <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        {mainPhotoId?.name || 'Uploaded'}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {mainPhotoId ? `${(mainPhotoId.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteDocument(mainPhotoIdUrl);
                      setMainPhotoIdUrl('');
                      setMainPhotoId(null);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File too large. Maximum 5MB.');
                        return;
                      }
                      setMainPhotoId(file);
                      const url = await uploadDocument(file, 'photo_id', 'main');
                      if (url) setMainPhotoIdUrl(url);
                    }
                  }}
                  className="hidden"
                  id="main-photo-id"
                  disabled={uploadingDoc === 'main-photo_id'}
                />
                <label
                  htmlFor="main-photo-id"
                  className="flex flex-col items-center cursor-pointer"
                >
                  {uploadingDoc === 'main-photo_id' ? (
                    <>
                      <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload</span>
                      <span className="text-xs text-gray-500">or drag and drop</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proof of Address (Utility Bill, Council Tax) *
            </label>

            {mainProofAddressUrl ? (
              <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        {mainProofAddress?.name || 'Uploaded'}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {mainProofAddress ? `${(mainProofAddress.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteDocument(mainProofAddressUrl);
                      setMainProofAddressUrl('');
                      setMainProofAddress(null);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File too large. Maximum 5MB.');
                        return;
                      }
                      setMainProofAddress(file);
                      const url = await uploadDocument(file, 'proof_address', 'main');
                      if (url) setMainProofAddressUrl(url);
                    }
                  }}
                  className="hidden"
                  id="main-proof-address"
                  disabled={uploadingDoc === 'main-proof_address'}
                />
                <label
                  htmlFor="main-proof-address"
                  className="flex flex-col items-center cursor-pointer"
                >
                  {uploadingDoc === 'main-proof_address' ? (
                    <>
                      <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload</span>
                      <span className="text-xs text-gray-500">or drag and drop</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasJointMember && (
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-4 w-4 mr-2 text-emerald-600" />
            Joint Member Documents
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo ID (Passport, Driving Licence) *
              </label>

              {jointPhotoIdUrl ? (
                <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          {jointPhotoId?.name || 'Uploaded'}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {jointPhotoId ? `${(jointPhotoId.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDocument(jointPhotoIdUrl);
                        setJointPhotoIdUrl('');
                        setJointPhotoId(null);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File too large. Maximum 5MB.');
                          return;
                        }
                        setJointPhotoId(file);
                        const url = await uploadDocument(file, 'photo_id', 'joint');
                        if (url) setJointPhotoIdUrl(url);
                      }
                    }}
                    className="hidden"
                    id="joint-photo-id"
                    disabled={uploadingDoc === 'joint-photo_id'}
                  />
                  <label
                    htmlFor="joint-photo-id"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {uploadingDoc === 'joint-photo_id' ? (
                      <>
                        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload</span>
                        <span className="text-xs text-gray-500">or drag and drop</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Address (Utility Bill, Council Tax) *
              </label>

              {jointProofAddressUrl ? (
                <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          {jointProofAddress?.name || 'Uploaded'}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {jointProofAddress ? `${(jointProofAddress.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDocument(jointProofAddressUrl);
                        setJointProofAddressUrl('');
                        setJointProofAddress(null);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File too large. Maximum 5MB.');
                          return;
                        }
                        setJointProofAddress(file);
                        const url = await uploadDocument(file, 'proof_address', 'joint');
                        if (url) setJointProofAddressUrl(url);
                      }
                    }}
                    className="hidden"
                    id="joint-proof-address"
                    disabled={uploadingDoc === 'joint-proof_address'}
                  />
                  <label
                    htmlFor="joint-proof-address"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {uploadingDoc === 'joint-proof_address' ? (
                      <>
                        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload</span>
                        <span className="text-xs text-gray-500">or drag and drop</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <Baby className="h-4 w-4 mr-2 text-emerald-600" />
            Children's Documents
          </h4>

          <div className="space-y-4">
            {children.map((child: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {child.first_name} {child.last_name} (Age {calculateAge(child.dob)})
                </p>

                {childrenDocumentUrls[`child-${index}`] ? (
                  <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-emerald-900">
                            {childrenDocuments[`child-${index}`]?.name || 'Uploaded'}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Birth Certificate / Passport
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDocument(childrenDocumentUrls[`child-${index}`]);
                          setChildrenDocumentUrls((prev: any) => {
                            const updated = { ...prev };
                            delete updated[`child-${index}`];
                            return updated;
                          });
                          setChildrenDocuments((prev: any) => {
                            const updated = { ...prev };
                            delete updated[`child-${index}`];
                            return updated;
                          });
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('File too large. Maximum 5MB.');
                            return;
                          }
                          setChildrenDocuments((prev: any) => ({ ...prev, [`child-${index}`]: file }));
                          const url = await uploadDocument(file, 'birth_cert', `child_${index}`);
                          if (url) {
                            setChildrenDocumentUrls((prev: any) => ({ ...prev, [`child-${index}`]: url }));
                          }
                        }
                      }}
                      className="hidden"
                      id={`child-doc-${index}`}
                      disabled={uploadingDoc === `child_${index}-birth_cert`}
                    />
                    <label
                      htmlFor={`child-doc-${index}`}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      {uploadingDoc === `child_${index}-birth_cert` ? (
                        <>
                          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload Birth Certificate</span>
                          <span className="text-xs text-gray-500">or Passport</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepDeclarations({
  formData,
  gpPracticeName, setGpPracticeName,
  gpPracticeAddress, setGpPracticeAddress,
  gpPostcode, setGpPostcode,
  gpTelephone, setGpTelephone,
  gpEmail, setGpEmail,
  mainMedicalConsent, setMainMedicalConsent,
  mainMedicalSignature, setMainMedicalSignature,
  jointMedicalConsent, setJointMedicalConsent,
  jointMedicalSignature, setJointMedicalSignature,
  mainFinalDeclaration, setMainFinalDeclaration,
  mainFinalSignature, setMainFinalSignature,
  jointFinalDeclaration, setJointFinalDeclaration,
  jointFinalSignature, setJointFinalSignature,
  validationErrors
}: any) {
  const hasJointMember = formData.app_type === 'joint';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Declarations & Signatures</h2>
        <p className="text-sm text-gray-600">Please complete all required declarations</p>
      </div>

      {/* ============================================ */}
      {/* SECTION 6: MEDICAL CONSENT */}
      {/* ============================================ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Section 6: Medical Consent
          </h3>
          <InfoTooltip title="Medical Consent Statement">
            <p className="leading-relaxed">
              I do not have any medical condition or illness other than those disclosed in the medical
              history section of this form that may invalidate my application (see section 14). In the
              event of my death, I authorise CRMFS to request information from my medical records
              relevant to my application for funeral cover. I give consent for this information to be
              sourced from my GP or other medical specialists that I may have received treatment from.
            </p>
          </InfoTooltip>
        </div>

        {/* GP Details */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">GP Practice Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP Practice Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gpPracticeName}
                onChange={(e) => setGpPracticeName(e.target.value)}
                required
                placeholder="Enter GP practice name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${validationErrors.gpPracticeName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.gpPracticeName && <p className="text-red-500 text-xs mt-1">{validationErrors.gpPracticeName}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GP Practice Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gpPracticeAddress}
                onChange={(e) => setGpPracticeAddress(e.target.value)}
                required
                placeholder="Enter GP practice address"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${validationErrors.gpPracticeAddress ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.gpPracticeAddress && <p className="text-red-500 text-xs mt-1">{validationErrors.gpPracticeAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={gpPostcode}
                onChange={(e) => setGpPostcode(e.target.value)}
                required
                placeholder="e.g., FK1 1UG"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${validationErrors.gpPostcode ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.gpPostcode && <p className="text-red-500 text-xs mt-1">{validationErrors.gpPostcode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telephone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={gpTelephone}
                onChange={(e) => setGpTelephone(e.target.value)}
                required
                placeholder="GP practice phone"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${validationErrors.gpTelephone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.gpTelephone && <p className="text-red-500 text-xs mt-1">{validationErrors.gpTelephone}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={gpEmail}
                onChange={(e) => setGpEmail(e.target.value)}
                placeholder="GP practice email (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Main Member Consent & Signature */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Applicant 1 Consent</h4>

          <div className="space-y-4">
            {/* Checkbox */}
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={mainMedicalConsent}
                onChange={(e) => setMainMedicalConsent(e.target.checked)}
                required
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                I confirm that I have read and agree to the medical consent statement above <span className="text-red-500">*</span>
              </span>
            </label>
            {validationErrors.mainMedicalConsent && <p className="text-red-500 text-xs mt-1">{validationErrors.mainMedicalConsent}</p>}

            {/* Signature Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicant 1 Signature (Full Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mainMedicalSignature}
                onChange={(e) => setMainMedicalSignature(e.target.value)}
                required
                placeholder="Type your full name as signature"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-serif italic text-lg ${validationErrors.mainMedicalSignature ? 'border-red-500' : 'border-gray-300'}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                By typing your name, you are providing your electronic signature
              </p>
              {validationErrors.mainMedicalSignature && <p className="text-red-500 text-xs mt-1">{validationErrors.mainMedicalSignature}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Joint Member Consent & Signature (if applicable) */}
        {hasJointMember && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Applicant 2 Consent</h4>

            <div className="space-y-4">
              {/* Checkbox */}
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={jointMedicalConsent}
                  onChange={(e) => setJointMedicalConsent(e.target.checked)}
                  required={hasJointMember}
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I confirm that I have read and agree to the medical consent statement above <span className="text-red-500">*</span>
                </span>
              </label>
              {validationErrors.jointMedicalConsent && <p className="text-red-500 text-xs mt-1">{validationErrors.jointMedicalConsent}</p>}

              {/* Signature Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicant 2 Signature (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jointMedicalSignature}
                  onChange={(e) => setJointMedicalSignature(e.target.value)}
                  required={hasJointMember}
                  placeholder="Type full name as signature"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-serif italic text-lg ${validationErrors.jointMedicalSignature ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.jointMedicalSignature && <p className="text-red-500 text-xs mt-1">{validationErrors.jointMedicalSignature}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION 7: DECLARATION */}
      {/* ============================================ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Section 7: Declaration
        </h3>

        {/* Declaration Statement */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
          <p className="text-sm text-purple-900 leading-relaxed">
            I solemnly declare that I have read, understood, and agree to abide by the terms and
            conditions as set out here in this document by Central Region Muslim Funerals Services
            (CRMFS). Should CRMFS create emergency only funds to meet the unexpected cost, I
            agree to contribute my equal share. I hereby declare that the personal details provided
            in this form are true and correct. A copy of which I have received.
          </p>
        </div>

        {/* Main Member Declaration & Signature */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Applicant 1 Declaration</h4>

          <div className="space-y-4">
            {/* Checkbox */}
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={mainFinalDeclaration}
                onChange={(e) => setMainFinalDeclaration(e.target.checked)}
                required
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                I confirm that I have read and agree to the declaration above <span className="text-red-500">*</span>
              </span>
            </label>
            {validationErrors.mainFinalDeclaration && <p className="text-red-500 text-xs mt-1">{validationErrors.mainFinalDeclaration}</p>}

            {/* Signature Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicant 1 Signature (Full Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mainFinalSignature}
                onChange={(e) => setMainFinalSignature(e.target.value)}
                required
                placeholder="Type your full name as signature"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-serif italic text-lg ${validationErrors.mainFinalSignature ? 'border-red-500' : 'border-gray-300'}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                By typing your name, you are providing your electronic signature
              </p>
              {validationErrors.mainFinalSignature && <p className="text-red-500 text-xs mt-1">{validationErrors.mainFinalSignature}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Joint Member Declaration & Signature (if applicable) */}
        {hasJointMember && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Applicant 2 Declaration</h4>

            <div className="space-y-4">
              {/* Checkbox */}
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={jointFinalDeclaration}
                  onChange={(e) => setJointFinalDeclaration(e.target.checked)}
                  required={hasJointMember}
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I confirm that I have read and agree to the declaration above <span className="text-red-500">*</span>
                </span>
              </label>
              {validationErrors.jointFinalDeclaration && <p className="text-red-500 text-xs mt-1">{validationErrors.jointFinalDeclaration}</p>}

              {/* Signature Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicant 2 Signature (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jointFinalSignature}
                  onChange={(e) => setJointFinalSignature(e.target.value)}
                  required={hasJointMember}
                  placeholder="Type full name as signature"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-serif italic text-lg ${validationErrors.jointFinalSignature ? 'border-red-500' : 'border-gray-300'}`}
                />
                {validationErrors.jointFinalSignature && <p className="text-red-500 text-xs mt-1">{validationErrors.jointFinalSignature}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepPaperForm({
  formData,
  paperFormVersion, setPaperFormVersion,
  applicationDate, setApplicationDate,
  mainSignature, setMainSignature,
  jointSignature, setJointSignature,
  paperFormConfirmed, setPaperFormConfirmed,
  dataEnteredBy, setDataEnteredBy,
  validationErrors
}: any) {
  const hasJointMember = formData.app_type === 'joint';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paper Application Form Record</h2>
        <p className="text-sm text-gray-600">Record that the member has completed and signed the official paper form</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Paper Application Form Record
          </h3>
          <InfoTooltip title="GDPR Compliance via Paper Form">
            <p className="mb-2">
              The member has completed and signed the official paper application form which includes:
            </p>
            <ul className="space-y-1 mb-2">
              <li>• Section 6: Medical Consent (explicit consent for special category data)</li>
              <li>• Section 7: Declaration (T&Cs acceptance, emergency fund contribution)</li>
              <li>• All required GDPR consents (personal data, medical data, GP access, data sharing, retention)</li>
            </ul>
            <p className="text-[10px] text-gray-500 border-t border-gray-200 pt-2 mt-2">
              <strong>Record Keeping:</strong> The signed paper form must be filed and retained for 7 years
              after membership ends (GDPR Article 30 - Record of Processing Activities).
            </p>
          </InfoTooltip>
        </div>

        <div className="space-y-4">
          {/* Paper Form Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paper Application Form Version *
            </label>
            <select
              value={paperFormVersion}
              onChange={(e) => setPaperFormVersion(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
            >
              <option value="v01.25">v01.25 (January 2025)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The version of the paper form the member completed
            </p>
            {validationErrors.paperFormVersion && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.paperFormVersion}</p>
            )}
          </div>

          {/* Application Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Date (from paper form) *
            </label>
            <input
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Date when member signed the paper application form
            </p>
            {validationErrors.applicationDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.applicationDate}</p>
            )}
          </div>

          {/* Main Member Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Member Signature (Section 7 Declaration) *
            </label>
            <input
              type="text"
              value={mainSignature}
              onChange={(e) => setMainSignature(e.target.value)}
              required
              placeholder="Full name as signed on paper form"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-serif italic"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the member's signature exactly as written on the paper form
            </p>
            {validationErrors.mainSignature && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.mainSignature}</p>
            )}
          </div>

          {/* Joint Member Signature (if applicable) */}
          {hasJointMember && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joint Member Signature (Section 7 Declaration) *
              </label>
              <input
                type="text"
                value={jointSignature}
                onChange={(e) => setJointSignature(e.target.value)}
                required={hasJointMember}
                placeholder="Full name as signed on paper form"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 font-serif italic"
              />
              {validationErrors.jointSignature && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.jointSignature}</p>
              )}
            </div>
          )}

          {/* Data Entry Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Entered By (Committee Member) *
            </label>
            <input
              type="text"
              value={dataEnteredBy}
              onChange={(e) => setDataEnteredBy(e.target.value)}
              required
              placeholder="Your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your name for audit trail purposes
            </p>
            {validationErrors.dataEnteredBy && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.dataEnteredBy}</p>
            )}
          </div>

          {/* Confirmation */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <label className="flex items-start cursor-pointer group hover:bg-gray-50 p-3 rounded-lg -m-3">
              <input
                type="checkbox"
                checked={paperFormConfirmed}
                onChange={(e) => setPaperFormConfirmed(e.target.checked)}
                required
                className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900 block mb-2">
                  Paper Form Confirmation (Required) *
                </span>
                <span className="text-sm text-gray-700">
                  I confirm that:
                </span>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• The member has completed and signed the official paper application form (v01.25)</li>
                  <li>• All sections are complete including Section 6 (Medical Consent) and Section 7 (Declaration)</li>
                  <li>• All required GDPR consents have been obtained via the paper form</li>
                  <li>• The signed paper form is filed for record-keeping and audit purposes</li>
                  <li>• I have accurately transcribed the member's information into this system</li>
                </ul>
              </div>
            </label>
            {validationErrors.paperFormConfirmed && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.paperFormConfirmed}</p>
            )}
          </div>
        </div>

        {/* Data Protection Notice for Committee */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                Committee Member Data Protection Obligations
              </h4>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Handle member data confidentially - do not share outside committee</li>
                <li>• Medical data (Section 5, 6) is special category data - extra care required</li>
                <li>• Access only the data you need to perform your duties</li>
                <li>• Log out when finished - do not leave system unattended</li>
                <li>• Report any suspected data breaches immediately to committee chair</li>
                <li>• Retain paper forms securely for 7 years minimum</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPayment({ formData, updateFormData, validationErrors, membershipType, setMembershipType, signupDate, setSignupDate, adjustmentAmount, setAdjustmentAmount, adjustmentReason, setAdjustmentReason, paymentReceived, setPaymentReceived, mainDob, calculateAge, joiningFee, mainJoiningFee, jointJoiningFee, proRataAnnualFee, mainProRataFee, jointProRataFee, adjustmentValue, totalDue, coverageEndDate }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
        <p className="text-sm text-gray-600">Configure membership type and payment details</p>
      </div>

      {/* Payment Details Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Payment Details
        </h3>

        {/* Payment Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type *
          </label>
          <select
            value={membershipType}
            onChange={(e) => setMembershipType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          >
            <option value="new">New Membership</option>
            <option value="legacy">Legacy Membership (Child turned 18)</option>
          </select>
          {membershipType === 'legacy' && (
            <p className="text-xs text-yellow-600 mt-2 font-medium">
              ✓ Legacy members receive FREE joining fee (children who turned 18 within 90 days)
            </p>
          )}
        </div>

        {/* Signup Date */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signup Date *
          </label>
          <input
            type="date"
            value={signupDate}
            onChange={(e) => setSignupDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Annual fees are pro-rated from signup date to December 31st
          </p>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Fee Breakdown</h4>

          <div className="space-y-3 text-sm">
            {/* Main Member - Joining Fee */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 flex items-center gap-1">
                  Joining Fee (one-time):
                  <InfoTooltip title="Age-Based Joining Fee">
                    <ul className="space-y-1">
                      <li>• Ages 18-25: £75</li>
                      <li>• Ages 26-35: £100</li>
                      <li>• Ages 36-45: £200</li>
                      <li>• Ages 46-55: £300</li>
                      <li>• Ages 56-65+: £500</li>
                    </ul>
                    <p className="mt-2 pt-2 border-t border-gray-200">Children under 18 are free.</p>
                  </InfoTooltip>
                </span>
                <span className="font-medium">
                  {membershipType === 'legacy' ? (
                    <span className="text-yellow-600">£0.00 (Waived - Legacy)</span>
                  ) : mainDob ? (
                    <span>£{joiningFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">Enter DOB to calculate</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-2">
                • {formData.first_name} {formData.last_name} {mainDob && `(Age ${calculateAge(mainDob)})`} - £{mainJoiningFee.toFixed(2)}
              </p>
              {formData.app_type === 'joint' && formData.joint_first_name && (
                <p className="text-xs text-gray-500 ml-2">
                  • {formData.joint_first_name} {formData.joint_last_name} {formData.joint_dob && `(Age ${calculateAge(formData.joint_dob)})`} - £{jointJoiningFee.toFixed(2)}
                </p>
              )}
              {formData.children && formData.children.map((child: any, index: number) => (
                <p key={index} className="text-xs text-gray-500 ml-2">
                  • {child.first_name} {child.last_name} {child.dob && `(Age ${calculateAge(child.dob)})`} - £0.00
                </p>
              ))}
            </div>

            {/* Pro-rata Annual Fee */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex-1">
                  <span className="text-gray-600">Annual Membership:</span>
                  <p className="text-xs text-gray-500">
                    Pro-rated: {new Date(signupDate).toLocaleDateString('en-GB')} - 31/12/{new Date(signupDate).getFullYear()}
                  </p>
                </div>
                <span className="font-medium">£{proRataAnnualFee.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 ml-2">
                • {formData.first_name} {formData.last_name} - £{mainProRataFee.toFixed(2)}
              </p>
              {formData.app_type === 'joint' && formData.joint_first_name && (
                <p className="text-xs text-gray-500 ml-2">
                  • {formData.joint_first_name} {formData.joint_last_name} - £{jointProRataFee.toFixed(2)}
                </p>
              )}
              {formData.children && formData.children.map((child: any, index: number) => (
                <p key={index} className="text-xs text-gray-500 ml-2">
                  • {child.first_name} {child.last_name} - £0.00
                </p>
              ))}
            </div>

            {/* Adjustment */}
            {adjustmentValue > 0 && (
              <div className="flex justify-between text-yellow-600">
                <div className="flex-1">
                  <span>Adjustment:</span>
                  {adjustmentReason && (
                    <p className="text-xs">{adjustmentReason}</p>
                  )}
                </div>
                <span className="font-medium">£{adjustmentValue.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total Due:</span>
                <span className="text-lg">£{totalDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Coverage Period */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-xs text-gray-600">
                Coverage: {new Date(signupDate).toLocaleDateString('en-GB')} - {coverageEndDate}
              </p>
            </div>
          </div>
        </div>

        {/* Adjustments Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Adjustments (Optional)
            </h4>
            <InfoTooltip title="Pro-rata Payment Information">
              <ul className="space-y-1">
                <li>• All memberships renew on <strong>January 1st</strong> each year</li>
                <li>• Annual fee is pro-rated from signup date to December 31st</li>
                <li>• Use adjustments to prepay for following year (saves time in January!)</li>
                <li>• Example: Add £100 adjustment = coverage through Dec 31, 2026</li>
              </ul>
            </InfoTooltip>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Add additional amount to prepay for following year or make advance payment
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Add £100 to prepay for 2027
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <input
                type="text"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Prepay 2027"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payment Received Toggle */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Payment Status
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Mark as received to activate membership immediately
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentReceived(!paymentReceived)}
              className={`
                relative inline-flex h-10 w-20 items-center rounded-full transition-colors
                ${paymentReceived ? 'bg-emerald-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-8 w-8 transform rounded-full bg-white transition-transform
                  ${paymentReceived ? 'translate-x-11' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className={`
            rounded-lg p-4 text-sm
            ${paymentReceived
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-yellow-50 border border-yellow-200'
            }
          `}>
            {paymentReceived ? (
              <div className="flex items-center text-emerald-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-xs text-emerald-600">
                    Member will be set to ACTIVE status
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-yellow-800">
                <Clock className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Payment Pending</p>
                  <p className="text-xs text-yellow-600">
                    Member will be set to PENDING status until payment received
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button type="button" onClick={() => updateFormData('payment_method', 'cash')}
            className={`p-4 rounded-lg border-2 transition-all ${formData.payment_method === 'cash' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Cash</div>
              {formData.payment_method === 'cash' && <Check className="h-5 w-5 mx-auto mt-2 text-emerald-600" />}
            </div>
          </button>
          <button type="button" onClick={() => updateFormData('payment_method', 'cheque')}
            className={`p-4 rounded-lg border-2 transition-all ${formData.payment_method === 'cheque' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Cheque</div>
              {formData.payment_method === 'cheque' && <Check className="h-5 w-5 mx-auto mt-2 text-emerald-600" />}
            </div>
          </button>
          <button type="button" onClick={() => updateFormData('payment_method', 'bank_transfer')}
            className={`p-4 rounded-lg border-2 transition-all ${formData.payment_method === 'bank_transfer' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Bank Transfer</div>
              {formData.payment_method === 'bank_transfer' && <Check className="h-5 w-5 mx-auto mt-2 text-emerald-600" />}
            </div>
          </button>
        </div>
        {validationErrors.payment_method && <p className="text-red-500 text-xs mt-2">{validationErrors.payment_method}</p>}
      </div>
    </div>
  );
}