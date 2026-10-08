import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Shield, GraduationCap, Briefcase, 
  Trash2, UserCheck, UserX, AlertTriangle, Loader2, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('all'); // 'all', 'student', 'faculty', 'admin'
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/meta/departments');
      if (res.data.success) setDepartments(res.data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      addToast('Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(user.id);
      const res = await api.patch(`/users/${user.id}/status`);
      if (res.data.success) {
        addToast(res.data.message || 'User status updated', 'success');
        setUsers(users.map(u => u.id === user.id ? { ...u, is_active: u.is_active ? 0 : 1 } : u));
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    try {
      setActionLoading(deleteModal.user.id);
      const res = await api.delete(`/users/${deleteModal.user.id}`);
      if (res.data.success) {
        addToast('User record permanently deleted', 'success');
        setUsers(users.filter(u => u.id !== deleteModal.user.id));
        setDeleteModal({ open: false, user: null });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleTab === 'all' || u.role === roleTab;
    const matchesDept = deptFilter === 'all' || String(u.department_id) === deptFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.is_active) || 
                          (statusFilter === 'inactive' && !u.is_active);
    const q = search.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q) ||
                          (u.student_id && u.student_id.toLowerCase().includes(q)) ||
                          (u.employee_id && u.employee_id.toLowerCase().includes(q));
    return matchesRole && matchesDept && matchesStatus && matchesSearch;
  });

  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Users className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          University User Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage system access, student enrollments, faculty coordinators, and administrative privileges.
        </p>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setRoleTab('all')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleTab === 'all'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          All Users <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">{users.length}</span>
        </button>
        <button
          onClick={() => setRoleTab('student')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleTab === 'student'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" /> Students <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">{studentCount}</span>
        </button>
        <button
          onClick={() => setRoleTab('faculty')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleTab === 'faculty'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Faculty <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">{facultyCount}</span>
        </button>
        <button
          onClick={() => setRoleTab('admin')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            roleTab === 'admin'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Administrators <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">{adminCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll number, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field text-xs py-2 px-3 w-auto"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs py-2 px-3 w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <SkeletonLoader count={6} height="h-16" />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your criteria"
          description="Try broadening your search or switching role filters."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Institutional Role</th>
                  <th className="py-3 px-4">Identifier / Dept</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <Badge variant={
                        u.role === 'admin' ? 'danger' :
                        u.role === 'faculty' ? 'primary' : 'info'
                      }>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Roll / Employee ID & Dept */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {u.student_id || u.employee_id || 'N/A'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {u.department_name || 'General Academic'}
                      </p>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading === u.id}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.is_active 
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={u.is_active ? 'Suspend User Access' : 'Activate User Access'}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.is_active ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setDeleteModal({ open: true, user: u })}
                          disabled={actionLoading === u.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Delete User Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete User Profile</h3>
                <p className="text-xs text-slate-500">This will delete their login credentials and student/faculty associations.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete user <strong className="text-slate-900 dark:text-white">"{deleteModal.user?.name}"</strong> ({deleteModal.user?.email})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading === deleteModal.user?.id}
                className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5"
              >
                {actionLoading === deleteModal.user?.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
