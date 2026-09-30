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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>
        <div className="blink mono" style={{ fontSize: '1.25rem', color: 'var(--accent)', letterSpacing: '2px' }}>INITIALIZING SIMULATION LAB...</div>
      </div>
    );
  }

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: MODIFICATION BUILDER */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
        
        {/* HEADER */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel-light)' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--accent)' }}>⏣</span> COUNTERFACTUAL
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '1px' }}>SCENARIO ANALYSIS & PROJECTED CONSEQUENCES</div>
          
          <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CURRENT SCENARIO:</span>
              <strong style={{ color: 'var(--text-main)', letterSpacing: '1px' }}>{activeScenario.toUpperCase()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SYSTEM STATUS:</span>
              <strong style={{ color: 'var(--success)', letterSpacing: '1px' }}>OPERATIONAL</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BASELINE CAPTURE:</span>
              <strong className="mono" style={{ color: 'var(--text-main)', letterSpacing: '1px' }}>{captureTime}</strong>
            </div>
          </div>
        </div>
        
        {/* BUILDER AREA */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', flex: 1, background: 'var(--bg-panel)' }}>
          
          <ModificationBuilder state={state} onAddModification={handleAddModification} />

          {/* STRATEGY SELECTION */}
          <div className="panel-nested" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>DECISION ACTIONS (OPTIONAL)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Select a candidate strategy from the active session to simulate its deterministic outcome.</div>
            
            <select 
              className="mono" 
              value={selectedStrategyId || ''} 
              onChange={e => { setSelectedStrategyId(e.target.value || null); setResult(null); }}
              style={{ 
                padding: '0.5rem', 
                background: 'var(--bg-base)', 
                color: 'var(--text-main)', 
                border: '1px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer'
              }}
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '1rem', background: 'var(--bg-base)' }}>
            <div style={{ fontSize: '4rem', color: 'var(--accent)', opacity: 0.15, textShadow: '0 0 20px rgba(0,229,255,0.2)' }}>⏣</div>
            <div style={{ fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 700, color: 'var(--text-main)' }}>READY FOR SIMULATION</div>
            <div style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>BASELINE STATE CAPTURED</div>
            <div className="mono panel-nested" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginTop: '1rem', color: modifications.length > 0 ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${modifications.length > 0 ? 'var(--accent)' : 'var(--border)'}` }}>MODIFICATIONS LOADED: {modifications.length}</div>
          </div>
        )}

        {isSimulating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', background: 'var(--bg-base)' }}>
            <div className="blink" style={{ fontSize: '1.2rem', color: 'var(--accent)', letterSpacing: '2px', fontWeight: 700 }}>SIMULATING COUNTERFACTUAL...</div>
            <div style={{ width: '300px', height: '2px', background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', animation: 'radar-sweep 1.5s infinite linear' }}></div>
            </div>
            <style>{`
              @keyframes radar-sweep {
                0% { left: -100%; }
                100% { left: 100%; }
              }
            `}</style>
          </div>
        )}

        {result && !isSimulating && (
          <SimulationResultPanel result={result} onReset={() => setResult(null)} />
        )}
      </div>
    </div>
  );
};
