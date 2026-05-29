import { useNavigate } from 'react-router-dom';
import { VERSION_STRING } from '../lib/version';

export default function ServerError() {
  const navigate = useNavigate();

  const errorDetails = {
    hostname: window.location.hostname,
    logRef: `500-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    errorType: 'InternalServerError',
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
          <div style={{ fontSize: '72px', marginBottom: '10px' }}>💥</div>
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
            Error 500: Internal Server Error
          </p>
        </div>

        {/* Explanation */}
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
        }}>
          <p style={{ 
            fontSize: '15px', 
            color: '#991b1b',
            margin: 0,
            lineHeight: '1.6',
          }}>
            Something went wrong on our end. The server encountered an unexpected error 
            and couldn't complete your request. This is definitely not your fault.
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
            Please send a screenshot of this page to{' '}
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
            onClick={() => window.location.reload()}
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
            🔄 Try Again
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
