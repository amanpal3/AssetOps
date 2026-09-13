import React from 'react';
import {
  LayoutDashboard,
  Coins,
  Users,
  FileText,
  CreditCard,
  Flame,
  History,
  PlayCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets', icon: Coins },
    { id: 'holders', label: 'Holder Registry', icon: Users },
    { id: 'actions', label: 'Corporate Actions', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'redemptions', label: 'Redemptions', icon: Flame },
    { id: 'audit', label: 'Audit History', icon: History },
    { id: 'demo', label: 'Demo Controls', icon: PlayCircle },
  ];

  return (
    <aside className="w-64 border-r border-line/80 bg-surface/70 backdrop-blur-xl min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between transition-all">
      <div className="flex flex-col gap-1.5">
        <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left relative group ${
                isActive
                  ? 'bg-primary-soft/80 text-primary shadow-xs border border-primary/20'
                  : 'text-ink-muted hover:bg-surface-muted/60 hover:text-ink hover:translate-x-0.5'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-ink-muted'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sync & Indexer Status Footer */}
      <div className="pt-4 border-t border-line/80">
        <div className="p-3.5 rounded-xl bg-surface/90 border border-line/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <div>
              <p className="text-xs font-bold text-ink leading-none">Indexer Synced</p>
              <p className="text-[10px] text-ink-muted mt-0.5 font-mono">Head: Block #194825</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-success-soft text-success border border-success/20">
            Live
          </span>
        </div>
      </div>
    </aside>
  );
};
