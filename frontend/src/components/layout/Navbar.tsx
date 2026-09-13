import React from 'react';
import { Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 border-b border-line bg-surface px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <div>
          <h1 className="font-semibold text-ink leading-tight">AssetOps</h1>
          <p className="text-xs text-ink-muted">Tokenized Asset Lifecycle Operations</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-soft text-success border border-success/20">
          <Activity className="w-3.5 h-3.5" />
          Sepolia / Hardhat
        </span>
        <button className="px-3.5 py-1.5 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};
