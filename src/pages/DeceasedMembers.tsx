import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TableSkeleton } from '../components/SkeletonComponents';
import {
  FileHeart,
  Search,
  Filter,
  Calendar,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Check,
} from 'lucide-react';

export default function DeceasedMembers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch deceased members with their records
  const { data: deceasedData, isLoading, refetch } = useQuery({
    queryKey: ['deceased-members'],
    queryFn: async () => {
      const { data: members } = await supabase
        .from('members')
        .select(`
          *,
          deceased_records (*)
        `)
        .eq('status', 'deceased')
        .order('updated_at', { ascending: false });

      return members || [];
    },
  });

  // Calculate statistics
  const stats = {
    totalDeceased: deceasedData?.length || 0,
    thisMonth: deceasedData?.filter((m: any) => {
      if (!m.deceased_records?.[0]?.date_of_death) return false;
      const deathDate = new Date(m.deceased_records[0].date_of_death);
      const now = new Date();
      return deathDate.getMonth() === now.getMonth() && 
             deathDate.getFullYear() === now.getFullYear();
    }).length || 0,
    pendingArrangements: deceasedData?.filter((m: any) => 
      m.deceased_records?.[0]?.status === 'reported' || 
      m.deceased_records?.[0]?.status === 'arranged'
    ).length || 0,
    completedCases: deceasedData?.filter((m: any) => 
      m.deceased_records?.[0]?.status === 'completed'
    ).length || 0,
  };

  // Filter deceased members
  const filteredMembers = deceasedData?.filter((member: any) => {
    const record = member.deceased_records?.[0];
    
    const matchesSearch =
      searchTerm === '' ||
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record?.burial_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      record?.status === statusFilter ||
      (!record && statusFilter === 'no_record');

    let matchesDate = true;
    if (dateFilter !== 'all' && record?.date_of_death) {
      const deathDate = new Date(record.date_of_death);
      const now = new Date();

      if (dateFilter === 'month') {
        matchesDate = deathDate.getMonth() === now.getMonth() && 
                     deathDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'year') {
        matchesDate = deathDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'last_year') {
        matchesDate = deathDate.getFullYear() === now.getFullYear() - 1;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status?: string) => {
    const styles = {
      reported: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Reported' },
      arranged: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Arranged' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completed' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
      no_record: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle, label: 'No Record' },
    };

    const style = styles[status as keyof typeof styles] || styles.no_record;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {style.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deceased Members</h1>
            <p className="mt-1 text-sm text-gray-600">
              إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ - Surely we belong to Allah and to Him we shall return
            </p>
          </div>
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deceased Members</h1>
          <p className="mt-1 text-sm text-gray-600">
            إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ - Surely we belong to Allah and to Him we shall return
          </p>
        </div>
        <Link
          to="/deceased/record"
          className="inline-flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Death
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-gray-100">
                <FileHeart className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Deceased</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalDeceased}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-gray-500 to-gray-600"></div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3 bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.thisMonth}</div>
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
              <div className="flex-shrink-0 rounded-lg p-3 bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Cases</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.pendingArrangements}</div>
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
              <div className="flex-shrink-0 rounded-lg p-3 bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.completedCases}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
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
              placeholder="Search by name or burial location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="all">All Status</option>
                <option value="reported">Reported</option>
                <option value="arranged">Arranged</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
                <option value="no_record">No Record</option>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="last_year">Last Year</option>
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

      {/* Deceased Members List */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Date of Death
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Burial Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Handled By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member: any) => {
                  const record = member.deceased_records?.[0];
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.title} {member.first_name} {member.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.dob ? `Born: ${new Date(member.dob).toLocaleDateString()}` : 'DOB not recorded'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record?.date_of_death 
                            ? new Date(record.date_of_death).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Not recorded'
                          }
                        </div>
                        {record?.time_of_death && (
                          <div className="text-xs text-gray-500">{record.time_of_death}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record?.burial_location || 'Not recorded'}
                        </div>
                        {record?.burial_plot_number && (
                          <div className="text-xs text-gray-500">Plot: {record.burial_plot_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record?.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record?.handled_by || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/deceased/${member.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileHeart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No deceased members found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Deceased member records will appear here'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {filteredMembers && filteredMembers.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredMembers.length}</span> of{' '}
              <span className="font-medium">{deceasedData?.length}</span> deceased members
            </p>
          </div>
        )}
      </div>
    </div>
  );
}