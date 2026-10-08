import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  ArrowRight,
  Shield,
  User,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, forgotPassword, getDashboardPath } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.displayName || user.email}!`);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success('Password reset link dispatched!');
    } catch (err) {
      setForgotError(err.message || 'Failed to dispatch reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Demo Credentials Quick-Select
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden glass-panel border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Left Branding Showcase Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Top Brand */}
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Smart Campus Cloud 2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight leading-tight">
              One Portal.<br />Every Event.<br />Endless Memories.
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Real-time attendance scanning, certified credentials, waitlist automation, and instant registration for the entire college.
            </p>
          </div>

          {/* Center Feature Highlights */}
          <div className="relative z-10 py-6 sm:py-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs sm:text-sm bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="font-bold">Live QR Attendance</p>
                <p className="text-[11px] text-indigo-200">Instant check-ins at entry gates</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="font-bold">Verifiable Digital Certificates</p>
                <p className="text-[11px] text-indigo-200">Public tamper-proof credential QR codes</p>
              </div>
            </div>
          </div>

          {/* Bottom Accreditation */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-indigo-200">
            <span>Role-Based Access Control</span>
            <span className="font-mono">Smart CEMS</span>
          </div>
        </div>

        {/* Right Authentication Card Column */}
        <div className="lg:col-span-7 p-6 sm:p-10 bg-white dark:bg-navy-950 flex flex-col justify-center space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
              Sign In to Your Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your college credentials to access your dashboard.
            </p>
          </div>

          {/* Demo Accounts Quick-Select Buttons */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              ⚡ Quick Demo Sign-In
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('student.alex@cems.edu', 'Student@123')}
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-all shadow-sm"
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('faculty.cs@cems.edu', 'Faculty@123')}
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-all shadow-sm"
              >
                <User className="w-4 h-4 text-brand-500" />
                <span>Faculty</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@cems.edu', 'Admin@123')}
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 flex flex-col items-center gap-1 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition-all shadow-sm"
              >
                <Shield className="w-4 h-4 text-purple-500" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cems.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don’t have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Create student / faculty account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Reset Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                    setForgotError('');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotSuccess ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Password Reset Link Dispatched
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      We sent a secure password reset email to <strong>{forgotEmail}</strong>. Please check your inbox or spam folder.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the email associated with your CEMS account and Firebase will send you a password recovery link.
                  </p>

                  {forgotError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                      {forgotError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@cems.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white disabled:opacity-50"
                    >
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
