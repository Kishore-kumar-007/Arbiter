import React, { useEffect, useState } from 'react';
import type { AppState, SimulationModification, SimulationResult, Strategy } from '../types/domain';
import { api } from '../services/api';
import { decisionStore } from '../services/decisionStore';
import { ModificationBuilder } from '../components/simulation/ModificationBuilder';
import { ModificationList } from '../components/simulation/ModificationList';
import { SimulationResultPanel } from '../components/simulation/SimulationResultPanel';

export const Simulation: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Simulation Context
  const [activeScenario, setActiveScenario] = useState<string>('LIVE FEED');
  const [captureTime, setCaptureTime] = useState<string>('');
  
  // Modifications State
  const [modifications, setModifications] = useState<SimulationModification[]>([]);
  
  // Strategy Integration
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  
  // Simulation Execution
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const [stateData, scenariosData] = await Promise.all([
          api.getState(),
          api.getScenarios()
        ]);
        
        setState(stateData);
        setCaptureTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
        
        const stateZoneIds = Object.keys(stateData.zones).sort().join(',');
        const match = scenariosData.find(s => Object.keys(s.initial_state.zones).sort().join(',') === stateZoneIds);
        if (match) setActiveScenario(match.name);
        
        // Load pending strategies from decision store as candidates
        const pendingDecisions = decisionStore.getDecisions().filter(d => d.status === 'PENDING');
        const strats: Strategy[] = [];
        pendingDecisions.forEach(d => {
          strats.push(d.strategy);
          strats.push(...d.candidate_strategies.filter(c => c.id !== d.strategy.id));
        });
        
        // Ensure unique strategies
        const unique = Array.from(new Map(strats.map(item => [item.id, item])).values());
        setAvailableStrategies(unique);
        
      } catch (err) {
        console.error('Failed to sync simulation state', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContext();
  }, []);

  const handleAddModification = (mod: SimulationModification) => {
    setModifications(prev => [...prev, mod]);
    setResult(null); // Clear previous result when modifications change
  };

  const handleRemoveModification = (index: number) => {
    setModifications(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleClear = () => {
    setModifications([]);
    setSelectedStrategyId(null);
    setResult(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setResult(null);
    
    let actions: any[] = [];
    if (selectedStrategyId) {
      const s = availableStrategies.find(s => s.id === selectedStrategyId);
      if (s) actions = s.actions;
    }
    
    try {
      const res = await api.simulateScenario({
        modifications,
        strategy_actions: actions
      });
      setResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading || !state) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>INITIALIZING SIMULATION LAB...</div>;
  }

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: MODIFICATION BUILDER */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
        
        {/* HEADER */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px' }}>COUNTERFACTUAL SIMULATION</h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>SCENARIO ANALYSIS & PROJECTED CONSEQUENCES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>CURRENT SCENARIO: <strong style={{ color: 'var(--text-main)' }}>{activeScenario}</strong></span>
            <span>SYSTEM STATUS: <strong style={{ color: 'var(--success)' }}>OPERATIONAL</strong></span>
            <span>BASELINE CAPTURE: <strong className="mono" style={{ color: 'var(--text-main)' }}>{captureTime}</strong></span>
          </div>
        </div>
        
        {/* BUILDER AREA */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', flex: 1 }}>
          
          <ModificationBuilder state={state} onAddModification={handleAddModification} />

          {/* STRATEGY SELECTION */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>DECISION ACTIONS (OPTIONAL)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select a candidate strategy from the active session to simulate its deterministic outcome.</div>
            
            <select 
              className="mono" 
              value={selectedStrategyId || ''} 
              onChange={e => { setSelectedStrategyId(e.target.value || null); setResult(null); }}
              style={{ padding: '0.4rem', background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
            >
              <option value="">-- NO STRATEGY APPLIED --</option>
              {availableStrategies.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          
          <ModificationList 
            modifications={modifications} 
            onRemove={handleRemoveModification} 
            onClear={handleClear} 
            onRun={handleRunSimulation} 
            isSimulating={isSimulating} 
          />

        </div>
      </div>

      {/* RIGHT COLUMN: SIMULATION OUTPUT */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
        
        {!result && !isSimulating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '1rem' }}>
            <div style={{ fontSize: '2rem', color: 'var(--accent)', opacity: 0.5 }}>⏣</div>
            <div style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>READY</div>
            <div style={{ fontSize: '0.85rem' }}>BASELINE STATE CAPTURED</div>
            <div className="mono" style={{ fontSize: '0.85rem' }}>MODIFICATIONS: {modifications.length}</div>
          </div>
        )}

        {isSimulating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <div className="blink" style={{ fontSize: '1.2rem', color: 'var(--accent)', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>SIMULATING COUNTERFACTUAL...</div>
            <div className="metric-bar" style={{ width: '40%' }}>
              <div className="metric-fill" style={{ width: '100%', background: 'var(--accent)', animation: 'blink 1s infinite' }}></div>
            </div>
          </div>
        )}

        {result && !isSimulating && (
          <SimulationResultPanel result={result} onReset={() => setResult(null)} />
        )}
      </div>
    </div>
  );
};
