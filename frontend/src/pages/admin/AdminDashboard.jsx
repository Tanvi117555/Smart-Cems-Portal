import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Calendar, CheckCircle2, Clock, DollarSign, TrendingUp,
  AlertTriangle, ArrowRight, ShieldCheck, XCircle, Check, Eye, 
  BarChart2, PieChart as PieIcon, Layers, FileText, ChevronRight, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, eventId: null, reason: '' });
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [res, auditRes] = await Promise.allSettled([
        api.get('/meta/analytics/dashboard'),
        api.get('/meta/audit-logs?limit=10')
      ]);
      if (res.status === 'fulfilled' && (res.value?.success || res.value?.data?.success)) {
        setData(res.value.success ? res.value : res.value.data);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.success) {
        setAuditLogs(auditRes.value.logs || []);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      toast.error('Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      setActionLoading(eventId);
      const res = await api.patch(`/events/${eventId}/approve`);
      if (res?.success || res?.data?.success) {
        toast.success('Event approved and published successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(rejectModal.eventId);
      const res = await api.patch(`/events/${rejectModal.eventId}/reject`, {
        rejection_reason: rejectModal.reason.trim()
      });
      if (res?.success || res?.data?.success) {
        toast.info('Event rejected with feedback');
        setRejectModal({ open: false, eventId: null, reason: '' });
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reject event');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader count={4} height="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader count={2} height="h-80" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const eventsByCategory = data?.eventsByCategory?.map(c => ({ name: c.name, value: Number(c.count) })) || [];
  const deptParticipation = data?.departmentParticipation?.map(d => ({
    name: d.department || d.department_name,
    registrations: Number(d.registrations),
    students: Number(d.students)
  })) || [];
  const monthlyData = data?.monthlyRegistrations || [];
  const pendingEvents = data?.pendingEvents || [];
  const recentRegistrations = data?.recentRegistrations || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-blue-200 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Super Administrator Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Institutional Oversight & Insights
          </h1>
          <p className="mt-2 text-sm md:text-base text-blue-100/80 leading-relaxed">
            Monitor real-time participation metrics, expedite event approvals, track registrations, and maintain academic standards across all departments.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -top-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Community"
          value={stats.totalUsers || 0}
          subtitle={`${stats.totalStudents || 0} Students • ${stats.totalFaculty || 0} Faculty`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Campus Events"
          value={stats.totalEvents || 0}
          subtitle={`${stats.upcomingEvents || 0} Active • ${stats.completedEvents || 0} Completed`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations || 0}
          subtitle="Lifetime confirmed bookings"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Audited Revenue"
          value={`₹${(Number(stats.totalRevenue) || 0).toLocaleString()}`}
          subtitle="Verified payment collections"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Pending Approvals Notice / Alert */}
      {pendingEvents.length > 0 && (
        <div className="card p-5 border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Events Awaiting Administrative Approval ({pendingEvents.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review faculty-submitted events to publish them to the student directory.
                </p>
              </div>
            </div>
            <Link to="/admin/events?status=pending" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingEvents.map((event) => (
              <div key={event.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors">
                      {event.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {event.category_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      by {event.organizer_name} ({event.department_name || 'Academic'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    📅 {new Date(event.date).toLocaleDateString()} • 📍 {event.venue} • {event.is_paid ? `₹${event.registration_fee}` : 'Free'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/events/${event.id}`}
                    target="_blank"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
                    title="Preview Event"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </Link>

                  <button
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading === event.id}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {actionLoading === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>

                  <button
                    onClick={() => setRejectModal({ open: true, eventId: event.id, reason: '' })}
                    disabled={actionLoading === event.id}
                    className="btn-secondary py-1.5 px-3 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary-500" />
                Event Distribution by Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Classification across technical, cultural & sports</p>
            </div>
          </div>

          <div className="h-64">
            {eventsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {eventsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No categorical event data available
              </div>
            )}
          </div>
        </div>

        {/* Department Participation Bar Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Department Student Participation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Total event registrations by academic department</p>
            </div>
          </div>

          <div className="h-64">
            {deptParticipation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptParticipation} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <RechartsTooltip
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderColor: '#334155', 
                      borderRadius: '8px', 
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="registrations" name="Registrations" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="students" name="Enrolled Students" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department participation data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Registrations & Revenue Trend */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Registration Growth & Revenue Velocity (6-Month Trajectory)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Institutional engagement acceleration over the current semester</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <RechartsTooltip
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  borderColor: '#334155', 
                  borderRadius: '8px', 
                  color: '#F8FAFC',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="registrations" name="Total Registrations" stroke="#2563EB" fillOpacity={1} fill="url(#colorReg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recent Student Registrations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest enrollments across upcoming college events</p>
          </div>
          <Link to="/admin/events" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Manage All Events <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Reg ID</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Booked At</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Registration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    No recent registrations recorded.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {reg.registration_id}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{reg.student_name}</p>
                      <p className="text-[11px] text-slate-400">{reg.student_email}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {reg.event_title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(reg.registered_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      {reg.payment_status ? (
                        <Badge variant={reg.payment_status === 'verified' ? 'success' : reg.payment_status === 'rejected' ? 'danger' : 'warning'}>
                          {reg.payment_status}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Free</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={reg.status === 'confirmed' ? 'success' : reg.status === 'attended' ? 'info' : 'warning'}>
                        {reg.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Activity & Audit Trail */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Audit Trail & Activity Logs
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Real-time compliance ledger ({auditLogs.length} recent actions)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    No recent audit activity recorded.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{log.actorName || log.actorId}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {log.entityType} ({log.entityId ? log.entityId.slice(0, 10) : 'N/A'})
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Reject Event Proposal</h3>
                <p className="text-xs text-slate-500">Specify remarks to notify the organizing faculty member.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows="4"
                placeholder="e.g. Schedule conflicts with College Annual Day. Please revise the date or venue details."
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
    </div>
  );
};

export default AdminDashboard;
