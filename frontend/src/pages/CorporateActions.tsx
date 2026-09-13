import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  ArrowUpRight,
  X,
  Send,
  Info,
  Calendar,
  Percent
} from 'lucide-react';
import { ActionFeed } from '../components/actions/ActionFeed.js';
import { getActions, CorporateActionItem } from '../services/api.js';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateViews.js';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';

interface CorporateActionsProps {
  onNavigate?: (tab: string) => void;
}

export const CorporateActions: React.FC<CorporateActionsProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<CorporateActionItem[]>([]);
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false);
  const [newRateBps, setNewRateBps] = useState('350');
  const [newPayableDate, setNewPayableDate] = useState('2026-09-20');
  const [amendReason, setAmendReason] = useState('Annual budget alignment');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amendSuccess, setAmendSuccess] = useState(false);

  const fetchActionsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActions();
      setActions(res.actions);
    } catch (err: any) {
      setError(err.message || 'Failed to load corporate actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionsData();
  }, []);

  const handleSubmitAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAmendSuccess(true);
      setTimeout(() => {
        setAmendSuccess(false);
        setIsAmendModalOpen(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
              Append-Only Registry
            </span>
            <span className="text-xs font-mono text-ink-muted">
              CorporateActionRegistry.sol
            </span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Corporate Actions</h2>
          <p className="text-sm text-ink-muted">
            Immutable announcement lineage, version superseding, and cryptographic audit proofs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={getExplorerUrl(CONTRACT_ADDRESSES.corporateActionRegistry, 'address')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <span>Registry: {CONTRACT_ADDRESSES.corporateActionRegistry.slice(0, 6)}...{CONTRACT_ADDRESSES.corporateActionRegistry.slice(-4)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
          </a>

          <button
            onClick={() => setIsAmendModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Propose Amendment</span>
          </button>
        </div>
      </div>

      {loading && <LoadingState message="Loading corporate actions and version lineages from Member 1 Backend..." />}
      {error && <ErrorState message={error} onRetry={fetchActionsData} />}

      {!loading && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Total Actions</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">{actions.length}</h3>
              <p className="text-xs text-ink-muted mt-1 font-mono">Identifier: CA-001</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Active Version</span>
              <h3 className="text-2xl font-bold font-mono text-success mt-1">Version 2</h3>
              <p className="text-xs text-ink-muted mt-1">4.00% Coupon (400 bps)</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Historical Versions</span>
              <h3 className="text-2xl font-bold font-mono text-superseded mt-1">1 Superseded</h3>
              <p className="text-xs text-ink-muted mt-1">v1 (500 bps) permanently sealed</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Payment Obligation</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">40.00 USDC</h3>
              <p className="text-xs text-ink-muted mt-1">Payable across 3 holders</p>
            </div>
          </div>

          {/* Action Feed & Version Tree Component */}
          {actions.length === 0 ? (
            <EmptyState
              title="No corporate actions announced"
              message="No debt servicing actions have been announced yet."
              actionLabel="Announce Action"
              onAction={() => setIsAmendModalOpen(true)}
            />
          ) : (
            <ActionFeed
              onNavigate={onNavigate}
              onOpenAmendModal={() => setIsAmendModalOpen(true)}
            />
          )}
        </>
      )}

      {/* Amendment Proposal Modal */}
      {isAmendModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-line shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="font-bold text-ink text-lg">Propose Action Amendment</h3>
                <p className="text-xs text-ink-muted">Creates a new append-only version for CA-001.</p>
              </div>
              <button
                onClick={() => setIsAmendModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAmendment} className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-muted border border-line text-xs text-ink-muted flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Submitting this transaction will append <strong>Version 3</strong> on-chain. Version 2 will transition to <strong className="text-superseded">SUPERSEDED</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">
                  Target Action ID
                </label>
                <input
                  type="text"
                  disabled
                  value="CA-001 (0x63612d303031...)"
                  className="w-full px-3 py-2 bg-surface-muted border border-line rounded-lg text-xs font-mono text-ink-muted cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    New Rate (Basis Points)
                  </label>
                  <input
                    type="number"
                    value={newRateBps}
                    onChange={(e) => setNewRateBps(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs font-mono text-ink focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. 400"
                    required
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">
                    {(Number(newRateBps) / 100).toFixed(2)}% annual coupon
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    New Payable Date
                  </label>
                  <input
                    type="date"
                    value={newPayableDate}
                    onChange={(e) => setNewPayableDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase mb-1">
                  Amendment Justification & Reason
                </label>
                <textarea
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Describe the economic or legal basis for this amendment..."
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line hover:bg-surface-muted text-xs font-medium text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || amendSuccess}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting On-Chain...</span>
                  ) : amendSuccess ? (
                    <span>Amendment Submitted!</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Broadcast Amendment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
