import React from 'react';

const StatCard = ({ title, value, icon: Icon, change, subtitle, gradient = 'from-blue-600 to-indigo-600' }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-2">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {change}
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          )}
        </div>

        {/* Icon with gradient badge */}
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md shadow-brand-500/20`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
