import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Download,
  CreditCard,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  X,
  Upload
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoader';

const MyRegistrations = () => {
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal for submitting payment for a pending registration
  const [activePaymentReg, setActivePaymentReg] = useState(null);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/registrations/my');
      if (res.success) {
        setRegistrations(res.registrations || []);
      }
    } catch (err) {
      toast.error('Failed to load your registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      toast.error('Please provide the UPI Transaction ID / UTR.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('registration_id', activePaymentReg.id);
      formData.append('transaction_id', utr.trim());
      formData.append('amount', activePaymentReg.registration_fee);
      if (screenshot) formData.append('screenshot', screenshot);

      const res = await api.post('/payments', formData);

      if (res.success) {
        toast.success('Payment proof submitted successfully!');
        setActivePaymentReg(null);
        setUtr('');
        setScreenshot(null);
        fetchRegistrations();
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            My Event Passes & Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View pass identifiers, check verification status, and download official PDF receipts.
          </p>
        </div>
        <Link
          to="/events"
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
        >
          Discover More Events
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="You haven't registered for any events yet"
          description="Browse the campus calendar to find hackathons, sports meets, cultural fests, and workshops."
          actionLabel="Browse Events"
          actionLink="/events"
        />
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isCompleted = new Date(reg.event_date).toISOString().split('T')[0] < todayStr;
            const needsPayment = reg.is_paid && (!reg.payment_status || reg.payment_status === 'rejected');

            return (
              <div
                key={reg.id}
                className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left Event Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img
                    src={reg.event_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300'}
                    alt={reg.event_title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-900">
                        {reg.registration_id}
                      </span>
                      <Badge status={reg.status} />
                      {reg.is_paid && (
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          reg.payment_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : reg.payment_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          Payment: {reg.payment_status || 'PENDING'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {reg.event_title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-500" />
                        {new Date(reg.event_date).toLocaleDateString()} at {reg.event_start_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {reg.venue}
                      </span>
                    </div>

                    {/* Team tag if team event */}
                    {reg.is_team && (
                      <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 pt-0.5">
                        Team: {reg.team_name}
                      </p>
                    )}

                    {/* Rejection reason message if payment was rejected */}
                    {reg.payment_rejection_reason && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900 mt-1">
                        <strong>Payment Note:</strong> {reg.payment_rejection_reason}
                      </p>
                    )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pt-2 md:pt-0">
                {/* Download PDF Pass (Fixed 401 with Token Authentication) */}
                <button
                    onClick={() => {
                      const token = localStorage.getItem('cems_token');
                      const regCode = reg.registrationId || reg.registration_id || reg.id;
                      window.open(`/api/reports/receipt/${regCode}?token=${token}`, '_blank');
                    }}
                    className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-800"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  {/* Gate Check-In Status */}
                  {reg.checkedIn && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Admitted at Gate</span>
                    </span>
                  )}

                  {/* Submit Payment Button if pending */}
                  {needsPayment && (
                    <button
                      onClick={() => setActivePaymentReg(reg)}
                      className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{reg.payment_status === 'rejected' ? 'Re-Submit Payment' : 'Pay ₹' + (reg.registration_fee || reg.fee || 0)}</span>
                    </button>
                  )}

                  {/* Feedback CTA if completed */}
                  {isCompleted && reg.feedback_form_id && (
                    <Link
                      to={`/student/feedback?eventId=${reg.event_id}`}
                      className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        reg.submitted_feedback_id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{reg.submitted_feedback_id ? 'Feedback Submitted' : 'Give Feedback'}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Proof Upload Modal */}
      {activePaymentReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <button
              onClick={() => setActivePaymentReg(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Submit Payment Proof
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activePaymentReg.event_title} — Amount: ₹{activePaymentReg.registration_fee}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-slate-500">
                  UPI UTR / Transaction Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 948271049281"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-slate-500">
                  Payment Receipt Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Payment Verification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
