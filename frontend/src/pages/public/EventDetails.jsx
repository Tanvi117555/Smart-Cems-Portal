import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Share2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Upload,
  UserPlus,
  Trash2,
  X,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendar';
import { motion, AnimatePresence } from '../../animations/motion';

const EventDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [waitlisting, setWaitlisting] = useState(false);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [isTeam, setIsTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState(['']);

  // Payment proof state for paid events
  const [step, setStep] = useState('details'); // 'details' or 'payment'
  const [createdRegId, setCreatedRegId] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Lightbox Modal State
  const [activeImage, setActiveImage] = useState(null);

  // Real-time Student Eligibility Status
  const [eligibility, setEligibility] = useState(null);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      if (res.success) {
        setEvent(res.event);
        setIsRegistered(res.isRegistered);
        setRegistration(res.registration);
        setIsWaitlisted(res.isWaitlisted);
        setWaitlistPosition(res.waitlistPosition);
      }
    } catch (err) {
      toast.error('Unable to find event details.');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();

    if (searchParams.get('action') === 'register') {
      setShowRegModal(true);
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student' && id) {
      api.get(`/events/${id}/eligibility`)
        .then((res) => {
          if (res?.success) setEligibility(res);
        })
        .catch(() => {});
    }
  }, [id, isAuthenticated, user]);

  // Handle Dynamic Team Member Input
  const handleMemberChange = (index, value) => {
    const updated = [...teamMembers];
    updated[index] = value;
    setTeamMembers(updated);
  };

  const addMemberField = () => {
    if (teamMembers.length < 4) {
      setTeamMembers([...teamMembers, '']);
    }
  };

  const removeMemberField = (index) => {
    const updated = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updated);
  };

  // 1. Submit Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmittingReg(true);
    try {
      const payload = {
        event_id: event.id,
        is_team: isTeam,
        team_name: isTeam ? teamName : null,
        team_members: isTeam ? teamMembers.filter((m) => m.trim()) : null
      };

      const res = await api.post('/registrations', payload);

      if (res.success) {
        if (event.is_paid || event.fee > 0) {
          setCreatedRegId(res.registration?.id);
          setStep('payment');
          toast.info('Registration created. Please submit UPI transaction proof.');
        } else {
          toast.success('Registration Confirmed! 🎉');
          setShowRegModal(false);
          setIsRegistered(true);
          setRegistration(res.registration);
          fetchEvent();
        }
      }
    } catch (err) {
      if (err.isFull) {
        toast.warning(err.message);
      } else {
        toast.error(err.message || 'Error processing registration.');
      }
    } finally {
      setSubmittingReg(false);
    }
  };

  // 2. Submit UPI Payment Proof
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.error('Please enter the UPI Transaction ID / UTR.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        registration_id: createdRegId,
        transaction_id: transactionId.trim(),
        amount: event.fee || event.registration_fee || 0,
        screenshot_url: null
      };

      const res = await api.post('/payments', payload);

      if (res.success) {
        toast.success('Payment submitted for audit! The faculty coordinator will verify shortly.');
        setShowRegModal(false);
        setStep('details');
        setIsRegistered(true);
        fetchEvent();
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // 3. Join Waitlist
  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setWaitlisting(true);
    try {
      const res = await api.post('/registrations/waitlist', { event_id: event.id });
      if (res.success) {
        toast.success(res.message);
        setIsWaitlisted(true);
        setWaitlistPosition(res.position);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join waitlist.');
    } finally {
      setWaitlisting(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Loading campus event details...</p>
      </div>
    );
  }

  const seatsFilled = event.seatsFilled || event.registered_count || 0;
  const maxSeats = event.maxParticipants || event.max_participants || 100;
  const seatsAvailable = Math.max(0, maxSeats - seatsFilled);
  const fillPercentage = Math.min(100, Math.round((seatsFilled / maxSeats) * 100));

  const isFull = seatsAvailable === 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const deadlineStr = (event.registrationDeadline || event.registration_end || event.date || '').split('T')[0];
  const isExpired = todayStr > deadlineStr;
  const isFree = !event.is_paid && (event.fee === 0 || !event.fee);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div className="h-64 sm:h-96 w-full relative">
          <img
            src={event.bannerImage || event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        {/* Floating Details Header */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 space-y-3 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600/90 backdrop-blur-md">
              {event.category || event.category_name || 'General'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              {event.department || event.department_name || 'All Departments'}
            </span>
            {event.status === 'approved' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/80 backdrop-blur-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accredited
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>{event.startTime || event.start_time} - {event.endTime || event.end_time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>{event.venue} {event.room_number ? `(${event.room_number})` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID (LEFT CONTENT, RIGHT STICKY ACTION PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overview, Schedule, Rules, Gallery */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              About This Event
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-6">
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Event Schedule & Itinerary
              </h2>
              <div className="space-y-4">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 shrink-0">
                      {item.time || item.schedule_time}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.activity}</h4>
                      {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {event.rules && event.rules.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Rules & Participation Guidelines
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <span>{typeof rule === 'string' ? rule : rule.rule_text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Action & Capacity Panel */}
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entry Admission</span>
              <span className="text-2xl font-black font-heading text-slate-900 dark:text-white">
                {isFree ? 'FREE' : `₹${parseFloat(event.fee || event.registration_fee).toFixed(2)}`}
              </span>
            </div>

            {/* Capacity & Animated Seat Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {seatsFilled} / {maxSeats} Seats Filled
                </span>
                <span className={seatsAvailable > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-rose-500'}>
                  {seatsAvailable > 0 ? `${seatsAvailable} Seats Remaining` : 'Full Capacity'}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-navy-900 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    fillPercentage > 90
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                />
              </div>
            </div>

            {/* Calendar Integration CTAs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl text-[11px] font-bold text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>Google Cal</span>
              </a>

              <button
                onClick={() => downloadIcsFile(event)}
                className="px-3 py-2 rounded-xl text-[11px] font-bold text-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-navy-900 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-500" />
                <span>Download .ics</span>
              </button>
            </div>

            {/* Registration CTA Actions */}
            <div className="pt-2">
              {isRegistered ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    You are registered for this event!
                  </p>
                  {registration && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                      Pass: {registration.registrationId || registration.registration_id}
                    </p>
                  )}
                  <Link
                    to="/student/registrations"
                    className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    View E-Ticket & Pass
                  </Link>
                </div>
              ) : isWaitlisted ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    You are on the Waitlist! ⏳
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Queue Position: #{waitlistPosition || 1}. If an attendee cancels, your pass will be automatically issued.
                  </p>
                </div>
              ) : isExpired ? (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-center text-xs font-bold text-slate-500">
                  Registration Window Closed
                </div>
              ) : isFull ? (
                <button
                  onClick={handleJoinWaitlist}
                  disabled={waitlisting}
                  className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>{waitlisting ? 'Joining...' : 'Event Full — Join Waitlist'}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {eligibility && (
                    eligibility.eligible ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Verified: You are eligible to register</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-[11px] text-rose-800 dark:text-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Not Eligible: </span>
                          <span>{eligibility.message || 'This event has departmental/cohort restrictions.'}</span>
                        </div>
                      </div>
                    )
                  )}
                  <button
                    onClick={() => {
                      if (!isAuthenticated) navigate('/login');
                      else setShowRegModal(true);
                    }}
                    disabled={eligibility && !eligibility.eligible}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                      eligibility && !eligibility.eligible
                        ? 'bg-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-gradient-brand shadow-glow-primary hover:opacity-95'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAuthenticated ? 'Register Now' : 'Sign In to Register'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Organizer Details Card */}
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Faculty Convener & Organizer
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 font-bold flex items-center justify-center shrink-0">
                {(event.organizerName || event.organizer_name || 'C')[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {event.organizerName || event.organizer_name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {event.department || event.department_name || 'Academic Faculty'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REGISTRATION MODAL */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => { setShowRegModal(false); setStep('details'); }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {step === 'details' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold font-heading text-slate-900 dark:text-white">
                      Confirm Event Registration
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {event.title} • {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Team Registration Toggle */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Participating as a Team?</span>
                      <input
                        type="checkbox"
                        checked={isTeam}
                        onChange={(e) => setIsTeam(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                    </div>

                    {isTeam && (
                      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Team Name *</label>
                          <input
                            type="text"
                            required
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. Innovators Club"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 text-xs text-brand-900 dark:text-brand-200 flex items-center justify-between">
                    <span>Admission Fee:</span>
                    <strong className="text-sm font-bold">
                      {isFree ? 'FREE PASS' : `₹${parseFloat(event.fee || event.registration_fee).toFixed(2)}`}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
                  >
                    {submittingReg ? 'Securing Seat in Transaction...' : isFree ? 'Confirm Free Admission Pass' : 'Proceed to Payment Verification'}
                  </button>
                </form>
              ) : (
                /* Step 2: Paid Event QR Code Screen */
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                      Scan UPI QR: ₹{event.fee || event.registration_fee}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Scan with Google Pay, PhonePe, or Paytm and enter the 12-digit UTR reference.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                    <img
                      src={event.paymentQrUrl || event.qr_code_image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=cems.fest@upi&pn=${encodeURIComponent(event.title)}&am=${event.fee || 100}`}
                      alt="Payment QR"
                      className="w-44 h-44 rounded-xl object-contain border p-2 bg-white"
                    />
                    <p className="mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      UPI ID: <span className="text-brand-600 font-mono">cems.fest@upi</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase text-slate-500">
                      UPI Transaction ID / 12-Digit UTR *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. 428190382910"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
                  >
                    {submittingPayment ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetails;
