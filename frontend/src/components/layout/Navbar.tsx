import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { ShieldCheck, Wallet, AlertCircle, LogOut, Copy, Check } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);

  const isSupportedChain = chainId === 31337 || chainId === 11155111;
  const chainName = chainId === 11155111 ? 'Sepolia' : chainId === 31337 ? 'Hardhat' : 'Unsupported';

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-line/80 bg-surface/85 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Brand Identity with Antigravity Glow */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary/20 border border-white/20">
          A
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-ink leading-tight tracking-tight text-base">AssetOps</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">
              v0.1.0 • Live
            </span>
          </div>
          <p className="text-[11px] text-ink-muted hidden sm:block">Operations Layer for Tokenized Assets</p>
        </div>
      </div>

      {/* Network & Wallet Controls */}
      <div className="flex items-center gap-3">
        {/* Network Beacon Indicator */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border shadow-xs transition-colors ${
            isSupportedChain
              ? 'bg-success-soft/70 text-success border-success/30'
              : 'bg-danger-soft/70 text-danger border-danger/30'
          }`}
        >
          {isSupportedChain ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span className="font-medium text-[11px]">{chainName}</span>
        </div>

        {/* Wallet Connection State */}
        {isConnected && address ? (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-surface-muted/80 border border-line rounded-xl flex items-center gap-2 text-xs font-medium font-mono text-ink shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>{truncateAddress(address)}</span>
              <button
                onClick={() => handleCopy(address)}
                className="text-ink-muted hover:text-ink transition-colors ml-0.5"
                title="Copy address"
              >
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <button
              onClick={() => disconnect()}
              title="Disconnect Wallet"
              className="p-2 text-ink-muted hover:text-danger hover:bg-danger-soft/60 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const injected = connectors.find((c) => c.id === 'injected') || connectors[0];
              if (injected) connect({ connector: injected });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};
