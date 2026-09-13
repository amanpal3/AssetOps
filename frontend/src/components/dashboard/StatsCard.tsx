import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon }) => {
  return (
    <div className="glass-panel interactive-card p-5 rounded-2xl flex items-start justify-between relative overflow-hidden group">
      <div className="space-y-1 z-10">
        <p className="text-[11px] font-bold text-ink-muted/90 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-ink tracking-tight tabular-nums font-mono">{value}</h3>
        {subtitle && <p className="text-[11px] text-ink-muted leading-tight">{subtitle}</p>}
      </div>
      {icon && (
        <div className="p-3 rounded-xl bg-surface-muted/80 text-primary border border-line/60 group-hover:bg-primary-soft group-hover:scale-105 transition-all duration-200 shrink-0 shadow-xs">
          {icon}
        </div>
      )}
      {/* Subtle bottom highlight aura */}
      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
    </div>
  );
};
