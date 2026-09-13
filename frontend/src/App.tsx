import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Overview } from './pages/Overview.js';
import { Assets } from './pages/Assets.js';
import { Holders } from './pages/Holders.js';
import { CorporateActions } from './pages/CorporateActions.js';
import { Payments } from './pages/Payments.js';
import { Redemptions } from './pages/Redemptions.js';
import { AuditHistory } from './pages/AuditHistory.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 bg-canvas">
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'assets' && <Assets />}
          {activeTab === 'holders' && <Holders />}
          {activeTab === 'actions' && <CorporateActions />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'redemptions' && <Redemptions />}
          {activeTab === 'audit' && <AuditHistory />}
        </main>
      </div>
    </div>
  );
};

export default App;
