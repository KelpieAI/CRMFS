import {
  getMemberPaymentDisplayStatus,
  getMemberPaymentSummary,
  type PaymentLike,
} from './paymentDisplay';

export type AppType = 'single' | 'joint';

export interface MemberDocumentRequirementsInput {
  appType: AppType;
  mainPhotoIdUrl?: string | null;
  mainProofAddressUrl?: string | null;
  jointPhotoIdUrl?: string | null;
  jointProofAddressUrl?: string | null;
  mainPhotoIdFile?: File | null;
  mainProofAddressFile?: File | null;
  jointPhotoIdFile?: File | null;
  jointProofAddressFile?: File | null;
  children?: Array<{
    id?: string;
    first_name?: string;
    last_name?: string;
    birth_certificate_url?: string | null;
  }>;
  childBirthCertFiles?: (File | null | undefined)[];
}

export interface MemberStatusResolution {
  status: 'active' | 'pending';
  paymentStatus: 'completed' | 'pending';
  missingDocuments: string[];
}

function hasMainPhotoId(input: MemberDocumentRequirementsInput): boolean {
  return !!(input.mainPhotoIdUrl || input.mainPhotoIdFile);
}

function hasMainProofAddress(input: MemberDocumentRequirementsInput): boolean {
  return !!(input.mainProofAddressUrl || input.mainProofAddressFile);
}

function hasJointPhotoId(input: MemberDocumentRequirementsInput): boolean {
  return !!(input.jointPhotoIdUrl || input.jointPhotoIdFile);
}

function hasJointProofAddress(input: MemberDocumentRequirementsInput): boolean {
  return !!(input.jointProofAddressUrl || input.jointProofAddressFile);
}

export function getMissingRequiredDocuments(input: MemberDocumentRequirementsInput): string[] {
  const missing: string[] = [];

  if (!hasMainPhotoId(input)) {
    missing.push('Main member photo ID');
  }
  if (!hasMainProofAddress(input)) {
    missing.push('Main member proof of address');
  }

  if (input.appType === 'joint') {
    if (!hasJointPhotoId(input)) {
      missing.push('Joint member photo ID');
    }
    if (!hasJointProofAddress(input)) {
      missing.push('Joint member proof of address');
    }
  }

  const children = input.children ?? [];
  children.forEach((child, index) => {
    const hasCert =
      !!child.birth_certificate_url || !!input.childBirthCertFiles?.[index];
    if (!hasCert) {
      const name =
        [child.first_name, child.last_name].filter(Boolean).join(' ') ||
        `Child ${index + 1}`;
      missing.push(`Birth certificate for ${name}`);
    }
  });

  return missing;
}

export function hasRequiredDocuments(input: MemberDocumentRequirementsInput): boolean {
  return getMissingRequiredDocuments(input).length === 0;
}

export function memberDocumentInputFromMember(
  member: {
    app_type?: AppType;
    main_photo_id_url?: string | null;
    main_proof_address_url?: string | null;
    joint_photo_id_url?: string | null;
    joint_proof_address_url?: string | null;
  },
  children: Array<{ birth_certificate_url?: string | null }> = []
): MemberDocumentRequirementsInput {
  return {
    appType: (member.app_type as AppType) || 'single',
    mainPhotoIdUrl: member.main_photo_id_url,
    mainProofAddressUrl: member.main_proof_address_url,
    jointPhotoIdUrl: member.joint_photo_id_url,
    jointProofAddressUrl: member.joint_proof_address_url,
    children,
  };
}

export function registrationDocumentInput(params: {
  appType: AppType;
  mainPhotoId: File | null;
  mainProofOfAddress: File | null;
  jointPhotoId: File | null;
  jointProofOfAddress: File | null;
  children: Array<{ first_name?: string; last_name?: string }>;
  childBirthCerts: (File | null)[];
}): MemberDocumentRequirementsInput {
  return {
    appType: params.appType,
    mainPhotoIdFile: params.mainPhotoId,
    mainProofAddressFile: params.mainProofOfAddress,
    jointPhotoIdFile: params.jointPhotoId,
    jointProofAddressFile: params.jointProofOfAddress,
    children: params.children,
    childBirthCertFiles: params.childBirthCerts,
  };
}

/** Determines member/payment status at registration submit. */
export function resolveMemberStatusOnRegistration(
  paymentReceived: boolean,
  input: MemberDocumentRequirementsInput
): MemberStatusResolution {
  const missingDocuments = getMissingRequiredDocuments(input);

  if (!paymentReceived) {
    return {
      status: 'pending',
      paymentStatus: 'pending',
      missingDocuments,
    };
  }

  if (!hasRequiredDocuments(input)) {
    return {
      status: 'pending',
      paymentStatus: 'completed',
      missingDocuments,
    };
  }

  return {
    status: 'active',
    paymentStatus: 'completed',
    missingDocuments: [],
  };
}

export type MemberPaymentRow = PaymentLike;

export interface MemberActivationEligibility {
  canActivate: boolean;
  missingDocuments: string[];
  hasCompletedPayment: boolean;
  outstandingBalance: number;
  blockers: string[];
}

/** Whether a member can be set to active (payments cleared + required documents). */
export function getMemberActivationEligibility(
  member: {
    app_type?: AppType;
    main_photo_id_url?: string | null;
    main_proof_address_url?: string | null;
    joint_photo_id_url?: string | null;
    joint_proof_address_url?: string | null;
  },
  children: Array<{ birth_certificate_url?: string | null }> = [],
  payments: MemberPaymentRow[] = []
): MemberActivationEligibility {
  const docInput = memberDocumentInputFromMember(member, children);
  const missingDocuments = getMissingRequiredDocuments(docInput);

  const { outstanding: outstandingBalance, hasCompletedPayment } =
    getMemberPaymentSummary(payments);

  const blockers: string[] = [];
  if (!hasCompletedPayment) {
    blockers.push('No completed payment on record');
  }
  if (outstandingBalance > 0) {
    const paymentDisplay = getMemberPaymentDisplayStatus(payments);
    if (paymentDisplay.kind === 'failed') {
      blockers.push(
        `Failed payment — £${outstandingBalance.toFixed(2)} overdue (30+ days). Clear the full balance before reactivating.`
      );
    } else {
      blockers.push(
        `Outstanding balance of £${outstandingBalance.toFixed(2)} remaining`
      );
    }
  }
  if (missingDocuments.length > 0) {
    blockers.push(...missingDocuments.map((d) => `Missing: ${d}`));
  }

  const canActivate =
    hasCompletedPayment &&
    outstandingBalance === 0 &&
    missingDocuments.length === 0;

  return {
    canActivate,
    missingDocuments,
    hasCompletedPayment,
    outstandingBalance,
    blockers,
  };
}
