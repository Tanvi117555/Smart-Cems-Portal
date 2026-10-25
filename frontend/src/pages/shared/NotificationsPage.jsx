import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Trash2, Calendar, 
  CreditCard, MessageSquare, AlertCircle, Info, ExternalLink, Loader2,
  Megaphone, Plus, X
} from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, unreadCount, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [actionLoading, setActionLoading] = useState(null);
  const [announceModal, setAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceType, setAnnounceType] = useState('info');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof fetchNotifications === 'function') {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      if (typeof deleteNotification === 'function') {
        await deleteNotification(id);
      } else {
        await api.delete(`/notifications/${id}`);
      }
      addToast('Notification dismissed', 'info');
      if (typeof fetchNotifications === 'function') fetchNotifications();
    } catch (err) {
      addToast('Failed to dismiss notification', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceMsg.trim()) {
      addToast('Please provide a title and announcement text', 'warning');
      return;
    }

    setSendingAnnounce(true);
    try {
      const res = await api.post('/notifications/announcement', {
        title: announceTitle.trim(),
        message: announceMsg.trim(),
        type: announceType,
        target: 'all'
      });
      if (res?.success) {
        addToast(res.message || 'Campus announcement broadcasted successfully!', 'success');
        setAnnounceModal(false);
        setAnnounceTitle('');
        setAnnounceMsg('');
        if (typeof fetchNotifications === 'function') fetchNotifications();
      }
    } catch (err) {
      addToast(err.message || 'Failed to broadcast announcement', 'error');
    } finally {
      setSendingAnnounce(false);
    }
  };

  const isUnread = (item) => {
    return item.isRead === false || item.is_read === 0 || item.is_read === false;
  };

  const filtered = (notifications || []).filter(n => filter === 'all' || isUnread(n));

  const getIcon = (type) => {
    switch (type) {
      case 'event_approved':
      case 'event_registered':
      case 'success':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'payment_verified':
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'feedback_requested':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'event_rejected':
      case 'payment_rejected':
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'faculty';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with event approvals, registrations, payment audits, and campus announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          {isStaffOrAdmin && (
            <button
              onClick={() => setAnnounceModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-brand text-white shadow-glow-primary hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          All Notifications ({(notifications || []).length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'unread'
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description={filter === 'unread' ? "You have no unread notifications." : "You have no notifications yet."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const itemUnread = isUnread(item);
            const dateStr = item.createdAt || item.created_at || new Date().toISOString();

            return (
              <div
                key={item.id}
                className={`card p-4 transition-all flex items-start justify-between gap-4 ${
                  itemUnread 
                    ? 'border-l-4 border-l-primary-600 bg-primary-50/20 dark:bg-primary-950/10' 
                    : 'hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      {itemUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary-600 inline-block" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                      <span>
                        {new Date(dateStr).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {item.link && (
                        <Link
                          to={item.link}
                          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {itemUnread && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Mark as Read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoading === item.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Dismiss Notification"
                  >
                    {actionLoading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {announceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Broadcast Announcement</h3>
              </div>
              <button
                onClick={() => setAnnounceModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Campus Fest Schedule Released or Venue Change Notice"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows="4"
                  placeholder="Type the message for all registered campus students and faculty..."
                  value={announceMsg}
                  onChange={(e) => setAnnounceMsg(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Severity
                </label>
                <select
                  value={announceType}
                  onChange={(e) => setAnnounceType(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="info">General Information (Blue)</option>
                  <option value="warning">Important Notice / Urgent (Amber)</option>
                  <option value="success">Celebration / Result Announcement (Green)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnounceModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-brand text-white shadow-glow-primary hover:opacity-95 transition-all flex items-center gap-2"
                >
                  {sendingAnnounce && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
