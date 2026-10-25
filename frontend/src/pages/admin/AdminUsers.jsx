import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Shield, GraduationCap, Briefcase, 
  Trash2, UserCheck, UserX, AlertTriangle, Loader2, CheckCircle2, UserCog, X
} from 'lucide-react';
import api from '../../services/api';
import { fetchDepartments as getResilientDepartments, getCachedDepartments } from '../../services/metaService';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState(getCachedDepartments);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState('all'); // 'all', 'student', 'faculty', 'admin'
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [roleModal, setRoleModal] = useState({ open: false, user: null, newRole: 'student' });

  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const depts = await getResilientDepartments();
      if (depts && depts.length > 0) setDepartments(depts);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const loaded = res?.users || res?.data?.users || [];
      setUsers(loaded);
    } catch (err) {
      addToast('Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isUserActive = (u) => {
    return u.status === 'active' || u.is_active === 1 || u.is_active === true;
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(user.id);
      const currentlyActive = isUserActive(user);
      const newStatus = currentlyActive ? 'suspended' : 'active';

      const res = await api.patch(`/users/${user.id}/status`, { status: newStatus });
      if (res?.success || res?.data?.success) {
        addToast(res.message || `User marked as ${newStatus}`, 'success');
        setUsers(users.map(u => u.id === user.id ? { 
          ...u, 
          status: newStatus, 
          is_active: newStatus === 'active' ? 1 : 0 
        } : u));
      }
    } catch (err) {
      addToast(err.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleModal.user) return;
    try {
      setActionLoading(roleModal.user.id);
      const res = await api.post('/auth/set-role', {
        userId: roleModal.user.id,
        role: roleModal.newRole
      });
      if (res?.success || res?.data?.success) {
        addToast(`Role updated to ${roleModal.newRole.toUpperCase()} successfully`, 'success');
        setUsers(users.map(u => u.id === roleModal.user.id ? { ...u, role: roleModal.newRole } : u));
        setRoleModal({ open: false, user: null, newRole: 'student' });
      }
    } catch (err) {
      addToast(err.message || 'Failed to update role', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    try {
      setActionLoading(deleteModal.user.id);
      const res = await api.delete(`/users/${deleteModal.user.id}`);
      if (res?.success || res?.data?.success) {
        addToast('User record permanently deleted', 'success');
        setUsers(users.filter(u => u.id !== deleteModal.user.id));
        setDeleteModal({ open: false, user: null });
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleTab === 'all' || u.role === roleTab;
    const matchesDept = deptFilter === 'all' || String(u.department_id || u.departmentId) === deptFilter;
    const active = isUserActive(u);
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && active) || 
                          (statusFilter === 'inactive' && !active);
    const q = search.toLowerCase();
    const matchesSearch = (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.student_id && u.student_id.toLowerCase().includes(q)) ||
                          (u.faculty_id && u.faculty_id.toLowerCase().includes(q)) ||
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
          University User Directory & RBAC
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
            <option value="active">Active Only</option>
            <option value="inactive">Suspended Only</option>
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
                {filteredUsers.map((u) => {
                  const active = isUserActive(u);
                  const dateStr = u.createdAt || u.created_at || new Date().toISOString();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* User info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{u.name || 'Anonymous'}</p>
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
                          {String(u.role || 'student').toUpperCase()}
                        </Badge>
                      </td>

                      {/* Roll / Employee ID & Dept */}
                      <td className="py-3.5 px-4">
                        <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {u.student_id || u.faculty_id || u.employee_id || 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {u.department_name || u.departmentName || 'General Academic'}
                        </p>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={active ? 'success' : 'danger'}>
                          {active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => setRoleModal({ open: true, user: u, newRole: u.role || 'student' })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-slate-200 dark:border-slate-700 transition-colors"
                            title="Change Role / Permissions"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active/Suspended */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading === u.id}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              active 
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                            }`}
                            title={active ? 'Suspend User Access' : 'Activate User Access'}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete User */}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleModal.open && roleModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Assign Role</h3>
              </div>
              <button
                onClick={() => setRoleModal({ open: false, user: null, newRole: 'student' })}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assign role and system capabilities for <strong className="text-slate-900 dark:text-white">{roleModal.user.name}</strong> ({roleModal.user.email}).
            </p>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Institutional Role
                </label>
                <select
                  value={roleModal.newRole}
                  onChange={(e) => setRoleModal(prev => ({ ...prev, newRole: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="student">Student (Browse, Register, Feedback, Certificates)</option>
                  <option value="faculty">Faculty (Organize Events, Scan Gate QR, Form Builder, Reports)</option>
                  <option value="admin">Admin (Full Campus Super Administrator Privileges)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModal({ open: false, user: null, newRole: 'student' })}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === roleModal.user.id}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading === roleModal.user.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
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

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">Name:</strong> {deleteModal.user?.name}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Email:</strong> {deleteModal.user?.email}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Role:</strong> {deleteModal.user?.role?.toUpperCase()}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading === deleteModal.user?.id}
                className="btn-danger py-2 px-4 text-xs flex items-center gap-2"
              >
                {actionLoading === deleteModal.user?.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
