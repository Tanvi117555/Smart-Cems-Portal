import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  MapPin,
  Download,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [regRes, recRes] = await Promise.allSettled([
          api.get('/registrations/my'),
          api.get('/events/recommendations')
        ]);
        if (regRes.status === 'fulfilled' && regRes.value?.success) {
          setRegistrations(regRes.value.registrations || []);
        }
        if (recRes.status === 'fulfilled' && recRes.value?.success) {
          setRecommendedEvents(recRes.value.recommendations || []);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingRegs = registrations.filter(
    (r) => new Date(r.event_date).toISOString().split('T')[0] >= todayStr && r.status !== 'cancelled'
  );
  const completedRegs = registrations.filter(
    (r) => new Date(r.event_date).toISOString().split('T')[0] < todayStr && r.status !== 'cancelled'
  );
  const pendingFeedback = completedRegs.filter((r) => r.feedback_form_id && !r.submitted_feedback_id);

  return (
    <div className="space-y-8">
      {/* Welcome Greeting Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-brand text-white shadow-xl shadow-brand-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <span>Student Dashboard</span>
            <span>•</span>
            <span>{user?.student_roll_id || user?.student_year || 'Undergraduate'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            You have <strong className="text-white font-bold">{upcomingRegs.length}</strong> upcoming campus events on your schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/events"
            className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-white text-slate-900 shadow-md hover:scale-105 transition-all flex items-center gap-2 shrink-0"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Discover Events</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Registrations"
          value={registrations.length}
          icon={Ticket}
          gradient="from-blue-600 to-indigo-600"
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingRegs.length}
          icon={Calendar}
          gradient="from-indigo-600 to-purple-600"
        />
        <StatCard
          title="Completed Events"
          value={completedRegs.length}
          icon={CheckCircle2}
          gradient="from-emerald-600 to-teal-600"
        />
        <StatCard
          title="Pending Feedback"
          value={pendingFeedback.length}
          icon={MessageSquare}
          gradient="from-amber-600 to-orange-600"
        />
      </div>

      {/* Upcoming Events Carousel/List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-500" />
            <span>Upcoming Event Passes</span>
          </h2>
          <Link
            to="/student/registrations"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({registrations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingRegs.length === 0 ? (
          <div className="p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs sm:text-sm text-slate-500">You have no upcoming events scheduled.</p>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Explore available competitions & workshops</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingRegs.map((reg) => (
              <div
                key={reg.id}
                className="p-5 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                      Pass: {reg.registration_id}
                    </span>
                    <Badge status={reg.status} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {reg.event_title}
                  </h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{new Date(reg.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {reg.event_start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">{reg.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">
                    {reg.is_paid ? `Payment: ${(reg.payment_status || 'PENDING').toUpperCase()}` : 'Free Pass'}
                  </span>
                  <a
                    href={`/api/reports/receipt/${reg.registration_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 hover:bg-brand-100 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended For You Section */}
      {recommendedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Recommended For You</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Personalized based on department, interests & popularity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedEvents.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-3xl glass-panel border border-brand-200/60 dark:border-brand-900/60 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {rec.category || 'Event'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    {rec.matchScore}% Match
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {rec.title}
                  </h3>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-500" />
                      <span>{new Date(rec.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">{rec.venue}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rec.is_paid || rec.fee > 0 ? `₹${rec.fee}` : 'Free Pass'}
                  </span>
                  <Link
                    to={`/events/${rec.id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Event</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/events"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Explore Events</h4>
            <p className="text-[11px] text-slate-400">Discover upcoming fests</p>
          </div>
        </Link>

        <Link
          to="/student/registrations"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">My Registrations</h4>
            <p className="text-[11px] text-slate-400">View tickets & passes</p>
          </div>
        </Link>

        <Link
          to="/student/feedback"
          className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Give Feedback</h4>
            <p className="text-[11px] text-slate-400">Rate completed events</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
