import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Users,
  Building2,
  Tag,
  CreditCard,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Ticket,
  Bell,
  UserCheck,
  Compass,
  CheckSquare,
  Sparkles,
  User,
  Settings,
  QrCode,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = ({ isMobile, onClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Navigation Items by Role
  const adminLinks = [
    { name: 'Analytics Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Event Approvals', path: '/admin/events?status=pending', icon: CheckSquare },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Gate QR Scanner', path: '/faculty/scan-qr', icon: QrCode },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Categories', path: '/admin/categories', icon: Tag },
    { name: 'Payment Verifications', path: '/admin/payments', icon: CreditCard },
    { name: 'Campus Reports', path: '/admin/reports', icon: FileText },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  const facultyLinks = [
    { name: 'Organizer Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'My Managed Events', path: '/faculty/events', icon: Calendar },
    { name: 'Gate QR Check-In', path: '/faculty/scan-qr', icon: QrCode },
    { name: 'Create New Event', path: '/faculty/events/create', icon: PlusCircle },
    { name: 'Attendee Roster', path: '/faculty/events', icon: UserCheck },
    { name: 'Feedback Builder', path: '/faculty/events', icon: MessageSquare },
    { name: 'Event Gallery', path: '/faculty/events', icon: ImageIcon },
    { name: 'PDF Reports', path: '/faculty/reports', icon: FileText },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  const studentLinks = [
    { name: 'Student Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Discover Events', path: '/events', icon: Compass },
    { name: 'My Passes & Tickets', path: '/student/registrations', icon: Ticket },
    { name: 'My Certificates', path: '/student/certificates', icon: Award },
    { name: 'Give Event Feedback', path: '/student/feedback', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  let links = studentLinks;
  if (user?.role === 'admin') links = adminLinks;
  if (user?.role === 'faculty') links = facultyLinks;

  return (
    <aside className="w-64 h-full flex flex-col justify-between py-6 px-4 bg-white dark:bg-navy-900 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="space-y-6">
        {/* Role Identity Tag */}
        <div className="px-3 py-3 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/20 border border-brand-100 dark:border-brand-900/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
              {user?.role} Portal
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user?.department_code || 'Central Campus'}
            </p>
          </div>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 dark:shadow-brand-900/40'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{link.name}</span>
                    </div>
                    {link.badge > 0 && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <NavLink
          to="/profile"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
            alt={user?.name}
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
