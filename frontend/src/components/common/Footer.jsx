import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, Phone, MapPin, Heart, Shield, Award, Sparkles } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 dark:bg-navy-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-glow-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight font-heading text-white">
                CEMS<span className="text-brand-400">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The centralized College Event Management System empowering students, faculty, and administrators to discover, organize, register, and celebrate campus events.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider pt-2">
              <Sparkles className="w-4 h-4" />
              Plan. Participate. Celebrate.
            </div>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-brand-400 transition-colors">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition-colors">
                  Portal Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-400 transition-colors">
                  Student Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Event Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/events?category=technical" className="hover:text-brand-400 transition-colors">
                  💻 Technical & Hackathons
                </Link>
              </li>
              <li>
                <Link to="/events?category=cultural" className="hover:text-brand-400 transition-colors">
                  🎭 Cultural Festivals
                </Link>
              </li>
              <li>
                <Link to="/events?category=sports" className="hover:text-brand-400 transition-colors">
                  ⚽ Sports Championships
                </Link>
              </li>
              <li>
                <Link to="/events?category=competitions" className="hover:text-brand-400 transition-colors">
                  🏆 Competitions & Debates
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact & Campus Info */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 font-heading">
              Campus Desk
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-1" />
                <span>Student Activity Center, University Central Campus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>events@cems.edu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CEMS • College Event Management System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-brand-400" /> Enterprise Role-Based Security
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-brand-400" /> Official University Platform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
