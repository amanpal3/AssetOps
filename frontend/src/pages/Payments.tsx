import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { StatusModal, TxState } from '../components/transactions/StatusModal.js';
import { PaymentHistoryTable } from '../components/payments/PaymentHistoryTable.js';
import { CANONICAL_HOLDERS } from '../components/holders/HolderTable.js';
import { getPayments, PaymentItem } from '../services/api.js';
import { LoadingState, ErrorState } from '../components/common/StateViews.js';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';

interface PaymentsProps {
  onNavigate?: (tab: string) => void;
}

export const Payments: React.FC<PaymentsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isExecuted, setIsExecuted] = useState(false);
  const [modalState, setModalState] = useState<TxState>('idle');
  const [modalTitle, setModalTitle] = useState('Execute Payout');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [revertCode, setRevertCode] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined);

  const fetchPaymentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayments();
      setPayments(res.payments);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const couponRate = 0.04; // 4% for Version 2
  const totalPayout = CANONICAL_HOLDERS.reduce((sum, h) => sum + h.balance * couponRate, 0);

  // Normal Authorized Execution
  const handleExecutePayout = () => {
    if (isExecuted) return;
    setModalTitle('Execute Corporate Action Payout');
    setRevertCode(undefined);
    setErrorMsg(undefined);
    setModalState('prompt');

    // Simulate wallet signature -> mining -> confirmed
    setTimeout(() => {
      setModalState('pending');
      const hash = '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a';
      setTxHash(hash);

      setTimeout(() => {
        setModalState('confirmed');
        setBlockNumber(194825);
        setIsExecuted(true);
        // Append to payments list
        const newRecord: PaymentItem = {
          id: `pay-${Date.now()}`,
          actionId: 'CA-001',
          version: 2,
          type: 'Coupon Payment (400 bps)',
          totalAmount: 40.0,
          holderCount: 3,
          txHash: hash,
          blockNumber: 194825,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          status: 'SETTLED',
        };
        setPayments(prev => [newRecord, ...prev]);
      }, 2000);
    }, 1500);
  };

  // Replay Attack Test: Intentionally call duplicate payout
  const handleAttemptDuplicate = () => {
    setModalTitle('Replay Attack Verification');
    setModalState('prompt');

    setTimeout(() => {
      setModalState('pending');
      const hash = '0x8f27e192a8374019283740192837401928374019283740192837401928374019';
      setTxHash(hash);

      setTimeout(() => {
        setModalState('error');
        setRevertCode('AlreadyExecuted');
        setErrorMsg('PaymentExecutor: Action version (CA-001 v2) has already been executed. On-chain execution guard halted duplicate disbursement.');
      }, 1800);
    }, 1200);
  };

  const handleResetDemoState = () => {
    setIsExecuted(false);
    setModalState('idle');
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
              Financial Servicing
            </span>
            <span className="text-xs font-mono text-ink-muted">
              PaymentExecutor.sol
            </span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Coupon & Dividend Payments</h2>
          <p className="text-sm text-ink-muted">
            Atomic on-chain disbursement calculated from authoritative snapshot balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isExecuted && (
            <button
              onClick={handleResetDemoState}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
              title="Reset state for testing"
            >
              <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
              <span>Reset State</span>
            </button>
          )}

          <a
            href={getExplorerUrl(CONTRACT_ADDRESSES.paymentExecutor, 'address')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm"
          >
            <span>Executor: {CONTRACT_ADDRESSES.paymentExecutor.slice(0, 6)}...{CONTRACT_ADDRESSES.paymentExecutor.slice(-4)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
          </a>
        </div>
      </div>

      {loading && <LoadingState message="Fetching payments from Member 1 Backend..." />}
      {error && <ErrorState message={error} onRetry={fetchPaymentsData} />}

      {!loading && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Target Action</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">CA-001 (v2)</h3>
              <p className="text-xs text-ink-muted mt-1">4.00% Coupon (Amended)</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Total Obligation</span>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1">{totalPayout.toFixed(2)} USDC</h3>
              <p className="text-xs text-ink-muted mt-1">3 Whitelisted recipients</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Treasury Reserves</span>
              <h3 className="text-2xl font-bold font-mono text-success mt-1">50,000.00 USDC</h3>
              <p className="text-xs text-ink-muted mt-1">Fully collateralized</p>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-line shadow-sm">
              <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">Idempotency Guard</span>
              <h3 className={`text-2xl font-bold font-mono mt-1 ${isExecuted ? 'text-success' : 'text-primary'}`}>
                {isExecuted ? 'SEALED' : 'READY'}
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                {isExecuted ? 'Executed (Replay Prohibited)' : 'Unexecuted (Callable)'}
              </p>
            </div>
          </div>

          {/* Pre-Execution Preview Card */}
          <div className="bg-surface rounded-xl border border-line p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase font-mono bg-primary-soft px-2 py-0.5 rounded">
                    Pre-Execution Calculation
                  </span>
                  <span className="text-xs text-ink-muted">Rate: 0.04 USDC / DBT</span>
                </div>
                <h3 className="font-bold text-ink text-base mt-1">
                  Holder Distribution Breakdown (CA-001 Version 2)
                </h3>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex items-center gap-2.5">
                {!isExecuted ? (
                  <button
                    onClick={handleExecutePayout}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Execute Action Payout ({totalPayout.toFixed(2)} USDC)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAttemptDuplicate}
                    className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Attempt Duplicate Payout (Test Guard)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Calculation Table */}
            <div className="overflow-x-auto border border-line rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/70 text-ink-muted uppercase font-semibold border-b border-line">
                  <tr>
                    <th className="px-4 py-2.5">Holder Account</th>
                    <th className="px-4 py-2.5 text-right">Holdings (DBT)</th>
                    <th className="px-4 py-2.5 text-right">Share %</th>
                    <th className="px-4 py-2.5 text-center">Formula</th>
                    <th className="px-4 py-2.5 text-right">Disbursement (USDC)</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono">
                  {CANONICAL_HOLDERS.map((h) => {
                    const amount = h.balance * couponRate;
                    return (
                      <tr key={h.address} className="hover:bg-surface-muted/40 transition-colors">
                        <td className="px-4 py-3 font-sans">
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

                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {h.balance.toFixed(2)} DBT
                        </td>

                        <td className="px-4 py-3 text-right text-ink-muted">
                          {h.sharePercent.toFixed(1)}%
                        </td>

                        <td className="px-4 py-3 text-center text-ink-muted text-[11px]">
                          {h.balance} × 0.04
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-ink text-sm">
                          {amount.toFixed(2)} USDC
                        </td>

                        <td className="px-4 py-3 text-center font-sans">
                          {isExecuted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-soft text-success border border-success/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-soft text-warning border border-warning/30">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-surface-muted/50 border-t border-line font-mono font-bold text-xs">
                  <tr>
                    <td className="px-4 py-2.5 font-sans uppercase text-ink">Total Disbursed</td>
                    <td className="px-4 py-2.5 text-right text-ink">1,000.00 DBT</td>
                    <td className="px-4 py-2.5 text-right text-ink">100.0%</td>
                    <td className="px-4 py-2.5 text-center text-ink-muted">—</td>
                    <td className="px-4 py-2.5 text-right text-success text-sm">{totalPayout.toFixed(2)} USDC</td>
                    <td className="px-4 py-2.5 text-center font-sans text-ink-muted">
                      {isExecuted ? 'Finalized' : 'Ready'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Idempotency Alert Box */}
            {isExecuted && (
              <div className="p-4 bg-surface-muted border border-line rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-success shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-ink">Idempotency Guard Permanently Active:</span>
                    <p className="text-ink-muted mt-0.5">
                      The on-chain key <code className="font-mono text-ink">executedVersion[0x2b9c...v2]</code> is now true. Any duplicate execution will revert on-chain with <code className="font-mono text-danger font-semibold">AlreadyExecuted()</code>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAttemptDuplicate}
                  className="shrink-0 px-3 py-1.5 bg-danger text-white rounded-lg text-xs font-semibold hover:bg-danger/90 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Test Replay Attack</span>
                </button>
              </div>
            )}
          </div>

          {/* Historical Payment Events Table */}
          <PaymentHistoryTable records={payments.map(p => ({
            actionId: p.actionId,
            version: p.version,
            type: p.type,
            totalAmount: p.totalAmount,
            recipientCount: p.holderCount,
            txHash: p.txHash,
            blockNumber: p.blockNumber,
            timestamp: p.timestamp,
            status: p.status,
          }))} />
        </>
      )}

      {/* Web3 Transaction Status Modal */}
      <StatusModal
        isOpen={modalState !== 'idle'}
        onClose={() => setModalState('idle')}
        status={modalState}
        title={modalTitle}
        txHash={txHash}
        blockNumber={blockNumber}
        revertCode={revertCode}
        errorMsg={errorMsg}
        onRetry={handleExecutePayout}
      />
    </div>
  );
};
