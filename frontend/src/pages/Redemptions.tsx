import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { RedemptionPanel } from '../components/redemption/RedemptionPanel.js';
import { getRedemptions, RedemptionItem } from '../services/api.js';
import { LoadingState, ErrorState } from '../components/common/StateViews.js';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';

interface RedemptionsProps {
  onNavigate?: (tab: string) => void;
}

export const Redemptions: React.FC<RedemptionsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_redemptions, setRedemptions] = useState<RedemptionItem[]>([]);

  const fetchRedemptionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRedemptions();
      setRedemptions(res.redemptions);
    } catch (err: any) {
      setError(err.message || 'Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptionData();
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-danger-soft text-danger">
              Lifecycle Termination
            </span>
            <span className="text-xs font-mono text-ink-muted">Authorized Token Burn</span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Maturity Redemptions</h2>
          <p className="text-sm text-ink-muted">
            Atomic redemption of par principal and permanent token supply burn upon bond maturity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={getExplorerUrl(CONTRACT_ADDRESSES.securityToken, 'address')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <span>Token: {CONTRACT_ADDRESSES.securityToken.slice(0, 6)}...{CONTRACT_ADDRESSES.securityToken.slice(-4)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
          </a>
        </div>
      </div>

      {loading && <LoadingState message="Fetching redemption schedule from Member 1 Backend..." />}
      {error && <ErrorState message={error} onRetry={fetchRedemptionData} />}

      {!loading && <RedemptionPanel />}
    </div>
  );
};
