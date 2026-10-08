import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Filter, CheckCircle2, XCircle, 
  ExternalLink, Eye, AlertCircle, Loader2, DollarSign, 
  Clock, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, paymentId: null, remarks: '' });

  const { addToast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      if (res.data.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      addToast('Failed to load payment transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    try {
      setActionLoading(paymentId);
      const res = await api.patch(`/payments/${paymentId}/verify`);
      if (res.data.success) {
        addToast('Payment verified! Registration is now confirmed.', 'success');
        fetchPayments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Verification failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.remarks.trim()) {
      addToast('Please provide a reason for rejecting the payment proof', 'warning');
      return;
    }
    try {
      setActionLoading(rejectModal.paymentId);
      const res = await api.patch(`/payments/${rejectModal.paymentId}/reject`, {
        remarks: rejectModal.remarks.trim()
      });
      if (res.data.success) {
        addToast('Payment rejected and student notified', 'info');
        setRejectModal({ open: false, paymentId: null, remarks: '' });
        fetchPayments();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const totalCollected = payments
    .filter(p => p.status === 'verified')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'submitted' || p.status === 'pending').length;

  const filtered = payments.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = 
      (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
      (p.utr_number && p.utr_number.toLowerCase().includes(q)) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.event_title && p.event_title.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          Financial Audit & Payment Verifications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review UPI transaction proofs, match UTR records, and authorize fee disbursements.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Verified Revenue</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              ₹{totalCollected.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Awaiting Verification</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {pendingCount} Transactions
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Transactions</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {payments.length} Records
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search UTR, student, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs py-1.5 px-3 w-auto"
          >
            <option value="all">All Payments</option>
            <option value="submitted">Submitted (Pending)</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <SkeletonLoader count={5} height="h-16" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description={search ? "No payments match your search criteria." : "No payment submissions registered yet."}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">UTR / Transaction ID</th>
                  <th className="py-3 px-4">Proof Receipt</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{p.student_name}</p>
                      <p className="text-[11px] text-slate-400">{p.student_email}</p>
                      {p.student_roll_id && (
                        <p className="text-[10px] text-primary-600 dark:text-primary-400 font-mono mt-0.5">
                          ID: {p.student_roll_id}
                        </p>
                      )}
                    </td>

                    {/* Event */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.event_title}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.event_date ? new Date(p.event_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        ₹{p.amount}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase">{p.payment_method || 'UPI'}</p>
                    </td>

                    {/* UTR */}
                    <td className="py-3.5 px-4 font-mono">
                      <p className="text-slate-800 dark:text-slate-200 font-bold">{p.utr_number || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{p.transaction_id}</p>
                    </td>

                    {/* Proof */}
                    <td className="py-3.5 px-4">
                      {p.screenshot_url ? (
                        <button
                          onClick={() => setPreviewImage(p.screenshot_url)}
                          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No file</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={
                        p.status === 'verified' ? 'success' :
                        p.status === 'rejected' ? 'danger' : 'warning'
                      }>
                        {p.status}
                      </Badge>
                      {p.remarks && (
                        <p className="text-[10px] text-rose-500 mt-1 max-w-[130px] truncate" title={p.remarks}>
                          {p.remarks}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {p.status !== 'verified' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleVerify(p.id)}
                            disabled={actionLoading === p.id}
                            className="btn-primary py-1 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                          >
                            {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Verify
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, paymentId: p.id, remarks: '' })}
                            disabled={actionLoading === p.id}
                            className="btn-secondary py-1 px-2.5 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Audited
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer animate-fade-in"
        >
          <div className="max-w-2xl max-h-[85vh] p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <img 
              src={previewImage} 
              alt="Payment proof receipt" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto"
            />
            <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to dismiss</p>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Reject Payment Proof</h3>
                <p className="text-xs text-slate-500">Provide an audit remark for the student.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audit Reason *
              </label>
              <textarea
                rows="3"
                placeholder="e.g. UTR number does not match bank records. Please re-verify and upload a clear screenshot."
                value={rejectModal.remarks}
                onChange={(e) => setRejectModal({ ...rejectModal, remarks: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal({ open: false, paymentId: null, remarks: '' })}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.paymentId}
                className="btn-primary py-2 px-4 text-xs bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5"
              >
                {actionLoading === rejectModal.paymentId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
