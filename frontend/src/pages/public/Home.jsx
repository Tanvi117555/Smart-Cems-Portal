import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  QrCode,
  Users,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  BookOpen,
  Trophy,
  Cpu,
  Layers,
  Bell,
  FileText,
  Star
} from 'lucide-react';
import api from '../../services/api';
import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
  HoverCard,
  AnimatedCounter
} from '../../animations/motion';

const Home = () => {
  const [stats, setStats] = useState({
    totalEvents: 14,
    totalStudents: 340,
    totalRegistrations: 420,
    totalDepartments: 5
  });
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes] = await Promise.all([
          api.get('/meta/dashboard/admin').catch(() => null),
          api.get('/events/featured').catch(() => null)
        ]);

        if (statsRes?.success && statsRes.stats) {
          setStats({
            totalEvents: statsRes.stats.totalEvents || 14,
            totalStudents: statsRes.stats.totalStudents || 340,
            totalRegistrations: statsRes.stats.totalRegistrations || 420,
            totalDepartments: statsRes.departmentParticipation?.length || 5
          });
        }

        if (eventsRes?.success && eventsRes.events) {
          setFeaturedEvents(eventsRes.events.slice(0, 3));
        }
      } catch (err) {
        console.warn('Home data load:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = [
    { name: 'Technical', icon: Cpu, desc: 'Hackathons, coding challenges, AI bootcamps', color: 'from-blue-500 to-indigo-600' },
    { name: 'Cultural', icon: Sparkles, desc: 'Music, theatricals, arts & dance fests', color: 'from-purple-500 to-pink-600' },
    { name: 'Sports', icon: Trophy, desc: 'Inter-college tournaments and athletic meets', color: 'from-amber-500 to-orange-600' },
    { name: 'Workshop', icon: Layers, desc: 'Hands-on technical & industry skill building', color: 'from-emerald-500 to-teal-600' },
    { name: 'Seminar', icon: BookOpen, desc: 'Distinguished research lectures & symposia', color: 'from-cyan-500 to-blue-600' },
    { name: 'Competition', icon: Award, desc: 'Design sprints, debates, innovation showcases', color: 'from-rose-500 to-red-600' }
  ];

  const steps = [
    { num: '01', title: 'Discover', desc: 'Explore approved events filtered by academic discipline, category, and date.' },
    { num: '02', title: 'Register', desc: 'Secure your seat in seconds with instant digital pass issuance and UPI audit.' },
    { num: '03', title: 'Participate', desc: 'Present your live QR digital admission pass at the gate for one-scan entry.' },
    { num: '04', title: 'Get Certified', desc: 'Submit post-event feedback and instantly download your accredited digital certificate.' }
  ];

  const pillars = [
    { icon: Layers, title: 'Centralized Event Management', desc: 'End-to-end event lifecycle from draft submission to admin approval.' },
    { icon: Sparkles, title: 'Smart Concurrency Registration', desc: 'Zero overbooking race conditions with live waitlist auto-promotion.' },
    { icon: QrCode, title: 'Real-Time QR Attendance', desc: 'Optical browser scanner for instant attendee verification at the venue entrance.' },
    { icon: Bell, title: 'Live Instant Notifications', desc: 'Firestore real-time updates for approvals, tickets, reminders, and waitlists.' },
    { icon: Star, title: 'Versioned Feedback Analytics', desc: 'Preserves student responses permanently with rich Recharts insight graphs.' },
    { icon: Award, title: 'Accredited Digital Certificates', desc: 'Tamper-resistant credential certificates with public verification QR links.' },
    { icon: FileText, title: 'Comprehensive PDF & Excel Reports', desc: 'One-click accreditation summaries and exportable attendee rosters.' },
    { icon: Calendar, title: 'One-Click Calendar Sync', desc: 'Seamlessly add events to Google Calendar or export standard .ics files.' }
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 sm:pt-16 pb-12 overflow-hidden">
        {/* Abstract Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-500/20 to-purple-500/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-200 dark:border-brand-900/60 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Smart CEMS • Next-Generation Higher Education Event Cloud</span>
            </div>
          </FadeIn>

          <SlideUp delay={0.1} distance={20} className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              One Platform. Every Event.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                One Campus Experience.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              Discover college events, register in seconds, stay updated, participate confidently, and manage your complete campus event journey from one unified smart platform.
            </p>
          </SlideUp>

          <SlideUp delay={0.2} distance={20} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/events"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-slate-800 dark:text-white bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-navy-800 shadow-sm transition-all"
            >
              Get Started Free
            </Link>
          </SlideUp>

          {/* Dynamic Live Campus Counter Banner */}
          <SlideUp delay={0.3} distance={20} className="pt-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-brand-600 dark:text-brand-400">
                  <AnimatedCounter target={stats.totalEvents} suffix="+" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Events</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400">
                  <AnimatedCounter target={stats.totalStudents} suffix="+" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter target={stats.totalRegistrations} suffix="+" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                  <AnimatedCounter target={stats.totalDepartments} suffix=" Depts" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Taxonomy</p>
              </div>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Simple 4-Step Lifecycle</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            How Smart CEMS Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            From discovering your favorite club activity to walking out with an accredited credential.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, i) => (
            <HoverCard key={st.num} className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-4 relative overflow-hidden">
              <span className="text-4xl font-black font-heading bg-gradient-to-br from-brand-500 to-purple-600 bg-clip-text text-transparent">
                {st.num}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{st.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
            </HoverCard>
          ))}
        </div>
      </section>

      {/* 3. EVENT CATEGORIES */}
      <section className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Diverse Tracks</span>
            <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
              Explore Event Categories
            </h2>
          </div>
          <Link to="/events" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            <span>View All Tracks</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <HoverCard key={cat.name} className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-md flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-slate-500">{cat.desc}</p>
                </div>
              </HoverCard>
            );
          })}
        </div>
      </section>

      {/* 4. WHY SMART CEMS (KEY CAPABILITIES) */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Core Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Engineered for Modern Higher Education
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Everything universities need to orchestrate seamless campus engagement and institutional accreditation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-2xl overflow-hidden text-center space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        <h2 className="text-3xl sm:text-5xl font-black font-heading leading-tight max-w-2xl mx-auto">
          Elevate Your Campus Event Experience Today
        </h2>
        <p className="text-xs sm:text-sm text-white/80 max-w-lg mx-auto">
          Join hundreds of students, coordinators, and college leadership collaborating on Smart CEMS.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold text-brand-700 bg-white hover:bg-slate-100 transition-colors shadow-lg"
          >
            Discover All Events
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold text-white border border-white/30 hover:bg-white/10 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
