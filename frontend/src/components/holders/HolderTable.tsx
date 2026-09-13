import React from 'react';

interface HolderTableProps {
  holders: any[];
}

export const HolderTable: React.FC<HolderTableProps> = ({ holders }) => {
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
      <div className="p-4 border-b border-line">
        <h3 className="font-semibold text-ink">Token Holders (Authoritative Live Registry)</h3>
        <p className="text-xs text-ink-muted">Balances reflect on-chain state used for real-time payout calculation.</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-ink-muted text-xs uppercase font-semibold">
          <tr>
            <th className="px-6 py-3">Holder Address</th>
            <th className="px-6 py-3">Balance (DBT)</th>
            <th className="px-6 py-3">Allowlist Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {holders.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-ink-muted">No holders registered yet.</td>
            </tr>
          ) : (
            holders.map((h, i) => (
              <tr key={i} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-3.5 font-mono text-xs text-ink font-medium">{h.address}</td>
                <td className="px-6 py-3.5 font-semibold text-ink">{h.balance}</td>
                <td className="px-6 py-3.5">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success-soft text-success">Whitelisted</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
