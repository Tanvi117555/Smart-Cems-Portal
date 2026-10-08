import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-6 border border-primary-100 dark:border-primary-800 shadow-xl animate-bounce">
        <Compass className="w-10 h-10" />
      </div>

      <span className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
        Page Not Found
      </h1>

      <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed mb-8">
        The campus link or page you are looking for doesn't exist, has been rescheduled, or was moved to another department.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
          <Home className="w-4 h-4" />
          Return to Campus Home
        </Link>
        <Link to="/events" className="btn-secondary py-2.5 px-5 text-sm flex items-center gap-2">
          <Search className="w-4 h-4" />
          Explore Events
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
