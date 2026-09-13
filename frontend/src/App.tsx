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
import { DemoControls } from './pages/DemoControls.js';
import { ActionDetails } from './pages/ActionDetails.js';
import { Footer } from './components/layout/Footer.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-canvas ambient-mesh flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {activeTab === 'overview' && <Overview onNavigate={setActiveTab} />}
            {activeTab === 'assets' && <Assets onNavigate={setActiveTab} />}
            {activeTab === 'holders' && <Holders onNavigate={setActiveTab} />}
            {activeTab === 'actions' && <CorporateActions onNavigate={setActiveTab} />}
            {activeTab === 'action-details' && (
              <ActionDetails
                onBack={() => setActiveTab('actions')}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'payments' && <Payments onNavigate={setActiveTab} />}
            {activeTab === 'redemptions' && <Redemptions onNavigate={setActiveTab} />}
            {activeTab === 'audit' && <AuditHistory onNavigate={setActiveTab} />}
            {activeTab === 'demo' && <DemoControls onNavigate={setActiveTab} />}
          </div>
          <Footer onNavigate={setActiveTab} />
        </main>
      </div>
    </div>
  );
};

export default App;
