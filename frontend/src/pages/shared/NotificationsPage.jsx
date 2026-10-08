import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, Check, CheckCheck, Trash2, Calendar, 
  CreditCard, MessageSquare, AlertCircle, Info, ExternalLink, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const NotificationsPage = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        addToast('Notification dismissed', 'info');
        fetchNotifications();
      }
    } catch (err) {
      addToast('Failed to delete notification', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = notifications.filter(n => filter === 'all' || !n.is_read);

  const getIcon = (type) => {
    switch (type) {
      case 'event_approved':
      case 'event_registered':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'payment_verified':
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'feedback_requested':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'event_rejected':
      case 'payment_rejected':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

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

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
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
          All Notifications ({notifications.length})
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
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`card p-4 transition-all flex items-start justify-between gap-4 ${
                !item.is_read 
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
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-600 inline-block" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                    <span>
                      {new Date(item.created_at).toLocaleString('en-US', {
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
                {!item.is_read && (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
