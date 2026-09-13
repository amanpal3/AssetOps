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
import { StatusModal, TxState } from '../components/transactions/StatusModal.js';

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
  const [amendReason, setAmendReason] = useState('Updated macro treasury addendum');

  // Modal State
  const [modalState, setModalState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

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
    setIsAmendModalOpen(false);
    setModalState('prompt');

    setTimeout(() => {
      setModalState('pending');
      const hash = '0x1df74e9ea9d4d45922cba09bc501f3b5b3503a44a8952fd3fe61df11d5ee5642';
      setTxHash(hash);

      setTimeout(() => {
        setModalState('confirmed');
        // Dynamically append new amended action version in local state
        setActions((prev) =>
          prev.map((act) =>
            act.id === 'CA-001'
              ? {
                  ...act,
                  activeVersion: act.activeVersion + 1,
                  totalVersions: act.totalVersions + 1,
                  status: 'ACTIVE'
                }
              : act
          )
        );
      }, 1600);
    }, 800);
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

      {/* Invariant Educational Banner */}
      <div className="p-4 rounded-xl bg-surface border border-line flex items-start gap-3 shadow-xs">
        <div className="p-2 rounded-lg bg-primary-soft text-primary shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-semibold text-ink">Append-Only Immutability Rule</h4>
          <p className="text-ink-muted leading-relaxed">
            Amendments never overwrite prior versions. Creating an amendment marks the previous active version as{' '}
            <span className="font-semibold text-superseded font-mono">SUPERSEDED</span> on-chain. Only the current{' '}
            <span className="font-semibold text-success font-mono">ACTIVE</span> version can be executed by the{' '}
            <code className="px-1 py-0.5 bg-surface-muted rounded text-[11px] font-mono text-ink">PaymentExecutor</code>.
          </p>
        </div>
      </div>

      {/* Content Rendering */}
      {loading && <LoadingState message="Loading registered corporate actions..." />}
      {error && <ErrorState message={error} onRetry={fetchActionsData} />}

      {!loading && !error && actions.length === 0 && (
        <EmptyState
          title="No Corporate Actions Found"
          message="There are currently no active corporate actions on-chain for this asset."
          actionLabel="Propose New Action"
          onAction={() => setIsAmendModalOpen(true)}
        />
      )}

      {!loading && !error && actions.length > 0 && (
        <ActionFeed
          onNavigate={onNavigate}
          onOpenAmendModal={() => setIsAmendModalOpen(true)}
        />
      )}

      {/* Amendment Proposal Modal */}
      {isAmendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Propose Action Amendment</h3>
                <p className="text-xs text-ink-muted">Action ID: CA-001 (Append new active version)</p>
              </div>
              <button
                onClick={() => setIsAmendModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAmendment} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-ink flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-primary" />
                  <span>New Coupon Rate (Basis Points)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newRateBps}
                    onChange={(e) => setNewRateBps(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    placeholder="350"
                    required
                  />
                  <span className="absolute right-3 top-2 text-ink-muted font-mono">
                    {(Number(newRateBps) / 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Amended Payable Date</span>
                </label>
                <input
                  type="date"
                  value={newPayableDate}
                  onChange={(e) => setNewPayableDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink">Amendment Justification / Legal Notice</label>
                <textarea
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Reason for changing the distribution terms..."
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-surface-muted/60 border border-line text-[11px] text-ink-muted">
                Executing this transaction will permanently advance the version pointer and mark Version 2 as{' '}
                <span className="font-semibold text-superseded">SUPERSEDED</span>.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAmendModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line hover:bg-surface-muted text-ink font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Amendment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Broadcast Status Modal */}
      <StatusModal
        isOpen={modalState !== 'idle'}
        onClose={() => setModalState('idle')}
        status={modalState}
        title="Broadcast Corporate Action Amendment"
        txHash={txHash}
      />
    </div>
  );
};
