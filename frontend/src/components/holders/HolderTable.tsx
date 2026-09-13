import React, { useState } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, Search } from 'lucide-react';
import { getExplorerUrl } from '../../lib/explorer.js';

export interface HolderItem {
  address: string;
  name: string;
  role?: string;
  balance: number;
  sharePercent: number;
  isWhitelisted: boolean;
}

export const CANONICAL_HOLDERS: HolderItem[] = [
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    name: 'Alice',
    role: 'Anchor Institutional Investor',
    balance: 500,
    sharePercent: 50.0,
    isWhitelisted: true,
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    name: 'Bob',
    role: 'Primary Account (Transferred 200 to Charlie)',
    balance: 300,
    sharePercent: 30.0,
    isWhitelisted: true,
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    name: 'Charlie',
    role: 'Secondary Market Transferee',
    balance: 200,
    sharePercent: 20.0,
    isWhitelisted: true,
  },
];

interface HolderTableProps {
  holders?: HolderItem[];
  totalSupply?: number;
}

export const HolderTable: React.FC<HolderTableProps> = ({
  holders = CANONICAL_HOLDERS,
  totalSupply = 1000,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredHolders = holders.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.role ? h.role.toLowerCase().includes(searchQuery.toLowerCase()) : false)
  );

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink text-base">Token Holders Registry</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Authoritative on-chain balances verified against <code className="font-mono text-[11px] text-ink font-semibold">SecurityToken.sol</code>.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search address or holder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-line rounded-lg text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-ink-muted"
          />
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted/60 text-ink-muted text-[11px] uppercase font-semibold border-b border-line">
            <tr>
              <th className="px-5 py-3">Holder Account</th>
              <th className="px-5 py-3">Role / Classification</th>
              <th className="px-5 py-3 text-right">Balance (DBT)</th>
              <th className="px-5 py-3 text-right">Ownership</th>
              <th className="px-5 py-3 text-center">Compliance Status</th>
              <th className="px-5 py-3 text-center">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredHolders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted text-xs">
                  No holder accounts match your search filter.
                </td>
              </tr>
            ) : (
              filteredHolders.map((holder) => {
                const isCopied = copiedAddress === holder.address;
                const share = ((holder.balance / totalSupply) * 100).toFixed(1);

                return (
                  <tr key={holder.address} className="hover:bg-surface-muted/40 transition-colors">
                    {/* Account */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center">
                          {holder.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-ink text-xs">{holder.name}</div>
                          <div className="font-mono text-[11px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                            <span>
                              {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                            </span>
                            <button
                              onClick={() => handleCopy(holder.address)}
                              className="text-ink-muted hover:text-ink transition-colors"
                              title="Copy address"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-success" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5 text-xs text-ink-muted">
                      {holder.role}
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold font-mono text-ink text-sm">
                        {holder.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="ml-1 text-[11px] text-ink-muted font-mono font-medium">DBT</span>
                    </td>

                    {/* Ownership Share */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-muted text-ink border border-line">
                        {share}%
                      </span>
                    </td>

                    {/* Compliance / Whitelist */}
                    <td className="px-5 py-3.5 text-center">
                      {holder.isWhitelisted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success border border-success/30">
                          <ShieldCheck className="w-3 h-3" />
                          Whitelisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-soft text-danger border border-danger/30">
                          Restricted
                        </span>
                      )}
                    </td>

                    {/* Explorer */}
                    <td className="px-5 py-3.5 text-center">
                      <a
                        href={getExplorerUrl(holder.address, 'address')}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center text-ink-muted hover:text-primary transition-colors p-1 rounded hover:bg-surface-muted"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Snapshot Note */}
      <div className="px-5 py-3 bg-surface-muted/40 border-t border-line flex items-center justify-between text-xs text-ink-muted">
        <span>
          Total Circulating Supply: <strong className="font-mono text-ink font-semibold">{totalSupply.toLocaleString()} DBT</strong>
        </span>
        <span className="font-mono text-[11px]">
          Snapshot State: Block-Level Live Read
        </span>
      </div>
    </div>
  );
};
