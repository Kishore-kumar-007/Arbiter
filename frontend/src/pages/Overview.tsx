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
  
  // Scenario state
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('s1');

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

  const fetchState = async () => {
    const stateData = await api.getState();
    setState(stateData);
  };

  useEffect(() => {
    // Initial fetch
    Promise.all([api.getState(), api.getAuditTrail(), api.getScenarios()]).then(([stateData, auditData, scenariosData]) => {
      setState(stateData);
      setTrail(auditData.reverse()); // Latest first
      setScenarios(scenariosData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleScenarioChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedScenarioId(newId);
    setLoading(true);
    
    try {
      await api.loadScenario(newId);
      await fetchState();
      setStrategies([]); // Clear old strategies for the new scenario
      setSelectedStrategyId(null);
      addEvent('Scenario Loaded', `Switched to scenario: ${newId}`);
    } catch (err) {
      console.error("Failed to load scenario", err);
    }
    
    setLoading(false);
  };

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
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '-0.25rem' }}>
        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: '0.5rem', fontWeight: 600 }}>Active Scenario:</label>
        <select 
          value={selectedScenarioId} 
          onChange={handleScenarioChange}
          style={{ 
            background: 'var(--bg-panel)', 
            color: 'var(--text-main)', 
            border: '1px solid var(--border)',
            padding: '0.25rem 0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
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
