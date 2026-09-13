import React from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Wallet,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { getExplorerUrl } from '../../lib/explorer.js';

export type TxState = 'idle' | 'prompt' | 'pending' | 'confirmed' | 'error';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TxState;
  title?: string;
  txHash?: string;
  blockNumber?: number | string;
  errorMsg?: string;
  revertCode?: string;
  onRetry?: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  status,
  title = 'Transaction Execution',
  txHash,
  blockNumber,
  errorMsg,
  revertCode,
  onRetry,
}) => {
  if (!isOpen || status === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-line shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-bold text-ink text-base">{title}</h3>
          <button
            onClick={onClose}
            disabled={status === 'pending' || status === 'prompt'}
            className="p-1 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: Wallet Prompt */}
        {status === 'prompt' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center animate-pulse">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-ink text-lg">Signature Requested</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                Please check your connected Web3 wallet and confirm the on-chain transaction.
              </p>
            </div>
            <div className="p-3 bg-surface-muted border border-line rounded-lg text-[11px] font-mono text-ink-muted text-left">
              Method: <strong className="text-ink">PaymentExecutor.executeAction()</strong>
            </div>
          </div>
        )}

        {/* State 2: Mining Pending */}
        {status === 'pending' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-ink text-lg">Broadcasting to Network</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                Transaction submitted to mempool. Waiting for validator block inclusion and finality.
              </p>
            </div>
            {txHash && (
              <div className="p-3 bg-surface-muted border border-line rounded-lg text-left space-y-1">
                <span className="text-[10px] text-ink-muted uppercase font-semibold">Transaction Hash</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink truncate max-w-[260px]">{txHash}</span>
                  <a
                    href={getExplorerUrl(txHash, 'tx')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-xs shrink-0"
                  >
                    Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State 3: Confirmed Success */}
        {status === 'confirmed' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success-soft text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-ink text-lg">Transaction Confirmed</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                State transition permanently finalized on the blockchain ledger.
              </p>
            </div>

            <div className="p-3.5 bg-success-soft/30 border border-success/30 rounded-lg text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Execution Status:</span>
                <span className="font-semibold text-success">SETTLED (Receipt Confirmed)</span>
              </div>
              {blockNumber && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Included in Block:</span>
                  <span className="font-mono font-semibold text-ink">#{blockNumber}</span>
                </div>
              )}
              {txHash && (
                <div className="flex justify-between items-center pt-1 border-t border-line/60">
                  <span className="text-ink-muted">Tx Hash:</span>
                  <a
                    href={getExplorerUrl(txHash, 'tx')}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 bg-ink hover:bg-ink/90 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

        {/* State 4: Error / Reverted */}
        {status === 'error' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-danger-soft text-danger mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-ink text-lg">
                {revertCode === 'AlreadyExecuted' ? 'Protocol Guard Reverted Call' : 'Transaction Failed'}
              </h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                {revertCode === 'AlreadyExecuted'
                  ? 'Duplicate payment replay attack halted by smart contract invariant.'
                  : 'The transaction was rejected or encountered an execution failure.'}
              </p>
            </div>

            {/* Decoded Revert Box */}
            <div className="p-3.5 bg-danger-soft/40 border border-danger/40 rounded-lg text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink font-semibold uppercase text-[10px]">Decoded Revert Reason:</span>
                <span className="font-mono font-bold text-danger bg-danger-soft px-2 py-0.5 rounded border border-danger/30">
                  {revertCode || 'ExecutionReverted'}
                </span>
              </div>
              <p className="text-ink text-xs font-mono break-words leading-relaxed">
                {errorMsg || 'Revert: Corporate action version was already executed and sealed.'}
              </p>
              {txHash && (
                <div className="pt-2 border-t border-danger/20 flex justify-between items-center text-[11px]">
                  <span className="text-ink-muted">On-Chain Evidence:</span>
                  <a
                    href={getExplorerUrl(txHash, 'tx')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-danger hover:underline flex items-center gap-1 font-mono font-semibold"
                  >
                    View Reverted Tx <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-surface border border-line hover:bg-surface-muted text-ink rounded-lg text-xs font-medium transition-colors"
              >
                Dismiss
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
