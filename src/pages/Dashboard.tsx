import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ApplicationsInProgress from '../components/ApplicationsInProgress';
import {
  Users,
  UserCheck,
  Clock,
  DollarSign,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to CRMFS</p>
      </div>
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
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
  const { data: recentMembers } = useQuery({
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

  // Fetch upcoming renewals (members who joined ~1 year ago)
  const { data: upcomingRenewals } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setMonth(oneYearAgo.getMonth() + 1); // Next month

      const { data } = await supabase
        .from('payments')
        .select('*, members(first_name, last_name, email)')
        .gte('renewal_date', new Date().toISOString())
        .lte('renewal_date', oneYearAgo.toISOString())
        .order('renewal_date', { ascending: true })
        .limit(5);
      return data || [];
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
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Link
          to="/members/new"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Member
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-lg p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Recent Members</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentMembers && recentMembers.length > 0 ? (
              recentMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/members/${member.id}`}
                  className="px-6 py-4 hover:bg-emerald-50 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
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
              <div className="px-6 py-8 text-center text-gray-500">
                No recent members
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/members"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all members →
            </Link>
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Upcoming Renewals
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingRenewals && upcomingRenewals.length > 0 ? (
              upcomingRenewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="px-6 py-4 hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {renewal.members?.first_name} {renewal.members?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {renewal.members?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {renewal.renewal_date
                          ? new Date(renewal.renewal_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        £{Number(renewal.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No upcoming renewals
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/payments"
              className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              View all payments →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
