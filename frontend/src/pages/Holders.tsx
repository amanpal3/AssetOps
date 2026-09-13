import React, { useState, useEffect } from 'react';
import { Users, Coins, ShieldCheck, ArrowRightLeft, ArrowUpRight } from 'lucide-react';
import { HolderTable } from '../components/holders/HolderTable.js';
import { getHolders, HolderData } from '../services/api.js';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateViews.js';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';

interface HoldersProps {
  onNavigate?: (tab: string) => void;
}

export const Holders: React.FC<HoldersProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [totalSupply, setTotalSupply] = useState(1000);

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

        {/* Quick Contract Link */}
        <div className="flex items-center gap-2">
          <a
            href={getExplorerUrl(CONTRACT_ADDRESSES.securityToken, 'address')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <span>Contract: {CONTRACT_ADDRESSES.securityToken.slice(0, 6)}...{CONTRACT_ADDRESSES.securityToken.slice(-4)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
          </a>
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
              <h3 className="text-2xl font-bold font-mono text-success mt-2">{complianceRate}%</h3>
              <p className="text-xs text-ink-muted mt-1">All accounts verified on-chain</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Mid-Cycle Transfer</span>
                <div className="p-2 rounded-lg bg-surface-muted text-ink-muted">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold font-mono text-ink mt-2">200 DBT</h3>
              <p className="text-xs text-ink-muted mt-1">Bob → Charlie executed</p>
            </div>
          </div>

          {/* Mid-cycle transfer callout banner */}
          <div className="bg-surface-muted/60 border border-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-surface text-primary border border-line shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">Mid-Cycle Transfer Synchronization</h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Bob transferred 200 DBT to Charlie after initial announcement. Payment calculation automatically adapts to the updated live balances without requiring manual reconciliation.
                </p>
              </div>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('payments')}
                className="shrink-0 px-3.5 py-1.5 bg-surface border border-line hover:bg-surface-muted text-ink rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                Preview Payout Breakdown →
              </button>
            )}
          </div>

          {/* Main Authoritative Table or Empty State */}
          {holders.length === 0 ? (
            <EmptyState
              title="No holders registered"
              message="No token balances are indexed yet for this security token."
            />
          ) : (
            <HolderTable holders={holders} totalSupply={totalSupply} />
          )}
        </>
      )}
    </div>
  );
};
