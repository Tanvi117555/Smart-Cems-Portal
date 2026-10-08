import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, MapPin, Users, DollarSign, 
  Search, Filter, CheckCircle2, AlertCircle, ArrowUpRight, Loader2, Star
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const FacultyReports = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events/my');
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
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

      // Create download link for PDF blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      link.setAttribute('download', `CEMS_Report_${sanitizedTitle}_${event.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast(`Report downloaded successfully for "${event.title}"`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      addToast('Failed to generate PDF report. Please try again.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
                          (ev.venue && ev.venue.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Official Event Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate and export university-grade summary reports with participant rosters, financial audits, and feedback ratings in PDF format.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm py-1.5 px-3 w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending">Pending Approval</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonLoader count={4} height="h-44" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No events found"
          description={search ? "No events match your search criteria." : "You have not organized any events yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((event) => {
            const isCompleted = new Date(event.date) < new Date();
            return (
              <div 
                key={event.id}
                className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                      {event.category_name || 'General'}
                    </span>
                    <Badge variant={
                      event.status === 'published' ? 'success' :
                      event.status === 'pending' ? 'warning' :
                      event.status === 'rejected' ? 'danger' : 'neutral'
                    }>
                      {event.status}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-base text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {event.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {event.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      {event.registered_count || 0} / {event.max_participants || '∞'} Registrations
                    </span>
                  </div>

                  {/* Highlights Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Type</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {event.is_paid ? `₹${event.registration_fee}` : 'Free'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Attendance</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {event.attended_count || 0} Checked-in
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Timeline</p>
                      <p className={`text-xs font-semibold mt-0.5 ${isCompleted ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isCompleted ? 'Completed' : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    ID: #{event.id}
                  </span>
                  
                  <button
                    onClick={() => handleDownloadPDF(event)}
                    disabled={downloadingId === event.id}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    {downloadingId === event.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export PDF Report
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

export default FacultyReports;
