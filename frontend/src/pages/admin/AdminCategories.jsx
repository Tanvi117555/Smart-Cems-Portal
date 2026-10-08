import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Edit2, Trash2, Search, AlertTriangle, 
  Loader2, Check, X, Code, Music, Trophy, BookOpen, 
  Cpu, Users, Sparkles, Video, Mic
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const AVAILABLE_ICONS = [
  { label: 'Code', icon: Code },
  { label: 'Music', icon: Music },
  { label: 'Trophy', icon: Trophy },
  { label: 'BookOpen', icon: BookOpen },
  { label: 'Cpu', icon: Cpu },
  { label: 'Users', icon: Users },
  { label: 'Sparkles', icon: Sparkles },
  { label: 'Mic', icon: Mic },
  { label: 'Tag', icon: Tag }
];

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, isEdit: false, data: { id: null, name: '', slug: '', icon: 'Tag', description: '' } });
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meta/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      addToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal.data.name.trim()) {
      addToast('Category Name is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (modal.isEdit) {
        const res = await api.put(`/meta/categories/${modal.data.id}`, modal.data);
        if (res.data.success) {
          addToast('Category updated successfully', 'success');
          setModal({ open: false, isEdit: false, data: { id: null, name: '', slug: '', icon: 'Tag', description: '' } });
          fetchCategories();
        }
      } else {
        const res = await api.post('/meta/categories', modal.data);
        if (res.data.success) {
          addToast('Category created successfully', 'success');
          setModal({ open: false, isEdit: false, data: { id: null, name: '', slug: '', icon: 'Tag', description: '' } });
          fetchCategories();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/meta/categories/${deleteModal.category.id}`);
      if (res.data.success) {
        addToast('Category deleted successfully', 'success');
        setDeleteModal({ open: false, category: null });
        fetchCategories();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error deleting category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Event Categories & Taxonomy
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize campus activities into structured disciplines for student discovery and filtering.
          </p>
        </div>

        <button
          onClick={() => setModal({ open: true, isEdit: false, data: { id: null, name: '', slug: '', icon: 'Tag', description: '' } })}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="card p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader count={6} height="h-36" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          description={search ? "No categories match your search." : "No event categories have been created yet."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat) => (
            <div 
              key={cat.id}
              className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-100 dark:border-primary-800/80">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ 
                        open: true, 
                        isEdit: true, 
                        data: { id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon || 'Tag', description: cat.description || '' } 
                      })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, category: cat })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {cat.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {cat.description || 'General event category for university programming.'}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>slug: /{cat.slug || cat.name.toLowerCase().replace(/ /g, '-')}</span>
                <span>ID: #{cat.id}</span>
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
                <Tag className="w-5 h-5 text-primary-600" />
                {modal.isEdit ? 'Edit Category' : 'Create New Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical, Cultural, Sports"
                  value={modal.data.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    setModal({ ...modal, data: { ...modal.data, name, slug } });
                  }}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. technical"
                  value={modal.data.slug}
                  onChange={(e) => setModal({ ...modal, data: { ...modal.data, slug: e.target.value } })}
                  className="input-field text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Brief description of event types under this category..."
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
                  {modal.isEdit ? 'Update Category' : 'Create Category'}
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
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Category</h3>
                <p className="text-xs text-slate-500">Events belonging to this category will become uncategorized.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete category <strong className="text-slate-900 dark:text-white">"{deleteModal.category?.name}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, category: null })}
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

export default AdminCategories;
