import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  CreditCard,
  X,
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoader';

const EventParticipants = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify Modal
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // 1. Fetch faculty events list
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/my');
        if (res.success) {
          setEvents(res.events || []);
          if (!selectedEventId && res.events.length > 0) {
            setSelectedEventId(res.events[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch participants for selected event
  const fetchParticipants = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/registrations/event/${selectedEventId}`);
      if (res.success) {
        setParticipants(res.participants || []);
      }
    } catch (err) {
      toast.error('Error fetching participant roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [selectedEventId]);

  // Handle Verify
  const handleVerify = async (paymentId) => {
    setProcessing(true);
    try {
      const res = await api.patch(`/payments/${paymentId}/verify`);
      if (res.success) {
        toast.success('Payment verified and registration confirmed!');
        setVerifyingPayment(null);
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.message || 'Error verifying payment.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify the reason for rejecting payment.');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.patch(`/payments/${paymentId}/reject`, { reason: rejectionReason.trim() });
      if (res.success) {
        toast.success('Payment rejected with note sent to student.');
        setVerifyingPayment(null);
        setRejectionReason('');
        fetchParticipants();
      }
    } catch (err) {
      toast.error(err.message || 'Error rejecting payment.');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = participants.filter((p) => {
    const matchSearch =
      !search ||
      p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.registration_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.student_email?.toLowerCase().includes(search.toLowerCase()) ||
      p.student_roll_id?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      p.status === statusFilter ||
      (statusFilter === 'paid' && p.payment_status === 'verified') ||
      (statusFilter === 'pending_payment' && p.payment_status === 'pending');

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            Attendee Roster & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View registered students, review team formations, and verify UPI payment proofs.
          </p>
        </div>

        {selectedEventId && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/faculty/scan-qr?eventId=${selectedEventId}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gate QR Scanner</span>
            </Link>

            <button
              onClick={() => {
                const token = localStorage.getItem('cems_token');
                window.open(`/api/reports/export/excel/${selectedEventId}?token=${token}`, '_blank');
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                const token = localStorage.getItem('cems_token');
                window.open(`/api/reports/export/csv/${selectedEventId}?token=${token}`, '_blank');
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-brand-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => {
                const token = localStorage.getItem('cems_token');
                window.open(`/api/reports/event/${selectedEventId}?token=${token}`, '_blank');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Event Selector & Filter Bar */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-400">
              Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.registered_count || 0} attendees)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-400">
              Search Attendees
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, ID, Pass Code..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="sm:col-span-1 space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-400">
              Payment Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Attendees ({participants.length})</option>
              <option value="pending_payment">Pending Payment Verification</option>
              <option value="paid">Payment Verified</option>
              <option value="confirmed">Confirmed Registrations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <p>Showing <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> participants</p>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No attendees match criteria"
            description="No students have enrolled or match the current search filters for this event."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-3 font-bold">Pass ID</th>
                  <th className="pb-3 font-bold">Student Attendee</th>
                  <th className="pb-3 font-bold">Roll No. / Year</th>
                  <th className="pb-3 font-bold">Department</th>
                  <th className="pb-3 font-bold">Registration Status</th>
                  <th className="pb-3 font-bold">Payment</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/30">
                    <td className="py-3.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {p.registration_id}
                    </td>
                    <td className="py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{p.student_name}</p>
                      <p className="text-[11px] text-slate-400">{p.student_email}</p>
                      {p.is_team && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                          Team: {p.team_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      {p.student_roll_id || 'N/A'} {p.student_year ? `• ${p.student_year}` : ''}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {p.department_name || 'Campus Wide'}
                    </td>
                    <td className="py-3.5">
                      <Badge status={p.status} />
                    </td>
                    <td className="py-3.5">
                      {p.payment_id ? (
                        <div className="space-y-0.5">
                          <Badge status={p.payment_status} />
                          <p className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {p.transaction_id}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Free Pass</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      {p.payment_id && p.payment_status === 'pending' ? (
                        <button
                          onClick={() => setVerifyingPayment(p)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
                        >
                          Verify Payment
                        </button>
                      ) : p.payment_id ? (
                        <button
                          onClick={() => setVerifyingPayment(p)}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                        >
                          Review Proof
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Enrolled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Proof Review Modal */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <button
              onClick={() => { setVerifyingPayment(null); setRejectionReason(''); }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Review Payment Proof
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Attendee: {verifyingPayment.student_name} ({verifyingPayment.registration_id})
              </p>
            </div>

            {/* Payment Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Due:</span>
                <strong className="text-slate-900 dark:text-white">₹{verifyingPayment.payment_amount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID / UTR:</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{verifyingPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <Badge status={verifyingPayment.payment_status} />
              </div>
            </div>

            {/* Screenshot Preview */}
            {verifyingPayment.screenshot_path ? (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400">Uploaded Screenshot:</span>
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/10">
                  <img
                    src={verifyingPayment.screenshot_path}
                    alt="Payment proof"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No screenshot file uploaded.</p>
            )}

            {/* Rejection input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-slate-500">
                Rejection Note (Mandatory if rejecting)
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid UTR or amount mismatch"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleReject(verifyingPayment.payment_id)}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-colors"
              >
                Reject Payment
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleVerify(verifyingPayment.payment_id)}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Confirm Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventParticipants;
