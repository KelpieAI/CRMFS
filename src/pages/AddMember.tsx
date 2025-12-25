import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  User,
  Baby,
  Heart,
  Stethoscope,
  FileText,
  Upload,
  CheckSquare,
  CreditCard,
  Loader2,
  X,
  Plus,
} from 'lucide-react';

const stepIcons = [Users, User, Users, Baby, Heart, Stethoscope, FileText, Upload, CheckSquare, CreditCard];

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

export default function AddMember() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [childValidationErrors, setChildValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [formData, setFormData] = useState<FormData>({
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

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: member, error: memberError } = await supabase.from('members').insert({
        app_type: formData.app_type, title: formData.title, first_name: formData.first_name, last_name: formData.last_name,
        dob: formData.dob, address_line_1: formData.address_line_1, town: formData.town, city: formData.city,
        postcode: formData.postcode, mobile: formData.mobile, home_phone: formData.home_phone, work_phone: formData.work_phone,
        email: formData.email, status: 'pending',
      }).select().single();

      if (memberError) throw memberError;
      const memberId = member.id;

      if (formData.app_type === 'joint') {
        await supabase.from('joint_members').insert({
          member_id: memberId, title: formData.joint_title, first_name: formData.joint_first_name,
          last_name: formData.joint_last_name, dob: formData.joint_dob, address_line_1: formData.joint_address_line_1,
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
        member_id: memberId, gp_name_surgery: formData.gp_name_surgery, address_line_1: formData.gp_address_line_1,
        town: formData.gp_town, city: formData.gp_city, postcode: formData.gp_postcode, phone: formData.gp_phone, email: formData.gp_email,
      });

      await supabase.from('medical_info').insert({ member_id: memberId, member_type: 'main', disclaimer: formData.main_disclaimer, conditions: formData.main_conditions });

      if (formData.app_type === 'joint') {
        await supabase.from('medical_info').insert({ member_id: memberId, member_type: 'joint', disclaimer: formData.joint_disclaimer, conditions: formData.joint_conditions });
      }

      await supabase.from('declarations').insert({
        member_id: memberId, agreement_sig_1: formData.agreement_sig_1, agreement_sig_2: formData.agreement_sig_2,
        funding_sig_1: formData.funding_sig_1, funding_sig_2: formData.funding_sig_2, declaration_sig_1: formData.declaration_sig_1, declaration_sig_2: formData.declaration_sig_2,
      });

      await supabase.from('payments').insert({
        member_id: memberId, payment_type: 'registration', payment_method: formData.payment_method,
        main_joining_fee: formData.main_joining_fee, main_membership_fee: formData.main_membership_fee, main_misc: 0,
        joint_joining_fee: formData.joint_joining_fee, joint_membership_fee: formData.joint_membership_fee, joint_misc: 0,
        late_fee: 0, total_amount: formData.total_amount, payment_status: 'pending', join_date: new Date().toISOString(),
      });

      return memberId;
    },
    onSuccess: (memberId) => {
      navigate(`/members/${memberId}`);
    },
  });

  const steps = ['Membership Type', 'Main Member', 'Joint Member', 'Children', 'Next of Kin', 'GP Details', 'Medical Info', 'Documents', 'Declarations', 'Payment'];

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

  const validateChildAge = (dob: string): boolean => {
    if (!dob) return true;
    const age = calculateAge(dob);
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
        errors.dob = 'Child must be under 18 years of age';
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

  const canProceedFromStep = (): boolean => {
    if (currentStep === 1) {
      return validateMainMemberStep();
    }
    if (currentStep === 3) {
      return validateChildrenStep();
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
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    if (currentStep === 3 && formData.app_type === 'single') {
      setCurrentStep(1);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addChild = () => {
    setFormData((prev) => ({ ...prev, children: [...prev.children, { first_name: '', last_name: '', dob: '', relation: '' }] }));
  };

  const removeChild = (index: number) => {
    setFormData((prev) => ({ ...prev, children: prev.children.filter((_, i) => i !== index) }));
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

  const visibleStepIcons = formData.app_type === 'single'
    ? stepIcons.filter((_, index) => index !== 2)
    : stepIcons;

  const stepIndexMap = formData.app_type === 'single'
    ? [0, 1, 3, 4, 5, 6, 7, 8, 9]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const currentVisibleStepIndex = stepIndexMap.indexOf(currentStep);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Member Registration</h1>
        <p className="mt-1 text-sm text-gray-600">Complete all steps to register a new funeral service member</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          {visibleSteps.map((step, visualIndex) => {
            const actualIndex = stepIndexMap[visualIndex];
            const Icon = visibleStepIcons[visualIndex];
            const isActive = actualIndex === currentStep;
            const isCompleted = actualIndex < currentStep;

            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      isActive ? 'border-emerald-600 bg-emerald-600 text-white' :
                      isCompleted ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-white text-gray-400'
                    }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden md:block ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
                {visualIndex < visibleSteps.length - 1 && <div className={`h-0.5 w-8 mx-2 ${isCompleted ? 'bg-emerald-600' : 'bg-gray-300'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        {currentStep === 0 && <StepMembershipType formData={formData} updateFormData={updateFormData} />}
        {currentStep === 1 && <StepMainMember formData={formData} updateFormData={updateFormData} validationErrors={validationErrors} />}
        {currentStep === 2 && <StepJointMember formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <StepChildren formData={formData} addChild={addChild} removeChild={removeChild} updateChild={updateChild} childValidationErrors={childValidationErrors} />}
        {currentStep === 4 && <StepNextOfKin formData={formData} updateFormData={updateFormData} />}
        {currentStep === 5 && <StepGPDetails formData={formData} updateFormData={updateFormData} />}
        {currentStep === 6 && <StepMedicalInfo formData={formData} updateFormData={updateFormData} />}
        {currentStep === 7 && <StepDocuments formData={formData} updateFormData={updateFormData} />}
        {currentStep === 8 && <StepDeclarations formData={formData} updateFormData={updateFormData} />}
        {currentStep === 9 && <StepPayment formData={formData} updateFormData={updateFormData} />}
      </div>

      <div className="flex justify-between items-center bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <button onClick={handleBack} disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>

        <span className="text-sm text-gray-600">Step {currentVisibleStepIndex + 1} of {visibleSteps.length}</span>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" required value={formData.dob} onChange={(e) => updateFormData('dob', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.dob ? 'border-red-500' : 'border-gray-300'}`} />
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
          <input type="tel" required value={formData.mobile} onChange={(e) => updateFormData('mobile', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.mobile ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter mobile number" />
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

function StepJointMember({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joint Member Details</h2>
        <p className="text-sm text-gray-600">Enter the spouse/partner's information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <select value={formData.joint_title} onChange={(e) => updateFormData('joint_title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option value="">Select title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Miss">Miss</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_first_name} onChange={(e) => updateFormData('joint_first_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter first name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.joint_last_name} onChange={(e) => updateFormData('joint_last_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter last name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" required value={formData.joint_dob} onChange={(e) => updateFormData('joint_dob', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
          <input type="text" value={formData.joint_address_line_1} onChange={(e) => updateFormData('joint_address_line_1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter street address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town</label>
          <input type="text" value={formData.joint_town} onChange={(e) => updateFormData('joint_town', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter town" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input type="text" value={formData.joint_city} onChange={(e) => updateFormData('joint_city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter city" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
          <input type="text" value={formData.joint_postcode} onChange={(e) => updateFormData('joint_postcode', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter postcode" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone</label>
          <input type="tel" value={formData.joint_mobile} onChange={(e) => updateFormData('joint_mobile', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter mobile number" />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" value={formData.joint_email} onChange={(e) => updateFormData('joint_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter email address" />
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
                  <X className="h-5 w-5" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" required value={child.dob} onChange={(e) => updateChild(index, 'dob', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.dob ? 'border-red-500' : 'border-gray-300'}`} />
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

function StepNextOfKin({ formData, updateFormData }: any) {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input type="text" value={formData.nok_first_name} onChange={(e) => updateFormData('nok_first_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter first name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input type="text" value={formData.nok_last_name} onChange={(e) => updateFormData('nok_last_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter last name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
          <input type="text" value={formData.nok_relationship} onChange={(e) => updateFormData('nok_relationship', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="e.g., Son, Daughter, Brother" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
          <input type="text" value={formData.nok_address_line_1} onChange={(e) => updateFormData('nok_address_line_1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter street address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town</label>
          <input type="text" value={formData.nok_town} onChange={(e) => updateFormData('nok_town', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter town" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input type="text" value={formData.nok_city} onChange={(e) => updateFormData('nok_city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter city" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
          <input type="text" value={formData.nok_postcode} onChange={(e) => updateFormData('nok_postcode', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter postcode" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Phone</label>
          <input type="tel" value={formData.nok_mobile} onChange={(e) => updateFormData('nok_mobile', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter mobile number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Home Phone</label>
          <input type="tel" value={formData.nok_phone} onChange={(e) => updateFormData('nok_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter home phone" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" value={formData.nok_email} onChange={(e) => updateFormData('nok_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter email address" />
        </div>
      </div>
    </div>
  );
}

function StepGPDetails({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">GP Details</h2>
        <p className="text-sm text-gray-600">General Practitioner / Doctor information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">GP Name / Surgery</label>
          <input type="text" value={formData.gp_name_surgery} onChange={(e) => updateFormData('gp_name_surgery', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter GP name or surgery name" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
          <input type="text" value={formData.gp_address_line_1} onChange={(e) => updateFormData('gp_address_line_1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter street address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Town</label>
          <input type="text" value={formData.gp_town} onChange={(e) => updateFormData('gp_town', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter town" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input type="text" value={formData.gp_city} onChange={(e) => updateFormData('gp_city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter city" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
          <input type="text" value={formData.gp_postcode} onChange={(e) => updateFormData('gp_postcode', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter postcode" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input type="tel" value={formData.gp_phone} onChange={(e) => updateFormData('gp_phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter phone number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" value={formData.gp_email} onChange={(e) => updateFormData('gp_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Enter email address" />
        </div>
      </div>
    </div>
  );
}

function StepMedicalInfo({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Information</h2>
        <p className="text-sm text-gray-600">Optional medical conditions or disclaimers</p>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Main Member</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disclaimer</label>
              <input type="text" value={formData.main_disclaimer} onChange={(e) => updateFormData('main_disclaimer', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Any disclaimers" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
              <textarea value={formData.main_conditions} onChange={(e) => updateFormData('main_conditions', e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="List any relevant medical conditions" />
            </div>
          </div>
        </div>

        {formData.app_type === 'joint' && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Joint Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Disclaimer</label>
                <input type="text" value={formData.joint_disclaimer} onChange={(e) => updateFormData('joint_disclaimer', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Any disclaimers" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                <textarea value={formData.joint_conditions} onChange={(e) => updateFormData('joint_conditions', e.target.value)} rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="List any relevant medical conditions" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDocuments({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents</h2>
        <p className="text-sm text-gray-600">Document upload feature (coming soon)</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
        <h3 className="font-medium text-blue-900 mb-2">Document Upload Placeholder</h3>
        <p className="text-sm text-blue-700 mb-4">
          Document upload functionality will be added in the next phase. Required documents include:
        </p>
        <ul className="text-sm text-blue-700 text-left max-w-md mx-auto space-y-1">
          <li>• Photo ID (main member)</li>
          <li>• Proof of Address (main member)</li>
          {formData.app_type === 'joint' && (
            <>
              <li>• Photo ID (joint member)</li>
              <li>• Proof of Address (joint member)</li>
            </>
          )}
          <li>• Birth certificates (children, if applicable)</li>
        </ul>
        <div className="mt-4">
          <label className="flex items-center justify-center">
            <input type="checkbox" checked={formData.documents_acknowledged}
              onChange={(e) => updateFormData('documents_acknowledged', e.target.checked)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
            <span className="ml-2 text-sm text-gray-700">
              I acknowledge documents will be provided
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function StepDeclarations({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Declarations</h2>
        <p className="text-sm text-gray-600">Please confirm the following declarations</p>
      </div>
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Agreement Signatures</h3>
          <div className="space-y-2">
            <label className="flex items-start">
              <input type="checkbox" checked={formData.agreement_sig_1}
                onChange={(e) => updateFormData('agreement_sig_1', e.target.checked)}
                className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">
                Main member agrees to the terms and conditions of the funeral service
              </span>
            </label>
            {formData.app_type === 'joint' && (
              <label className="flex items-start">
                <input type="checkbox" checked={formData.agreement_sig_2}
                  onChange={(e) => updateFormData('agreement_sig_2', e.target.checked)}
                  className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">
                  Joint member agrees to the terms and conditions of the funeral service
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Funding Signatures</h3>
          <div className="space-y-2">
            <label className="flex items-start">
              <input type="checkbox" checked={formData.funding_sig_1}
                onChange={(e) => updateFormData('funding_sig_1', e.target.checked)}
                className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">
                Main member acknowledges the funding requirements
              </span>
            </label>
            {formData.app_type === 'joint' && (
              <label className="flex items-start">
                <input type="checkbox" checked={formData.funding_sig_2}
                  onChange={(e) => updateFormData('funding_sig_2', e.target.checked)}
                  className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">
                  Joint member acknowledges the funding requirements
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Declaration Signatures</h3>
          <div className="space-y-2">
            <label className="flex items-start">
              <input type="checkbox" checked={formData.declaration_sig_1}
                onChange={(e) => updateFormData('declaration_sig_1', e.target.checked)}
                className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
              <span className="ml-2 text-sm text-gray-700">
                Main member declares all information provided is accurate
              </span>
            </label>
            {formData.app_type === 'joint' && (
              <label className="flex items-start">
                <input type="checkbox" checked={formData.declaration_sig_2}
                  onChange={(e) => updateFormData('declaration_sig_2', e.target.checked)}
                  className="h-4 w-4 mt-1 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700">
                  Joint member declares all information provided is accurate
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPayment({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Summary</h2>
        <p className="text-sm text-gray-600">Review fees and select payment method</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-yellow-50 border-2 border-emerald-200 rounded-xl p-6">
        <h3 className="font-semibold text-emerald-900 mb-4">Fee Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
            <span className="text-gray-700">Main Member - Joining Fee</span>
            <span className="font-semibold text-gray-900">£{formData.main_joining_fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
            <span className="text-gray-700">Main Member - Membership Fee</span>
            <span className="font-semibold text-gray-900">£{formData.main_membership_fee.toFixed(2)}</span>
          </div>
          {formData.app_type === 'joint' && (
            <>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                <span className="text-gray-700">Joint Member - Joining Fee</span>
                <span className="font-semibold text-gray-900">£{formData.joint_joining_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                <span className="text-gray-700">Joint Member - Membership Fee</span>
                <span className="font-semibold text-gray-900">£{formData.joint_membership_fee.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center pt-3 border-t-2 border-emerald-400">
            <span className="text-lg font-bold text-emerald-900">Total Amount</span>
            <span className="text-2xl font-bold text-emerald-900">£{formData.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
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
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> PayPal integration coming soon. For now, payment will be marked as pending and can be processed manually.
        </p>
      </div>
    </div>
  );
}