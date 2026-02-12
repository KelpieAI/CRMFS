import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Shield, FileText, Trash2, CheckCircle, XCircle, Clock, Download, Palette, Moon, Sun, Mail, Save, DollarSign, Info, Users, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { VERSION_STRING } from '../lib/version';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('appearance');
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [emailPreferences, setEmailPreferences] = useState({
    senderName: 'Central Region Muslim Funeral Service',
    emailSignature: 'Central Region Muslim Funeral Service\nFalkirk Central Mosque\nPhone: [committee phone]\nEmail: crmfs@kelpieai.co.uk',
    ccCommitteeOnMemberEmails: false,
    memberActionNotifications: true,
  });
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({
    annual_fee: 350,
    joining_fees: {
      '18-25': 75,
      '26-35': 100,
      '36-45': 200,
      '46-55': 300,
      '56-65+': 500,
    },
    grace_period_days: 30,
    reminder_schedule: [30, 14, 7, 0],
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentSettingsMetadata, setPaymentSettingsMetadata] = useState<{
    updated_by?: string;
    updated_at?: string;
  }>({});

  // Load preferences on mount
  useEffect(() => {
    loadEmailPreferences();
    loadPaymentSettings();
  }, []);

  const loadEmailPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'email_preferences')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setEmailPreferences(data.setting_value as any);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
    }
  };

  const saveEmailPreferences = async () => {
    setIsSavingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'email_preferences',
          setting_value: emailPreferences,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      showToast('Email preferences saved successfully', 'success');
    } catch (error) {
      console.error('Error saving email preferences:', error);
      showToast('Failed to save email preferences', 'error');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value, updated_at, updated_by')
        .eq('setting_key', 'payment_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setPaymentSettings(data.setting_value as any);

        if (data.updated_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', data.updated_by)
            .maybeSingle();

          setPaymentSettingsMetadata({
            updated_by: userData?.full_name || userData?.email || 'Unknown',
            updated_at: data.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const savePaymentSettings = async () => {
    if (paymentSettings.annual_fee <= 0) {
      showToast('Annual fee must be a positive number', 'error');
      return;
    }

    const joiningFeesValues = Object.values(paymentSettings.joining_fees);
    if (joiningFeesValues.some((fee) => fee <= 0)) {
      showToast('All joining fees must be positive numbers', 'error');
      return;
    }

    if (paymentSettings.grace_period_days <= 0) {
      showToast('Grace period must be a positive number', 'error');
      return;
    }

    setIsSavingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'payment_settings',
          setting_value: paymentSettings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      showToast('Payment settings saved successfully', 'success');
      await loadPaymentSettings();
    } catch (error) {
      console.error('Error saving payment settings:', error);
      showToast('Failed to save payment settings', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    const schedule = [...paymentSettings.reminder_schedule];
    const index = schedule.indexOf(day);

    if (index > -1) {
      schedule.splice(index, 1);
    } else {
      schedule.push(day);
      schedule.sort((a, b) => b - a);
    }

    setPaymentSettings({ ...paymentSettings, reminder_schedule: schedule });
  };

  // Fetch deletion requests
  const { data: deletionRequests, refetch } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch system statistics
  const { data: systemStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        membersResult,
        activeMembersResult,
        pendingApplicationsResult,
        totalRevenueResult,
        emailsSentResult,
        documentsUploadPendingResult,
        declarationsPendingResult,
      ] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true }),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('total_amount'),
        supabase.from('email_activity').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('email_tokens').select('id', { count: 'exact', head: true }).eq('token_type', 'document_upload').is('used_at', null),
        supabase.from('email_tokens').select('id', { count: 'exact', head: true }).eq('token_type', 'declarations_signature').is('used_at', null),
      ]);

      const totalRevenue = totalRevenueResult.data?.reduce((sum, payment) => sum + Number(payment.total_amount || 0), 0) || 0;

      let dbStatus = 'Connected';
      try {
        await supabase.from('members').select('id', { count: 'exact', head: true }).limit(1);
      } catch {
        dbStatus = 'Disconnected';
      }

      return {
        totalMembers: membersResult.count || 0,
        activeMembers: activeMembersResult.count || 0,
        pendingApplications: pendingApplicationsResult.count || 0,
        totalRevenue: totalRevenue,
        emailsSent30Days: emailsSentResult.count || 0,
        documentsPending: documentsUploadPendingResult.count || 0,
        declarationsPending: declarationsPendingResult.count || 0,
        dbStatus,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleDecision = async (requestId: string, status: string, reason: string) => {
    if (!reason?.trim()) {
      alert('Please provide a reason for your decision');
      return;
    }

    try {
      const { error } = await supabase
        .from('deletion_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Committee',
          decision_reason: reason,
        })
        .eq('id', requestId);

      if (error) throw error;

      if (status === 'approved') {
        const request = deletionRequests?.find((r: any) => r.id === requestId);
        if (request?.member_id) {
          await supabase
            .from('members')
            .update({
              status: 'pending_deletion',
              deletion_scheduled_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              retention_category: 'pending_deletion',
            })
            .eq('id', request.member_id);
        }
      }

      refetch();
      alert('Request ' + status + ' successfully.');
    } catch (error) {
      console.error('Decision error:', error);
      alert('Failed to update request');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('appearance')}
            className={'pb-4 px-1 border-b-2 font-medium text-sm transition-colors ' + (
              activeTab === 'appearance'
                ? 'border-mosque-green-600 text-mosque-green-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Palette className="h-4 w-4 inline mr-2" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={'pb-4 px-1 border-b-2 font-medium text-sm transition-colors ' + (
              activeTab === 'email'
                ? 'border-mosque-green-600 text-mosque-green-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email Preferences
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={'pb-4 px-1 border-b-2 font-medium text-sm transition-colors ' + (
              activeTab === 'payment'
                ? 'border-mosque-green-600 text-mosque-green-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <DollarSign className="h-4 w-4 inline mr-2" />
            Payment Configuration
          </button>
          <button
            onClick={() => setActiveTab('gdpr')}
            className={'pb-4 px-1 border-b-2 font-medium text-sm transition-colors ' + (
              activeTab === 'gdpr'
                ? 'border-mosque-green-600 text-mosque-green-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            GDPR & Privacy
          </button>
        </nav>
      </div>

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-mosque-green-600" />
              Theme
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Choose your preferred color theme for the application.
            </p>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-gray-300" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                    <span className="px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 rounded-full border border-orange-300 dark:border-orange-700">
                      EXPERIMENTAL
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {theme === 'dark' ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-mosque-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Your theme preference is saved locally and will persist across sessions.
            </p>
          </div>
        </div>
      )}

      {/* Email Preferences Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-mosque-green-600" />
              Email Preferences
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure how automated emails are sent to members and committee.
            </p>

            <div className="space-y-6">
              {/* Email Sender Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Sender Name
                </label>
                <input
                  type="text"
                  value={emailPreferences.senderName}
                  onChange={(e) => setEmailPreferences({ ...emailPreferences, senderName: e.target.value })}
                  disabled={isSavingEmail}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  placeholder="Central Region Muslim Funeral Service"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This name will appear as the sender on all automated emails
                </p>
              </div>

              {/* Email Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Signature
                </label>
                <textarea
                  value={emailPreferences.emailSignature}
                  onChange={(e) => setEmailPreferences({ ...emailPreferences, emailSignature: e.target.value })}
                  disabled={isSavingEmail}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono text-sm"
                  placeholder="Central Region Muslim Funeral Service&#10;Falkirk Central Mosque&#10;Phone: [committee phone]&#10;Email: crmfs@kelpieai.co.uk"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Added to the footer of all automated emails
                </p>
              </div>

              {/* CC Committee on Member Emails */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Copy committee on document upload and declaration emails
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When enabled, committee will receive a copy of all emails sent to members
                  </p>
                </div>
                <button
                  onClick={() => setEmailPreferences({ ...emailPreferences, ccCommitteeOnMemberEmails: !emailPreferences.ccCommitteeOnMemberEmails })}
                  disabled={isSavingEmail}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailPreferences.ccCommitteeOnMemberEmails ? 'bg-mosque-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailPreferences.ccCommitteeOnMemberEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Member Action Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Notify committee when members complete actions
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Receive emails when members upload documents or sign declarations
                  </p>
                </div>
                <button
                  onClick={() => setEmailPreferences({ ...emailPreferences, memberActionNotifications: !emailPreferences.memberActionNotifications })}
                  disabled={isSavingEmail}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailPreferences.memberActionNotifications ? 'bg-mosque-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailPreferences.memberActionNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={saveEmailPreferences}
                  disabled={isSavingEmail}
                  className="w-full px-4 py-3 bg-mosque-green-600 text-white rounded-lg hover:bg-mosque-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {isSavingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Configuration Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-mosque-green-600" />
              Payment Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure membership fees, joining fees, and payment reminder settings.
            </p>

            <div className="space-y-6">
              {/* Annual Membership Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Membership Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                  <input
                    type="number"
                    value={paymentSettings.annual_fee}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, annual_fee: Number(e.target.value) })}
                    disabled={isSavingPayment}
                    min="0"
                    step="1"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The annual fee charged to all active members (pro-rated for new joiners)
                </p>
              </div>

              {/* Age-Based Joining Fees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Age-Based Joining Fees
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ages 18-25</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                      <input
                        type="number"
                        value={paymentSettings.joining_fees['18-25']}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          joining_fees: { ...paymentSettings.joining_fees, '18-25': Number(e.target.value) }
                        })}
                        disabled={isSavingPayment}
                        min="0"
                        step="1"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ages 26-35</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                      <input
                        type="number"
                        value={paymentSettings.joining_fees['26-35']}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          joining_fees: { ...paymentSettings.joining_fees, '26-35': Number(e.target.value) }
                        })}
                        disabled={isSavingPayment}
                        min="0"
                        step="1"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ages 36-45</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                      <input
                        type="number"
                        value={paymentSettings.joining_fees['36-45']}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          joining_fees: { ...paymentSettings.joining_fees, '36-45': Number(e.target.value) }
                        })}
                        disabled={isSavingPayment}
                        min="0"
                        step="1"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ages 46-55</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                      <input
                        type="number"
                        value={paymentSettings.joining_fees['46-55']}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          joining_fees: { ...paymentSettings.joining_fees, '46-55': Number(e.target.value) }
                        })}
                        disabled={isSavingPayment}
                        min="0"
                        step="1"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ages 56-65+</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">£</span>
                      <input
                        type="number"
                        value={paymentSettings.joining_fees['56-65+']}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          joining_fees: { ...paymentSettings.joining_fees, '56-65+': Number(e.target.value) }
                        })}
                        disabled={isSavingPayment}
                        min="0"
                        step="1"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  One-time joining fee based on age when member registers
                </p>
              </div>

              {/* Late Payment Grace Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Late Payment Grace Period
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentSettings.grace_period_days}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, grace_period_days: Number(e.target.value) })}
                    disabled={isSavingPayment}
                    min="0"
                    step="1"
                    className="w-full pr-14 pl-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mosque-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">days</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Days after renewal date before payment is marked as overdue
                </p>
              </div>

              {/* Payment Reminder Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Reminder Schedule
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={paymentSettings.reminder_schedule.includes(30)}
                      onChange={() => toggleReminderDay(30)}
                      disabled={isSavingPayment}
                      className="w-4 h-4 text-mosque-green-600 border-gray-300 rounded focus:ring-mosque-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Send reminder 30 days before renewal</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={paymentSettings.reminder_schedule.includes(14)}
                      onChange={() => toggleReminderDay(14)}
                      disabled={isSavingPayment}
                      className="w-4 h-4 text-mosque-green-600 border-gray-300 rounded focus:ring-mosque-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Send reminder 14 days before renewal</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={paymentSettings.reminder_schedule.includes(7)}
                      onChange={() => toggleReminderDay(7)}
                      disabled={isSavingPayment}
                      className="w-4 h-4 text-mosque-green-600 border-gray-300 rounded focus:ring-mosque-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Send reminder 7 days before renewal</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={paymentSettings.reminder_schedule.includes(0)}
                      onChange={() => toggleReminderDay(0)}
                      disabled={isSavingPayment}
                      className="w-4 h-4 text-mosque-green-600 border-gray-300 rounded focus:ring-mosque-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">Send reminder on renewal date</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Configure when automated payment reminders are sent
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={savePaymentSettings}
                  disabled={isSavingPayment}
                  className="w-full px-4 py-3 bg-mosque-green-600 text-white rounded-lg hover:bg-mosque-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {isSavingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                {paymentSettingsMetadata.updated_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Last updated by {paymentSettingsMetadata.updated_by} on{' '}
                    {new Date(paymentSettingsMetadata.updated_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Tab */}
      {activeTab === 'gdpr' && (
        <div className="space-y-6">
          {/* Privacy Policy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-mosque-green-600" />
              Privacy Policy
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download the current privacy policy for members. This should be provided to all new members during registration.
            </p>
            <button className="px-4 py-2 border border-mosque-green-600 text-mosque-green-600 rounded-lg hover:bg-mosque-green-50 dark:hover:bg-mosque-green-900/20 text-sm font-medium flex items-center transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Download Privacy Policy (PDF)
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Privacy policy must be reviewed annually and updated as needed. Last updated: January 2025
            </p>
          </div>

          {/* Deletion Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                Deletion Requests
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">
                    {deletionRequests?.filter((r: any) => r.status === 'pending').length || 0} Pending
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {deletionRequests?.filter((r: any) => r.status === 'approved').length || 0} Approved
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    {deletionRequests?.filter((r: any) => r.status === 'rejected').length || 0} Rejected
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>GDPR Article 17:</strong> Deletion requests must be processed within 30 days. 
                You can reject if legal obligation to retain data (active membership, financial records, etc).
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!deletionRequests || deletionRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No deletion requests</p>
              ) : (
                deletionRequests?.map((request: any) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.requester_name}</h3>
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (
                            request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.requester_email}</p>
                        <div className="bg-gray-50 rounded p-2 mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Reason:</p>
                          <p className="text-xs text-gray-600">{request.reason}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(request.requested_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {request.metadata?.requested_via && ' • via ' + request.metadata.requested_via}
                        </p>
                        {request.reviewed_at && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              Reviewed: {new Date(request.reviewed_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} by {request.reviewed_by}
                            </p>
                            {request.decision_reason && (
                              <p className="text-xs text-gray-700">
                                <strong>Decision:</strong> {request.decision_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for approval (e.g., "Member confirmed cancellation, no outstanding payments"):');
                              if (reason) handleDecision(request.id, 'approved', reason);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection (e.g., "Active membership with outstanding payments"):');
                              if (reason) handleDecision(request.id, 'rejected', reason);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Protection Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Committee Data Protection Obligations
            </h3>
            <ul className="text-xs text-blue-800 space-y-1.5">
              <li>• All member data must be kept confidential - do not share outside committee</li>
              <li>• Medical data (GP details, health conditions) is special category data - handle with extra care</li>
              <li>• Access only the data you need to perform your duties (principle of data minimization)</li>
              <li>• Log out when finished - do not leave system unattended</li>
              <li>• Report any suspected data breaches immediately to committee chair</li>
              <li>• Retain signed paper application forms securely for 7 years minimum</li>
              <li>• Member data access requests must be processed within 30 days</li>
              <li>• Deceased member records must be retained for 7 years before deletion/anonymization</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-300">
              <p className="text-xs text-blue-900 font-medium">
                <strong>In case of data breach:</strong> Contact committee chair immediately. ICO must be notified within 72 hours if high risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Information Section */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Info className="h-6 w-6 mr-3 text-mosque-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">System Information</h2>
            </div>
            <button
              onClick={() => refetchStats()}
              disabled={isLoadingStats}
              className="px-4 py-2 bg-mosque-green-600 text-white rounded-lg hover:bg-mosque-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm font-medium"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
              Refresh Stats
            </button>
          </div>

          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : systemStats ? (
            <div className="space-y-6">
              {/* Version */}
              <div className="bg-gradient-to-br from-mosque-green-50 to-mosque-green-100 dark:from-mosque-green-900 dark:to-mosque-green-800 p-6 rounded-lg border border-mosque-green-200 dark:border-mosque-green-700">
                <div className="flex items-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-mosque-green-600 dark:text-mosque-green-400 mr-2" />
                  <span className="text-sm font-medium text-mosque-green-700 dark:text-mosque-green-300">CRMFS Version</span>
                </div>
                <div className="text-3xl font-bold text-mosque-green-900 dark:text-mosque-green-100">{VERSION_STRING}</div>
              </div>

              {/* Database Statistics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Database Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total Members</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.totalMembers}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Active Members</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.activeMembers}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Pending Applications</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.pendingApplications}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-4 w-4 text-mosque-green-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">£{systemStats.totalRevenue.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Email Statistics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Emails Sent (Last 30 Days)</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.emailsSent30Days}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Documents Pending Upload</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.documentsPending}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Declarations Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{systemStats.declarationsPending}</div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  System Health
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Database className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Database Status</span>
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center">
                      {systemStats.dbStatus} ✓
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Mail className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Email Service Status</span>
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center">
                      Operational ✓
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-2">
                      <Database className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Last Backup</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Not configured
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Support Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Technical Support:</span>
                    <a href="mailto:info@kelpieai.co.uk" className="text-sm text-mosque-green-600 dark:text-mosque-green-400 hover:underline">
                      info@kelpieai.co.uk
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Developer:</span>
                    <a href="https://kelpieai.co.uk" target="_blank" rel="noopener noreferrer" className="text-sm text-mosque-green-600 dark:text-mosque-green-400 hover:underline">
                      Kelpie AI
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Documentation:</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Unable to load system statistics. Please try refreshing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}