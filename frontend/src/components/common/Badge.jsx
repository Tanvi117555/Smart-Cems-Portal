import React from 'react';

const Badge = ({ status, text }) => {
  const normalized = (status || text || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (['published', 'approved', 'verified', 'active', 'confirmed', 'success'].includes(normalized)) {
    styles = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  } else if (['pending', 'under_review', 'warning'].includes(normalized)) {
    styles = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (['rejected', 'cancelled', 'inactive', 'suspended', 'error'].includes(normalized)) {
    styles = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  } else if (['draft', 'upcoming'].includes(normalized)) {
    styles = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  } else if (['completed'].includes(normalized)) {
    styles = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles}`}>
      {text || status}
    </span>
  );
};

export default Badge;
