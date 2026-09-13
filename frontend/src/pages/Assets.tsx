import React from 'react';
import {
  ShieldCheck,
  DollarSign,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../lib/contracts.js';
import { getExplorerUrl } from '../lib/explorer.js';

interface AssetsProps {
  onNavigate?: (tab: string) => void;
}

export const Assets: React.FC<AssetsProps> = ({ onNavigate }) => {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-primary-soft text-primary">
              Asset Master Record
            </span>
            <span className="text-xs font-mono text-ink-muted">ERC-1404 Restricted</span>
          </div>
          <h2 className="text-2xl font-bold text-ink mt-1">Tokenized Asset Parameters</h2>
          <p className="text-sm text-ink-muted">
            Institutional terms, compliance rules, and smart contract bindings for Digital Bond Token (DBT).
          </p>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('holders')}
              className="px-3.5 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-muted text-xs font-medium text-ink transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>View Holder Cap Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Asset Overview Banner */}
      <div className="bg-surface rounded-xl border border-line p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold text-2xl shadow-sm border border-primary/20">
            DBT
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-ink">Digital Bond Token</h3>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success-soft text-success border border-success/30">
                Active & Serviced
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              ISIN: <strong className="font-mono text-ink font-medium">US0492817291</strong> • CUSIP: <strong className="font-mono text-ink font-medium">049281729</strong> • Standard: <strong className="font-mono text-ink font-medium">ERC-1404</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-xs font-medium text-ink-muted uppercase">Total Supply</span>
            <div className="text-xl font-bold font-mono text-ink mt-0.5">1,000.00 DBT</div>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-muted uppercase">Maturity Date</span>
            <div className="text-xl font-bold font-mono text-ink mt-0.5">2027-09-15</div>
          </div>
        </div>
      </div>

      {/* Grid: Financial Terms & Compliance Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial & Economic Specification */}
        <div className="bg-surface rounded-xl border border-line p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-ink text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Financial & Issuance Parameters
          </h4>

          <div className="divide-y divide-line text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Asset Class</span>
              <span className="font-semibold text-ink">Fixed-Income Commercial Debt</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Nominal Par Value</span>
              <span className="font-mono font-semibold text-ink">1.00 USDC / DBT</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Active Annual Coupon</span>
              <span className="font-mono font-semibold text-success">4.00% (400 bps)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Payment Frequency</span>
              <span className="font-semibold text-ink">Semi-Annual</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Settlement Currency</span>
              <span className="font-mono font-semibold text-ink">USDC (6 Decimals)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Redemption Mechanism</span>
              <span className="font-semibold text-ink">Authorized Token Burn (`burnFromHolder`)</span>
            </div>
          </div>
        </div>

        {/* Regulatory & Transfer Compliance */}
        <div className="bg-surface rounded-xl border border-line p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-ink text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            On-Chain Transfer Restrictions (ERC-1404)
          </h4>

          <div className="p-3 bg-surface-muted border border-line rounded-lg text-xs text-ink-muted leading-relaxed">
            All token transfers execute through <code className="font-mono text-ink font-semibold">detectTransferRestriction(from, to, value)</code>. Transfers between non-whitelisted addresses revert automatically on-chain.
          </div>

          <div className="divide-y divide-line text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Restriction Code 0</span>
              <span className="font-semibold text-success">SUCCESS (Compliant transfer)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Restriction Code 1</span>
              <span className="font-semibold text-danger">SENDER_NOT_WHITELISTED</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Restriction Code 2</span>
              <span className="font-semibold text-danger">RECEIVER_NOT_WHITELISTED</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-ink-muted">Active Allowlist Status</span>
              <span className="font-semibold text-success">3 Whitelisted Institutional Holders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Contract Infrastructure Table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-line">
          <h4 className="font-bold text-ink text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Protocol Smart Contract Bindings
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">
            Deployed contracts governing the AssetOps on-chain operations layer.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted/60 text-ink-muted uppercase font-semibold border-b border-line">
              <tr>
                <th className="px-5 py-3">Contract Role</th>
                <th className="px-5 py-3">Contract Address</th>
                <th className="px-5 py-3">Solidity Standard</th>
                <th className="px-5 py-3 text-center">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-surface-muted/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-ink">
                  Security Token (`SecurityToken.sol`)
                </td>
                <td className="px-5 py-3.5 font-mono text-ink font-semibold">
                  {CONTRACT_ADDRESSES.securityToken}
                </td>
                <td className="px-5 py-3.5 text-ink-muted font-mono">ERC-1404 / OpenZeppelin v5</td>
                <td className="px-5 py-3.5 text-center">
                  <a
                    href={getExplorerUrl(CONTRACT_ADDRESSES.securityToken, 'address')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Sepolia <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>

              <tr className="hover:bg-surface-muted/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-ink">
                  Corporate Action Registry (`CorporateActionRegistry.sol`)
                </td>
                <td className="px-5 py-3.5 font-mono text-ink font-semibold">
                  {CONTRACT_ADDRESSES.corporateActionRegistry}
                </td>
                <td className="px-5 py-3.5 text-ink-muted font-mono">Append-Only Version DAG</td>
                <td className="px-5 py-3.5 text-center">
                  <a
                    href={getExplorerUrl(CONTRACT_ADDRESSES.corporateActionRegistry, 'address')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Sepolia <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>

              <tr className="hover:bg-surface-muted/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-ink">
                  Payment Executor (`PaymentExecutor.sol`)
                </td>
                <td className="px-5 py-3.5 font-mono text-ink font-semibold">
                  {CONTRACT_ADDRESSES.paymentExecutor}
                </td>
                <td className="px-5 py-3.5 text-ink-muted font-mono">Idempotent Push Disburser</td>
                <td className="px-5 py-3.5 text-center">
                  <a
                    href={getExplorerUrl(CONTRACT_ADDRESSES.paymentExecutor, 'address')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Sepolia <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>

              <tr className="hover:bg-surface-muted/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-ink">
                  Payment Currency (`PaymentCurrency.sol`)
                </td>
                <td className="px-5 py-3.5 font-mono text-ink font-semibold">
                  {CONTRACT_ADDRESSES.paymentCurrency}
                </td>
                <td className="px-5 py-3.5 text-ink-muted font-mono">ERC-20 Mock USDC</td>
                <td className="px-5 py-3.5 text-center">
                  <a
                    href={getExplorerUrl(CONTRACT_ADDRESSES.paymentCurrency, 'address')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Sepolia <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
