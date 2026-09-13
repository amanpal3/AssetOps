import React, { useState, useEffect } from 'react';
import {
  Coins,
  FileText,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  History,
  PlayCircle,
  Activity,
  Wifi,
  Sparkles
} from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard.js';
import {
  getHealth,
  getNetwork,
  getAssets,
  getHolders,
  HealthResponse,
  NetworkResponse,
  HolderData
} from '../services/api.js';
import { LoadingState, ErrorState, SyncStatusBadge } from '../components/common/StateViews.js';

interface OverviewProps {
  onNavigate?: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [network, setNetwork] = useState<NetworkResponse | null>(null);
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [totalSupply, setTotalSupply] = useState(1000);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hRes, nRes, holdersRes] = await Promise.all([
        getHealth(),
        getNetwork(),
        getHolders(),
        getAssets()
      ]);
      setHealth(hRes);
      setNetwork(nRes);
      setHolders(holdersRes.holders);
      setTotalSupply(holdersRes.totalSupply);
    } catch (err: any) {
      setError(err.message || 'Error connecting to Member 1 backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <LoadingState message="Fetching live backend health, network head, and indexed holdings..." />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-primary-soft text-primary border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Operations Suite
            </span>
            <span className="text-xs text-ink-muted">Asset: Digital Bond Token (DBT)</span>
            <SyncStatusBadge
              isSyncing={health?.isSyncing}
              lastSyncedBlock={health?.lastSyncedBlock || 194825}
            />
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1.5 tracking-tight">Operations Control Room</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Institutional lifecycle dashboard: corporate action versioning, real-time payouts, and on-chain compliance.
          </p>
        </div>

        {/* Global Demo Shortcut & Network Tag */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-line/80 bg-surface/80 backdrop-blur-md text-xs font-mono text-ink shadow-xs">
            <Wifi className="w-3.5 h-3.5 text-success" />
            <span className="text-ink-muted">{network?.chainName || 'Sepolia'}</span>
            <span className="text-ink font-bold">#{network?.blockNumber || 194825}</span>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('demo')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink hover:bg-ink/90 text-white text-xs font-semibold shadow-md shadow-ink/10 transition-all active:scale-[0.98]"
            >
              <PlayCircle className="w-4 h-4 text-primary-soft" />
              <span>Demo Scenario</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadDashboardData} />}

      {/* 4 Metric Stats Cards with Interactive Physics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assets Issued"
          value={`${totalSupply.toLocaleString()} DBT`}
          subtitle={`${holders.length} whitelisted institutional holders`}
          icon={<Coins className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Corporate Action"
          value="CA-001 (v2)"
          subtitle="4.00% Coupon (v1 Superseded)"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatsCard
          title="Treasury Liquidity"
          value="50,000 USDC"
          subtitle="Payment Token: 100% Funded"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatsCard
          title="Indexer Synchronization"
          value={health?.status === 'ok' ? 'Synced' : 'Syncing'}
          subtitle={`Head: Block #${health?.lastSyncedBlock || 194825}`}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Flagship Actionable Callout with Shimmer Light-Sweep Effect */}
      <div className="glass-panel shimmer-banner rounded-2xl border-2 border-primary/30 p-6 shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-xs">
                ACTION REQUIRED
              </span>
              <span className="text-xs font-mono text-ink-muted">
                Action ID: CA-001 • Version 2 (ACTIVE)
              </span>
            </div>
            <h3 className="text-lg font-bold text-ink tracking-tight">
              Coupon Distribution Ready for Execution
            </h3>
            <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
              Corporate action amended from 5% to 4%. Historical Version 1 was marked{' '}
              <span className="font-semibold text-superseded bg-superseded-soft/80 px-1.5 py-0.5 rounded line-through border border-superseded/20">
                SUPERSEDED
              </span>
              . Payment will disburse <strong className="text-ink font-mono font-semibold">40.00 USDC</strong> across 3 active holders based on authoritative snapshot balances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('action-details')}
                  className="px-4 py-2 rounded-xl border border-line bg-surface/90 hover:bg-surface-muted text-ink text-xs font-semibold transition-all shadow-xs"
                >
                  View Action Details
                </button>
                <button
                  onClick={() => onNavigate('payments')}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <span>Review & Execute Payout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Split: Ownership Distribution & Lifecycle Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Token Ownership Distribution with Liquid Progress Bar */}
        <div className="glass-panel interactive-card rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink text-sm">Holders Distribution</h3>
              <p className="text-xs text-ink-muted">Cap table breakdown of {totalSupply.toLocaleString()} DBT</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('holders')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                Full Registry <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-2.5">
            <div className="w-full h-3 bg-surface-muted rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${holders[0]?.sharePercent || 50}%` }}
                className="bg-primary h-full transition-all duration-500 ease-out"
                title={`${holders[0]?.name || 'Alice'}: 50%`}
              />
              <div
                style={{ width: `${holders[1]?.sharePercent || 30}%` }}
                className="bg-blue-400 h-full transition-all duration-500 ease-out"
                title={`${holders[1]?.name || 'Bob'}: 30%`}
              />
              <div
                style={{ width: `${holders[2]?.sharePercent || 20}%` }}
                className="bg-success h-full transition-all duration-500 ease-out"
                title={`${holders[2]?.name || 'Charlie'}: 20%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted px-0.5 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>{holders[0]?.name || 'Alice'} ({holders[0]?.sharePercent || 50}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span>{holders[1]?.name || 'Bob'} ({holders[1]?.sharePercent || 30}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <span>{holders[2]?.name || 'Charlie'} ({holders[2]?.sharePercent || 20}%)</span>
              </div>
            </div>
          </div>

          {/* Mini Holder Table */}
          <div className="border border-line/80 rounded-xl overflow-hidden divide-y divide-line/70 bg-surface/50">
            {holders.map((h) => (
              <div
                key={h.address}
                className="p-3 px-3.5 flex items-center justify-between text-xs hover:bg-surface-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-[10px] flex items-center justify-center border border-primary/20">
                    {h.name[0]}
                  </div>
                  <div>
                    <span className="font-semibold text-ink">{h.name}</span>
                    <span className="ml-1 text-[11px] font-mono text-ink-muted">
                      ({h.address.slice(0, 4)}...{h.address.slice(-4)})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-ink tabular-nums">{h.balance} DBT</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-surface-muted text-ink-muted border border-line/80">
                    {h.sharePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Lifecycle Activity Timeline */}
        <div className="glass-panel interactive-card rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink text-sm">Recent Activity</h3>
              <p className="text-xs text-ink-muted">On-chain lifecycle events indexed</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                Audit Log <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/60 border border-line/60 hover:bg-surface-muted/40 transition-colors">
              <div className="p-1.5 rounded-full bg-success-soft text-success shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">ActionAmended (v2 Created)</span>
                  <span className="text-[10px] text-ink-muted font-mono">Block #194821</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  CA-001 coupon rate amended to 4.00%. Version 1 set to SUPERSEDED.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/60 border border-line/60 hover:bg-surface-muted/40 transition-colors">
              <div className="p-1.5 rounded-full bg-primary-soft text-primary shrink-0 mt-0.5">
                <History className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Transfer (200 DBT)</span>
                  <span className="text-[10px] text-ink-muted font-mono">Block #194819</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Bob transferred 200 DBT to Charlie. Balances: Bob (300), Charlie (200).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/60 border border-line/60 hover:bg-surface-muted/40 transition-colors">
              <div className="p-1.5 rounded-full bg-superseded-soft text-superseded shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">ActionCreated (v1 Announced)</span>
                  <span className="text-[10px] text-ink-muted font-mono">Block #194810</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Initial coupon announcement for CA-001 at 5.00% rate.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/60 border border-line/60 hover:bg-surface-muted/40 transition-colors">
              <div className="p-1.5 rounded-full bg-surface-muted text-ink-muted shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Token Mint & Whitelist</span>
                  <span className="text-[10px] text-ink-muted font-mono">Block #194801</span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  1,000 DBT minted. Alice (500) and Bob (500) registered and whitelisted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
