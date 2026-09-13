import React, { useState } from 'react';
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Layers
} from 'lucide-react';
import { VersionBadge } from './VersionBadge.js';

export interface ActionVersionData {
  version: number;
  versionId: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXECUTED';
  rateBps: number;
  amountPerToken: number;
  totalObligation: number;
  recordDate: string;
  payableDate: string;
  documentHash: string;
  supersededBy?: string;
  supersedes?: string;
  amendmentReason?: string;
  announcedAt: string;
}

export const CANONICAL_VERSIONS: ActionVersionData[] = [
  {
    version: 1,
    versionId: '0x1a8f92b7c0d38119e48271829374019283740192837401928374019283740191',
    status: 'SUPERSEDED',
    rateBps: 500,
    amountPerToken: 0.05,
    totalObligation: 50.0,
    recordDate: '2026-09-15 00:00:00 UTC',
    payableDate: '2026-09-15 12:00:00 UTC',
    documentHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    supersededBy: '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202',
    amendmentReason: 'Rate adjusted from 5.00% to 4.00% per finalized pricing addendum.',
    announcedAt: '2026-09-12 10:15:00 UTC',
  },
  {
    version: 2,
    versionId: '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202',
    status: 'ACTIVE',
    rateBps: 400,
    amountPerToken: 0.04,
    totalObligation: 40.0,
    recordDate: '2026-09-15 00:00:00 UTC',
    payableDate: '2026-09-18 12:00:00 UTC',
    documentHash: 'QmZtmD2qtW3wT1xYy72vedxjQkDD73hwo81kNmE9281kNm',
    supersedes: '0x1a8f92b7c0d38119e48271829374019283740192837401928374019283740191',
    announcedAt: '2026-09-13 09:30:00 UTC',
  },
];

interface ActionFeedProps {
  onNavigate?: (tab: string) => void;
  onOpenAmendModal?: () => void;
}

