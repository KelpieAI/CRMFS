import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, Member } from '../lib/supabase';
import { TableSkeleton } from '../components/SkeletonComponents';
import { BulkActionsBar } from '../components/BulkActionsBar';
import { Search, Filter, Plus, Eye, Mail, Phone, Users, RefreshCw, Check, MoreVertical, Edit, Pause, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MemberList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);

  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Member[];
    },
  });

  const filteredMembers = members?.filter((member) => {
    const matchesSearch =
      searchTerm === '' ||
      `${member.first_name} ${member.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.mobile?.includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalMembers = filteredMembers?.length || 0;
  const totalPages = Math.ceil(totalMembers / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMembers = filteredMembers?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const allIds = useMemo(() => filteredMembers?.map((m) => m.id) || [], [filteredMembers]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (selectedIds.size === allIds.length) {
          clearSelection();
        } else {
          selectAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, allIds]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-mosque-gold-100 text-mosque-gold-800 border-mosque-gold-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      paused: 'bg-red-100 text-red-800 border-red-200',
      deceased: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage funeral service memberships
            </p>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
              {members?.length || 0} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Manage funeral service memberships
          </p>
        </div>
        <Link
          to="/members/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Member
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
                <option value="deceased">Deceased</option>
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

      {/* Members Table */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === allIds.length && allIds.length > 0}
                    onChange={() => {
                      if (selectedIds.size === allIds.length) {
                        clearSelection();
                      } else {
                        selectAll();
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMembers && paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-emerald-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Only select if not clicking on checkbox, menu, or interactive elements
                      if (
                        !(e.target as HTMLElement).closest('input') &&
                        !(e.target as HTMLElement).closest('button') &&
                        !(e.target as HTMLElement).closest('a')
                      ) {
                        toggleSelection(member.id);
                      }
                    }}
                    onDoubleClick={(e) => {
                      // Navigate to member detail on double click
                      if (
                        !(e.target as HTMLElement).closest('input') &&
                        !(e.target as HTMLElement).closest('button') &&
                        !(e.target as HTMLElement).closest('a')
                      ) {
                        navigate(`/members/${member.id}`);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleSelection(member.id)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                            {member.first_name[0]}
                            {member.last_name[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.title} {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {member.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.app_type === 'joint'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {member.app_type === 'joint' ? 'Joint' : 'Single'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {member.email && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email}
                          </div>
                        )}
                        {member.mobile && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {member.mobile}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.member_since || member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setShowMemberMenu(showMemberMenu === member.id ? null : member.id)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {showMemberMenu === member.id && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowMemberMenu(null)}
                            />
                            
                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  navigate(`/members/${member.id}`);
                                  setShowMemberMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-3 text-gray-400" />
                                View Member
                              </button>
                              
                              <button
                                onClick={() => {
                                  navigate(`/members/${member.id}?tab=personal&edit=true`);
                                  setShowMemberMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-3 text-gray-400" />
                                Edit Member
                              </button>
                              
                              {member.status !== 'paused' && (
                                <button
                                  onClick={() => {
                                    navigate(`/members/${member.id}?action=pause`);
                                    setShowMemberMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Pause className="h-4 w-4 mr-3 text-gray-400" />
                                  Pause Membership
                                </button>
                              )}
                              
                              <button
                                onClick={async () => {
                                  // Export member data
                                  const { data: memberData } = await supabase
                                    .from('members')
                                    .select(`
                                      *,
                                      children (*),
                                      next_of_kin (*),
                                      medical_info (*),
                                      payments (*)
                                    `)
                                    .eq('id', member.id)
                                    .single();

                                  const dataStr = JSON.stringify(memberData, null, 2);
                                  const blob = new Blob([dataStr], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `member-${member.id}-${new Date().toISOString().split('T')[0]}.json`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  setShowMemberMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Download className="h-4 w-4 mr-3 text-gray-400" />
                                Export Data
                              </button>
                              
                              <div className="border-t border-gray-200 my-1"></div>
                              
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
                                    navigate(`/members/${member.id}?action=delete`);
                                  }
                                  setShowMemberMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                                Delete Member
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No members found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first member'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        {paginatedMembers && paginatedMembers.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{startIndex + 1}</span>-
                <span className="font-medium">{Math.min(endIndex, totalMembers)}</span> of{' '}
                <span className="font-medium">{totalMembers}</span> members
              </p>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

      <BulkActionsBar
        selectedIds={selectedIds}
        allIds={allIds}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
      />
    </div>
  );
}