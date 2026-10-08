import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  Search,
  ArrowLeft,
  RefreshCw,
  Camera,
  Keyboard,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from '../../animations/motion';
import confetti from 'canvas-confetti';

const QRScannerPage = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({ totalConfirmed: 0, totalPresent: 0, attendanceRate: 0 });
  const [recentScans, setRecentScans] = useState([]);

  // Scanner UI States
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'success' | 'already_checked_in' | 'error', attendee, message }
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);

  const scannerRef = useRef(null);

  // 1. Fetch Faculty Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/my');
        if (res.success && res.events?.length > 0) {
          setEvents(res.events);
          if (!selectedEventId) {
            setSelectedEventId(res.events[0].id);
            setSelectedEvent(res.events[0]);
          } else {
            const found = res.events.find(e => e.id === selectedEventId);
            if (found) setSelectedEvent(found);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, [selectedEventId]);

  // 2. Fetch Live Attendance Stats
  const fetchStats = async () => {
    if (!selectedEventId) return;
    try {
      const res = await api.get(`/attendance/stats/${selectedEventId}`);
      if (res.success) {
        setStats(res.stats || { totalConfirmed: 0, totalPresent: 0, attendanceRate: 0 });
        if (res.recentCheckIns) setRecentScans(res.recentCheckIns);
      }
    } catch (err) {
      console.warn('Could not fetch stats:', err.message);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [selectedEventId]);

  // 3. Initialize QR Scanner
  useEffect(() => {
    let html5QrScanner = null;

    if (isScanning && selectedEventId) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      };

      html5QrScanner = new Html5QrcodeScanner('qr-reader-container', config, false);

      html5QrScanner.render(
        (decodedText) => {
          handleVerifyCheckIn(decodedText);
        },
        (error) => {
          // Frame read ignore
        }
      );

      scannerRef.current = html5QrScanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.warn('Scanner cleanup:', err));
      }
    };
  }, [isScanning, selectedEventId]);

  // Verify and record check-in
  const handleVerifyCheckIn = async (code) => {
    if (processing || !code) return;
    setProcessing(true);

    try {
      const res = await api.post('/attendance/check-in', {
        eventId: selectedEventId,
        qrData: code,
        method: 'qr_scanner'
      });

      if (res.success && res.status === 'success') {
        setScanResult({
          status: 'success',
          attendee: res.attendee,
          message: res.message
        });
        toast.success(res.message);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        fetchStats();
      }
    } catch (err) {
      const status = err.response?.data?.status || 'error';
      const msg = err.response?.data?.message || err.message;
      const attendee = err.response?.data?.attendee || null;

      setScanResult({
        status,
        attendee,
        message: msg
      });

      if (status === 'already_checked_in') {
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyCheckIn(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/faculty/events" className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Gate Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-8 h-8 text-brand-600" />
            Live Event Gate Check-In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Scan attendee digital passes in real time to verify identity and record institutional attendance.
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const found = events.find(ev => ev.id === e.target.value);
              if (found) setSelectedEvent(found);
              setScanResult(null);
            }}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Attendance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirmed Passes</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalConfirmed}</p>
        </div>
        <div className="p-4 rounded-3xl glass-panel border border-emerald-200 dark:border-emerald-900/40 bg-emerald-500/5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present (Checked In)</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalPresent}</p>
        </div>
        <div className="p-4 rounded-3xl glass-panel border border-amber-200 dark:border-amber-900/40 bg-amber-500/5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Yet to Arrive</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{Math.max(0, stats.totalConfirmed - stats.totalPresent)}</p>
        </div>
        <div className="p-4 rounded-3xl glass-panel border border-brand-200 dark:border-brand-900/40 bg-brand-500/5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Attendance Rate</p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{stats.attendanceRate}%</p>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Camera Scanner + Manual Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-500" />
                Optical Camera Scanner
              </h2>

              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  isScanning
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-gradient-brand text-white hover:opacity-95 shadow-glow-primary'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Stop Camera' : 'Start Camera Scanner'}</span>
              </button>
            </div>

            {/* Camera Viewport */}
            {isScanning ? (
              <div className="rounded-2xl overflow-hidden border-2 border-brand-500/40 bg-slate-950 p-2">
                <div id="qr-reader-container" className="w-full max-w-md mx-auto" />
              </div>
            ) : (
              <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Camera Scanner Inactive</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click "Start Camera Scanner" above to activate device webcam and begin continuous gate scanning.
                  </p>
                </div>
              </div>
            )}

            {/* Manual Code Fallback */}
            <form onSubmit={handleManualSubmit} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Or Type Pass Identifier Manually
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Keyboard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. CEMS-2026-X8K4P2Q9"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Verify & Check-In
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Scan Result Pop-up Card */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15 }}
                className={`p-6 rounded-3xl border-2 shadow-2xl space-y-4 ${
                  scanResult.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                    : scanResult.status === 'already_checked_in'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {scanResult.status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />}
                  {scanResult.status === 'already_checked_in' && <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />}
                  {scanResult.status !== 'success' && scanResult.status !== 'already_checked_in' && (
                    <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 space-y-1">
                    <h3 className="text-base font-extrabold font-heading">
                      {scanResult.status === 'success'
                        ? 'Admission Verified & Checked In! 🎉'
                        : scanResult.status === 'already_checked_in'
                        ? 'Duplicate Scan: Attendee Already Present'
                        : 'Admission Denied'}
                    </h3>
                    <p className="text-xs font-medium opacity-90">{scanResult.message}</p>

                    {scanResult.attendee && (
                      <div className="mt-3 pt-3 border-t border-current/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="opacity-70 text-[10px] block">STUDENT</span>
                          <span className="font-bold">{scanResult.attendee.studentName}</span>
                        </div>
                        <div>
                          <span className="opacity-70 text-[10px] block">ROLL / ID</span>
                          <span className="font-bold">{scanResult.attendee.studentRollId || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="opacity-70 text-[10px] block">DEPARTMENT</span>
                          <span className="font-bold">{scanResult.attendee.departmentName}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setScanResult(null)}
                    className="p-1 rounded-lg opacity-60 hover:opacity-100 text-xs font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Col: Recent Check-in Feed */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Live Check-In Activity
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700">
              Live
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No check-ins recorded yet for this session.</p>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{scan.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{scan.registrationId}</p>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    {new Date(scan.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