export const ActionFeed: React.FC<ActionFeedProps> = ({ onNavigate, onOpenAmendModal }) => {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(2);
  const [showDiff, setShowDiff] = useState<boolean>(true);

  const activeVersion = CANONICAL_VERSIONS.find((v) => v.status === 'ACTIVE')!;
  const supersededVersion = CANONICAL_VERSIONS.find((v) => v.status === 'SUPERSEDED')!;

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <div className="bg-surface rounded-xl border border-line p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-primary bg-primary-soft px-2 py-0.5 rounded">
                  CA-001
                </span>
                <span className="text-xs text-ink-muted">Semi-Annual Debt Service</span>
              </div>
              <h3 className="text-lg font-bold text-ink mt-0.5">
                Corporate Action: 2026-H2 Coupon Distribution
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('action-details')}
                className="px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
              >
                View Action Details
              </button>
            )}
            {onOpenAmendModal && (
              <button
                onClick={onOpenAmendModal}
                className="px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
              >
                + Propose Amendment
              </button>
            )}
            {onNavigate && (
              <button
                onClick={() => onNavigate('payments')}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Proceed to Payout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Append-Only Invariant Callout */}
        <div className="p-3 rounded-lg bg-surface-muted border border-line flex items-center gap-2.5 text-xs text-ink-muted">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Append-Only Integrity:</strong> In <code className="font-mono text-[11px] text-ink font-semibold">CorporateActionRegistry.sol</code>, historical announcements cannot be overwritten or deleted. Superseded versions are permanently sealed on-chain.
          </span>
        </div>
      </div>

      {/* Version Comparison Diff Card */}
      {showDiff && (
        <div className="bg-surface rounded-xl border border-line p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-ink text-sm">Version Comparison Diff (v1 → v2)</h4>
            </div>
            <button
              onClick={() => setShowDiff(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Hide Diff
            </button>
          </div>

          <div className="border border-line rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-surface-muted/70 text-ink-muted uppercase font-semibold border-b border-line">
                <tr>
                  <th className="px-4 py-2 text-left">Parameter</th>
                  <th className="px-4 py-2 text-left text-superseded">Version 1 (SUPERSEDED)</th>
                  <th className="px-4 py-2 text-left text-success">Version 2 (ACTIVE)</th>
                  <th className="px-4 py-2 text-left">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-ink">Coupon Rate</td>
                  <td className="px-4 py-2.5 text-superseded line-through">500 bps (5.00%)</td>
                  <td className="px-4 py-2.5 text-success font-semibold">400 bps (4.00%)</td>
                  <td className="px-4 py-2.5 font-sans text-ink-muted">-100 bps reduction</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-ink">Amount Per Token</td>
                  <td className="px-4 py-2.5 text-superseded line-through">0.0500 USDC</td>
                  <td className="px-4 py-2.5 text-success font-semibold">0.0400 USDC</td>
                  <td className="px-4 py-2.5 font-sans text-ink-muted">Reflects 4% coupon</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-ink">Total Payout Required</td>
                  <td className="px-4 py-2.5 text-superseded line-through">50.00 USDC</td>
                  <td className="px-4 py-2.5 text-success font-semibold">40.00 USDC</td>
                  <td className="px-4 py-2.5 font-sans text-ink-muted">-$10.00 cash savings</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-ink">Payable Date</td>
                  <td className="px-4 py-2.5 text-ink-muted">2026-09-15</td>
                  <td className="px-4 py-2.5 text-ink font-semibold">2026-09-18</td>
                  <td className="px-4 py-2.5 font-sans text-ink-muted">+3 day extension</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-ink">IPFS Legal Prospectus</td>
                  <td className="px-4 py-2.5 text-superseded font-mono text-[10px]">QmXoyp...uco</td>
                  <td className="px-4 py-2.5 text-success font-mono text-[10px]">QmZtmD...Nm</td>
                  <td className="px-4 py-2.5 font-sans text-ink-muted">Signed prospectus addendum</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Version Lineage Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-ink text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-ink-muted" />
            Append-Only Version History
          </h4>
          {!showDiff && (
            <button
              onClick={() => setShowDiff(true)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Show Comparison Diff
            </button>
          )}
        </div>

        {/* Version 2 (ACTIVE) */}
        <div className="bg-surface rounded-xl border-2 border-success/40 shadow-sm overflow-hidden transition-all">
          <div
            onClick={() => setExpandedVersion(expandedVersion === 2 ? null : 2)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-success-soft text-success font-bold text-xs flex items-center justify-center">
                v2
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-ink text-sm">Version 2: Amended Action</h5>
                  <VersionBadge version={2} status="ACTIVE" />
                  <span className="text-[11px] font-mono text-success font-medium bg-success-soft px-1.5 py-0.5 rounded">
                    Sole Execution Target
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Coupon Rate: <strong className="text-ink font-mono font-semibold">4.00% (400 bps)</strong> • Total Payout: <strong className="text-ink font-mono font-semibold">40.00 USDC</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted font-mono hidden sm:inline">
                {activeVersion.announcedAt}
              </span>
              {expandedVersion === 2 ? (
                <ChevronUp className="w-4 h-4 text-ink-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              )}
            </div>
          </div>

          {expandedVersion === 2 && (
            <div className="px-5 pb-5 pt-2 border-t border-line/60 bg-surface-muted/20 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Version Hash</span>
                  <p className="font-mono text-ink text-[11px] mt-1 break-all font-semibold">
                    {activeVersion.versionId}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Supersedes</span>
                  <p className="font-mono text-superseded text-[11px] mt-1 break-all">
                    {activeVersion.supersedes}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Legal Document</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-ink text-[11px]">{activeVersion.documentHash.slice(0, 14)}...</span>
                    <a
                      href={`https://ipfs.io/ipfs/${activeVersion.documentHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      IPFS <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Execution Ready Bar */}
              <div className="p-3 bg-success-soft/50 border border-success/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-success font-medium">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Verified by PaymentExecutor.sol: Can be executed on-chain.</span>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('payments')}
                    className="px-3 py-1 bg-success text-white rounded text-xs font-semibold hover:bg-success/90 transition-colors"
                  >
                    Execute Payout →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Version 1 (SUPERSEDED) */}
        <div className="bg-surface rounded-xl border border-line/80 shadow-sm overflow-hidden opacity-85">
          <div
            onClick={() => setExpandedVersion(expandedVersion === 1 ? null : 1)}
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-superseded-soft text-superseded font-bold text-xs flex items-center justify-center">
                v1
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-semibold text-ink-muted text-sm line-through">
                    Version 1: Original Announcement
                  </h5>
                  <VersionBadge version={1} status="SUPERSEDED" />
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  Initial announcement at 5.00% (500 bps). Cannot be paid.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-muted font-mono hidden sm:inline">
                {supersededVersion.announcedAt}
              </span>
              {expandedVersion === 1 ? (
                <ChevronUp className="w-4 h-4 text-ink-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              )}
            </div>
          </div>

          {expandedVersion === 1 && (
            <div className="px-5 pb-5 pt-2 border-t border-line bg-surface-muted/20 space-y-4">
              <div className="p-3 bg-danger-soft/40 border border-danger/30 rounded-lg flex items-start gap-2.5 text-xs text-danger">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <div>
                  <strong>Execution Prohibited by Protocol Guard:</strong> Any transaction attempting to call <code className="font-mono text-danger font-bold">executeAction</code> for Version 1 will fail and revert on-chain with <code className="font-mono text-danger font-bold">SupersededVersion()</code>.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Version Hash</span>
                  <p className="font-mono text-ink-muted text-[11px] mt-1 break-all">
                    {supersededVersion.versionId}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Superseded By</span>
                  <p className="font-mono text-primary text-[11px] mt-1 break-all">
                    {supersededVersion.supersededBy}
                  </p>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-line">
                  <span className="text-ink-muted uppercase text-[10px] font-semibold">Amendment Rationale</span>
                  <p className="text-ink-muted text-xs mt-1">
                    {supersededVersion.amendmentReason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
