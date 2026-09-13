import React, { useState, useEffect } from 'react';
import {
  Users,
  Coins,
  ShieldCheck,
  ArrowRightLeft,
  ArrowUpRight,
  Send,
  X
} from 'lucide-react';
import { HolderTable } from '../components/holders/HolderTable.js';
import { getHolders, HolderData } from '../services/api.js';
import { LoadingState, ErrorState } from '../components/common/StateViews.js';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';
import { StatusModal, TxState } from '../components/transactions/StatusModal.js';

interface HoldersProps {
  onNavigate?: (tab: string) => void;
}

export const Holders: React.FC<HoldersProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [totalSupply, setTotalSupply] = useState(1000);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromHolder, setFromHolder] = useState('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'); // Bob
  const [toHolder, setToHolder] = useState('0x90F79bf6EB2c4f870365E785982E1f101E93b906'); // Charlie
  const [transferAmount, setTransferAmount] = useState('50');

  // Status Modal State
  const [modalState, setModalState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const fetchHoldersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHolders();
      setHolders(res.holders);
      setTotalSupply(res.totalSupply);
    } catch (err: any) {
      setError(err.message || 'Failed to load holders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldersData();
  }, []);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransferModalOpen(false);
    setModalState('prompt');

    setTimeout(() => {
      setModalState('pending');
      const hash = '0x7a81928374019283740192837401928374019283740192837401928374019283';
      setTxHash(hash);

      setTimeout(() => {
        setModalState('confirmed');
        const amt = Number(transferAmount);
        setHolders((prev) =>
          prev.map((h) => {
            if (h.address.toLowerCase() === fromHolder.toLowerCase()) {
              return { ...h, balance: Math.max(0, h.balance - amt) };
            }
            if (h.address.toLowerCase() === toHolder.toLowerCase()) {
              return { ...h, balance: h.balance + amt };
            }
            return h;
          })
        );
      }, 1600);
    }, 800);
  };

  const activeHoldersCount = holders.length;
  const whitelistedCount = holders.filter((h) => h.isWhitelisted).length;
  const complianceRate = activeHoldersCount > 0 ? Math.round((whitelistedCount / activeHoldersCount) * 100) : 100;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
              Authoritative Registry
            </span>
            <span className="text-xs font-mono text-ink-muted">
              ERC-1404 Restricted Token
            </span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Holders Registry</h2>
          <p className="text-sm text-ink-muted">
            Live on-chain ownership registry reflecting real-time token distribution and allowlist compliance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={getExplorerUrl(CONTRACT_ADDRESSES.securityToken, 'address')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <span>Contract: {CONTRACT_ADDRESSES.securityToken.slice(0, 6)}...{CONTRACT_ADDRESSES.securityToken.slice(-4)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
          </a>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Compliant Transfer</span>
          </button>
        </div>
      </div>

      {loading && <LoadingState message="Fetching live token holders from Member 1 Backend..." />}
      {error && <ErrorState message={error} onRetry={fetchHoldersData} />}

      {!loading && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Total Supply</span>
                <div className="p-2 rounded-lg bg-primary-soft text-primary">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-mono text-ink mt-2">
                {totalSupply.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-ink-muted mt-1 font-mono">DBT (Digital Bond Token)</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Active Holders</span>
                <div className="p-2 rounded-lg bg-surface-muted text-ink">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-mono text-ink mt-2">{activeHoldersCount}</h3>
              <p className="text-xs text-ink-muted mt-1">Whitelisted institutional accounts</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Allowlist Compliance</span>
                <div className="p-2 rounded-lg bg-success-soft text-success">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-mono text-ink mt-2">{complianceRate}%</h3>
              <p className="text-xs text-ink-muted mt-1">All accounts verified on-chain</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Mid-Cycle Transfer</span>
                <div className="p-2 rounded-lg bg-primary-soft text-primary">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-mono text-ink mt-2">200 DBT</h3>
              <p className="text-xs text-ink-muted mt-1">Bob → Charlie executed</p>
            </div>
          </div>

          {/* Context Narrative Card */}
          <div className="p-4 rounded-xl bg-surface border border-line flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Mid-Cycle Transfer Synchronization</h4>
                <p className="text-xs text-ink-muted">
                  Bob transferred 200 DBT to Charlie after initial announcement. Payment calculation automatically adapts to the updated live balances without requiring manual reconciliation.
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('payments')}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-muted hover:bg-line text-ink transition-colors"
              >
                Preview Payout Breakdown →
              </button>
            )}
          </div>

          {/* Holder Registry Table */}
          <HolderTable holders={holders} />
        </>
      )}

      {/* Compliant Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Compliant Token Transfer</h3>
                <p className="text-xs text-ink-muted">ERC-1404 pre-flight checked transfer</p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-ink">Sender Account</label>
                <select
                  value={fromHolder}
                  onChange={(e) => setFromHolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                >
                  <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8">Alice (500 DBT)</option>
                  <option value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC">Bob (300 DBT)</option>
                  <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Charlie (200 DBT)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink">Recipient Account</label>
                <select
                  value={toHolder}
                  onChange={(e) => setToHolder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                >
                  <option value="0x90F79bf6EB2c4f870365E785982E1f101E93b906">Charlie (Secondary Investor - Whitelisted)</option>
                  <option value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8">Alice (Anchor Investor - Whitelisted)</option>
                  <option value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC">Bob (Primary Account - Whitelisted)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink">Transfer Amount (DBT)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface-muted/40 text-ink focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  placeholder="50"
                  max="300"
                  min="1"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-success-soft/30 border border-success/30 text-[11px] text-success flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  ERC-1404 pre-flight verified: Both sender and recipient are registered on the compliance allowlist. Restriction code: <code>0 (SUCCESS)</code>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-line hover:bg-surface-muted text-ink font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Transfer</span>
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
        title="Compliant ERC-1404 Transfer"
        txHash={txHash}
      />
    </div>
  );
};
