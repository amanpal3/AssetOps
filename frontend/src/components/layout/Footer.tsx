import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  Terminal,
  Code2,
  Heart
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../lib/contracts.js';
import { getExplorerUrl } from '../../lib/explorer.js';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const handleNav = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-16 border-t border-line/80 bg-surface/90 backdrop-blur-xl transition-all">
      {/* Top Banner / Mission Statement */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-b border-line/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                A
              </div>
              <span className="text-base font-extrabold text-ink tracking-tight">AssetOps</span>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary-soft text-primary rounded-md border border-primary/20">
                Institutional RWA Layer
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight leading-tight">
              The Autonomous Operations Layer for Tokenized Real-World Assets
            </h2>
            <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
              Engineered by <strong className="text-ink font-semibold">Aman Pal</strong>, <strong className="text-ink font-semibold">Om Upadhyay</strong>, and <strong className="text-ink font-semibold">Armaan Dwivedi</strong>.
              Deterministic corporate actions, cryptographic append-only state lineage, and atomic on-chain settlement.
            </p>
          </div>

          {/* System Status & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-line shadow-xs">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-ink leading-tight">All Systems Operational</p>
                <p className="text-xs text-ink-muted font-mono leading-tight">Hardhat #8545 • Sepolia Testnet</p>
              </div>
            </div>

            <button
              onClick={() => handleNav('demo')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span>Launch Interactive Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 4-Column Directory */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Platform Navigation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <Layers className="w-4 h-4 text-primary" />
              <span>Platform</span>
            </div>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li>
                <button
                  onClick={() => handleNav('overview')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Operations Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('holders')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Holder Registry & Cap Table
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('actions')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Corporate Actions (DAG)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('payments')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Payment Execution & Settlement
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('redemptions')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Principal Redemption & Burn
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('audit')}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  On-Chain Audit Timeline
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture & Contracts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <Terminal className="w-4 h-4 text-success" />
              <span>Smart Contracts</span>
            </div>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li>
                <a
                  href={getExplorerUrl(CONTRACT_ADDRESSES.securityToken, 'address')}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>SecurityToken (DBT)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                </a>
              </li>
              <li>
                <a
                  href={getExplorerUrl(CONTRACT_ADDRESSES.corporateActionRegistry, 'address')}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>ActionRegistry (Append-Only)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                </a>
              </li>
              <li>
                <a
                  href={getExplorerUrl(CONTRACT_ADDRESSES.paymentExecutor, 'address')}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>PaymentExecutor</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                </a>
              </li>
              <li>
                <a
                  href={getExplorerUrl(CONTRACT_ADDRESSES.paymentCurrency, 'address')}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <span>PaymentCurrency (mUSDC)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted" />
                </a>
              </li>
              <li>
                <span className="text-xs font-mono text-ink-muted bg-surface-muted px-2 py-1 rounded">
                  Solidity ^0.8.24 • OpenZeppelin v5
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Invariants & Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <ShieldCheck className="w-4 h-4 text-warning" />
              <span>Security Invariants</span>
            </div>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>ERC-1404 Transfer Compliance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Strict Append-Only Versioning</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Idempotent Execution Guard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Authorized Token Burn to 0</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Sentry Distributed Monitoring</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Core Engineering Team */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <Cpu className="w-4 h-4 text-primary" />
              <span>Engineering Team</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-2.5 rounded-lg bg-surface border border-line shadow-2xs">
                <p className="font-bold text-ink">Aman Pal</p>
                <p className="text-xs text-ink-muted">Smart Contracts Lead & Architecture</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-line shadow-2xs">
                <p className="font-bold text-ink">Om Upadhyay</p>
                <p className="text-xs text-ink-muted">Protocol & Backend Indexer Lead</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-line shadow-2xs">
                <p className="font-bold text-ink">Armaan Dwivedi</p>
                <p className="text-xs text-ink-muted">Product & Frontend Web3 Lead</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-line/60 bg-surface-muted/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-ink text-surface flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span>
              © {currentYear} <strong className="text-ink font-semibold">AssetOps</strong> • Developed by <strong className="text-ink font-semibold">Aman Pal</strong>, <strong className="text-ink font-semibold">Om Upadhyay</strong>, and <strong className="text-ink font-semibold">Armaan Dwivedi</strong>.
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5">
              Built with <Heart className="w-3.5 h-3.5 text-danger fill-danger" /> by Team AssetOps
            </span>
            <span className="text-line">•</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-line">
              MIT License
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
