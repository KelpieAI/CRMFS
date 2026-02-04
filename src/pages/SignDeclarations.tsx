import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TokenData {
  id: string;
  member_id: string;
  token_type: string;
  is_valid: boolean;
  expires_at: string;
  used_at: string | null;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

type PageState = 'loading' | 'invalid' | 'expired' | 'already_used' | 'ready' | 'submitting' | 'success' | 'error';

export default function SignDeclarations() {
  const [state, setState] = useState<PageState>('loading');
  const [member, setMember] = useState<Member | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Checkbox & signature state
  const [checkedMedical, setCheckedMedical] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [signature, setSignature] = useState('');
  const [signatureError, setSignatureError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setState('invalid');
      return;
    }

    validateToken(token);
  }, []);

  const validateToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('email_tokens')
        .select('*')
        .eq('token', token)
        .eq('token_type', 'declarations_signature')
        .single();

      if (error || !data) { setState('invalid'); return; }
      if (data.used_at) { setState('already_used'); return; }
      if (new Date(data.expires_at) < new Date()) { setState('expired'); return; }
      if (!data.is_valid) { setState('invalid'); return; }

      setTokenData(data);

      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('id', data.member_id)
        .single();

      if (memberError || !memberData) { setState('invalid'); return; }

      setMember(memberData);
      setState('ready');

    } catch (err) {
      console.error('Token validation error:', err);
      setState('error');
      setErrorMessage('Something went wrong while verifying your link.');
    }
  };

  const handleSubmit = async () => {
    if (!member || !tokenData) return;

    // Validate checkboxes
    if (!checkedMedical || !checkedTerms) {
      setSignatureError('You must agree to both declarations before signing.');
      return;
    }

    // Validate signature matches full name
    const expectedName = `${member.first_name} ${member.last_name}`.toLowerCase();
    if (signature.trim().toLowerCase() !== expectedName) {
      setSignatureError(`Please type your full name exactly: ${member.first_name} ${member.last_name}`);
      return;
    }

    setSignatureError('');
    setState('submitting');

    try {
      // Insert the signed declarations
      await supabase.from('declarations').insert({
        member_id: member.id,
        medical_sig_1: true,
        agreement_sig_1: true,
        signed_at: new Date().toISOString(),
      });

      // Mark token as used
      await supabase.from('email_tokens').update({
        used_at: new Date().toISOString(),
        used_from_ip: 'client-side',
      }).eq('id', tokenData.id);

      // Activity log
      await supabase.from('activity_log').insert({
        member_id: member.id,
        action_type: 'member_edited',
        entity_type: 'declaration',
        description: `Declarations signed by member via secure email link. Digital signature: "${signature}"`,
      });

      setState('success');

    } catch (err) {
      console.error('Submit error:', err);
      setState('error');
      setErrorMessage('Submission failed. Please try again or contact us.');
    }
  };

  // ─── STYLES ───
  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: '20px',
    },
    card: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '560px',
      overflow: 'hidden' as const,
    },
    header: {
      background: 'linear-gradient(135deg, #2d5016, #3d6622)',
      padding: '32px 28px',
      textAlign: 'center' as const,
    },
    headerTitle: {
      color: '#fff',
      fontSize: '22px',
      fontWeight: 700,
      margin: '0 0 6px 0',
    },
    headerSub: {
      color: '#D4AF37',
      fontSize: '13px',
      fontWeight: 600,
      margin: 0,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    body: {
      padding: '28px',
    },
    greeting: {
      color: '#1f2937',
      fontSize: '16px',
      margin: '0 0 8px 0',
    },
    intro: {
      color: '#6b7280',
      fontSize: '14px',
      margin: '0 0 20px 0',
      lineHeight: 1.5,
    },
    redWarning: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '12px 16px',
      margin: '0 0 24px 0',
    },
    redWarningText: {
      color: '#991b1b',
      fontSize: '14px',
      margin: 0,
    },
    sectionTitle: {
      color: '#1f2937',
      fontSize: '15px',
      fontWeight: 700,
      margin: '0 0 10px 0',
    },
    declarationBox: {
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '14px 16px',
      margin: '0 0 12px 0',
      maxHeight: '130px',
      overflowY: 'auto' as const,
    },
    declarationText: {
      color: '#4b5563',
      fontSize: '13px',
      margin: 0,
      lineHeight: 1.6,
    },
    checkLabel: {
      display: 'flex' as const,
      alignItems: 'flex-start' as const,
      gap: '10px',
      cursor: 'pointer',
      margin: '0 0 24px 0',
    },
    checkText: {
      color: '#374151',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '17px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    errorText: {
      color: '#dc2626',
      fontSize: '13px',
      margin: '8px 0 0 0',
    },
    button: (disabled: boolean) => ({
      width: '100%',
      padding: '14px',
      background: disabled ? '#9ca3af' : '#2d5016',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer',
      marginTop: '24px',
      transition: 'background 0.2s',
    }),
    legalNote: {
      color: '#9ca3af',
      fontSize: '12px',
      textAlign: 'center' as const,
      margin: '16px 0 0 0',
      lineHeight: 1.5,
    },
    footer: {
      background: '#f9fafb',
      padding: '16px 28px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
    },
    footerText: {
      color: '#9ca3af',
      fontSize: '12px',
      margin: 0,
    },
    statusBox: {
      textAlign: 'center' as const,
      padding: '12px 0',
    },
    statusIcon: {
      fontSize: '48px',
      margin: '0 0 16px 0',
    },
    statusTitle: (color: string) => ({
      color,
      fontSize: '20px',
      fontWeight: 700,
      margin: '0 0 8px 0',
    }),
    statusDesc: {
      color: '#6b7280',
      fontSize: '15px',
      margin: 0,
      lineHeight: 1.5,
    },
  };

  // ─── Status screens (loading / invalid / expired / used / success / error) ───
  if (state === 'loading') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusDesc}>Verifying your link...</p>
        </div>
      </div></div>
    );
  }

  if (state === 'invalid') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusIcon}>❌</p>
          <p style={styles.statusTitle('#dc2626')}>Invalid Link</p>
          <p style={styles.statusDesc}>This link is not valid. It may have been tampered with or does not exist.<br /><br />Please contact the committee for a new link.</p>
        </div>
      </div></div>
    );
  }

  if (state === 'expired') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusIcon}>⏰</p>
          <p style={styles.statusTitle('#d97706')}>Link Expired</p>
          <p style={styles.statusDesc}>This link expired after 7 days. Please contact the committee and they can send you a fresh one.</p>
        </div>
      </div></div>
    );
  }

  if (state === 'already_used') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusIcon}>🔒</p>
          <p style={styles.statusTitle('#7c3aed')}>Already Signed</p>
          <p style={styles.statusDesc}>You have already signed the declarations using this link. Each link can only be used once.<br /><br />Contact the committee if you need anything changed.</p>
        </div>
      </div></div>
    );
  }

  if (state === 'success') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusIcon}>✅</p>
          <p style={styles.statusTitle('#16a34a')}>Declarations Signed!</p>
          <p style={styles.statusDesc}>Thank you, {member?.first_name}. Both declarations have been recorded.<br /><br />The committee will review and activate your membership shortly.</p>
        </div>
        <div style={styles.footer}>
          <p style={styles.footerText}>© {new Date().getFullYear()} CRMFS | Powered by Kelpie AI</p>
        </div>
      </div></div>
    );
  }

  if (state === 'error') {
    return (
      <div style={styles.page}><div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Sign Declarations</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={{ ...styles.body, ...styles.statusBox }}>
          <p style={styles.statusIcon}>⚠️</p>
          <p style={styles.statusTitle('#dc2626')}>Something Went Wrong</p>
          <p style={styles.statusDesc}>{errorMessage}</p>
        </div>
      </div></div>
    );
  }

  // ─── MAIN FORM (state === 'ready' or 'submitting') ───
  const canSubmit = checkedMedical && checkedTerms && signature.trim().toLowerCase() === `${member?.first_name} ${member?.last_name}`.toLowerCase();

  return (
    <div style={styles.page}><div style={styles.card}>
      <div style={styles.header}>
        <p style={styles.headerTitle}>Sign Your Declarations</p>
        <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
      </div>
      <div style={styles.body}>
        <p style={styles.greeting}>Hello {member?.first_name} {member?.last_name},</p>
        <p style={styles.intro}>Please read both declarations below, tick the boxes to confirm you agree, then type your full name as your digital signature.</p>

        {/* Legal warning */}
        <div style={styles.redWarning}>
          <p style={styles.redWarningText}>⚠️ <strong>Important:</strong> Your membership cannot be activated until these are signed. This is a legal requirement for funeral service coverage.</p>
        </div>

        {/* Declaration 1 — Medical Consent */}
        <p style={styles.sectionTitle}>Section 6: Medical Consent</p>
        <div style={styles.declarationBox}>
          <p style={styles.declarationText}>
            I hereby authorise the Central Region Muslim Funeral Service to disclose my medical information to the extent necessary for the provision of funeral services. I understand that this consent is required for the service to function effectively and that my information will be handled in accordance with GDPR and applicable data protection laws. I confirm that I have read and understood this declaration and that I freely give my consent.
          </p>
        </div>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={checkedMedical}
            onChange={(e) => setCheckedMedical(e.target.checked)}
            disabled={state === 'submitting'}
            style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#2d5016' }}
          />
          <span style={styles.checkText}>I have read and <strong>agree</strong> to the Medical Consent declaration.</span>
        </label>

        {/* Declaration 2 — Terms & Conditions */}
        <p style={styles.sectionTitle}>Section 7: Terms & Conditions</p>
        <div style={styles.declarationBox}>
          <p style={styles.declarationText}>
            I agree to the Terms and Conditions of the Central Region Muslim Funeral Service. I understand that membership provides funeral service coverage for myself and my registered family members. I acknowledge that membership fees must be kept up to date for service coverage to remain active, and that failure to maintain payments may result in the suspension of services. I understand that CRMFS reserves the right to amend these terms with reasonable notice. By signing, I confirm my full agreement to all terms and conditions as set out by the CRMFS.
          </p>
        </div>
        <label style={styles.checkLabel}>
          <input
            type="checkbox"
            checked={checkedTerms}
            onChange={(e) => setCheckedTerms(e.target.checked)}
            disabled={state === 'submitting'}
            style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#2d5016' }}
          />
          <span style={styles.checkText}>I have read and <strong>agree</strong> to the Terms & Conditions.</span>
        </label>

        {/* Signature input */}
        <p style={styles.sectionTitle}>✍️ Digital Signature</p>
        <p style={{ ...styles.intro, marginBottom: '8px' }}>Type your full name exactly as shown: <strong>{member?.first_name} {member?.last_name}</strong></p>
        <input
          type="text"
          style={styles.input}
          value={signature}
          placeholder={`${member?.first_name} ${member?.last_name}`}
          onChange={(e) => setSignature(e.target.value)}
          disabled={state === 'submitting'}
        />
        {signatureError && <p style={styles.errorText}>{signatureError}</p>}

        {/* Submit */}
        <button
          style={styles.button(!canSubmit || state === 'submitting')}
          disabled={!canSubmit || state === 'submitting'}
          onClick={handleSubmit}
        >
          {state === 'submitting' ? 'Submitting...' : '✍️ Sign & Submit'}
        </button>

        <p style={styles.legalNote}>🔒 This is a legally binding digital signature.<br />© {new Date().getFullYear()} CRMFS | Powered by Kelpie AI</p>
      </div>
    </div></div>
  );
}