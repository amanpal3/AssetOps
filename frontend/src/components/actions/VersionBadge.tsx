import React from 'react';

interface VersionBadgeProps {
  version: number;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXECUTED' | 'CANCELLED';
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ version, status }) => {
  const styles = {
    ACTIVE: 'bg-success-soft text-success border-success/30',
    SUPERSEDED: 'bg-superseded-soft text-superseded border-superseded/30 line-through',
    EXECUTED: 'bg-primary-soft text-primary border-primary/30',
    CANCELLED: 'bg-danger-soft text-danger border-danger/30',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      v{version} • {status}
    </span>
  );
};
