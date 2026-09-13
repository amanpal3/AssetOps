import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-surface p-5 rounded-xl border border-line shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-ink mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-1">{subtitle}</p>}
      </div>
      {icon && <div className="p-2.5 rounded-lg bg-surface-muted text-primary">{icon}</div>}
    </div>
  );
};
