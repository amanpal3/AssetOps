import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { CANONICAL_HOLDERS } from '../holders/HolderTable.js';
import { StatusModal, TxState } from '../transactions/StatusModal.js';
import { getExplorerUrl } from '../../lib/explorer.js';

export const RedemptionPanel: React.FC = () => {
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [modalState, setModalState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined);

  const parRate = 1.0; // 1 DBT = 1.00 USDC
  const initialSupply = 1000;
  const currentSupply = isRedeemed ? 0 : initialSupply;
  const totalPrincipal = CANONICAL_HOLDERS.reduce((sum, h) => sum + h.balance * parRate, 0);

  const handleExecuteRedemption = () => {
    setModalState('prompt');

    setTimeout(() => {
      setModalState('pending');
      const hash = '0x5d91823740192837401928374019283740192837401928374019283740192837';
      setTxHash(hash);

      setTimeout(() => {
        setModalState('confirmed');
        setBlockNumber(194830);
        setIsRedeemed(true);
      }, 2000);
    }, 1500);
  };

  const handleReset = () => {
    setIsRedeemed(false);
    setModalState('idle');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Execution Trigger */}
      <div className="bg-surface rounded-xl border border-line p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-xl ${isRedeemed ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'}`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-muted text-ink border border-line">
                  Maturity Phase
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  isRedeemed
                    ? 'bg-success-soft text-success border border-success/30'
                    : 'bg-warning-soft text-warning border border-warning/30'
                }`}>
                  {isRedeemed ? 'MATURED & FULLY BURNED' : 'PENDING MATURITY REDEMPTION'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-ink mt-1">
                Principal Redemption & Authorized Token Burn
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isRedeemed && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
                <span>Reset Simulation</span>
              </button>
            )}

            {!isRedeemed ? (
              <button
                onClick={handleExecuteRedemption}
                className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>Execute Final Redemption & Burn</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 bg-success-soft text-success border border-success/30 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tokens Permanently Burned</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-surface-muted/50 rounded-xl border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Asset Circulating Supply</span>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              {currentSupply.toFixed(2)} <span className="text-xs font-medium text-ink-muted">DBT</span>
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              {isRedeemed ? '100% burned from holder accounts' : '1,000 DBT outstanding before burn'}
            </p>
          </div>

          <div className="p-4 bg-surface-muted/50 rounded-xl border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Par Redemption Value</span>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              1.00 <span className="text-xs font-medium text-ink-muted">USDC / DBT</span>
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              100% return of principal upon maturity
            </p>
          </div>

          <div className="p-4 bg-surface-muted/50 rounded-xl border border-line">
            <span className="text-ink-muted uppercase text-[10px] font-semibold">Principal Liquidity Disbursed</span>
            <div className="text-2xl font-bold font-mono text-success mt-1">
              {isRedeemed ? `${totalPrincipal.toFixed(2)} USDC` : '0.00 USDC'}
            </div>
            <p className="text-[11px] text-ink-muted mt-1">
              {isRedeemed ? 'Fully settled across all 3 holders' : `${totalPrincipal.toFixed(2)} USDC reserved in Treasury`}
            </p>
          </div>
        </div>
      </div>

      {/* Holder Burn & Payout Breakdown Table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-line">
          <h4 className="font-semibold text-ink text-sm">
            Holder Redemption & Token Burn Ledger
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">
            Invokes <code className="font-mono text-[11px] text-ink font-semibold">burnFromHolder(account, amount)</code> on <code className="font-mono text-[11px] text-ink font-semibold">SecurityToken.sol</code>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/60 text-ink-muted uppercase font-semibold border-b border-line">
              <tr>
                <th className="px-5 py-3">Holder Account</th>
                <th className="px-5 py-3 text-right">Pre-Burn Balance</th>
                <th className="px-5 py-3 text-right">Tokens Burned</th>
                <th className="px-5 py-3 text-right">Post-Burn Balance</th>
                <th className="px-5 py-3 text-right">Principal Received</th>
                <th className="px-5 py-3 text-center">Final State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono">
              {CANONICAL_HOLDERS.map((h) => {
                const principal = h.balance * parRate;
                return (
                  <tr key={h.address} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="px-5 py-3.5 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-[10px] flex items-center justify-center">
                          {h.name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-ink text-xs">{h.name}</span>
                          <span className="text-[10px] text-ink-muted ml-1 font-mono">
                            ({h.address.slice(0, 4)}...{h.address.slice(-4)})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right font-medium text-ink">
                      {h.balance.toFixed(2)} DBT
                    </td>

                    <td className="px-5 py-3.5 text-right font-semibold text-danger">
                      {isRedeemed ? `-${h.balance.toFixed(2)} DBT` : '0.00 DBT'}
                    </td>

                    <td className="px-5 py-3.5 text-right font-medium text-ink-muted">
                      {isRedeemed ? '0.00 DBT' : `${h.balance.toFixed(2)} DBT`}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-success text-sm">
                      {isRedeemed ? `${principal.toFixed(2)} USDC` : 'Pending'}
                    </td>

                    <td className="px-5 py-3.5 text-center font-sans">
                      {isRedeemed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-soft text-success border border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted text-ink-muted border border-line">
                          Active Holding
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isRedeemed && (
          <div className="p-4 bg-success-soft/30 border-t border-success/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-success font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Asset Maturity Reached: Total circulating supply permanently reduced to 0 DBT.</span>
            </div>
            {txHash && (
              <a
                href={getExplorerUrl(txHash, 'tx')}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                Burn Tx Receipt <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      <StatusModal
        isOpen={modalState !== 'idle'}
        onClose={() => setModalState('idle')}
        status={modalState}
        title="Asset Principal Redemption & Token Burn"
        txHash={txHash}
        blockNumber={blockNumber}
      />
    </div>
  );
};
