import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Search, AlertTriangle, 
  Loader2, Check, X, Users, BookOpen
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, isEdit: false, data: { id: null, name: '', code: '', description: '' } });
  const [deleteModal, setDeleteModal] = useState({ open: false, dept: null });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meta/departments');
      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      addToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal.data.name.trim() || !modal.data.code.trim()) {
      addToast('Department Name and Code are required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (modal.isEdit) {
        const res = await api.put(`/meta/departments/${modal.data.id}`, modal.data);
        if (res.data.success) {
          addToast('Department updated successfully', 'success');
          setModal({ open: false, isEdit: false, data: { id: null, name: '', code: '', description: '' } });
          fetchDepartments();
        }
      } else {
        const res = await api.post('/meta/departments', modal.data);
        if (res.data.success) {
          addToast('Department created successfully', 'success');
          setModal({ open: false, isEdit: false, data: { id: null, name: '', code: '', description: '' } });
          fetchDepartments();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.dept) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/meta/departments/${deleteModal.dept.id}`);
      if (res.data.success) {
        addToast('Department deleted successfully', 'success');
        setDeleteModal({ open: false, dept: null });
        fetchDepartments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Academic Departments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure institutional faculties, departments, and academic branches.
          </p>
        </div>

        <button
          onClick={() => setModal({ open: true, isEdit: false, data: { id: null, name: '', code: '', description: '' } })}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="card p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader count={6} height="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description={search ? "No departments match your query." : "No academic departments have been created."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <div 
              key={d.id}
              className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                    {d.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ open: true, isEdit: true, data: { id: d.id, name: d.name, code: d.code, description: d.description || '' } })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, dept: d })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
                  {d.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {d.description || 'No description provided for this academic department.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Academic Unit
                </span>
                <span>ID: #{d.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                {modal.isEdit ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button 
                onClick={() => setModal({ ...modal, open: false })}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={modal.data.name}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  value={modal.data.code}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, code: e.target.value.toUpperCase() } })}
                  className="input-field text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief summary of programs, labs, or faculty focus..."
                  value={modal.data.description}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ ...modal, open: false })}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {modal.isEdit ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Department</h3>
                <p className="text-xs text-slate-500">Associated students and faculty will lose department tags.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deleteModal.dept?.name} ({deleteModal.dept?.code})"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, dept: null })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
