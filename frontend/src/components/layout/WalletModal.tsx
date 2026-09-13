import React from 'react';
import { X, Wallet, ArrowRight } from 'lucide-react';
import { useConnect } from 'wagmi';

export interface DemoPersona {
  name: string;
  role: string;
  address: `0x${string}`;
  balance: string;
  badge: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Issuer & Treasury',
    role: 'Deployer, Admin & PaymentExecutor Admin',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: '100,000 mUSDC',
    badge: 'Admin / Issuer'
  },
  {
    name: 'Alice',
    role: 'Anchor Institutional Investor (50% Cap Table)',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    balance: '500.00 DBT',
    badge: 'Whitelisted'
  },
  {
    name: 'Bob',
    role: 'Primary Account (Transferred 200 to Charlie)',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    balance: '300.00 DBT',
    badge: 'Whitelisted'
  },
  {
    name: 'Charlie',
    role: 'Secondary Market Transferee (Received 200 DBT)',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    balance: '200.00 DBT',
    badge: 'Whitelisted'
  }
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: DemoPersona) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSelectPersona
}) => {
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  const handleInjectedConnect = () => {
    const injected = connectors.find((c) => c.id === 'injected') || connectors[0];
    if (injected) {
      connect({ connector: injected });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
      <div className="bg-surface border border-line rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Connect Wallet</h3>
              <p className="text-xs text-ink-muted">Choose a Web3 provider or 1-click demo persona</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Browser Web3 Extension */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
            Web3 Browser Extension
          </span>
          <button
            onClick={handleInjectedConnect}
            className="w-full p-3.5 rounded-xl border border-line hover:border-primary/50 bg-surface-muted/50 hover:bg-primary-soft/20 text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
                🦊
              </div>
              <div>
                <span className="font-semibold text-ink text-xs block group-hover:text-primary transition-colors">
                  Injected Web3 Wallet
                </span>
                <span className="text-[11px] text-ink-muted">
                  MetaMask, Rabby, Coinbase Wallet, or Brave
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Section 2: 1-Click Institutional Personas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              1-Click Institutional Demo Personas
            </span>
            <span className="text-[10px] text-primary font-mono font-semibold bg-primary-soft px-2 py-0.5 rounded">
              Judge Friendly
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {DEMO_PERSONAS.map((persona) => (
              <button
                key={persona.address}
                onClick={() => {
                  onSelectPersona(persona);
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-line hover:border-primary/40 bg-surface hover:bg-surface-muted/60 text-left flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {persona.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-xs truncate group-hover:text-primary transition-colors">
                        {persona.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-muted border border-line text-ink-muted font-mono shrink-0">
                        {persona.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-muted truncate block">
                      {persona.role}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-mono font-bold text-ink block">
                    {persona.balance}
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono">
                    {persona.address.slice(0, 6)}...{persona.address.slice(-4)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Hint */}
        <div className="p-3 bg-surface-muted/60 border border-line rounded-xl text-[11px] text-ink-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span>Target: <strong>Local Hardhat</strong> (#31337) or <strong>Sepolia</strong> (#11155111)</span>
          </div>
          <span className="font-mono text-[10px]">127.0.0.1:8545</span>
        </div>
      </div>
    </div>
  );
};
