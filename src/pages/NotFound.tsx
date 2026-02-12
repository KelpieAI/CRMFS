import { useNavigate } from 'react-router-dom';
import { VERSION_STRING } from '../lib/version';

export default function NotFound() {
  const navigate = useNavigate();

  const errorDetails = {
    hostname: window.location.hostname,
    logRef: `404-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    errorType: 'PageNotFound',
    attemptedPath: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  const copyErrorDetails = () => {
    const text = `Hostname: ${errorDetails.hostname}
Log Ref: ${errorDetails.logRef}
Error Type: ${errorDetails.errorType}
Attempted Path: ${errorDetails.attemptedPath}
Timestamp: ${errorDetails.timestamp}`;

    navigator.clipboard.writeText(text);
    alert('Error details copied to clipboard!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '600px',
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '72px', marginBottom: '10px' }}>🤦</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '10px',
          }}>
            Oh no! That wasn't supposed to happen...
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            fontWeight: 600,
          }}>
            Error 404: Page Not Found
          </p>
        </div>

        {/* Explanation */}
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
        }}>
          <p style={{
            fontSize: '15px',
            color: '#92400e',
            margin: 0,
            lineHeight: '1.6',
          }}>
            The page you're looking for doesn't exist. You might have followed a broken link,
            or the committee may have moved things around without telling anyone.
          </p>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{
            fontSize: '15px',
            color: '#374151',
            marginBottom: '15px',
            lineHeight: '1.6',
          }}>
            If you think this page <strong>should</strong> exist, please send a screenshot of this page to{' '}
            <a
              href="mailto:sami@kelpieai.co.uk"
              style={{ color: '#2d5016', fontWeight: 600, textDecoration: 'underline' }}
            >
              Kelpie AI
            </a>
            {' '}and describe in as much detail as possible how you came to{' '}
            <span style={{
              textDecoration: 'line-through',
              color: '#ef4444',
            }}>
              break CRMFS
            </span>
            {' '}see this error page.
          </p>

          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '10px',
          }}>
            Copy and attach the following message into the email:
          </p>

          <div style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#1f2937',
            position: 'relative',
          }}>
            <div style={{ marginBottom: '4px' }}>• Hostname: {errorDetails.hostname}</div>
            <div style={{ marginBottom: '4px' }}>• Log Ref: {errorDetails.logRef}</div>
            <div style={{ marginBottom: '4px' }}>• Error Type: {errorDetails.errorType}</div>
            <div style={{ marginBottom: '4px' }}>• Attempted Path: {errorDetails.attemptedPath}</div>
            <div>• Timestamp: {errorDetails.timestamp}</div>
          </div>

          <button
            onClick={copyErrorDetails}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#2d5016',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Copy Error Details
          </button>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              background: '#2d5016',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🏠 Go to Dashboard
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            margin: 0,
          }}>
            Powered by Kelpie AI | {VERSION_STRING}
          </p>
        </div>
      </div>
    </div>
  );
}
