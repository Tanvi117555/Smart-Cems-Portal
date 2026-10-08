import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, Search, Filter, Check, XCircle, Trash2, Eye, 
  MapPin, Users, DollarSign, Clock, AlertTriangle, Loader2, 
  CheckCircle2, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, eventId: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });

  const { addToast } = useToast();

  // Sync state with URL query parameter changes
  useEffect(() => {
    const s = searchParams.get('status');
    if (s) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMetadata();
    fetchEvents();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [catsRes, deptsRes] = await Promise.all([
        api.get('/meta/categories'),
        api.get('/meta/departments')
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.categories || []);
      if (deptsRes.data.success) setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Pass status: 'all' to ensure backend returns pending, published, rejected, and draft events
      const res = await api.get('/events', { params: { limit: 100, status: 'all' } });
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      addToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      setActionLoading(eventId);
      const res = await api.patch(`/events/${eventId}/approve`);
      if (res.data.success) {
        addToast('Event approved successfully and published to student directory!', 'success');
        fetchEvents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve event', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      addToast('Please provide a reason for rejection', 'warning');
      return;
    }
    try {
      setActionLoading(rejectModal.eventId);
      const res = await api.patch(`/events/${rejectModal.eventId}/reject`, {
        rejection_reason: rejectModal.reason.trim()
      });
      if (res.data.success) {
        addToast('Event marked as rejected and faculty coordinator notified', 'info');
        setRejectModal({ open: false, eventId: null, reason: '' });
        fetchEvents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reject event', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.event) return;
    try {
      setActionLoading(deleteModal.event.id);
      const res = await api.delete(`/events/${deleteModal.event.id}`);
      if (res.data.success) {
        addToast(`Event "${deleteModal.event.title}" deleted`, 'success');
        setDeleteModal({ open: false, event: null });
        fetchEvents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete event', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = events.filter(e => e.status === 'pending').length;
  const publishedCount = events.filter(e => e.status === 'published').length;
  const rejectedCount = events.filter(e => e.status === 'rejected').length;

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
                          (ev.venue && ev.venue.toLowerCase().includes(search.toLowerCase())) ||
                          (ev.organizer_name && ev.organizer_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || String(ev.category_id) === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    if (newStatus === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Institutional Events Management & Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, approve, and oversee all university-wide co-curricular and extracurricular events.
          </p>
        </div>
      </div>

      {/* Pending Banner Alert if pending items exist */}
      {pendingCount > 0 && statusFilter !== 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {pendingCount} Event Proposal{pendingCount > 1 ? 's' : ''} Awaiting Your Review
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                Faculty organizers have submitted events that require administrative verification before appearing in the student directory.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTabChange('pending')}
            className="btn-primary py-2 px-4 text-xs shrink-0 self-start sm:self-auto bg-amber-600 hover:bg-amber-700 flex items-center gap-1.5"
          >
            Review Pending Now ({pendingCount})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('pending')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'pending'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Awaiting Approval
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            pendingCount > 0 
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse' 
              : 'bg-slate-100 dark:bg-slate-800'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('all')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'all'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          All Events
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('published')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'published'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Published
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {publishedCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('rejected')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            statusFilter === 'rejected'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Rejected
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px]">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, organizer, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field text-xs py-2 px-3 w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <SkeletonLoader count={5} height="h-16" />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={statusFilter === 'pending' ? "No pending event proposals" : "No events found"}
          description={
            statusFilter === 'pending'
              ? "All submitted events have been reviewed. New proposals from faculty coordinators will appear here automatically."
              : search 
              ? "No events match your criteria." 
              : "No college events exist in this view."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Organizer & Dept</th>
                  <th className="py-3 px-4">Date & Venue</th>
                  <th className="py-3 px-4">Fee / Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.map((ev) => (
                  <tr 
                    key={ev.id} 
                    className={`transition-colors ${
                      ev.status === 'pending' 
                        ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/30' 
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Title and Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={ev.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80'} 
                          alt={ev.title}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <Link 
                            to={`/events/${ev.id}`} 
                            target="_blank"
                            className="font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors truncate block text-sm"
                          >
                            {ev.title}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            {ev.category_name || 'General Event'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Organizer & Department */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {ev.organizer_name || 'Faculty Coordinator'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ev.department_name || 'All Departments'}
                      </p>
                    </td>

                    {/* Date & Venue */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
                        <p className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-primary-500" />
                          {new Date(ev.date).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {ev.venue}
                        </p>
                      </div>
                    </td>

                    {/* Fee & Capacity */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {ev.is_paid ? `₹${ev.registration_fee}` : 'Free'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ev.registered_count || 0} / {ev.max_participants || '∞'} Booked
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={
                        ev.status === 'published' ? 'success' :
                        ev.status === 'pending' ? 'warning' :
                        ev.status === 'rejected' ? 'danger' : 'neutral'
                      }>
                        {ev.status === 'pending' ? 'Pending Review' : ev.status}
                      </Badge>
                      {ev.rejection_reason && (
                        <p className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={ev.rejection_reason}>
                          Note: {ev.rejection_reason}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/events/${ev.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Preview Public Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {ev.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ev.id)}
                              disabled={actionLoading === ev.id}
                              className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                              title="Approve and Publish Event"
                            >
                              {actionLoading === ev.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() => setRejectModal({ open: true, eventId: ev.id, reason: '' })}
                              disabled={actionLoading === ev.id}
                              className="btn-secondary py-1.5 px-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 flex items-center gap-1"
                              title="Reject Event Proposal"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setDeleteModal({ open: true, event: ev })}
                          disabled={actionLoading === ev.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Event"
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

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Reject Event Proposal</h3>
                <p className="text-xs text-slate-500">Specify why this event proposal was not approved so the organizer can revise it.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Feedback & Reason for Rejection *
              </label>
              <textarea
                rows="4"
                placeholder="e.g. Schedule conflicts with College Annual Day. Please change the venue or propose an alternate date."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal({ open: false, eventId: null, reason: '' })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.eventId}
                className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5"
              >
                {actionLoading === rejectModal.eventId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Delete Event Record</h3>
                <p className="text-xs text-slate-500">This action permanently removes the event and all associated registrations.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deleteModal.event?.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, event: null })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteModal.event?.id}
                className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5"
              >
                {actionLoading === deleteModal.event?.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
