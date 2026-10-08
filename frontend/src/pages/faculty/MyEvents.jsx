import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  Users,
  Edit,
  Trash2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoader';

const MyEvents = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/my');
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      toast.error('Error fetching your events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/events/${id}`);
      if (res.success) {
        toast.success('Event deleted successfully.');
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting event.');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            My Managed Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create, edit schedules, manage student rosters, and inspect approval status.
          </p>
        </div>
        <Link
          to="/faculty/events/create"
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Event Proposal</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
        {['all', 'published', 'pending', 'rejected', 'draft'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === status
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {status} ({events.filter((e) => status === 'all' || e.status === status).length})
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events matching status"
          description="You haven't created any events under this filter yet."
          actionLabel="Create an Event"
          actionLink="/faculty/events/create"
        />
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((e) => (
            <div
              key={e.id}
              className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={e.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=200'}
                    alt={e.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                        {e.category_name}
                      </span>
                      <Badge status={e.status} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {e.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(e.date).toLocaleDateString()} ({e.start_time} - {e.end_time}) • {e.venue}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">Attendees Registered</p>
                  <p className="text-lg font-extrabold font-heading text-brand-600 dark:text-brand-400">
                    {e.registered_count || 0} / {e.max_participants}
                  </p>
                </div>
              </div>

              {/* Rejection Note if Rejected */}
              {e.status === 'rejected' && e.rejection_reason && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Administrative Feedback:</strong> {e.rejection_reason}
                  </div>
                </div>
              )}

              {/* Card Actions Toolbar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/faculty/registrations?eventId=${e.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-brand-50 text-slate-700 dark:text-slate-200 hover:text-brand-600 flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    <span>View Roster ({e.registered_count || 0})</span>
                  </Link>
                  <Link
                    to={`/faculty/gallery?eventId=${e.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-purple-50 text-slate-700 dark:text-slate-200 hover:text-purple-600 flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                    <span>Gallery</span>
                  </Link>
                  <a
                    href={`/api/reports/event/${e.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-600 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>PDF Report</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/faculty/events/edit/${e.id}`}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-navy-800"
                    title="Edit event"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(e.id, e.title)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
