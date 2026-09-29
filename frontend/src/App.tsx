import { useState } from 'react';
import './index.css';
import { TopCommandBar } from './components/layout/TopCommandBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { Overview } from './pages/Overview';
import { Incidents } from './pages/Incidents';
import { Resources } from './pages/Resources';
import { Decisions } from './pages/Decisions';
import { Simulation } from './pages/Simulation';
import { AuditTrail } from './pages/AuditTrail';

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return <Overview onTabChange={setActiveTab} />;
      case 'Incidents': return <Incidents />;
      case 'Resources': return <Resources />;
      case 'Decisions': return <Decisions onTabChange={setActiveTab} />;
      case 'Simulation': return <Simulation />;
      case 'Audit Trail': return <AuditTrail />;
      default: return <Overview />;
    }
  };

  return (
    <div className="app-container">
      <TopCommandBar />
      <div className="main-body">
        <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
