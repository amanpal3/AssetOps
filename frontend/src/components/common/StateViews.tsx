import React from 'react';
import { Loader2, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading on-chain data...'
}) => (
  <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <div className="absolute w-6 h-6 rounded-full bg-primary/10 animate-pulse" />
    </div>
    <p className="text-xs text-ink-muted font-medium tracking-wide animate-pulse">{message}</p>
  </div>
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({
  message = 'Failed to communicate with Member 1 Backend or RPC.',
  onRetry
}) => (
  <div className="p-6 rounded-2xl border border-danger/30 bg-danger-soft/30 backdrop-blur-md text-center space-y-3.5 shadow-sm">
    <div className="w-10 h-10 rounded-full bg-danger-soft text-danger mx-auto flex items-center justify-center border border-danger/20 shadow-xs">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-ink">Backend Telemetry Notice</h4>
      <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto leading-relaxed">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-line/80 hover:bg-surface-muted text-xs font-semibold text-ink transition-all shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Request</span>
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({
  title = 'No records found',
  message = 'There are no active entries in this registry yet.',
  actionLabel,
  onAction
}) => (
  <div className="py-16 px-6 rounded-2xl border-2 border-dashed border-line/80 text-center space-y-3.5 bg-surface/40 backdrop-blur-sm">
    <div className="w-12 h-12 rounded-2xl bg-surface-muted/80 text-ink-muted mx-auto flex items-center justify-center border border-line/50">
      <Inbox className="w-6 h-6" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">{message}</p>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const SyncStatusBadge: React.FC<{
  isSyncing?: boolean;
  lastSyncedBlock?: number;
}> = ({ isSyncing = false, lastSyncedBlock = 194825 }) => (
  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-surface/90 border border-line/80 backdrop-blur-md shadow-xs">
    {isSyncing ? (
      <>
        <Loader2 className="w-3.5 h-3.5 text-warning animate-spin" />
        <span className="text-warning font-semibold text-[11px]">Syncing Head</span>
      </>
    ) : (
      <>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-ink font-mono text-[11px] font-medium">
          Synced: #{lastSyncedBlock}
        </span>
      </>
    )}
  </div>
);
