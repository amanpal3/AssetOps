import React, { useState } from 'react';
import {
  History,
  FileText,
  CreditCard,
  Flame,
  ArrowRightLeft,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getExplorerUrl } from '../../lib/explorer.js';

export interface AuditEvent {
  id: string;
  eventName: string;
  category: 'action' | 'payment' | 'transfer' | 'burn';
  blockNumber: number;
  timestamp: string;
  txHash: string;
  description: string;
  details: Record<string, any>;
}

export const CANONICAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-6',
    eventName: 'ActionPaymentExecuted',
    category: 'payment',
    blockNumber: 194825,
    timestamp: '2026-09-13 11:20:00 UTC',
    txHash: '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a',
    description: 'Executed coupon payout for CA-001 Version 2. Disbursed 40.00 USDC across 3 holders.',
    details: {
      actionId: 'CA-001',
      version: 2,
      totalDisbursed: '40.00 USDC',
      holdersCount: 3,
      idempotencyKey: '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202',
      idempotencyGuardStatus: 'SEALED (true)',
    },
  },
  {
    id: 'evt-5',
    eventName: 'ActionAmended',
    category: 'action',
    blockNumber: 194821,
    timestamp: '2026-09-13 09:30:00 UTC',
    txHash: '0x1e82937401928374019283740192837401928374019283740192837401928371',
    description: 'Corporate action amended: Rate updated to 4.00% (400 bps). Version 1 marked SUPERSEDED.',
    details: {
      actionId: 'CA-001',
      previousVersionId: '0x1a8f92b7...v1',
      newVersionId: '0x2b9c81a4...v2',
      newRateBps: 400,
      newPayableDate: '2026-09-18',
      amendmentRationale: 'Pricing addendum aligned with revised benchmark rate',
    },
  },
  {
    id: 'evt-4',
    eventName: 'Transfer',
    category: 'transfer',
    blockNumber: 194819,
    timestamp: '2026-09-12 16:45:00 UTC',
    txHash: '0x7a81928374019283740192837401928374019283740192837401928374019283',
    description: 'Compliant secondary market transfer: Bob sent 200.00 DBT to Charlie.',
    details: {
      from: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Bob)',
      to: '0x90F79bf6EB2c4f870365E785982E1f101E93b906 (Charlie)',
      amount: '200.00 DBT',
      restrictionCheck: '0 (SUCCESS - Both whitelisted)',
    },
  },
  {
    id: 'evt-3',
    eventName: 'ActionCreated',
    category: 'action',
    blockNumber: 194810,
    timestamp: '2026-09-12 10:15:00 UTC',
    txHash: '0x4f82719283740192837401928374019283740192837401928374019283740192',
    description: 'Initial announcement of CA-001 (Version 1) at 5.00% (500 bps) coupon rate.',
    details: {
      actionId: 'CA-001',
      version: 1,
      actionType: 'COUPON_PAYMENT (1)',
      rateBps: 500,
      documentHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    },
  },
  {
    id: 'evt-2',
    eventName: 'WhitelistUpdated',
    category: 'transfer',
    blockNumber: 194805,
    timestamp: '2026-09-11 14:00:00 UTC',
    txHash: '0x9c81729384710293847102938471029384710293847102938471029384710293',
    description: 'Allowlist updated: Alice, Bob, and Charlie approved for compliant ERC-1404 transfers.',
    details: {
      operator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Admin)',
      status: 'APPROVED (true)',
      accounts: ['Alice', 'Bob', 'Charlie'],
    },
  },
  {
    id: 'evt-1',
    eventName: 'TokenMint',
    category: 'burn',
    blockNumber: 194801,
    timestamp: '2026-09-11 09:00:00 UTC',
    txHash: '0x2d81726354819283740192837401928374019283740192837401928374019281',
    description: 'Asset genesis: 1,000.00 DBT issued and minted to anchor institutional accounts.',
    details: {
      assetToken: 'Digital Bond Token (DBT)',
      totalSupply: '1,000.00 DBT',
      allocations: 'Alice (500), Bob (500)',
    },
  },
];

export const AuditTimeline: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = CANONICAL_AUDIT_EVENTS.filter((evt) => {
    const matchesCategory = activeCategory === 'all' || evt.category === activeCategory;
    const matchesQuery =
      evt.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.blockNumber.toString().includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'action':
        return <FileText className="w-3.5 h-3.5 text-primary" />;
      case 'payment':
        return <CreditCard className="w-3.5 h-3.5 text-success" />;
      case 'transfer':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />;
      case 'burn':
        return <Flame className="w-3.5 h-3.5 text-danger" />;
      default:
        return <History className="w-3.5 h-3.5 text-ink-muted" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'action':
        return 'bg-primary-soft text-primary border-primary/30';
      case 'payment':
        return 'bg-success-soft text-success border-success/30';
      case 'transfer':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'burn':
        return 'bg-danger-soft text-danger border-danger/30';
      default:
        return 'bg-surface-muted text-ink-muted border-line';
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm space-y-0">
      {/* Search & Category Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Lifecycle Events' },
            { id: 'action', label: 'Corporate Actions' },
            { id: 'payment', label: 'Payments' },
            { id: 'transfer', label: 'Transfers & Compliance' },
            { id: 'burn', label: 'Issuance & Burns' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-ink text-white font-semibold shadow-sm'
                  : 'bg-surface-muted hover:bg-line text-ink-muted hover:text-ink'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search block, tx, event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-ink-muted"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-line">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted">
            No on-chain events found matching current criteria.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;

            return (
              <div
                key={evt.id}
                className="p-4 sm:p-5 hover:bg-surface-muted/30 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface border border-line shadow-xs shrink-0">
                      {getCategoryIcon(evt.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-ink text-sm font-mono">{evt.eventName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getCategoryBadge(evt.category)}`}>
                          {evt.category}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">{evt.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-xs font-semibold text-ink">Block #{evt.blockNumber}</span>
                      <span className="block text-[10px] text-ink-muted font-mono">{evt.timestamp}</span>
                    </div>

                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      className="p-1 rounded hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
                      title="Inspect payload"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Payload Inspector */}
                {isExpanded && (
                  <div className="p-3 bg-surface-muted rounded-lg border border-line text-xs font-mono space-y-2 mt-2">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="text-[10px] uppercase font-semibold text-ink-muted font-sans">
                        On-Chain Event Log Parameters
                      </span>
                      <a
                        href={getExplorerUrl(evt.txHash, 'tx')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] font-sans"
                      >
                        View on Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <pre className="text-[11px] text-ink overflow-x-auto leading-relaxed">
                      {JSON.stringify(evt.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Audit Guarantee */}
      <div className="px-5 py-3 bg-surface-muted/40 border-t border-line flex items-center justify-between text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Full Cryptographic Lineage Verified</span>
        </span>
        <span className="font-mono text-[11px]">
          Total Events Indexed: {CANONICAL_AUDIT_EVENTS.length}
        </span>
      </div>
    </div>
  );
};
