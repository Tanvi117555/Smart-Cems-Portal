import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  PlusCircle,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileText,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await api.get('/events/my');
        if (res.success) {
          setEvents(res.events || []);
        }
      } catch (err) {
        console.error('Error loading faculty events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === 'published');
  const pendingApprovals = events.filter((e) => e.status === 'pending');
  const totalParticipants = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);

  // Prepare chart data: Registrations by Event
  const eventRegData = events.slice(0, 6).map((e) => ({
    name: e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title,
    registrations: e.registered_count || 0,
    capacity: e.max_participants
  }));

  // Category counts
  const categoryMap = {};
  events.forEach((e) => {
    const cat = e.category_name || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryPieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-brand text-white shadow-xl shadow-brand-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <span>Faculty Event Director</span>
            <span>•</span>
            <span>{user?.department_name || 'Academic Faculty'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight">
            Welcome, {user?.name}! 🎓
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Manage your campus competitions, verify paid entries, view feedback analytics, and generate reports.
          </p>
        </div>

        <Link
          to="/faculty/events/create"
          className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-md hover:scale-105 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Events"
          value={totalEvents}
          icon={Calendar}
          gradient="from-blue-600 to-indigo-600"
        />
        <StatCard
          title="Total Participants"
          value={totalParticipants}
          icon={Users}
          gradient="from-indigo-600 to-purple-600"
        />
        <StatCard
          title="Active Published"
          value={publishedEvents.length}
          icon={CheckCircle2}
          gradient="from-emerald-600 to-teal-600"
        />
        <StatCard
          title="Pending Approval"
          value={pendingApprovals.length}
          icon={AlertTriangle}
          gradient="from-amber-600 to-orange-600"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registrations Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Registrations by Event
            </h3>
            <span className="text-xs text-slate-400">Top Managed Events</span>
          </div>

          <div className="h-64 w-full pt-4">
            {eventRegData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No event data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventRegData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="registrations" fill="#4f46e5" radius={[8, 8, 0, 0]} name="Attendees" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <span className="text-xs text-slate-400">By event disciplines</span>
          </div>

          <div className="h-52 w-full">
            {categoryPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No events created.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {categoryPieData.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/faculty/events"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all space-y-2"
        >
          <Calendar className="w-6 h-6 text-brand-600" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">My Managed Events</h4>
          <p className="text-xs text-slate-500">Edit rounds, schedules, rules and images.</p>
        </Link>

        <Link
          to="/faculty/registrations"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all space-y-2"
        >
          <Users className="w-6 h-6 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Attendee Management</h4>
          <p className="text-xs text-slate-500">Review student rosters & verify UPI proofs.</p>
        </Link>

        <Link
          to="/faculty/events"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all space-y-2"
        >
          <MessageSquare className="w-6 h-6 text-purple-600" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Feedback Analytics</h4>
          <p className="text-xs text-slate-500">Build questionnaires & inspect ratings.</p>
        </Link>

        <Link
          to="/faculty/reports"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all space-y-2"
        >
          <FileText className="w-6 h-6 text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Generate PDF Reports</h4>
          <p className="text-xs text-slate-500">Export comprehensive university reports.</p>
        </Link>
      </div>

      {/* Recent Events Table */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
            Managed Event Proposals
          </h3>
          <Link
            to="/faculty/events"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 font-bold">Event Name</th>
                <th className="pb-3 font-bold">Date & Time</th>
                <th className="pb-3 font-bold">Venue</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold">Registrations</th>
                <th className="pb-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {events.slice(0, 5).map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                    {e.title}
                  </td>
                  <td className="py-3.5 text-slate-500">
                    {new Date(e.date).toLocaleDateString()} ({e.start_time})
                  </td>
                  <td className="py-3.5 text-slate-500 max-w-[150px] truncate">
                    {e.venue}
                  </td>
                  <td className="py-3.5">
                    <Badge status={e.status} />
                  </td>
                  <td className="py-3.5 font-bold text-slate-700 dark:text-slate-300">
                    {e.registered_count || 0} / {e.max_participants}
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <Link
                      to={`/faculty/registrations?eventId=${e.id}`}
                      className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                    >
                      Roster
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
