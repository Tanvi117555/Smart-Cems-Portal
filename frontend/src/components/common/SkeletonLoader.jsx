import React from 'react';

export const EventCardSkeleton = () => (
  <div className="rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 p-4 space-y-4 animate-pulse">
    <div className="h-44 bg-slate-200 dark:bg-navy-800 rounded-2xl w-full" />
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-navy-800 rounded w-1/2" />
    </div>
    <div className="pt-4 flex gap-2">
      <div className="h-9 bg-slate-200 dark:bg-navy-800 rounded-xl flex-1" />
      <div className="h-9 bg-slate-200 dark:bg-navy-800 rounded-xl flex-1" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3 animate-pulse">
    <div className="h-10 bg-slate-200 dark:bg-navy-800 rounded-xl w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-14 bg-slate-100 dark:bg-navy-900 rounded-xl w-full" />
    ))}
  </div>
);

export default EventCardSkeleton;
