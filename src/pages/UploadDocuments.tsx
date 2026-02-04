import { useState, useEffect, useRef } from 'react';
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

type PageState = 'loading' | 'invalid' | 'expired' | 'already_used' | 'ready' | 'uploading' | 'success' | 'error';

export default function UploadDocuments() {
  const [state, setState] = useState<PageState>('loading');
  const [member, setMember] = useState<Member | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [files, setFiles] = useState<{ photoId: File | null; proofOfAddress: File | null }>({ photoId: null, proofOfAddress: null });
  const [errorMessage, setErrorMessage] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Extract token from URL
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
      // Look up the token
      const { data, error } = await supabase
        .from('email_tokens')
        .select('*')
        .eq('token', token)
        .eq('token_type', 'document_upload')
        .single();

      if (error || !data) {
        setState('invalid');
        return;
      }

      // Already used?
      if (data.used_at) {
        setState('already_used');
        return;
      }

      // Expired?
      if (new Date(data.expires_at) < new Date()) {
        setState('expired');
        return;
      }

      // Not valid?
      if (!data.is_valid) {
        setState('invalid');
        return;
      }

      setTokenData(data);

      // Get the member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .eq('id', data.member_id)
        .single();

      if (memberError || !memberData) {
        setState('invalid');
        return;
      }

      setMember(memberData);
      setState('ready');

    } catch (err) {
      console.error('Token validation error:', err);
      setState('error');
      setErrorMessage('Something went wrong while verifying your link.');
    }
  };

  const handleFileChange = (type: 'photoId' | 'proofOfAddress', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleUpload = async () => {
    if (!files.photoId || !files.proofOfAddress || !tokenData || !member) return;

    setState('uploading');

    try {
      const uploadFile = async (file: File, docType: string) => {
        const fileName = `${member.id}/${docType}_${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('member-documents')
          .upload(fileName, file, { contentType: file.type, upsert: true });

        if (error) throw new Error(`Upload failed for ${docType}: ${error.message}`);
        return data.path;
      };

      // Upload both files
      const [photoPath, addressPath] = await Promise.all([
        uploadFile(files.photoId, 'photo_id'),
        uploadFile(files.proofOfAddress, 'proof_of_address'),
      ]);

      // Record documents in the documents table
      await supabase.from('documents').insert([
        { member_id: member.id, document_type: 'photo_id', file_path: photoPath },
        { member_id: member.id, document_type: 'proof_of_address', file_path: addressPath },
      ]);

      // Mark token as used
      await supabase.from('email_tokens').update({
        used_at: new Date().toISOString(),
        used_from_ip: 'client-side', // Can't get real IP client-side
      }).eq('id', tokenData.id);

      // Log activity
      await supabase.from('activity_log').insert({
        member_id: member.id,
        action_type: 'document_uploaded',
        entity_type: 'document',
        description: 'Member uploaded Photo ID and Proof of Address via secure email link',
      });

      setState('success');

    } catch (err) {
      console.error('Upload error:', err);
      setState('error');
      setErrorMessage('Upload failed. Please try again or contact us.');
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
      maxWidth: '520px',
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
      margin: '0 0 20px 0',
    },
    infoBox: {
      background: '#f0f9f4',
      borderLeft: '4px solid #2d5016',
      padding: '14px 16px',
      borderRadius: '0 8px 8px 0',
      margin: '0 0 24px 0',
    },
    infoBoxTitle: {
      color: '#1f2937',
      fontSize: '14px',
      fontWeight: 600,
      margin: '0 0 8px 0',
    },
    infoBoxList: {
      color: '#374151',
      fontSize: '14px',
      margin: 0,
      paddingLeft: '18px',
      lineHeight: 1.8,
    },
    formatsNote: {
      color: '#6b7280',
      fontSize: '13px',
      margin: '0 0 24px 0',
    },
    label: {
      color: '#374151',
      fontSize: '14px',
      fontWeight: 600,
      margin: '0 0 4px 0',
    },
    dropzone: (hasFile: boolean) => ({
      border: `2px dashed ${hasFile ? '#2d5016' : '#d1d5db'}`,
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center' as const,
      background: hasFile ? '#f0f9f4' : '#fafafa',
      cursor: 'pointer' as const,
      margin: '0 0 20px 0',
      transition: 'all 0.2s',
    }),
    dropzoneText: {
      color: '#6b7280',
      fontSize: '14px',
      margin: 0,
    },
    fileChosen: {
      color: '#2d5016',
      fontSize: '14px',
      fontWeight: 600,
      margin: 0,
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
      marginTop: '8px',
      transition: 'background 0.2s',
    }),
    warningBox: {
      background: '#fef3c7',
      borderLeft: '4px solid #f59e0b',
      padding: '12px 14px',
      borderRadius: '0 8px 8px 0',
      margin: '20px 0 0 0',
    },
    warningText: {
      color: '#92400e',
      fontSize: '13px',
      margin: 0,
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
    // Status screens
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
      margin: '0 0 20px 0',
      lineHeight: 1.5,
    },
    statusBox: {
      textAlign: 'center' as const,
      padding: '12px 0',
    },
  };

  // ─── STATUS SCREENS ───
  if (state === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusDesc}>Verifying your link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusIcon}>❌</p>
            <p style={styles.statusTitle('#dc2626')}>Invalid Link</p>
            <p style={styles.statusDesc}>This link is not valid. It may have been tampered with or does not exist.<br /><br />Please contact the committee for a new link.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusIcon}>⏰</p>
            <p style={styles.statusTitle('#d97706')}>Link Expired</p>
            <p style={styles.statusDesc}>This link expired after 7 days. Please contact the committee and they can send you a fresh one.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'already_used') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusIcon}>🔒</p>
            <p style={styles.statusTitle('#7c3aed')}>Already Used</p>
            <p style={styles.statusDesc}>This link has already been used. Each link can only be used once for security.<br /><br />If you need to upload again, please contact the committee.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusIcon}>✅</p>
            <p style={styles.statusTitle('#16a34a')}>Documents Uploaded!</p>
            <p style={styles.statusDesc}>Thank you, {member?.first_name}. Your Photo ID and Proof of Address have been received successfully.<br /><br />The committee will review them shortly.</p>
          </div>
          <div style={styles.footer}>
            <p style={styles.footerText}>© {new Date().getFullYear()} CRMFS | Powered by Kelpie AI</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>Upload Documents</p>
            <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
          </div>
          <div style={{ ...styles.body, ...styles.statusBox }}>
            <p style={styles.statusIcon}>⚠️</p>
            <p style={styles.statusTitle('#dc2626')}>Something Went Wrong</p>
            <p style={styles.statusDesc}>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN UPLOAD FORM (state === 'ready' or 'uploading') ───
  const bothChosen = !!files.photoId && !!files.proofOfAddress;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>Upload Your Documents</p>
          <p style={styles.headerSub}>Central Region Muslim Funeral Service</p>
        </div>
        <div style={styles.body}>
          <p style={styles.greeting}>Hello {member?.first_name} {member?.last_name},</p>

          {/* Photo ID */}
          <p style={styles.label}>📷 Photo ID <span style={{ color: '#ef4444' }}>*</span></p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 8px 0' }}>Passport or Driving Licence · JPG, PNG or PDF (max 5MB)</p>
          <div style={styles.dropzone(!!files.photoId)} onClick={() => photoInputRef.current?.click()}>
            <input
              ref={photoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange('photoId', e)}
              disabled={state === 'uploading'}
            />
            {files.photoId
              ? <p style={styles.fileChosen}>✓ {files.photoId.name}</p>
              : <p style={styles.dropzoneText}>Tap to choose file</p>
            }
          </div>

          {/* Proof of Address */}
          <p style={{ ...styles.label, marginTop: '20px' }}>🏠 Proof of Address <span style={{ color: '#ef4444' }}>*</span></p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 8px 0' }}>Utility Bill or Council Tax (within 3 months) · JPG, PNG or PDF (max 5MB)</p>
          <div style={styles.dropzone(!!files.proofOfAddress)} onClick={() => addressInputRef.current?.click()}>
            <input
              ref={addressInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange('proofOfAddress', e)}
              disabled={state === 'uploading'}
            />
            {files.proofOfAddress
              ? <p style={styles.fileChosen}>✓ {files.proofOfAddress.name}</p>
              : <p style={styles.dropzoneText}>Tap to choose file</p>
            }
          </div>

          {/* Submit */}
          <button
            style={styles.button(!bothChosen || state === 'uploading')}
            disabled={!bothChosen || state === 'uploading'}
            onClick={handleUpload}
          >
            {state === 'uploading' ? 'Uploading...' : '📤 Upload Documents'}
          </button>

          <div style={styles.warningBox}>
            <p style={styles.warningText}>🔒 <strong>Security:</strong> This is a single-use secure link. Your documents are encrypted and handled in accordance with data protection regulations.</p>
          </div>
        </div>
        <div style={styles.footer}>
          <p style={styles.footerText}>© {new Date().getFullYear()} CRMFS | Powered by Kelpie AI</p>
        </div>
      </div>
    </div>
  );
}