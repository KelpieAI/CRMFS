import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ApplicationsInProgress from '../components/ApplicationsInProgress';
import { StatsGridSkeleton } from '../components/SkeletonComponents';
import {
  Users,
  UserCheck,
  Clock,
  PoundSterling,
  AlertCircle,
  Plus,
  RefreshCw,
  Check,
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

  // Fetch upcoming renewals (members whose anniversary is within next 30 days)
  const { data: upcomingRenewals, refetch: refetchRenewals } = useQuery({
    queryKey: ['upcoming-renewals'],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get all active members with their join dates
      const { data: members } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, join_date, status')
        .eq('status', 'active')
        .not('join_date', 'is', null)
        .order('join_date', { ascending: true });

      if (!members) return [];

      // Filter members whose anniversary is within next 30 days
      const renewals = members
        .map((member) => {
          const joinDate = new Date(member.join_date);
          const currentYear = today.getFullYear();
          
          // Calculate this year's anniversary
          const anniversaryThisYear = new Date(
            currentYear,
            joinDate.getMonth(),
            joinDate.getDate()
          );

          // If anniversary already passed this year, calculate next year's
          const renewalDate = anniversaryThisYear < today
            ? new Date(currentYear + 1, joinDate.getMonth(), joinDate.getDate())
            : anniversaryThisYear;

          // Check if renewal is within next 30 days
          if (renewalDate >= today && renewalDate <= thirtyDaysFromNow) {
            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              id: member.id,
              first_name: member.first_name,
              last_name: member.last_name,
              email: member.email,
              renewal_date: renewalDate.toISOString(),
              days_until_renewal: daysUntil,
            };
          }

          return null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => a.days_until_renewal - b.days_until_renewal)
        .slice(0, 5); // Limit to 5 most urgent

      return renewals;
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back! Here's what's happening today.
            </p>
          </div>
        </div>
        <StatsGridSkeleton />
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
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await Promise.all([
                refetchStats(),
                refetchMembers(),
                refetchRenewals(),
              ]);
              setIsRefreshing(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }}
            disabled={isRefreshing || showSuccess}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow ${
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
                          ? 'bg-mosque-gold-100 text-mosque-gold-800'
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
                <Link
                  key={renewal.id}
                  to={`/members/${renewal.id}`}
                  className="px-6 py-4 hover:bg-yellow-50 transition-colors block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {renewal.first_name} {renewal.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {renewal.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(renewal.renewal_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className={`text-xs font-semibold ${
                        renewal.days_until_renewal <= 7 
                          ? 'text-red-600' 
                          : renewal.days_until_renewal <= 14
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}>
                        {renewal.days_until_renewal === 0 
                          ? 'Today!' 
                          : renewal.days_until_renewal === 1
                          ? 'Tomorrow'
                          : `In ${renewal.days_until_renewal} days`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No upcoming renewals in the next 30 days
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