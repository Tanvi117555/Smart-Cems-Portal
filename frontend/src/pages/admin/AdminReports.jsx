import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Search, Filter, Calendar, MapPin, 
  Users, DollarSign, Loader2, CheckCircle2, Building2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminReports = () => {
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, deptsRes] = await Promise.all([
        api.get('/events', { params: { limit: 100 } }),
        api.get('/meta/departments')
      ]);
      if (eventsRes.data.success) setEvents(eventsRes.data.events || []);
      if (deptsRes.data.success) setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      addToast('Failed to load events for reporting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (event) => {
    setDownloadingId(event.id);
    try {
      const response = await api.get(`/reports/event/${event.id}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitized = event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      link.setAttribute('download', `Official_Report_${sanitized}_${event.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast(`Official PDF report generated for "${event.title}"`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      addToast('Failed to generate PDF report', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = events.filter((ev) => {
    const matchesDept = deptFilter === 'all' || String(ev.department_id) === deptFilter;
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = ev.title.toLowerCase().includes(q) ||
                          (ev.venue && ev.venue.toLowerCase().includes(q)) ||
                          (ev.organizer_name && ev.organizer_name.toLowerCase().includes(q));
    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          Institutional PDF Documentation & Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate accredited event summary reports with verified attendee rosters, audited financial returns, and student feedback ratings.
        </p>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by event title, organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input-field text-xs py-2 px-3 w-auto"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs py-2 px-3 w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonLoader count={4} height="h-44" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No events match filter"
          description="Try selecting different departments or search terms."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((ev) => {
            const isCompleted = new Date(ev.date) < new Date();
            return (
              <div 
                key={ev.id}
                className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                      {ev.category_name || 'General'}
                    </span>
                    <Badge variant={ev.status === 'published' ? 'success' : ev.status === 'pending' ? 'warning' : 'neutral'}>
                      {ev.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Organized by <strong className="text-slate-700 dark:text-slate-300">{ev.organizer_name}</strong> • {ev.department_name || 'Academic Dept'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {new Date(ev.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registrations</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ev.registered_count || 0} Booked
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fee</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ev.is_paid ? `₹${ev.registration_fee}` : 'Free'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    ID: #{ev.id}
                  </span>

                  <button
                    onClick={() => handleDownloadPDF(ev)}
                    disabled={downloadingId === ev.id}
                    className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-2"
                  >
                    {downloadingId === ev.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Export Official PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
