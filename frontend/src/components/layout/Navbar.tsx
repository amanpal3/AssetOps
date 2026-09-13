import React, { useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { ShieldCheck, Wallet, AlertCircle, LogOut, Copy, Check, ChevronDown } from 'lucide-react';
import { WalletModal, DemoPersona } from './WalletModal.js';

export const Navbar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona | null>(null);

  const activeAddress = selectedPersona ? selectedPersona.address : address;
  const isUserConnected = Boolean(selectedPersona) || (isConnected && Boolean(address));

  const isSupportedChain = chainId === 31337 || chainId === 11155111 || Boolean(selectedPersona);
  const chainName = chainId === 11155111 ? 'Sepolia' : 'Hardhat';

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    setSelectedPersona(null);
    disconnect();
  };

  return (
    <>
      <header className="h-16 border-b border-line/80 bg-surface/85 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-primary/20 border border-white/20">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-ink leading-tight tracking-tight text-lg sm:text-xl">AssetOps</h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-muted text-ink border border-line">
                Institutional RWA Layer
              </span>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">
                v0.1.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted hidden sm:block">
              Operations Layer for Tokenized Assets • <span className="font-medium text-ink">Aman Pal, Om Upadhyay, Armaan Dwivedi</span>
            </p>
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
          {isUserConnected && activeAddress ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-surface-muted/80 border border-line rounded-xl flex items-center gap-2 text-xs font-medium text-ink shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                {selectedPersona && (
                  <span className="font-semibold text-primary text-[11px] max-w-[80px] sm:max-w-none truncate">
                    {selectedPersona.name}
                  </span>
                )}
                <span className="font-mono text-ink-muted">{truncateAddress(activeAddress)}</span>
                <button
                  onClick={() => handleCopy(activeAddress)}
                  className="text-ink-muted hover:text-ink transition-colors ml-0.5"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <button
                onClick={() => setIsWalletModalOpen(true)}
                title="Switch Account"
                className="px-2.5 py-1.5 border border-line hover:bg-surface-muted rounded-xl text-xs font-medium text-ink-muted hover:text-ink transition-colors hidden sm:flex items-center gap-1"
              >
                <span>Switch</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <button
                onClick={handleDisconnect}
                title="Disconnect Wallet"
                className="p-2 text-ink-muted hover:text-danger hover:bg-danger-soft/60 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </header>

      {/* Connect Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectPersona={(persona) => setSelectedPersona(persona)}
      />
    </>
  );
};
