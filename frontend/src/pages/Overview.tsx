import React, { useEffect, useState, useRef } from 'react';
import type { AppState, Strategy, AuditRecord } from '../types/domain';
import { api } from '../services/api';

import { SituationStrip } from '../components/telemetry/SituationStrip';
import { IncidentFeed } from '../components/incidents/IncidentFeed';
import { CampusMap } from '../components/map/CampusMap';
import { DecisionPanel } from '../components/decisions/DecisionPanel';
import { BottomActivityArea } from '../components/audit/BottomActivityArea';

interface Props {
  onTabChange?: (tab: string) => void;
}

export const Overview: React.FC<Props> = ({ onTabChange }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lifted state
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [trail, setTrail] = useState<AuditRecord[]>([]);

  // We use a ref for trail to avoid dependency cycles in addEvent if we pass it deeply
  const trailRef = useRef(trail);
  useEffect(() => { trailRef.current = trail; }, [trail]);

  const addEvent = (event: string, details: string) => {
    const newRecord: AuditRecord = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      event,
      details
    };
    setTrail([newRecord, ...trailRef.current]);
  };

  useEffect(() => {
    // Initial fetch
    Promise.all([api.getState(), api.getAuditTrail()]).then(([stateData, auditData]) => {
      setState(stateData);
      setTrail(auditData.reverse()); // Latest first
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    addEvent('Situation Analysis Initiated', 'Operator triggered AI strategy generation');
    try {
      const data = await api.generateStrategies();
      setStrategies(data);
      if (data.length > 0) {
        setSelectedStrategyId(data[0].id);
        addEvent('Analysis Complete', `Generated ${data.length} candidate strategies`);
      }
    } catch (err) {
      console.error(err);
      addEvent('Analysis Failed', 'Error communicating with generation service');
    }
  };

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId) || null;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>INITIALIZING TELEMETRY...</div>;
  }

  return (
    <div className="overview-workspace">
      <SituationStrip state={state} />
      <IncidentFeed state={state} onTabChange={onTabChange} />
      <CampusMap state={state} selectedStrategy={selectedStrategy} />
      <DecisionPanel 
        strategies={strategies}
        setStrategies={setStrategies}
        selectedStrategyId={selectedStrategyId}
        onSelectStrategy={setSelectedStrategyId}
        onGenerate={handleGenerate} 
        addEvent={addEvent}
      />
      <BottomActivityArea trail={trail} />
    </div>
  );
};
