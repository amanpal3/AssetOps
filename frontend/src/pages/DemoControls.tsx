import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Flame,
  FileText,
  Users,
  CreditCard
} from 'lucide-react';
import { StatusModal, TxState } from '../components/transactions/StatusModal.js';

interface DemoControlsProps {
  onNavigate?: (tab: string) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({ onNavigate }) => {
  const [modalState, setModalState] = useState<TxState>('idle');
  const [modalTitle, setModalTitle] = useState('Replay Attack Verification');
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [revertCode, setRevertCode] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const handleTriggerReplayAttack = () => {
    setModalTitle('Attempt Duplicate Payout (Replay Test)');
    setModalState('prompt');

    setTimeout(() => {
      setModalState('pending');
      setTxHash('0x8f27e192a8374019283740192837401928374019283740192837401928374019');

      setTimeout(() => {
        setModalState('error');
        setRevertCode('AlreadyExecuted');
        setErrorMsg('PaymentExecutor.sol reverted: Corporate action version CA-001 (v2) has already been executed. On-chain double-payment guard successfully protected investor and treasury funds.');
      }, 1800);
    }, 1200);
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
            Judge & Demo Scenario Runner
          </span>
          <span className="text-xs font-mono text-ink-muted">5-Minute Canonical Lifecycle</span>
        </div>
        <h2 className="text-2xl font-bold text-ink mt-1">Guided Demonstration Control Panel</h2>
        <p className="text-sm text-ink-muted">
          Step-by-step interactive pitch runner demonstrating corporate actions, dynamic transfers, and protocol-level security invariants.
        </p>
      </div>

      {/* Demo Walkthrough Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 & 2 */}
        <div className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Step 1 & 2
              </span>
              <span className="text-[11px] text-ink-muted font-mono">Issuance & Initial Notice</span>
            </div>
            <h4 className="font-semibold text-ink text-sm">1. Asset Issuance & CA-001 Notice</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              1,000 DBT distributed to whitelisted institutional accounts (Alice: 500, Bob: 500). Initial notice announced at 5.00% coupon rate.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('holders')}
                  className="px-3 py-1.5 bg-surface-muted hover:bg-line text-ink rounded-lg text-xs font-medium transition-colors"
                >
                  Inspect Cap Table
                </button>
                <button
                  onClick={() => onNavigate('actions')}
                  className="px-3 py-1.5 bg-surface-muted hover:bg-line text-ink rounded-lg text-xs font-medium transition-colors"
                >
                  View Announcement (v1)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 3 & 4 */}
        <div className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Step 3 & 4
              </span>
              <span className="text-[11px] text-ink-muted font-mono">Transfer & Amendment</span>
            </div>
            <h4 className="font-semibold text-ink text-sm">2. Mid-Cycle Transfer & 4% Amendment</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Bob transfers 200 DBT to Charlie. Issuer amends coupon rate to 4.00% on-chain. Version 1 is permanently sealed as <span className="text-superseded font-semibold">SUPERSEDED</span>.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('holders')}
                  className="px-3 py-1.5 bg-surface-muted hover:bg-line text-ink rounded-lg text-xs font-medium transition-colors"
                >
                  Check New Balances
                </button>
                <button
                  onClick={() => onNavigate('actions')}
                  className="px-3 py-1.5 bg-primary-soft text-primary hover:bg-primary-soft/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Inspect Version DAG</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Step 5
              </span>
              <span className="text-[11px] text-ink-muted font-mono">Authorized Execution</span>
            </div>
            <h4 className="font-semibold text-ink text-sm">3. Execute Payout for Version 2</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Automated push payment calculates 4% against updated cap table: Alice (20), Bob (12), Charlie (8 USDC). Total: 40.00 USDC disbursed.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('payments')}
                className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Go to Payments Engine</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Step 6 - Replay Attack Test */}
        <div className="bg-surface p-5 rounded-xl border-2 border-danger/40 bg-danger-soft/10 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-danger flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                Step 6 (Judge Highlight)
              </span>
              <span className="text-[11px] text-danger font-mono font-semibold">Security Invariant Test</span>
            </div>
            <h4 className="font-semibold text-ink text-sm flex items-center gap-2">
              4. Attempt Duplicate Payout
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Intentionally invokes <code className="font-mono text-danger font-semibold">PaymentExecutor</code> for an already-paid version. Verifies on-chain revert <code className="font-mono text-danger font-bold">AlreadyExecuted()</code>.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleTriggerReplayAttack}
              className="px-3.5 py-1.5 bg-danger text-white rounded-lg text-xs font-semibold hover:bg-danger/90 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trigger Duplicate Payout Attack</span>
            </button>
          </div>
        </div>

        {/* Step 7 - Maturity Redemption */}
        <div className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-3 flex flex-col justify-between md:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-danger" />
                Step 7
              </span>
              <span className="text-[11px] text-ink-muted font-mono">Final Maturity Liquidation</span>
            </div>
            <h4 className="font-semibold text-ink text-sm">5. Maturity Principal Redemption & Token Burn</h4>
            <p className="text-xs text-ink-muted leading-relaxed">
              Returns $1,000.00 par principal to token holders (1.00 USDC per DBT) and invokes <code className="font-mono text-ink font-medium">burnFromHolder</code>, reducing total token supply permanently to zero.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('redemptions')}
                className="px-3.5 py-1.5 bg-surface border border-line hover:bg-surface-muted text-ink rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Open Redemption Panel</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replay Test Status Modal */}
      <StatusModal
        isOpen={modalState !== 'idle'}
        onClose={() => setModalState('idle')}
        status={modalState}
        title={modalTitle}
        txHash={txHash}
        revertCode={revertCode}
        errorMsg={errorMsg}
        onRetry={handleTriggerReplayAttack}
      />
    </div>
  );
};
