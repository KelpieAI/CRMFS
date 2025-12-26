import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TableSkeleton } from '../components/SkeletonComponents';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Calendar,
  PoundSterling,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';

export default function Payments() {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch all payments with member info
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          members (
            id,
            first_name,
            last_name,
            email,
            mobile,
            status
          )
        `)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Calculate stats
  const stats = {
    totalRevenue: payments
      ?.filter((p: any) => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0,
    pendingPayments: payments?.filter((p: any) => p.payment_status === 'pending').length || 0,
    completedToday: payments?.filter((p: any) => {
      if (p.payment_status !== 'completed') return false;
      const paymentDate = new Date(p.payment_date || p.created_at);
      const today = new Date();
      return paymentDate.toDateString() === today.toDateString();
    }).length || 0,
    overdueRenewals: payments?.filter((p: any) => p.payment_status === 'overdue').length || 0,
  };

  // Get overdue payments for widget
  const overduePayments = payments?.filter((p: any) => p.payment_status === 'overdue') || [];

  // Filter payments
  const filteredPayments = payments?.filter((payment: any) => {
    const member = payment.members;
    const matchesSearch =
      searchTerm === '' ||
      `${member?.first_name} ${member?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const paymentDate = new Date(payment.payment_date || payment.created_at);
      const now = new Date();

      if (dateFilter === 'today') {
        matchesDate = paymentDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = paymentDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    };

    const style = styles[status as keyof typeof styles] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="mt-1 text-sm text-gray-600">Manage membership payments and renewals</p>
          </div>
        </div>
        <TableSkeleton rows={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">Manage membership payments and renewals</p>
        </div>
        <button
          onClick={() => setShowAddPayment(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Late Payments Widget - Only show if there are overdue payments */}
      {overduePayments.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Late Payments</h3>
                <p className="text-sm text-red-700">
                  {overduePayments.length} {overduePayments.length === 1 ? 'payment is' : 'payments are'} overdue
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('overdue')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View All Overdue
            </button>
          </div>
          <div className="space-y-2">
            {overduePayments.slice(0, 3).map((payment: any) => (
              <Link
                key={payment.id}
                to={`/members/${payment.member_id}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                    {payment.members?.first_name?.[0]}{payment.members?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.members?.first_name} {payment.members?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{payment.members?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    £{Number(payment.total_amount).toFixed(2)}
                  </p>
                  {payment.late_fee > 0 && (
                    <p className="text-xs text-red-500">
                      +£{Number(payment.late_fee).toFixed(2)} late fee
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {overduePayments.length > 3 && (
              <p className="text-sm text-red-700 text-center pt-2">
                +{overduePayments.length - 3} more overdue payment{overduePayments.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="text-2xl font-semibold text-gray-900">£{stats.totalRevenue.toFixed(2)}</div>
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
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pendingPayments}</div>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.completedToday}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue Payments</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.overdueRenewals}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by member name, email, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }}
            disabled={isRefreshing || showSuccess}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
              showSuccess
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-75 disabled:cursor-not-allowed`}
          >
            {showSuccess ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Refreshed
              </>
            ) : (
              <>
                <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-emerald-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                            {payment.members?.first_name?.[0]}{payment.members?.last_name?.[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.members?.first_name} {payment.members?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{payment.members?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{payment.payment_type || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-sm font-semibold text-emerald-600">
                          £{Number(payment.total_amount).toFixed(2)}
                        </span>
                        {payment.late_fee > 0 && (
                          <p className="text-xs text-red-600">+£{Number(payment.late_fee).toFixed(2)} late fee</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{payment.payment_method || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString()
                        : new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/members/${payment.member_id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Member
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No payments found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Payment records will appear here'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {filteredPayments && filteredPayments.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredPayments.length}</span> of{' '}
              <span className="font-medium">{payments?.length}</span> payments
            </p>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddPayment && (
        <AddPaymentModal onClose={() => setShowAddPayment(false)} />
      )}
    </div>
  );
}

// Add Payment Modal Component
function AddPaymentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    member_id: '',
    payment_type: 'renewal',
    payment_method: 'cash',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: '',
  });

  // Fetch all active members for dropdown
  const { data: members } = useQuery({
    queryKey: ['active-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, app_type')
        .in('status', ['active', 'pending'])
        .order('first_name', { ascending: true });
      return data || [];
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('payments').insert({
        member_id: formData.member_id,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        total_amount: parseFloat(formData.amount),
        main_joining_fee: 0,
        main_membership_fee: parseFloat(formData.amount),
        main_misc: 0,
        joint_joining_fee: 0,
        joint_membership_fee: 0,
        joint_misc: 0,
        late_fee: 0,
        payment_date: formData.payment_date,
        payment_status: 'completed',
        reference_no: formData.reference_no || null,
        notes: formData.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) return;
    createPaymentMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select member</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="registration">Registration</option>
              <option value="renewal">Renewal</option>
              <option value="late_fee">Late Fee</option>
              <option value="misc">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (£) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="100.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.reference_no}
              onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Optional reference number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}