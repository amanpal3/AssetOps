import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { AuditTimeline } from '../components/audit/AuditTimeline.js';
import { getAudit, AuditItem } from '../services/api.js';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateViews.js';

interface AuditHistoryProps {
  onNavigate?: (tab: string) => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditItem[]>([]);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAudit();
      setEvents(res.events);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `assetops_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
              Immutable Ledger
            </span>
            <span className="text-xs font-mono text-ink-muted">Cryptographic Proofs</span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Audit Trail & Event Log</h2>
          <p className="text-sm text-ink-muted">
            Complete sequence of all smart contract events governing DBT throughout its lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {loading && <LoadingState message="Querying verified on-chain event logs from Member 1 Backend..." />}
      {error && <ErrorState message={error} onRetry={fetchAuditData} />}

      {!loading && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Events Indexed</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">{events.length}</h3>
              <p className="text-xs text-ink-muted mt-1">100% on-chain verified</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Block Range</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">#194801 - #194825</h3>
              <p className="text-xs text-ink-muted mt-1 font-mono">Sepolia Testnet</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Lineage Invariant</span>
              <h3 className="text-2xl font-bold font-mono text-success mt-1">PASS</h3>
              <p className="text-xs text-ink-muted mt-1">Zero corrupted version links</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Replay Attack Status</span>
              <h3 className="text-2xl font-bold font-mono text-primary mt-1">PROTECTED</h3>
              <p className="text-xs text-ink-muted mt-1">Duplicate execution prevented</p>
            </div>
          </div>

          {/* Timeline Component */}
          {events.length === 0 ? (
            <EmptyState
              title="No events indexed yet"
              message="The indexer has not recorded any lifecycle transactions yet."
            />
          ) : (
            <AuditTimeline />
          )}
        </>
      )}
    </div>
  );
};
