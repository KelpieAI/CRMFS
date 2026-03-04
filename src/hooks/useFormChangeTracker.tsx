import { useState, useCallback, useRef } from 'react';

export interface FieldChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface ChangeTrackerState {
  hasChanges: boolean;
  changedFields: FieldChange[];
  originalData: Record<string, any> | null;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  first_name: 'First Name',
  last_name: 'Last Name',
  dob: 'Date of Birth',
  date_of_birth: 'Date of Birth',
  email: 'Email',
  mobile: 'Mobile Phone',
  home_phone: 'Home Phone',
  work_phone: 'Work Phone',
  address_line_1: 'Address',
  address: 'Address',
  town: 'Town',
  city: 'City',
  postcode: 'Postcode',
  status: 'Status',
  notes: 'Notes',
  relation: 'Relationship',
  relationship: 'Relationship',
  gp_name_surgery: 'GP Surgery Name',
  phone: 'Phone',
  conditions: 'Medical Conditions',
  disclaimer: 'Medical Disclaimer',
  member_type: 'Member Type',
  next_renewal_date: 'Next Renewal Date',
  join_date: 'Join Date',
  consent_personal_data: 'Personal Data Consent',
  consent_medical_data: 'Medical Data Consent',
  consent_gp_data: 'GP Data Consent',
  consent_data_sharing: 'Data Sharing Consent',
  consent_data_retention: 'Data Retention Consent',
  consent_international_transfer: 'International Transfer Consent',
  'email_preferences.newsletters': 'Newsletter Subscription',
  'email_preferences.renewal_reminders': 'Renewal Reminders',
  'email_preferences.late_payment_warnings': 'Late Payment Warnings',
  'email_preferences.system_announcements': 'System Announcements',
};

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return a === b;
}

function compareObjects(
  original: Record<string, any> | null,
  current: Record<string, any> | null,
  prefix = ''
): FieldChange[] {
  if (!original || !current) return [];

  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const oldVal = original[key];
    const newVal = current[key];

    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'member_id' || key === 'last_accessed_date') {
      continue;
    }

    if (typeof oldVal === 'object' && oldVal !== null && !Array.isArray(oldVal) &&
        typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
      changes.push(...compareObjects(oldVal, newVal, fullKey));
    } else if (!deepEqual(oldVal, newVal)) {
      changes.push({
        field: fullKey,
        label: getFieldLabel(fullKey),
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

export function useFormChangeTracker() {
  const [state, setState] = useState<ChangeTrackerState>({
    hasChanges: false,
    changedFields: [],
    originalData: null,
  });

  const originalDataRef = useRef<Record<string, any> | null>(null);

  const initializeTracking = useCallback((data: Record<string, any>) => {
    const clonedData = JSON.parse(JSON.stringify(data));
    originalDataRef.current = clonedData;
    setState({
      hasChanges: false,
      changedFields: [],
      originalData: clonedData,
    });
  }, []);

  const checkForChanges = useCallback((currentData: Record<string, any>) => {
    if (!originalDataRef.current) return;

    const changes = compareObjects(originalDataRef.current, currentData);
    setState(prev => ({
      ...prev,
      hasChanges: changes.length > 0,
      changedFields: changes,
    }));
  }, []);

  const resetTracking = useCallback(() => {
    originalDataRef.current = null;
    setState({
      hasChanges: false,
      changedFields: [],
      originalData: null,
    });
  }, []);

  const getChangeSummary = useCallback((): string => {
    if (state.changedFields.length === 0) return '';

    const fieldNames = state.changedFields.map(c => c.label);
    if (fieldNames.length === 1) {
      return `Modified: ${fieldNames[0]}`;
    }
    if (fieldNames.length <= 3) {
      return `Modified ${fieldNames.length} fields: ${fieldNames.join(', ')}`;
    }
    return `Modified ${fieldNames.length} fields: ${fieldNames.slice(0, 3).join(', ')}, and ${fieldNames.length - 3} more`;
  }, [state.changedFields]);

  return {
    hasChanges: state.hasChanges,
    changedFields: state.changedFields,
    originalData: state.originalData,
    initializeTracking,
    checkForChanges,
    resetTracking,
    getChangeSummary,
    formatValue,
    getFieldLabel,
  };
}

export type { FieldChange as ChangeField };
export { formatValue, getFieldLabel, compareObjects };
