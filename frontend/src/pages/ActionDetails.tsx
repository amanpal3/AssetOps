import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowLeft,
  CreditCard,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  getActionVersions,
  getActionPreview,
  ActionVersionDetail,
  PaymentPreviewResponse
} from '../services/api.js';
import { LoadingState, ErrorState } from '../components/common/StateViews.js';
import { VersionBadge } from '../components/actions/VersionBadge.js';
import { StatusModal, TxState } from '../components/transactions/StatusModal.js';

interface ActionDetailsProps {
  actionId?: string;
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

export const ActionDetails: React.FC<ActionDetailsProps> = ({
  actionId = 'CA-001',
  onBack,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ActionVersionDetail[]>([]);
  const [preview, setPreview] = useState<PaymentPreviewResponse | null>(null);

  // Execution modal state
  const [txState, setTxState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [isExecutedLocal, setIsExecutedLocal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionsRes, previewRes] = await Promise.all([
        getActionVersions(actionId),
        getActionPreview(actionId)
      ]);
      setVersions(versionsRes.versions);
      setPreview(previewRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch action details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [actionId]);

  const handleExecutePayout = () => {
    setTxState('prompt');
    setTimeout(() => {
      setTxState('pending');
      const hash = '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a';
      setTxHash(hash);

      setTimeout(() => {
        setTxState('confirmed');
        setIsExecutedLocal(true);
        if (preview) {
          setPreview({ ...preview, isExecuted: true });
        }
      }, 1600);
    }, 800);
  };

  if (loading) return <div className="p-8 max-w-6xl mx-auto"><LoadingState message="Loading Corporate Action details & on-chain preview..." /></div>;
  if (error) return <div className="p-8 max-w-6xl mx-auto"><ErrorState message={error} onRetry={loadData} /></div>;

  const activeVersion = versions.find((v) => v.status === 'ACTIVE') || versions[0];
  const isSettled = isExecutedLocal || preview?.isExecuted;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 rounded-lg border border-line bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors mr-1"
                title="Back to Corporate Actions"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-mono text-xs font-bold uppercase bg-primary-soft text-primary px-2 py-0.5 rounded">
              {actionId}
            </span>
            <VersionBadge version={activeVersion?.version || 2} status="ACTIVE" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Action Details: 2026-H2 Coupon Distribution</h2>
          <p className="text-sm text-ink-muted">
            Append-only servicing record for Digital Bond Token (DBT).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isSettled ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-success-soft text-success border border-success/30 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Coupon Disbursed (Settled)</span>
            </div>
          ) : (
            <button
              onClick={handleExecutePayout}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Execute Payout (40.00 USDC)</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('payments')}
              className="px-3 py-2 bg-surface hover:bg-surface-muted text-ink border border-line rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span>Payments Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Action Information Card */}
      <div className="bg-surface rounded-xl border border-line p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-ink text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Core Action Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-surface-muted/60 rounded-lg border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Action Type</span>
            <p className="font-bold text-ink text-sm mt-1">Coupon Payment</p>
            <span className="text-[11px] text-ink-muted">Semi-Annual Debt Service</span>
          </div>

          <div className="p-3 bg-surface-muted/60 rounded-lg border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Current Active Rate</span>
            <p className="font-bold text-success text-sm mt-1">4.00% (400 bps)</p>
            <span className="text-[11px] text-ink-muted">Amended from 5.00%</span>
          </div>

          <div className="p-3 bg-surface-muted/60 rounded-lg border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Payable Date</span>
            <p className="font-bold text-ink text-sm mt-1">{activeVersion?.payableDate?.split(' ')[0] || '2026-09-18'}</p>
            <span className="text-[11px] text-ink-muted">Settlement Target</span>
          </div>

          <div className="p-3 bg-surface-muted/60 rounded-lg border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Execution Status</span>
            <p className={`font-bold text-sm mt-1 ${isSettled ? 'text-success' : 'text-primary'}`}>
              {isSettled ? 'EXECUTED & SEALED' : 'READY FOR PAYOUT'}
            </p>
            <span className="text-[11px] text-ink-muted">Verified by PaymentExecutor</span>
          </div>
        </div>
      </div>

      {/* 2. Version History Lineage */}
      <div className="bg-surface rounded-xl border border-line p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ink text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Append-Only Version History
          </h3>
          <span className="text-xs text-ink-muted font-mono">{versions.length} Immutable Versions</span>
        </div>

        <div className="space-y-3">
          {versions.map((ver) => (
            <div
              key={ver.version}
              className={`p-4 rounded-xl border transition-all ${
                ver.status === 'ACTIVE'
                  ? 'border-success/40 bg-success-soft/10'
                  : 'border-line bg-surface-muted/30 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${
                    ver.status === 'ACTIVE' ? 'bg-success-soft text-success' : 'bg-superseded-soft text-superseded'
                  }`}>
                    v{ver.version}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-sm">
                        Version {ver.version} ({ver.rateBps / 100}%)
                      </span>
                      <VersionBadge version={ver.version} status={ver.status} />
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {ver.amendmentReason || 'Initial published prospectus notice.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-mono font-semibold text-ink">{ver.totalObligation.toFixed(2)} USDC</span>
                  <p className="text-[10px] text-ink-muted font-mono">{ver.announcedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Payment Preview Calculation Table */}
      {preview && (
        <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
          <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Payment Preview & Cap Table Distribution
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Computed against authoritative on-chain token balances for Version {preview.version}.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary-soft text-primary">
              Total: {preview.totalObligation.toFixed(2)} {preview.currency}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/60 text-ink-muted uppercase font-semibold border-b border-line">
                <tr>
                  <th className="px-5 py-3">Holder Account</th>
                  <th className="px-5 py-3 text-right">Holdings (DBT)</th>
                  <th className="px-5 py-3 text-right">Ownership Share</th>
                  <th className="px-5 py-3 text-right">Coupon Rate</th>
                  <th className="px-5 py-3 text-right">Computed Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {preview.schedule.map((row) => (
                  <tr key={row.holder} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-5 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-[10px] flex items-center justify-center">
                          {row.name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-ink text-xs">{row.name}</span>
                          <span className="text-[10px] text-ink-muted ml-1 font-mono">
                            ({row.holder.slice(0, 4)}...{row.holder.slice(-4)})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {row.balance.toFixed(2)} DBT
                    </td>

                    <td className="px-5 py-3 text-right text-ink-muted">
                      {row.sharePercent.toFixed(1)}%
                    </td>

                    <td className="px-5 py-3 text-right text-ink-muted">
                      {(row.rate * 100).toFixed(2)}%
                    </td>

                    <td className="px-5 py-3 text-right font-bold text-success text-sm">
                      {row.amount.toFixed(2)} {row.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Status Modal */}
      <StatusModal
        isOpen={txState !== 'idle'}
        onClose={() => setTxState('idle')}
        status={txState}
        title="Execute Corporate Action Payout"
        txHash={txHash}
      />
    </div>
  );
};
