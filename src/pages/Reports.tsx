import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { StatsGridSkeleton } from '../components/SkeletonComponents';
import {
  FileText,
  Users,
  PoundSterling,
  TrendingUp,
  Download,
  PieChart,
  BarChart3,
  Activity,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';

export default function Reports() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch all data for reports
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const [
        { data: members },
        { data: payments },
        { data: children },
        { data: feeStructure },
      ] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('children').select('*'),
        supabase.from('fee_structure').select('*').order('age_min', { ascending: true }),
      ]);

      return { members, payments, children, feeStructure };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive insights into membership and financials
            </p>
          </div>
        </div>
        <StatsGridSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatsGridSkeleton />
        </div>
      </div>
    );
  }

  const { members = [], payments = [], children = [], feeStructure = [] } = reportData || {};

  // Calculate membership stats
  const membershipStats = {
    total: members?.length || 0,
    active: members?.filter((m: any) => m.status === 'active').length || 0,
    pending: members?.filter((m: any) => m.status === 'pending').length || 0,
    inactive: members?.filter((m: any) => m.status === 'inactive').length || 0,
    deceased: members?.filter((m: any) => m.status === 'deceased').length || 0,
    single: members?.filter((m: any) => m.app_type === 'single').length || 0,
    joint: members?.filter((m: any) => m.app_type === 'joint').length || 0,
    totalChildren: children?.length || 0,
  };

  // Calculate financial stats
  const financialStats = {
    totalRevenue: payments
      ?.filter((p: any) => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0,
    pendingRevenue: payments
      ?.filter((p: any) => p.payment_status === 'pending')
      .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0,
    totalPayments: payments?.length || 0,
    completedPayments: payments?.filter((p: any) => p.payment_status === 'completed').length || 0,
    pendingPayments: payments?.filter((p: any) => p.payment_status === 'pending').length || 0,
    averagePayment:
      payments && payments.length > 0
        ? payments.reduce((sum, p) => sum + Number(p.total_amount), 0) / payments.length
        : 0,
  };

  // Age distribution
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

  const ageDistribution = feeStructure?.map((tier: any) => {
    const count = members?.filter((m: any) => {
      const age = calculateAge(m.dob);
      return age >= tier.age_min && age <= tier.age_max;
    }).length || 0;
    return {
      range: `${tier.age_min}-${tier.age_max}`,
      count,
      joiningFee: tier.joining_fee,
    };
  }) || [];

  // Payment method breakdown
  const paymentMethods = payments?.reduce((acc: any, payment: any) => {
    const method = payment.payment_method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {}) || {};

  // Monthly registration trend (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      count: members?.filter((m: any) => {
        const memberDate = new Date(m.created_at);
        return (
          memberDate.getMonth() === date.getMonth() &&
          memberDate.getFullYear() === date.getFullYear()
        );
      }).length || 0,
    };
  }).reverse();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || '')).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportMembersReport = () => {
    const data = members?.map((m: any) => ({
      ID: m.id,
      Type: m.app_type,
      Title: m.title,
      FirstName: m.first_name,
      LastName: m.last_name,
      DOB: m.dob,
      Email: m.email,
      Mobile: m.mobile,
      Status: m.status,
      CreatedAt: new Date(m.created_at).toLocaleDateString(),
    })) || [];
    downloadCSV(data, 'members_report');
  };

  const exportPaymentsReport = () => {
    const data = payments?.map((p: any) => ({
      ID: p.id,
      MemberID: p.member_id,
      Type: p.payment_type,
      Method: p.payment_method,
      Amount: p.total_amount,
      Status: p.payment_status,
      Date: p.payment_date || p.created_at,
      Reference: p.reference_no,
    })) || [];
    downloadCSV(data, 'payments_report');
  };

  const exportFinancialSummary = () => {
    const data = [
      { Metric: 'Total Revenue', Value: `£${financialStats.totalRevenue.toFixed(2)}` },
      { Metric: 'Pending Revenue', Value: `£${financialStats.pendingRevenue.toFixed(2)}` },
      { Metric: 'Total Payments', Value: financialStats.totalPayments },
      { Metric: 'Completed Payments', Value: financialStats.completedPayments },
      { Metric: 'Pending Payments', Value: financialStats.pendingPayments },
      { Metric: 'Average Payment', Value: `£${financialStats.averagePayment.toFixed(2)}` },
      { Metric: 'Total Members', Value: membershipStats.total },
      { Metric: 'Active Members', Value: membershipStats.active },
      { Metric: 'Pending Members', Value: membershipStats.pending },
    ];
    downloadCSV(data, 'financial_summary');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive insights into membership and financials
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }}
            disabled={isRefreshing || showSuccess}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-all shadow-sm ${
              showSuccess
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-75 disabled:cursor-not-allowed`}
          >
            {showSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Refreshed
              </>
            ) : (
              <>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </>
            )}
          </button>
          <button
            onClick={exportFinancialSummary}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Members</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {membershipStats.total}
                    </div>
                    <div className="ml-2 text-sm text-emerald-600">
                      {membershipStats.active} active
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-green-100">
                <PoundSterling className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      £{financialStats.totalRevenue.toFixed(0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-yellow-100">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      £{financialStats.pendingRevenue.toFixed(0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Payment</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      £{financialStats.averagePayment.toFixed(0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Breakdown */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <PieChart className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Membership Breakdown</h2>
            </div>
            <button
              onClick={exportMembersReport}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-600 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Active Members</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {membershipStats.active}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-600 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Pending Applications</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">
                {membershipStats.pending}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-600 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Inactive Members</span>
              </div>
              <span className="text-lg font-bold text-gray-600">
                {membershipStats.inactive}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Deceased</span>
              </div>
              <span className="text-lg font-bold text-red-600">
                {membershipStats.deceased}
              </span>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Single</p>
                  <p className="text-2xl font-bold text-purple-600">{membershipStats.single}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Joint</p>
                  <p className="text-2xl font-bold text-blue-600">{membershipStats.joint}</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Children Covered</p>
                <p className="text-2xl font-bold text-pink-600">{membershipStats.totalChildren}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="h-5 w-5 text-emerald-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Age Distribution</h2>
          </div>

          <div className="space-y-4">
            {ageDistribution.map((tier: any) => (
              <div key={tier.range}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {tier.range} years (£{tier.joiningFee} joining)
                  </span>
                  <span className="text-sm font-bold text-emerald-600">{tier.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        membershipStats.total > 0
                          ? (tier.count / membershipStats.total) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Activity className="h-5 w-5 text-emerald-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Registration Trend (6 Months)</h2>
          </div>

          <div className="space-y-3">
            {last6Months.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <span className="text-sm font-bold text-blue-600">{month.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        Math.max(...last6Months.map((m) => m.count)) > 0
                          ? (month.count / Math.max(...last6Months.map((m) => m.count))) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <PoundSterling className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
            </div>
            <button
              onClick={exportPaymentsReport}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(paymentMethods).map(([method, count]: any) => (
              <div key={method}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {method.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-green-600">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        financialStats.totalPayments > 0
                          ? (count / financialStats.totalPayments) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}

            {Object.keys(paymentMethods).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PoundSterling className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payment data available</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {financialStats.completedPayments}
                </p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {financialStats.pendingPayments}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Export Actions */}
      <div className="bg-gradient-to-br from-emerald-50 to-yellow-50 border-2 border-emerald-200 rounded-xl p-6">
        <div className="flex items-start">
          <FileText className="h-6 w-6 text-emerald-600 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">Export Reports</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Download detailed reports in CSV format for analysis
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportMembersReport}
                className="inline-flex items-center px-4 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Members Report
              </button>
              <button
                onClick={exportPaymentsReport}
                className="inline-flex items-center px-4 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Payments Report
              </button>
              <button
                onClick={exportFinancialSummary}
                className="inline-flex items-center px-4 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Financial Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}