import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
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
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Copy,
  Info,
  FileText,
  Upload,
  X,
  Image,
  AlertTriangle,
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
        <div className="absolute z-50 left-6 top-0 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-left transition-colors">
          <div className="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white dark:border-r-gray-800"></div>
          <div className="absolute -left-[9px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-200 dark:border-r-gray-700"></div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h5>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
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
  middle_name: string;
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
  joint_middle_name: string;
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
  main_medical_consent: boolean;
  main_medical_signature: string;
  joint_medical_consent: boolean;
  joint_medical_signature: string;
  main_final_tc: boolean;
  main_final_emergency: boolean;
  main_final_declaration: boolean;
  main_final_signature: string;
  joint_final_declaration: boolean;
  joint_final_signature: string;
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
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const savedApplication = location.state?.savedApplication;
  const draftRef = searchParams.get('draft');
  const initializingRef = useRef(false);
  const lastSavedStepRef = useRef<number | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [highestStepReached, setHighestStepReached] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [childValidationErrors, setChildValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [applicationReference, setApplicationReference] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mainHasMedicalCondition, setMainHasMedicalCondition] = useState<boolean | null>(null);
  const [jointHasMedicalCondition, setJointHasMedicalCondition] = useState<boolean | null>(null);
  const [membershipType, setMembershipType] = useState('new');
  const [signupDate, setSignupDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [mainDob, setMainDob] = useState('');

  // Paper form tracking (kept for data submission, no longer shown as a step)
  const paperFormVersion = 'v01.25';
  const applicationDate = new Date().toISOString().split('T')[0];

  // GP Details (shared for both applicants)
  const [gpPracticeName, setGpPracticeName] = useState('');
  const [gpPracticeAddress, setGpPracticeAddress] = useState('');
  const [gpPostcode, setGpPostcode] = useState('');
  const [gpTelephone, setGpTelephone] = useState('');
  const [gpEmail, setGpEmail] = useState('');

  // Document upload files (File objects, not serializable to JSON draft)
  const [mainPhotoId, setMainPhotoId] = useState<File | null>(null);
  const [mainProofOfAddress, setMainProofOfAddress] = useState<File | null>(null);
  const [jointPhotoId, setJointPhotoId] = useState<File | null>(null);
  const [jointProofOfAddress, setJointProofOfAddress] = useState<File | null>(null);
  const [childBirthCerts, setChildBirthCerts] = useState<(File | null)[]>([]);
  const [documentValidationErrors, setDocumentValidationErrors] = useState<Record<string, string>>({});
  const [showDocWarningModal, setShowDocWarningModal] = useState(false);


  const [formData, setFormData] = useState<FormData>({
    app_type: 'single',
    title: '',
    first_name: '',
    middle_name: '',
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
    joint_middle_name: '',
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
    main_medical_consent: false,
    main_medical_signature: '',
    joint_medical_consent: false,
    joint_medical_signature: '',
    main_final_tc: false,
    main_final_emergency: false,
    main_final_declaration: false,
    main_final_signature: '',
    joint_final_declaration: false,
    joint_final_signature: '',
    main_joining_fee: 0,
    main_membership_fee: 100,
    joint_joining_fee: 0,
    joint_membership_fee: 100,
    total_amount: 0,
    payment_method: '',
  });

  const { data: feeStructure } = useQuery({
    queryKey: ['fee-structure'],
    queryFn: async () => {
      const { data } = await supabase.from('fee_structure').select('*').order('age_min', { ascending: true });
      return data || [];
    },
  });

  const initializeDraft = useCallback(async () => {
    if (initializingRef.current || !user) return;
    initializingRef.current = true;

    try {
      if (draftRef) {
        const { data: existingDraft, error } = await supabase
          .from('applications_in_progress')
          .select('*')
          .eq('application_reference', draftRef)
          .maybeSingle();

        if (error) throw error;

        if (existingDraft) {
          setApplicationReference(existingDraft.application_reference);
          setCurrentStep(existingDraft.current_step || 0);
          setHighestStepReached(existingDraft.current_step || 0);
          lastSavedStepRef.current = existingDraft.current_step || 0;
          if (existingDraft.form_data) {
            setFormData({ ...existingDraft.form_data, children: existingDraft.form_data.children ?? [] });
            setMainDob(existingDraft.form_data.dob || '');
          }
          setIsInitialized(true);
          return;
        }
      }

      if (savedApplication) {
        setApplicationReference(savedApplication.application_reference);
        setCurrentStep(savedApplication.current_step || 0);
        setHighestStepReached(savedApplication.current_step || 0);
        lastSavedStepRef.current = savedApplication.current_step || 0;
        if (savedApplication.form_data) {
          setFormData({ ...savedApplication.form_data, children: savedApplication.form_data.children ?? [] });
          setMainDob(savedApplication.form_data.dob || '');
        }
        setIsInitialized(true);
        return;
      }

      const { data: newDraft, error: insertError } = await supabase
        .from('applications_in_progress')
        .insert({
          form_data: {},
          current_step: 0,
          app_type: 'single',
          status: 'in_progress',
          created_by: user.id,
        })
        .select('application_reference')
        .single();

      if (insertError) throw insertError;

      setApplicationReference(newDraft.application_reference);
      lastSavedStepRef.current = 0;
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing draft:', error);
      setIsInitialized(true);
    }
  }, [draftRef, savedApplication, user]);

  useEffect(() => {
    initializeDraft();
  }, [initializeDraft]);

  const [isSaving, setIsSaving] = useState(false);

  const saveDraft = useCallback(async (stepToSave?: number) => {
    if (!applicationReference) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('applications_in_progress')
        .update({
          form_data: formData,
          current_step: stepToSave ?? currentStep,
          app_type: formData.app_type,
          main_first_name: formData.first_name,
          main_last_name: formData.last_name,
          main_email: formData.email,
          main_mobile: formData.mobile,
          joint_first_name: formData.joint_first_name,
          joint_last_name: formData.joint_last_name,
          updated_at: new Date().toISOString(),
          last_saved_at: new Date().toISOString(),
        })
        .eq('application_reference', applicationReference);

      if (error) throw error;
      if (stepToSave !== undefined) {
        lastSavedStepRef.current = stepToSave;
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [applicationReference, formData, currentStep]);

  const handleSaveProgress = useCallback(() => {
    saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    if (!isInitialized || !applicationReference) return;
    if (lastSavedStepRef.current !== null && currentStep !== lastSavedStepRef.current) {
      saveDraft(currentStep);
    }
  }, [currentStep, isInitialized, applicationReference, saveDraft]);

  useEffect(() => {
    if (!isInitialized || !applicationReference) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveDraft();
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized, applicationReference, saveDraft]);

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
      // Generate membership number
      const { data: membershipNumber, error: seqError } = await supabase
        .rpc('get_next_membership_number', { prefix_value: 'FCM' });

      if (seqError) throw seqError;

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
        membership_number: membershipNumber,
        app_type: formData.app_type, title: formData.title, first_name: formData.first_name, middle_name: formData.middle_name || null, last_name: formData.last_name,
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
        // Audit trail
        data_entry_date: new Date().toISOString(),
      };

      const { data: member, error: memberError } = await supabase.from('members').insert(memberInsert).select().single();

      if (memberError) throw memberError;
      const memberId = member.id;

      if (formData.app_type === 'joint') {
        await supabase.from('joint_members').insert({
          member_id: memberId, title: formData.joint_title, first_name: formData.joint_first_name,
          middle_name: formData.joint_middle_name || null, last_name: formData.joint_last_name, dob: formData.joint_dob, relation: formData.joint_relation,
          address_line_1: formData.joint_address_line_1,
          town: formData.joint_town, city: formData.joint_city, postcode: formData.joint_postcode,
          mobile: formData.joint_mobile, home_phone: formData.joint_home_phone, work_phone: formData.joint_work_phone, email: formData.joint_email,
        });
      }

      if ((formData.children?.length ?? 0) > 0) {
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

      const mainDisclaimer = mainHasMedicalCondition === true
        ? 'Yes - has medical conditions'
        : mainHasMedicalCondition === false
        ? 'No medical conditions'
        : 'Not answered';

      await supabase.from('medical_info').insert({
        member_id: memberId,
        member_type: 'main',
        disclaimer: mainDisclaimer,
        conditions: mainHasMedicalCondition === true ? (formData.main_conditions || null) : null,
      });

      if (formData.app_type === 'joint') {
        const jointDisclaimer = jointHasMedicalCondition === true
          ? 'Yes - has medical conditions'
          : jointHasMedicalCondition === false
          ? 'No medical conditions'
          : 'Not answered';

        await supabase.from('medical_info').insert({
          member_id: memberId,
          member_type: 'joint',
          disclaimer: jointDisclaimer,
          conditions: jointHasMedicalCondition === true ? (formData.joint_conditions || null) : null,
        });
      }

      const now = new Date().toISOString();
      await supabase.from('declarations').insert({
        member_id: memberId,
        main_medical_consent: formData.main_medical_consent,
        main_medical_signature: formData.main_medical_signature || null,
        main_medical_consent_date: formData.main_medical_consent ? now : null,
        main_final_declaration: formData.main_final_declaration,
        main_final_signature: formData.main_final_signature || null,
        main_final_declaration_date: formData.main_final_declaration ? now : null,
        ...(formData.app_type === 'joint' && {
          joint_medical_consent: formData.joint_medical_consent,
          joint_medical_signature: formData.joint_medical_signature || null,
          joint_medical_consent_date: formData.joint_medical_consent ? now : null,
          joint_final_declaration: formData.joint_final_declaration,
          joint_final_signature: formData.joint_final_signature || null,
          joint_final_declaration_date: formData.joint_final_declaration ? now : null,
        }),
      });

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

      // Upload documents to Supabase Storage
      const uploadDoc = async (file: File, path: string): Promise<string | null> => {
        const { error } = await supabase.storage.from('member-documents').upload(path, file, { upsert: true });
        if (error) return null;
        const { data: urlData } = supabase.storage.from('member-documents').getPublicUrl(path);
        return urlData.publicUrl;
      };

      const ts = Date.now();
      const ext = (f: File) => f.name.split('.').pop();

      const mainPhotoIdUrl = mainPhotoId
        ? await uploadDoc(mainPhotoId, `${memberId}/main-photo-id-${ts}.${ext(mainPhotoId)}`)
        : null;
      const mainPoaUrl = mainProofOfAddress
        ? await uploadDoc(mainProofOfAddress, `${memberId}/main-proof-of-address-${ts}.${ext(mainProofOfAddress)}`)
        : null;
      const jointPhotoIdUrl = jointPhotoId
        ? await uploadDoc(jointPhotoId, `${memberId}/joint-photo-id-${ts}.${ext(jointPhotoId)}`)
        : null;
      const jointPoaUrl = jointProofOfAddress
        ? await uploadDoc(jointProofOfAddress, `${memberId}/joint-proof-of-address-${ts}.${ext(jointProofOfAddress)}`)
        : null;

      const docUpdate: Record<string, string | null> = {};
      if (mainPhotoIdUrl) docUpdate.photo_id_url = mainPhotoIdUrl;
      if (mainPoaUrl) docUpdate.proof_of_address_url = mainPoaUrl;
      if (jointPhotoIdUrl) docUpdate.joint_photo_id_url = jointPhotoIdUrl;
      if (jointPoaUrl) docUpdate.joint_proof_of_address_url = jointPoaUrl;

      if (Object.keys(docUpdate).length > 0) {
        await supabase.from('members').update(docUpdate).eq('id', memberId);
      }

      for (let i = 0; i < childBirthCerts.length; i++) {
        const cert = childBirthCerts[i];
        if (cert) {
          const certUrl = await uploadDoc(cert, `${memberId}/child-${i}-birth-cert-${ts}.${ext(cert)}`);
          if (certUrl) {
            await supabase.from('children')
              .update({ birth_certificate_url: certUrl })
              .eq('member_id', memberId)
              .eq('first_name', formData.children[i].first_name)
              .eq('last_name', formData.children[i].last_name);
          }
        }
      }

      await logActivity(memberId, ActivityTypes.APPLICATION_SUBMITTED);

      return { memberId, membershipNumber };
    },
    onSuccess: async (result) => {
      if (!result) return;
      const { memberId, membershipNumber } = result;

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
          membershipNumber,
          memberName,
          memberEmail: formData.email,
          applicationReference,
          paymentReceived,
        },
      });
    },
  });


  const steps = ['Membership Type', 'Main Member', 'Joint Member', 'Children', 'Next of Kin', 'Medical Info', 'GP Details', 'Documents', 'Payment'];

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
    if ((formData.children?.length ?? 0) === 0) return true;

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

    if (!gpPracticeName) errors.gpPracticeName = 'GP practice name is required';
    if (!gpPracticeAddress) errors.gpPracticeAddress = 'GP practice address is required';
    if (!gpPostcode) errors.gpPostcode = 'GP postcode is required';
    if (!gpTelephone) errors.gpTelephone = 'GP telephone is required';

    if (!formData.main_medical_consent) errors.main_medical_consent = 'You must confirm the medical consent declaration';

    if (formData.app_type === 'joint') {
      if (!formData.joint_medical_consent) errors.joint_medical_consent = 'Joint member must confirm the medical consent declaration';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDocumentsStep = (): boolean => {
    setDocumentValidationErrors({});
    return true;
  };

  const hasAnyMissingDocs = (): boolean => {
    if (!mainPhotoId || !mainProofOfAddress) return true;
    if (formData.app_type === 'joint' && (!jointPhotoId || !jointProofOfAddress)) return true;
    if ((formData.children?.length ?? 0) > 0) {
      if (formData.children.some((_: any, i: number) => !childBirthCerts[i])) return true;
    }
    return false;
  };

  const validatePaymentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.main_final_tc) errors.main_final_tc = 'You must accept the Terms & Conditions';
    if (!formData.main_final_emergency) errors.main_final_emergency = 'You must agree to contribute to the emergency fund';
    if (!formData.main_final_declaration) errors.main_final_declaration = 'You must confirm the accuracy of your application';
    if (formData.app_type === 'joint') {
      if (!formData.joint_final_declaration) errors.joint_final_declaration = 'Joint member must confirm the accuracy of the application';
    }

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
    if (currentStep === 5) {
      const errors: Record<string, string> = {};
      if (mainHasMedicalCondition === null) {
        errors.main_medical = 'Please select Yes or No';
      }
      if (mainHasMedicalCondition === true && !formData.main_conditions.trim()) {
        errors.main_conditions = 'Please provide details of your medical condition(s)';
      }
      if (formData.app_type === 'joint') {
        if (jointHasMedicalCondition === null) {
          errors.joint_medical = 'Please select Yes or No';
        }
        if (jointHasMedicalCondition === true && !formData.joint_conditions.trim()) {
          errors.joint_conditions = 'Please provide details of the joint member\'s medical condition(s)';
        }
      }
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }
    if (currentStep === 6) {
      return validateDeclarationsStep();
    }
    if (currentStep === 7) {
      return validateDocumentsStep();
    }
    if (currentStep === 8) {
      return validatePaymentStep();
    }
    return true;
  };

  const proceedToNextStep = () => {
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

  const handleNext = () => {
    if (!canProceedFromStep()) {
      return;
    }

    if (currentStep === 7 && hasAnyMissingDocs()) {
      setShowDocWarningModal(true);
      return;
    }

    proceedToNextStep();
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
    ? [0, 1, 3, 4, 5, 6, 7, 8]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const currentVisibleStepIndex = stepIndexMap.indexOf(currentStep);

  // Map sidebar step IDs to internal step indices (dynamic based on app type)
  const sidebarStepToIndex: Record<number, number> = formData.app_type === 'joint'
    ? {
        1: 0,  // Membership Type
        2: 1,  // Main Member
        3: 2,  // Joint Member
        4: 3,  // Children
        5: 4,  // Next of Kin
        6: 5,  // Medical Info
        7: 6,  // GP Details
        8: 7,  // Documents
        9: 8,  // Payment
      }
    : {
        1: 0,  // Membership Type
        2: 1,  // Main Member
        3: 3,  // Children (skip joint member step 2)
        4: 4,  // Next of Kin
        5: 5,  // Medical Info
        6: 6,  // GP Details
        7: 7,  // Documents
        8: 8,  // Payment
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
          appType={formData.app_type}
          onBack={() => {
            saveDraft();
            navigate('/members');
          }}
          applicationReference={applicationReference}
          isSaving={isSaving}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[352px] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Member Registration</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Complete all steps to register a new funeral service member</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 transition-colors">
        {currentStep === 0 && <StepMembershipType formData={formData} updateFormData={updateFormData} />}
        {currentStep === 1 && <StepMainMember formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 2 && <StepJointMember formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 3 && <StepChildren formData={formData} addChild={addChild} removeChild={removeChild} updateChild={updateChild} childValidationErrors={childValidationErrors} />}
        {currentStep === 4 && <StepNextOfKin formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 5 && <StepMedicalInfo formData={formData} updateFormData={updateFormData} mainHasMedicalCondition={mainHasMedicalCondition} setMainHasMedicalCondition={setMainHasMedicalCondition} jointHasMedicalCondition={jointHasMedicalCondition} setJointHasMedicalCondition={setJointHasMedicalCondition} validationErrors={validationErrors} />}
        {currentStep === 6 && <StepDeclarations
          gpPracticeName={gpPracticeName} setGpPracticeName={setGpPracticeName}
          gpPracticeAddress={gpPracticeAddress} setGpPracticeAddress={setGpPracticeAddress}
          gpPostcode={gpPostcode} setGpPostcode={setGpPostcode}
          gpTelephone={gpTelephone} setGpTelephone={setGpTelephone}
          gpEmail={gpEmail} setGpEmail={setGpEmail}
          formData={formData} updateFormData={updateFormData}
          validationErrors={validationErrors}
        />}
        {currentStep === 7 && <StepDocuments
          formData={formData}
          mainPhotoId={mainPhotoId} setMainPhotoId={setMainPhotoId}
          mainProofOfAddress={mainProofOfAddress} setMainProofOfAddress={setMainProofOfAddress}
          jointPhotoId={jointPhotoId} setJointPhotoId={setJointPhotoId}
          jointProofOfAddress={jointProofOfAddress} setJointProofOfAddress={setJointProofOfAddress}
          childBirthCerts={childBirthCerts} setChildBirthCerts={setChildBirthCerts}
          validationErrors={documentValidationErrors}
        />}
        {currentStep === 8 && <StepPayment formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} membershipType={membershipType} setMembershipType={setMembershipType} signupDate={signupDate} setSignupDate={setSignupDate} adjustmentAmount={adjustmentAmount} setAdjustmentAmount={setAdjustmentAmount} adjustmentReason={adjustmentReason} setAdjustmentReason={setAdjustmentReason} paymentReceived={paymentReceived} setPaymentReceived={setPaymentReceived} mainDob={mainDob} calculateAge={calculateAge} joiningFee={joiningFee} mainJoiningFee={mainJoiningFee} jointJoiningFee={jointJoiningFee} proRataAnnualFee={proRataAnnualFee} mainProRataFee={mainProRataFee} jointProRataFee={jointProRataFee} adjustmentValue={adjustmentValue} totalDue={totalDue} coverageEndDate={coverageEndDate} />}
      </div>

          <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center gap-4">
              <button onClick={handleBack} disabled={currentStep === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </button>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Step {currentVisibleStepIndex + 1} of {visibleSteps.length}</span>
              {applicationReference && (
                <span className="text-xs text-emerald-600 mt-1 font-mono">{applicationReference}</span>
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

      {/* Document Warning Modal */}
      {showDocWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Documents Not Uploaded</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  One or more required documents have not been uploaded. Documents must be added after the member is created — you can upload them from the member's profile page.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDocWarningModal(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => { setShowDocWarningModal(false); proceedToNextStep(); }}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
            <select value={formData.title} onChange={(e) => updateFormData('title', e.target.value)} required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.title ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select</option>
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="First name" />
            {validationErrors.first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input type="text" value={formData.middle_name} onChange={(e) => updateFormData('middle_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.last_name} onChange={(e) => updateFormData('last_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Last name" />
            {validationErrors.last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[180px] gap-4">
          <div>
            <DateInput
              label={`Date of Birth${formData.dob ? ` (${calculateAge(formData.dob)} years old)` : ''}`}
              required
              value={formData.dob}
              onChange={(value) => updateFormData('dob', value)}
            />
            {validationErrors.dob && <p className="text-red-500 text-xs mt-1">{validationErrors.dob}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.address_line_1} onChange={(e) => updateFormData('address_line_1', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.address_line_1 ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter street address" />
          {validationErrors.address_line_1 && <p className="text-red-500 text-xs mt-1">{validationErrors.address_line_1}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4">
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.postcode ? 'border-red-500' : 'border-gray-300'}`} placeholder="Postcode" />
            {validationErrors.postcode && <p className="text-red-500 text-xs mt-1">{validationErrors.postcode}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
            <input type="tel" required pattern="[0-9]{11}" value={formData.mobile} onChange={(e) => updateFormData('mobile', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.mobile ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="11 digits"
              title="Mobile number must be exactly 11 digits" />
            {validationErrors.mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.mobile}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
            <input type="tel" value={formData.home_phone} onChange={(e) => updateFormData('home_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Phone</label>
            <input type="tel" value={formData.work_phone} onChange={(e) => updateFormData('work_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Optional" />
          </div>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joint Member (Spouse) Details</h2>
        <p className="text-sm text-gray-600">Enter the spouse's information</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
            <select value={formData.joint_title} onChange={(e) => updateFormData('joint_title', e.target.value)} required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_title ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.joint_first_name} onChange={(e) => updateFormData('joint_first_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="First name" />
            {validationErrors.joint_first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_first_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input type="text" value={formData.joint_middle_name} onChange={(e) => updateFormData('joint_middle_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.joint_last_name} onChange={(e) => updateFormData('joint_last_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Last name" />
            {validationErrors.joint_last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_last_name}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[180px_200px] gap-4">
          <div>
            <DateInput
              label={`Date of Birth${formData.joint_dob ? ` (${calculateAge(formData.joint_dob)} years old)` : ''}`}
              required
              value={formData.joint_dob}
              onChange={(value) => updateFormData('joint_dob', value)}
            />
            {validationErrors.joint_dob && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_dob}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
              Spouse
            </div>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={copyMainAddress}
            className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
          >
            <Copy className="h-4 w-4 mr-2" />
            Same address as {mainMemberName}?
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_address_line_1} onChange={(e) => updateFormData('joint_address_line_1', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_address_line_1 ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter street address" />
          {validationErrors.joint_address_line_1 && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_address_line_1}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4">
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_postcode ? 'border-red-500' : 'border-gray-300'}`} placeholder="Postcode" />
            {validationErrors.joint_postcode && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_postcode}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
            <input type="tel" required pattern="[0-9]{11}" value={formData.joint_mobile} onChange={(e) => updateFormData('joint_mobile', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.joint_mobile ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="11 digits"
              title="Mobile number must be exactly 11 digits" />
            {validationErrors.joint_mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_mobile}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
            <input type="tel" value={formData.joint_home_phone} onChange={(e) => updateFormData('joint_home_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Phone</label>
            <input type="tel" value={formData.joint_work_phone} onChange={(e) => updateFormData('joint_work_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Optional" />
          </div>
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

      {(formData.children?.length ?? 0) === 0 ? (
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
                <div className="space-y-4">
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_200px] gap-4">
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
                        <option value="">Select</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="stepson">Stepson</option>
                        <option value="stepdaughter">Stepdaughter</option>
                      </select>
                      {errors.relation && <p className="text-red-500 text-xs mt-1">{errors.relation}</p>}
                    </div>
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
      <div className="space-y-4">
        {/* Row 1: Title + First Name + Last Name + Relationship */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <select value={formData.nok_title} onChange={(e) => updateFormData('nok_title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
              <option value="">Select</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </div>
          <div className="col-span-1 md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nok_first_name} onChange={(e) => updateFormData('nok_first_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_first_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter first name" />
            {validationErrors.nok_first_name && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_first_name}</p>}
          </div>
          <div className="col-span-1 md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nok_last_name} onChange={(e) => updateFormData('nok_last_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_last_name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter last name" />
            {validationErrors.nok_last_name && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_last_name}</p>}
          </div>
          <div className="col-span-1 md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship <span className="text-red-500">*</span></label>
            <select required value={formData.nok_relationship} onChange={(e) => updateFormData('nok_relationship', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_relationship ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Select</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Other">Other</option>
            </select>
            {validationErrors.nok_relationship && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_relationship}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.nok_address_line_1} onChange={(e) => updateFormData('nok_address_line_1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Enter street address" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_150px] gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Town <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nok_town} onChange={(e) => updateFormData('nok_town', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Enter town" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nok_city} onChange={(e) => updateFormData('nok_city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Enter city" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nok_postcode} onChange={(e) => updateFormData('nok_postcode', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Postcode" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone <span className="text-red-500">*</span></label>
            <input type="tel" required pattern="[0-9]{11}" value={formData.nok_mobile} onChange={(e) => updateFormData('nok_mobile', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.nok_mobile ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="11 digits"
              title="Mobile number must be exactly 11 digits" />
            {validationErrors.nok_mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.nok_mobile}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
            <input type="tel" value={formData.nok_phone} onChange={(e) => updateFormData('nok_phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" required value={formData.nok_email} onChange={(e) => updateFormData('nok_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="Enter email address" />
        </div>
      </div>
    </div>
  );
}

function StepMedicalInfo({ formData, updateFormData, mainHasMedicalCondition, setMainHasMedicalCondition, jointHasMedicalCondition, setJointHasMedicalCondition, validationErrors }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Information</h2>
        <p className="text-sm text-gray-600">Please provide any relevant medical information</p>
      </div>

      <div className="space-y-6">
        {/* Main Member Medical Information */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg border p-6 transition-colors ${validationErrors?.main_medical ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {formData.first_name && formData.last_name
              ? `${formData.first_name} ${formData.last_name}`
              : 'Main Member'}
          </h3>

          {/* Medical Condition Question */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Do you have any medical condition or undergoing any medical treatment for any short/long term illness? <span className="text-red-500">*</span>
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
            {validationErrors?.main_medical && <p className="text-red-500 text-xs mt-2">{validationErrors.main_medical}</p>}
          </div>

          {/* Conditional Medical Conditions Text Box */}
          {mainHasMedicalCondition === true && (
            <div className="mt-4 animate-in slide-in-from-top duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide details of your medical condition(s) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.main_conditions}
                onChange={(e) => updateFormData('main_conditions', e.target.value)}
                rows={4}
                placeholder="Please describe your medical condition(s), treatment, and any medications..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors?.main_conditions ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {validationErrors?.main_conditions && <p className="text-red-500 text-xs mt-1">{validationErrors.main_conditions}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Include any medications, ongoing treatments, or conditions that may be relevant.
              </p>
            </div>
          )}
        </div>

        {/* Joint Member Medical Information */}
        {formData.app_type === 'joint' && (
          <div className={`bg-white dark:bg-gray-800 rounded-lg border p-6 transition-colors ${validationErrors?.joint_medical ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {formData.joint_first_name && formData.joint_last_name
                ? `${formData.joint_first_name} ${formData.joint_last_name}`
                : 'Joint Member'}
            </h3>

            {/* Medical Condition Question */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Does the joint member have any medical condition or undergoing any medical treatment for any short/long term illness? <span className="text-red-500">*</span>
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
              {validationErrors?.joint_medical && <p className="text-red-500 text-xs mt-2">{validationErrors.joint_medical}</p>}
            </div>

            {/* Conditional Medical Conditions Text Box */}
            {jointHasMedicalCondition === true && (
              <div className="mt-4 animate-in slide-in-from-top duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide details of joint member's medical condition(s) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.joint_conditions}
                  onChange={(e) => updateFormData('joint_conditions', e.target.value)}
                  rows={4}
                  placeholder="Please describe medical condition(s), treatment, and any medications..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${validationErrors?.joint_conditions ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {validationErrors?.joint_conditions && <p className="text-red-500 text-xs mt-1">{validationErrors.joint_conditions}</p>}
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

function StepDeclarations({
  gpPracticeName, setGpPracticeName,
  gpPracticeAddress, setGpPracticeAddress,
  gpPostcode, setGpPostcode,
  gpTelephone, setGpTelephone,
  gpEmail, setGpEmail,
  formData, updateFormData,
  validationErrors
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">GP Details & Medical Consent</h2>
        <p className="text-sm text-gray-600">Enter GP practice details and confirm medical consent</p>
      </div>

      {/* GP Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            GP Practice Details
          </h3>
        </div>

        <div className="space-y-4">
          <div>
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

          <div>
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

          <div className="grid grid-cols-1 md:grid-cols-[150px_200px] gap-4">
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
          </div>

          <div>
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

      {/* Medical Consent - Main Member */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Consent</h3>
        <p className="text-sm text-gray-600 mb-5">
          Section 6 — Main Member
        </p>

        <div className="space-y-5">
          <div className={`rounded-lg border p-4 ${validationErrors.main_medical_consent ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.main_medical_consent}
                onChange={(e) => updateFormData('main_medical_consent', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-800 leading-relaxed">
                I confirm that I have no known medical conditions or illnesses, other than those I have already
                disclosed in Section 5 (Medical Info) of this application, that could invalidate my application. <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
          {validationErrors.main_medical_consent && (
            <p className="text-red-500 text-xs -mt-2">{validationErrors.main_medical_consent}</p>
          )}
        </div>

        {/* Joint member consent — only shown for joint applications */}
        {formData.app_type === 'joint' && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-5">
            <p className="text-sm text-gray-600 font-medium">Section 6 — Joint Member</p>

            <div className={`rounded-lg border p-4 ${validationErrors.joint_medical_consent ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.joint_medical_consent}
                  onChange={(e) => updateFormData('joint_medical_consent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                />
                <span className="text-sm font-medium text-gray-800 leading-relaxed">
                  I (the joint member) confirm that I have no known medical conditions or illnesses, other than those
                  already disclosed in Section 5 (Medical Info) of this application, that could invalidate my application. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
            {validationErrors.joint_medical_consent && (
              <p className="text-red-500 text-xs -mt-2">{validationErrors.joint_medical_consent}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function FileUploadZone({
  label,
  file,
  onFileChange,
  errorKey,
  validationErrors,
}: {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  errorKey: string;
  validationErrors: Record<string, string>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (f: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(f.type)) return 'Only JPG, PNG, or PDF files are allowed';
    if (f.size > MAX_FILE_SIZE) return 'File must be under 5MB';
    return null;
  };

  const handleFile = (f: File) => {
    const err = validate(f);
    if (err) { setLocalError(err); return; }
    setLocalError(null);
    onFileChange(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const error = localError || validationErrors[errorKey];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      {file ? (
        <div className="flex items-center gap-3 p-3 border-2 border-[#06420c] bg-emerald-50 rounded-lg">
          {file.type === 'application/pdf' ? (
            <FileText className="h-8 w-8 text-[#06420c] flex-shrink-0" />
          ) : (
            <Image className="h-8 w-8 text-[#06420c] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => { onFileChange(null); setLocalError(null); }}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center min-h-[120px] border-2 border-dashed rounded-lg cursor-pointer transition-all
            ${isDragging ? 'border-[#06420c] bg-emerald-50' : error ? 'border-red-400 bg-red-50' : 'border-[#06420c]/40 hover:border-[#06420c] hover:bg-emerald-50/50'}
          `}
        >
          <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-[#06420c]' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-600">
            {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF · Max 5MB</p>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

function StepDocuments({
  formData,
  mainPhotoId, setMainPhotoId,
  mainProofOfAddress, setMainProofOfAddress,
  jointPhotoId, setJointPhotoId,
  jointProofOfAddress, setJointProofOfAddress,
  childBirthCerts, setChildBirthCerts,
  validationErrors,
}: any) {
  const updateChildCert = (index: number, file: File | null) => {
    setChildBirthCerts((prev: (File | null)[]) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-sm text-gray-600">Upload documents now if available — they can also be added later from the member's profile</p>
      </div>

      {/* Main Member Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-full bg-[#06420c] flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            Main Member — {formData.first_name} {formData.last_name}
          </h3>
          <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Optional</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FileUploadZone
            label="Photo ID"
            file={mainPhotoId}
            onFileChange={setMainPhotoId}
            errorKey="mainPhotoId"
            validationErrors={validationErrors}
          />
          <FileUploadZone
            label="Proof of Address"
            file={mainProofOfAddress}
            onFileChange={setMainProofOfAddress}
            errorKey="mainProofOfAddress"
            validationErrors={validationErrors}
          />
        </div>
      </div>

      {/* Joint Member Documents */}
      {formData.app_type === 'joint' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-full bg-[#06420c] flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Joint Member — {formData.joint_first_name} {formData.joint_last_name}
            </h3>
            <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileUploadZone
              label="Photo ID"
              file={jointPhotoId}
              onFileChange={setJointPhotoId}
              errorKey="jointPhotoId"
              validationErrors={validationErrors}
            />
            <FileUploadZone
              label="Proof of Address"
              file={jointProofOfAddress}
              onFileChange={setJointProofOfAddress}
              errorKey="jointProofOfAddress"
              validationErrors={validationErrors}
            />
          </div>
        </div>
      )}

      {/* Children Birth Certificates */}
      {(formData.children?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Baby className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Children's Birth Certificates</h3>
            <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Optional</span>
          </div>
          <div className="space-y-5">
            {formData.children.map((child: any, index: number) => (
              <FileUploadZone
                key={index}
                label={`Birth Certificate — ${child.first_name || `Child ${index + 1}`} ${child.last_name || ''}`}
                file={childBirthCerts[index] ?? null}
                onFileChange={(f) => updateChildCert(index, f)}
                errorKey={`childBirthCert_${index}`}
                validationErrors={validationErrors}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepPayment({ formData, updateFormData, validationErrors, membershipType, setMembershipType, signupDate, setSignupDate, adjustmentAmount, setAdjustmentAmount, adjustmentReason, setAdjustmentReason, paymentReceived, setPaymentReceived, mainDob, calculateAge, joiningFee, mainJoiningFee, jointJoiningFee, proRataAnnualFee, mainProRataFee, jointProRataFee, adjustmentValue, totalDue, coverageEndDate }: any) {
  const SHOW_ADJUSTMENT_FIELD = false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Declaration & Payment</h2>
        <p className="text-sm text-gray-600">Review and confirm declarations before completing payment</p>
      </div>

      {/* Section 1: Final Declaration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Final Declaration &amp; Terms</h3>
          <p className="text-xs text-gray-500 mt-0.5">Section 7 — All checkboxes required</p>
        </div>

        <div className="p-6 space-y-5">
          <div className={`rounded-lg border p-4 ${validationErrors.main_final_tc ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.main_final_tc}
                onChange={(e) => updateFormData('main_final_tc', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-700 flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-800 leading-relaxed">
                I accept the Terms &amp; Conditions of Central Region Muslim Funeral Service <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
          {validationErrors.main_final_tc && <p className="text-red-500 text-xs -mt-2">{validationErrors.main_final_tc}</p>}

          <div className={`rounded-lg border p-4 ${validationErrors.main_final_emergency ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.main_final_emergency}
                onChange={(e) => updateFormData('main_final_emergency', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-700 flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-800 leading-relaxed">
                I agree to contribute to the emergency fund if required <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
          {validationErrors.main_final_emergency && <p className="text-red-500 text-xs -mt-2">{validationErrors.main_final_emergency}</p>}

          <div className={`rounded-lg border p-4 ${validationErrors.main_final_declaration ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.main_final_declaration}
                onChange={(e) => updateFormData('main_final_declaration', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-700 flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-800 leading-relaxed">
                I confirm that all information provided in this application is accurate and complete <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
          {validationErrors.main_final_declaration && <p className="text-red-500 text-xs -mt-2">{validationErrors.main_final_declaration}</p>}

          {formData.app_type === 'joint' && (
            <div className="pt-5 mt-2 border-t border-gray-200 space-y-5">
              <p className="text-sm text-gray-600 font-medium">Section 7 — Joint Member</p>

              <div className={`rounded-lg border p-4 ${validationErrors.joint_final_declaration ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.joint_final_declaration}
                    onChange={(e) => updateFormData('joint_final_declaration', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-700 flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-800 leading-relaxed">
                    I (the joint member) confirm that all information provided in this application is accurate and complete <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
              {validationErrors.joint_final_declaration && <p className="text-red-500 text-xs -mt-2">{validationErrors.joint_final_declaration}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Payment Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
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

            {SHOW_ADJUSTMENT_FIELD && adjustmentValue > 0 && (
              <div className="flex justify-between text-yellow-600">
                <div className="flex-1">
                  <span>Adjustment:</span>
                  {adjustmentReason && <p className="text-xs">{adjustmentReason}</p>}
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

            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-xs text-gray-600">
                Coverage: {new Date(signupDate).toLocaleDateString('en-GB')} - {coverageEndDate}
              </p>
            </div>
          </div>
        </div>

        {SHOW_ADJUSTMENT_FIELD && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Adjustments (Optional)</h4>
              <InfoTooltip title="Pro-rata Payment Information">
                <ul className="space-y-1">
                  <li>• All memberships renew on <strong>January 1st</strong> each year</li>
                  <li>• Annual fee is pro-rated from signup date to December 31st</li>
                  <li>• Use adjustments to prepay for following year (saves time in January!)</li>
                  <li>• Example: Add £100 adjustment = coverage through Dec 31, 2027</li>
                </ul>
              </InfoTooltip>
            </div>
            <p className="text-xs text-gray-500 mb-3">Add additional amount to prepay for following year or make advance payment</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (£)</label>
                <input type="number" step="0.01" min="0" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent" />
                <p className="text-xs text-gray-500 mt-1">Tip: Add £100 to prepay for 2027</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <input type="text" value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="e.g., Prepay 2027"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent" />
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="mb-6">
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

        {/* Payment Received Toggle — at the bottom */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Payment Status</h4>
              <p className="text-xs text-gray-500 mt-1">Mark as received to activate membership immediately</p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentReceived(!paymentReceived)}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${paymentReceived ? 'bg-emerald-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${paymentReceived ? 'translate-x-11' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={`rounded-lg p-4 text-sm ${paymentReceived ? 'bg-emerald-50 border border-emerald-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            {paymentReceived ? (
              <div className="flex items-center text-emerald-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Payment Received</p>
                  <p className="text-xs text-emerald-600">Member will be set to ACTIVE status</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-yellow-800">
                <Clock className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Payment Pending</p>
                  <p className="text-xs text-yellow-600">Member will be set to PENDING status until payment received</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}