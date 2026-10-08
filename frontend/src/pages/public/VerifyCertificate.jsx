import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  User,
  Download,
  ShieldCheck,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { FadeIn, ScaleIn } from '../../animations/motion';

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [cert, setCert] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const checkCert = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/certificates/verify/${certificateId}`);
        if (res.success && res.valid) {
          setValid(true);
          setCert(res.certificate);
        } else {
          setValid(false);
          setErrorMsg(res.message || 'Certificate record not found.');
        }
      } catch (err) {
        setValid(false);
        setErrorMsg(err.message || 'Invalid certificate verification credential.');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      checkCert();
    }
  }, [certificateId]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Smart CEMS Portal</span>
          </Link>
          <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            Institutional Credential Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time verification registry of accredited college event certificates.
          </p>
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Querying cryptographic verification registry...</p>
          </div>
        ) : valid && cert ? (
          <ScaleIn className="p-8 sm:p-10 rounded-3xl glass-panel border-2 border-emerald-500/40 shadow-2xl space-y-8 bg-emerald-500/[0.02]">
            {/* Verification Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AUTHENTICATED & ACCREDITED
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {cert.certificateId}</p>
                </div>
              </div>

              <a
                href={`/api/certificates/download/${cert.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4 text-center sm:text-left">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Awarded To</p>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white mt-1">
                  {cert.studentName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{cert.studentRollId} • {cert.studentEmail}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                In recognition of successful participation in <strong>"{cert.eventTitle}"</strong> organized by the Department of <strong>{cert.departmentName}</strong> on {new Date(cert.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </div>
            </div>

            {/* Credential Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Event Name</span>
                <span className="font-bold text-slate-800 dark:text-white">{cert.eventTitle}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Event Date</span>
                <span className="font-bold text-slate-800 dark:text-white">{cert.eventDate}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Issued On</span>
                <span className="font-bold text-slate-800 dark:text-white">{new Date(cert.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </ScaleIn>
        ) : (
          <div className="p-8 sm:p-12 rounded-3xl glass-panel border-2 border-rose-500/40 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <XCircle className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Invalid or Unrecognized Certificate
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {errorMsg || 'No record matches the provided credential ID. Please check the QR code or link and try again.'}
            </p>
            <div className="pt-2">
              <Link
                to="/events"
                className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900"
              >
                Explore Active Events
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
