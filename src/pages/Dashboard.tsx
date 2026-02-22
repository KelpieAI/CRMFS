import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ApplicationsInProgress from '../components/ApplicationsInProgress';
import { StatsGridSkeleton } from '../components/SkeletonComponents';
import {
  Users,
  UserCheck,
  Clock,
  PoundSterling,
  AlertTriangle,
  Plus,
  RefreshCw,
  Check,
  FileText,
  PenSquare,
  CreditCard,
  Mail,
} from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Fetch dashboard stats
  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members').select('status', { count: 'exact' }),
        supabase.from('payments').select('total_amount, payment_status'),
      ]);

      const totalMembers = membersRes.count || 0;
      const activeMembers =
        membersRes.data?.filter((m) => m.status === 'active').length || 0;
      const pendingMembers =
        membersRes.data?.filter((m) => m.status === 'pending').length || 0;

      const totalRevenue =
        paymentsRes.data
          ?.filter((p) => p.payment_status === 'completed')
          .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      return {
        totalMembers,
        activeMembers,
        pendingMembers,
        totalRevenue,
      };
    },
  });

  // Fetch recent members
  const { data: recentMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['recent-members'],
    queryFn: async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch alerts (action-required items)
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get distinct members with pending document uploads
      const { data: docsPending } = await supabase
        .from('email_tokens')
        .select('member_id')
        .eq('token_type', 'document_upload')
        .is('used_at', null)
        .eq('is_valid', true);

      // Get distinct members with pending declarations
      const { data: declsPending } = await supabase
        .from('email_tokens')
        .select('member_id')
        .eq('token_type', 'declarations_signature')
        .is('used_at', null)
        .eq('is_valid', true);

      // Get distinct members with overdue payments
      const { data: paymentsOverdue } = await supabase
        .from('payments')
        .select('member_id')
        .eq('payment_status', 'pending')
        .lt('renewal_date', today)
        .not('renewal_date', 'is', null);

      // Count unique members for each alert type
      const documentsPendingCount = new Set(docsPending?.map(d => d.member_id) || []).size;
      const declarationsPendingCount = new Set(declsPending?.map(d => d.member_id) || []).size;
      const paymentsOverdueCount = new Set(paymentsOverdue?.map(p => p.member_id) || []).size;
      const emailsFailedCount = 0; // Placeholder for future feature

      return {
        documentsPending: documentsPendingCount,
        declarationsPending: declarationsPendingCount,
        paymentsOverdue: paymentsOverdueCount,
        emailsFailed: emailsFailedCount,
        totalAlerts: documentsPendingCount + declarationsPendingCount + paymentsOverdueCount + emailsFailedCount,
      };
    },
  });

  const statCards = [
    {
      name: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Active Members',
      value: stats?.activeMembers || 0,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      name: 'Pending Applications',
      value: stats?.pendingMembers || 0,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      name: 'Total Revenue',
      value: `£${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: PoundSterling,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening today.
            </p>
          </div>
        </div>
        <StatsGridSkeleton />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {getGreeting()}, {userName}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                refetchStats(),
                refetchMembers(),
                refetchAlerts(),
              ]);
              setIsRefreshing(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }}
            disabled={isRefreshing || showSuccess}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow ${
              showSuccess
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
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
          <Link
            to="/members/new"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Member
          </Link>
        </div>
      </div>

      {/* APPLICATIONS IN PROGRESS WIDGET */}
      <ApplicationsInProgress />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-lg p-2.5 ${stat.bgColor} dark:bg-opacity-20`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={`h-1.5 bg-gradient-to-r ${stat.color}`}></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3">
            <h2 className="text-base font-semibold text-white">Recent Members</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
            {recentMembers && recentMembers.length > 0 ? (
              recentMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/members/${member.id}`}
                  className="px-5 py-3 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                No recent members
              </div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 px-5 py-2.5">
            <Link
              to="/members"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all members →
            </Link>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="bg-orange-600 px-5 py-3">
            <h2 className="text-base font-semibold text-white flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts
              {alerts && alerts.totalAlerts > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-orange-600 text-xs font-bold rounded-full">
                  {alerts.totalAlerts}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto flex-1">
            {alerts && alerts.totalAlerts > 0 ? (
              <>
                {alerts.documentsPending > 0 && (
                  <Link
                    to="/members?filter=documents_pending"
                    className="px-5 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Documents Pending
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Members need to upload documents
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {alerts.documentsPending}
                      </span>
                    </div>
                  </Link>
                )}
                {alerts.declarationsPending > 0 && (
                  <Link
                    to="/members?filter=declarations_pending"
                    className="px-5 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <PenSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Declarations Pending
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Members need to sign declarations
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {alerts.declarationsPending}
                      </span>
                    </div>
                  </Link>
                )}
                {alerts.paymentsOverdue > 0 && (
                  <Link
                    to="/members?filter=payments_overdue"
                    className="px-5 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Payments Overdue
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Members with overdue payments
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {alerts.paymentsOverdue}
                      </span>
                    </div>
                  </Link>
                )}
                {alerts.emailsFailed > 0 && (
                  <Link
                    to="/members?filter=emails_failed"
                    className="px-5 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors block"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Emails Failed
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Email delivery issues
                          </p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                        {alerts.emailsFailed}
                      </span>
                    </div>
                  </Link>
                )}
              </>
            ) : (
              <div className="px-5 py-6 text-center flex items-center justify-center flex-1">
                <div className="flex flex-col items-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    No alerts - all members up to date
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Everything is looking good!
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 px-5 py-2.5 mt-auto">
            <Link
              to="/members"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View all members →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}