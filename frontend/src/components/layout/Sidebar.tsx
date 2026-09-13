import React from 'react';
import { LayoutDashboard, Users, FileText, CreditCard, Flame, History, PlayCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'holders', label: 'Holder Registry', icon: Users },
    { id: 'actions', label: 'Corporate Actions', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'redemptions', label: 'Redemptions', icon: Flame },
    { id: 'audit', label: 'Audit History', icon: History },
    { id: 'demo', label: 'Demo Controls', icon: PlayCircle },
  ];

  return (
    <aside className="w-64 border-r border-line bg-surface min-h-[calc(100vh-4rem)] p-4 flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary-soft text-primary font-semibold'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-ink-muted'}`} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
};
