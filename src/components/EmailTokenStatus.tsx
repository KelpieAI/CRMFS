import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface EmailTokenStatusProps {
  memberId: string;
  memberEmail: string;
  memberFirstName: string;
  memberLastName: string;
}

type TokenStatus = 'completed' | 'pending' | 'expired' | 'invalidated' | 'not_sent';

interface TokenData {
  token_id: string;
  email_sent_at: string;
  expires_at: string;
  used_at: string | null;
  status: TokenStatus;
}

export default function EmailTokenStatus({ memberId, memberEmail, memberFirstName: _memberFirstName, memberLastName: _memberLastName }: EmailTokenStatusProps) {
  const [documentStatus, setDocumentStatus] = useState<TokenData | null>(null);
  const [declarationStatus, setDeclarationStatus] = useState<TokenData | null>(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [hasDeclarations, setHasDeclarations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<'docs' | 'declarations' | null>(null);

  useEffect(() => {
    loadTokenStatus();
  }, [memberId]);

  const loadTokenStatus = async () => {
    setLoading(true);
    try {
      // Get document upload token status
      const { data: docToken } = await supabase
        .from('email_tokens')
        .select('id, email_sent_to, created_at, expires_at, used_at, is_valid')
        .eq('member_id', memberId)
        .eq('token_type', 'document_upload')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (docToken) {
        const status = getTokenStatus(docToken);
        setDocumentStatus({
          token_id: docToken.id,
          email_sent_at: docToken.created_at,
          expires_at: docToken.expires_at,
          used_at: docToken.used_at,
          status,
        });
      }

      // Get declarations signature token status
      const { data: declToken } = await supabase
        .from('email_tokens')
        .select('id, email_sent_to, created_at, expires_at, used_at, is_valid')
        .eq('member_id', memberId)
        .eq('token_type', 'declarations_signature')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (declToken) {
        const status = getTokenStatus(declToken);
        setDeclarationStatus({
          token_id: declToken.id,
          email_sent_at: declToken.created_at,
          expires_at: declToken.expires_at,
          used_at: declToken.used_at,
          status,
        });
      }

      // Check if member has actually uploaded documents
      const { data: docs } = await supabase
        .from('documents')
        .select('id')
        .eq('member_id', memberId)
        .in('document_type', ['photo_id', 'proof_of_address']);

      setHasDocuments((docs?.length || 0) >= 2);

      // Check if member has actually signed declarations
      const { data: decls } = await supabase
        .from('declarations')
        .select('id')
        .eq('member_id', memberId)
        .eq('medical_sig_1', true)
        .eq('agreement_sig_1', true)
        .single();

      setHasDeclarations(!!decls);

    } catch (error) {
      console.error('Error loading token status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTokenStatus = (token: any): TokenStatus => {
    if (token.used_at) return 'completed';
    if (!token.is_valid) return 'invalidated';
    if (new Date(token.expires_at) < new Date()) return 'expired';
    return 'pending';
  };

  const handleResend = async (type: 'document_upload' | 'declarations_signature') => {
    setResending(type === 'document_upload' ? 'docs' : 'declarations');
    try {
      const { data, error } = await supabase.functions.invoke('resend-member-email', {
        body: {
          memberId,
          emailType: type,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      // Reload status to show the new token
      await loadTokenStatus();

      // Show success message with magic link in development
      if (data?.magicLink) {
        console.log('Magic link generated:', data.magicLink);
      }

      alert(`Email resent successfully to ${memberEmail}`);
    } catch (error: any) {
      console.error('Resend error:', error);
      const errorMessage = error?.message || 'Failed to resend email. Please try again.';
      alert(errorMessage);
    } finally {
      setResending(null);
    }
  };

  const StatusBadge = ({ status }: { status: TokenStatus }) => {
    const styles = {
      completed: { bg: '#dcfce7', text: '#166534', label: '✓ Completed' },
      pending: { bg: '#fef3c7', text: '#92400e', label: '⏳ Pending' },
      expired: { bg: '#fee2e2', text: '#991b1b', label: '⏰ Expired' },
      invalidated: { bg: '#f3f4f6', text: '#6b7280', label: '✕ Cancelled' },
      not_sent: { bg: '#f3f4f6', text: '#6b7280', label: '─ Not Sent' },
    };

    const style = styles[status];

    return (
      <span style={{
        background: style.bg,
        color: style.text,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading email status...
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>
        📧 Email Token Status
      </h3>

      {/* Document Upload Status */}
      <div style={{ 
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '16px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            📤 Document Upload
          </span>
          <StatusBadge status={documentStatus?.status || 'not_sent'} />
        </div>

        {hasDocuments && (
          <p style={{ fontSize: '13px', color: '#059669', margin: '8px 0' }}>
            ✓ Documents received
          </p>
        )}

        {documentStatus && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            <p style={{ margin: '4px 0' }}>
              Email sent: {new Date(documentStatus.email_sent_at).toLocaleDateString('en-GB')} at {new Date(documentStatus.email_sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {documentStatus.used_at && (
              <p style={{ margin: '4px 0' }}>
                Completed: {new Date(documentStatus.used_at).toLocaleDateString('en-GB')} at {new Date(documentStatus.used_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {!documentStatus.used_at && (
              <p style={{ margin: '4px 0' }}>
                Expires: {new Date(documentStatus.expires_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        )}

        {(documentStatus?.status === 'expired' || documentStatus?.status === 'pending') && !hasDocuments && (
          <button
            onClick={() => handleResend('document_upload')}
            disabled={resending === 'docs'}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: resending === 'docs' ? '#9ca3af' : '#2d5016',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: resending === 'docs' ? 'not-allowed' : 'pointer',
            }}
          >
            {resending === 'docs' ? 'Sending...' : '🔄 Resend Upload Link'}
          </button>
        )}

        {!documentStatus && (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginTop: '8px' }}>
            No email sent yet
          </p>
        )}
      </div>

      {/* Declarations Signature Status */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            ✍️ Declarations Signature
          </span>
          <StatusBadge status={declarationStatus?.status || 'not_sent'} />
        </div>

        {hasDeclarations && (
          <p style={{ fontSize: '13px', color: '#059669', margin: '8px 0' }}>
            ✓ Declarations signed
          </p>
        )}

        {declarationStatus && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            <p style={{ margin: '4px 0' }}>
              Email sent: {new Date(declarationStatus.email_sent_at).toLocaleDateString('en-GB')} at {new Date(declarationStatus.email_sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {declarationStatus.used_at && (
              <p style={{ margin: '4px 0' }}>
                Completed: {new Date(declarationStatus.used_at).toLocaleDateString('en-GB')} at {new Date(declarationStatus.used_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {!declarationStatus.used_at && (
              <p style={{ margin: '4px 0' }}>
                Expires: {new Date(declarationStatus.expires_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        )}

        {(declarationStatus?.status === 'expired' || declarationStatus?.status === 'pending') && !hasDeclarations && (
          <button
            onClick={() => handleResend('declarations_signature')}
            disabled={resending === 'declarations'}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: resending === 'declarations' ? '#9ca3af' : '#2d5016',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: resending === 'declarations' ? 'not-allowed' : 'pointer',
            }}
          >
            {resending === 'declarations' ? 'Sending...' : '🔄 Resend Signature Link'}
          </button>
        )}

        {!declarationStatus && (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', marginTop: '8px' }}>
            No email sent yet
          </p>
        )}
      </div>
    </div>
  );
}