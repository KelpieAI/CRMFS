import { useState } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SendEmailPanelProps {
  member: any;
  onClose: () => void;
}

type EmailTemplate =
  | 'renewal_reminder'
  | 'late_payment_warning'
  | 'membership_paused'
  | 'payment_confirmation'
  | 'membership_activation'
  | 'document_upload_link'
  | 'declarations_signature_link';

interface EmailTemplateOption {
  id: EmailTemplate;
  name: string;
  description: string;
  category: 'automated' | 'scheduled' | 'magic_link';
}

const EMAIL_TEMPLATES: EmailTemplateOption[] = [
  {
    id: 'renewal_reminder',
    name: 'Renewal Reminder',
    description: 'Send membership renewal reminder with payment details',
    category: 'scheduled'
  },
  {
    id: 'late_payment_warning',
    name: 'Late Payment Warning',
    description: 'Send overdue payment warning with late fee information',
    category: 'scheduled'
  },
  {
    id: 'membership_paused',
    name: 'Membership Paused',
    description: 'Notify member about paused membership status',
    category: 'automated'
  },
  {
    id: 'payment_confirmation',
    name: 'Payment Confirmation',
    description: 'Send payment received confirmation',
    category: 'automated'
  },
  {
    id: 'membership_activation',
    name: 'Membership Activation',
    description: 'Welcome email for newly activated membership',
    category: 'automated'
  },
  {
    id: 'document_upload_link',
    name: 'Document Upload Link',
    description: 'Send secure link for document upload',
    category: 'magic_link'
  },
  {
    id: 'declarations_signature_link',
    name: 'Declaration Signature Link',
    description: 'Send secure link for signing declarations',
    category: 'magic_link'
  }
];

export default function SendEmailPanel({ member, onClose }: SendEmailPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendEmail = async () => {
    if (!selectedTemplate) {
      setErrorMessage('Please select an email template');
      setSendStatus('error');
      return;
    }

    setIsSending(true);
    setSendStatus('idle');
    setErrorMessage('');

    try {
      if (selectedTemplate === 'document_upload_link' || selectedTemplate === 'declarations_signature_link') {
        const tokenType = selectedTemplate === 'document_upload_link'
          ? 'document_upload'
          : 'declarations_signature';

        const { error } = await supabase.functions.invoke('resend-member-email', {
          body: {
            memberId: member.id,
            tokenType
          }
        });

        if (error) throw error;

        setSendStatus('success');
      } else {
        const { error } = await supabase.functions.invoke('send-individual-email', {
          body: {
            memberId: member.id,
            emailType: selectedTemplate,
            customSubject: customSubject || undefined,
            customMessage: customMessage || undefined
          }
        });

        if (error) throw error;

        setSendStatus('success');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setErrorMessage(error.message || 'Failed to send email');
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const selectedTemplateData = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Mail className="h-5 w-5 text-[#2d5016]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
              <p className="text-sm text-gray-500">
                {member.first_name} {member.last_name} ({member.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Email Template
              </label>
              <div className="space-y-2">
                {['scheduled', 'automated', 'magic_link'].map(category => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {category === 'scheduled' && 'Scheduled Emails'}
                      {category === 'automated' && 'Automated Emails'}
                      {category === 'magic_link' && 'Magic Links'}
                    </h3>
                    <div className="space-y-2">
                      {EMAIL_TEMPLATES.filter(t => t.category === category).map(template => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedTemplate === template.id
                              ? 'border-[#2d5016] bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {template.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {template.description}
                              </p>
                            </div>
                            {selectedTemplate === template.id && (
                              <CheckCircle className="h-5 w-5 text-[#2d5016] flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedTemplate && selectedTemplateData?.category !== 'magic_link' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Leave blank to use default subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a custom message to include in the email"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>
              </>
            )}

            {sendStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Email sent successfully!</p>
                  <p className="text-sm text-green-700">
                    The email has been sent to {member.email}
                  </p>
                </div>
              </div>
            )}

            {sendStatus === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Failed to send email</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!selectedTemplate || isSending}
              className="px-6 py-2.5 bg-[#2d5016] text-white rounded-lg hover:bg-[#234012] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
