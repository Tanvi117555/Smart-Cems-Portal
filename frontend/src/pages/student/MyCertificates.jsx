import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Calendar,
  Download,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from '../../animations/motion';

const MyCertificates = () => {
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/certificates/my');
        if (res.success) {
          setCertificates(res.certificates || []);
        }
      } catch (err) {
        toast.error('Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />
            My Certified Achievements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Access your officially accredited certificates of participation, accomplishment, and attendance.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-navy-900 animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Certificates Awarded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Attend your registered events and submit post-event feedback to earn your verifiable institutional credentials!
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary"
          >
            <span>Browse Upcoming Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <StaggerItem key={cert.id || cert.certificateId}>
              <HoverCard className="p-6 rounded-3xl glass-panel border-2 border-amber-500/20 dark:border-amber-500/10 shadow-lg space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Official Accreditation
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {cert.title || 'Certificate of Participation'}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{cert.eventTitle}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Issued on {new Date(cert.issuedAt).toLocaleDateString()}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    ID: {cert.certificateId}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/verify-certificate/${cert.certificateId}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </Link>

                    <a
                      href={`/api/certificates/download/${cert.certificateId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
};

export default MyCertificates;
