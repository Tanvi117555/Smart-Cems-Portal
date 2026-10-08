import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Download, ArrowRight, Calendar, Sparkles } from 'lucide-react';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const regId = searchParams.get('id') || 'REG-2026-CONFIRMED';
  const eventTitle = searchParams.get('event') || 'Campus Event';

  useEffect(() => {
    // Launch celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if canvas not supported
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center text-white shadow-2xl shadow-brand-500/30 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
          <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-slate-900 shadow">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Registration Confirmed! 🎉
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You're officially registered for <strong>{eventTitle}</strong>. We're excited to see you there!
          </p>
        </div>

        {/* Digital Pass Ticket Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl text-left space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official Campus Pass
              </span>
              <p className="font-mono text-base font-extrabold text-brand-600 dark:text-brand-400">
                {regId}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              CONFIRMED
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {eventTitle}
            </h3>
            <p className="text-xs text-slate-500">
              Please present this pass along with your university ID at the event reception.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <a
              href={`/api/reports/receipt/${regId}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Ticket</span>
            </a>
            <Link
              to="/student/registrations"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>My Passes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
