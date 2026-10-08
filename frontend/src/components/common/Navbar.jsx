import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Events', path: '/events' },
    { name: 'Categories', path: '/events?section=categories' },
    { name: 'About CEMS', path: '/#about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-glow-primary group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white">
                CEMS<span className="text-brand-600 dark:text-brand-400">.</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Event Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-semibold bg-brand-50/80 dark:bg-brand-950/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/60 dark:hover:bg-navy-900/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    aria-label="Notifications"
                    className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl glass-panel border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!n.is_read) markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setNotifDropdownOpen(false);
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-100/70 dark:hover:bg-navy-900/70 cursor-pointer transition-colors ${
                                !n.is_read ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 shrink-0">
                                  {n.type === 'success' ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-brand-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                                    {n.message}
                                  </p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(n.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
                      alt={user?.name}
                      className="w-9 h-9 rounded-lg object-cover ring-2 ring-brand-500/30"
                    />
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                        {user?.name?.split(' ')[0]}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-brand-600 dark:text-brand-400 tracking-wider">
                        {user?.role}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl glass-panel border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-600 dark:hover:text-brand-400"
                        >
                          <User className="w-4 h-4" />
                          Profile Settings
                        </Link>
                      </div>

                      <div className="border-t border-slate-200/80 dark:border-slate-800 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-navy-900"
            >
              {link.name}
            </Link>
          ))}
          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to={getDashboardPath()}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-600 dark:text-brand-400"
              >
                Go to {user?.role.toUpperCase()} Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
