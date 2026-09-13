import React from 'react';
import { ShieldCheck, ExternalLink, Lock } from 'lucide-react';
import { getExplorerUrl } from '../../lib/explorer.js';

export interface PaymentRecord {
  actionId: string;
  version: number;
  type: string;
  totalAmount: number;
  recipientCount: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'SETTLED' | 'PENDING' | 'REVERTED';
}

interface PaymentHistoryTableProps {
  records?: PaymentRecord[];
}

export const CANONICAL_PAYMENT_HISTORY: PaymentRecord[] = [
  {
    actionId: 'CA-001',
    version: 2,
    type: 'Coupon Payment (400 bps)',
    totalAmount: 40.0,
    recipientCount: 3,
    txHash: '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a',
    blockNumber: 194825,
    timestamp: '2026-09-13 11:20:00 UTC',
    status: 'SETTLED',
  },
];

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  records = CANONICAL_PAYMENT_HISTORY,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm space-y-0">
      <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink text-base">Payment Execution History</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Cryptographic ledger of on-chain distributions and payment events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-muted text-ink border border-line">
            <Lock className="w-3 h-3 text-primary" />
            <span>Idempotency Protected</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-ink-muted text-[11px] uppercase font-semibold border-b border-line">
            <tr>
              <th className="px-5 py-3">Action ID / Version</th>
              <th className="px-5 py-3">Payment Type</th>
              <th className="px-5 py-3 text-right">Disbursed (USDC)</th>
              <th className="px-5 py-3 text-center">Recipients</th>
              <th className="px-5 py-3 text-center">Idempotency Guard</th>
              <th className="px-5 py-3 text-center">Settlement Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs text-ink-muted">
                  No payment events recorded yet.
                </td>
              </tr>
            ) : (
              records.map((record, i) => (
                <tr key={i} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-ink">{record.actionId}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-success-soft text-success border border-success/30">
                        v{record.version}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono">{record.timestamp}</span>
                  </td>

                  <td className="px-5 py-3.5 text-xs text-ink">
                    {record.type}
                  </td>

                  <td className="px-5 py-3.5 text-right font-mono font-semibold text-ink text-sm">
                    {record.totalAmount.toFixed(2)} <span className="text-xs font-normal text-ink-muted">USDC</span>
                  </td>

                  <td className="px-5 py-3.5 text-center text-xs text-ink-muted">
                    <span className="font-semibold text-ink">{record.recipientCount}</span> Whitelisted Holders
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success border border-success/30">
                      <ShieldCheck className="w-3 h-3" />
                      Executed & Sealed
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <a
                      href={getExplorerUrl(record.txHash, 'tx')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    >
                      <span>#{record.blockNumber}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
