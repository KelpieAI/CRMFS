import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
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
  MapPin,
  User,
  MoreVertical,
  Edit,
  Printer,
  Download,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function DeceasedMembers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeceasedMenu, setShowDeceasedMenu] = useState<string | null>(null);

  // Fetch deceased members with their records
  // Query members with status='deceased' and left join with deceased_records
  const { data: deceasedData, isLoading, refetch } = useQuery({
    queryKey: ['deceased-members'],
    queryFn: async () => {
      // First get all deceased members
      const { data: deceasedMembers, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('status', 'deceased')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Then get all deceased records
      const { data: deceasedRecords, error: recordsError } = await supabase
        .from('deceased_records')
        .select('*');

      if (recordsError) throw recordsError;

      // Combine the data - create a unified structure
      const combined = deceasedMembers?.map((member: any) => {
        const record = deceasedRecords?.find((r: any) => r.member_id === member.id);

        // If there's a record, use it. Otherwise, create a pending record structure
        if (record) {
          return {
            ...record,
            members: member,
          };
        } else {
          // Member is deceased but has no death record yet - show as pending
          return {
            id: `pending-${member.id}`,
            member_id: member.id,
            date_of_death: null,
            time_of_death: null,
            place_of_death: null,
            burial_location: null,
            burial_plot_number: null,
            status: 'pending',
            assigned_committee_member: null,
            created_at: member.updated_at,
            members: member,
          };
        }
      }) || [];

      return combined;
    },
  });

  // Calculate statistics
  const stats = {
    totalDeceased: deceasedData?.length || 0,
    thisMonth: deceasedData?.filter((record: any) => {
      if (!record.date_of_death) return false;
      const deathDate = new Date(record.date_of_death);
      const now = new Date();
      return deathDate.getMonth() === now.getMonth() &&
             deathDate.getFullYear() === now.getFullYear();
    }).length || 0,
    pendingArrangements: deceasedData?.filter((record: any) =>
      record.status === 'pending' ||
      record.status === 'reported' ||
      record.status === 'arranged'
    ).length || 0,
    completedCases: deceasedData?.filter((record: any) =>
      record.status === 'completed'
    ).length || 0,
  };

  // Filter deceased members
  const filteredMembers = deceasedData?.filter((record: any) => {
    const member = record.members;
    const memberName = member ? `${member.first_name} ${member.last_name}` : '';

    const matchesSearch =
      searchTerm === '' ||
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.burial_location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      record.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all' && record.date_of_death) {
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

  // Pagination calculations
  const totalDeceased = filteredMembers?.length || 0;
  const totalPages = Math.ceil(totalDeceased / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMembers = filteredMembers?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, pageSize]);

  const getStatusBadge = (status?: string) => {
    const styles = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle, label: 'Pending' },
      reported: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Reported' },
      arranged: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Arranged' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completed' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' },
    };

    const style = styles[status as keyof typeof styles] || styles.pending;
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
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Deceased Members</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
              {deceasedData?.length || 0} Total
            </span>
          </div>
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
                <option value="pending">Pending</option>
                <option value="reported">Reported</option>
                <option value="arranged">Arranged</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
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
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
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
              {paginatedMembers && paginatedMembers.length > 0 ? (
                paginatedMembers.map((record: any) => {
                  const member = record.members;
                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onDoubleClick={(e) => {
                        if (
                          !(e.target as HTMLElement).closest('button') &&
                          !(e.target as HTMLElement).closest('a')
                        ) {
                          navigate(`/deceased/${member?.id || record.member_id}`);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                              {member?.first_name?.[0] || '?'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member ? `${member.first_name} ${member.last_name}` : 'Unknown Member'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member?.dob ? (
                                <>
                                  Born: {new Date(member.dob).toLocaleDateString()}
                                  {record.date_of_death && (
                                    <span className="ml-2">
                                      (Age: {Math.floor((new Date(record.date_of_death).getTime() - new Date(member.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))})
                                    </span>
                                  )}
                                </>
                              ) : (
                                'DOB not recorded'
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.date_of_death
                            ? new Date(record.date_of_death).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Not recorded'
                          }
                        </div>
                        {record.time_of_death && (
                          <div className="text-xs text-gray-500">{record.time_of_death}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.burial_location || 'Not recorded'}
                        </div>
                        {record.burial_plot_number && (
                          <div className="text-xs text-gray-500">Plot: {record.burial_plot_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.assigned_committee_member || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setShowDeceasedMenu(showDeceasedMenu === record.id ? null : record.id)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>

                          {showDeceasedMenu === record.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowDeceasedMenu(null)}
                              />
                              
                              {/* Dropdown */}
                              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    navigate(`/deceased/${member?.id || record.member_id}`);
                                    setShowDeceasedMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-3 text-gray-400" />
                                  View Details
                                </button>
                                
                                <button
                                  onClick={() => {
                                    navigate(`/deceased/${member?.id || record.member_id}?edit=true`);
                                    setShowDeceasedMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-3 text-gray-400" />
                                  Edit Death Record
                                </button>
                                
                                <button
                                  onClick={() => {
                                    window.print();
                                    setShowDeceasedMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Printer className="h-4 w-4 mr-3 text-gray-400" />
                                  Print Funeral Report
                                </button>
                                
                                <button
                                  onClick={async () => {
                                    // Export deceased data
                                    const { data: deceasedRecord } = await supabase
                                      .from('deceased')
                                      .select(`
                                        *,
                                        members (*),
                                        funeral_expenses (*),
                                        funeral_payments (*),
                                        funeral_contacts (*)
                                      `)
                                      .eq('id', record.id)
                                      .single();

                                    const dataStr = JSON.stringify(deceasedRecord, null, 2);
                                    const blob = new Blob([dataStr], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `deceased-${record.id}-${new Date().toISOString().split('T')[0]}.json`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    setShowDeceasedMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Download className="h-4 w-4 mr-3 text-gray-400" />
                                  Export Data
                                </button>
                                
                                <div className="border-t border-gray-200 my-1"></div>
                                
                                <button
                                  onClick={() => {
                                    if (confirm('Archive this funeral record? This will mark it as closed.')) {
                                      // Archive logic here
                                    }
                                    setShowDeceasedMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center"
                                >
                                  <Archive className="h-4 w-4 mr-3 text-gray-400" />
                                  Archive Record
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileHeart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl font-semibold text-gray-700 mb-2">
                        No deceased members found
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Deceased member records will appear here'}
                      </p>
                      <p className="text-xs text-gray-400 italic">
                        إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        "May Allah grant them Jannah Al-Firdaus"
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {paginatedMembers && paginatedMembers.length > 0 ? (
            paginatedMembers.map((record: any) => {
              return (
                <div 
                  key={record.id} 
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  onDoubleClick={() => navigate(`/deceased/${record.members?.id || record.member_id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-lg">
                        {record.deceased_name?.[0] || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900">{record.deceased_name}</p>
                        <p className="text-xs text-gray-500">
                          {record.date_of_death
                            ? new Date(record.date_of_death).toLocaleDateString()
                            : 'Date not recorded'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(record.status)}
                      
                      <div className="relative">
                        <button
                          onClick={() => setShowDeceasedMenu(showDeceasedMenu === record.id ? null : record.id)}
                          className="p-1 hover:bg-gray-200 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {showDeceasedMenu === record.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowDeceasedMenu(null)}
                            />
                            
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  navigate(`/deceased/${record.members?.id || record.member_id}`);
                                  setShowDeceasedMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/deceased/${record.members?.id || record.member_id}?edit=true`);
                                  setShowDeceasedMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  window.print();
                                  setShowDeceasedMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {record.burial_location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {record.burial_location}
                      </div>
                    )}
                    {record.handled_by && (
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {record.handled_by}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileHeart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No deceased members found</p>
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        {paginatedMembers && paginatedMembers.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{startIndex + 1}</span>-
                <span className="font-medium">{Math.min(endIndex, totalDeceased)}</span> of{' '}
                <span className="font-medium">{totalDeceased}</span> deceased members
              </p>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </span>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}