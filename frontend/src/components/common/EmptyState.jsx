import React from 'react';
import { CalendarX2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = CalendarX2,
  title = 'No records found',
  description = 'There are no items matching your request at this time.',
  actionLabel,
  actionLink,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl glass-panel border border-dashed border-slate-300 dark:border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-6">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
