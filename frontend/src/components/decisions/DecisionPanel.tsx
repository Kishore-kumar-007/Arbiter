import React, { useState } from 'react';
import type { Strategy } from '../../types/domain';
import { api } from '../../services/api';
import { decisionStore } from '../../services/decisionStore';

interface Props {
  strategies: Strategy[];
  setStrategies: React.Dispatch<React.SetStateAction<Strategy[]>>;
  selectedStrategyId: string | null;
  onSelectStrategy: (id: string) => void;
  onGenerate: () => Promise<Strategy[] | undefined>;
  addEvent: (event: string, details: string) => void;
  scenarioId?: string;
  scenarioName?: string;
}

type Mode = 'STANDBY' | 'ANALYZING' | 'REVIEW' | 'AUTHORIZING' | 'APPROVED' | 'REJECTING' | 'REJECTED' | 'MODIFYING' | 'SIMULATING_MOD';

export const DecisionPanel: React.FC<Props> = ({ strategies, setStrategies, selectedStrategyId, onSelectStrategy, onGenerate, addEvent, scenarioId = 'unknown', scenarioName = 'LIVE FEED' }) => {
  const [mode, setMode] = useState<Mode>('STANDBY');
  const [rejectReason, setRejectReason] = useState('');
  const [editableActions, setEditableActions] = useState<any[]>([]);
  const [currentDecisionId, setCurrentDecisionId] = useState<string | null>(null);

  const primary = strategies.find(s => s.id === selectedStrategyId) || null;
  const options = strategies.filter(s => s.id !== selectedStrategyId);

  const handleGenerateClick = async () => {
    setMode('ANALYZING');
    const generatedStrategies = await onGenerate();
    
    if (generatedStrategies && generatedStrategies.length > 0) {
      const p = generatedStrategies[0];
      const newDecision = decisionStore.addPendingDecision(scenarioId, scenarioName, p, generatedStrategies);
      setCurrentDecisionId(newDecision.id);
    }
    
    setMode('REVIEW');
  };

  const handleApprove = async () => {
    if (!primary) return;
    setMode('AUTHORIZING');
    addEvent('Authorizing Decision', `Approving strategy: ${primary.title}`);
    try {
      await api.submitDecision(primary.id, 'APPROVE');
      if (currentDecisionId) decisionStore.updateDecisionStatus(currentDecisionId, 'APPROVED', 'AUTHORIZE STRATEGY');
      setMode('APPROVED');
      addEvent('Decision Approved', `Strategy executed. System updating.`);
    } catch (e) {
      setMode('REVIEW');
    }
  };

  const handleRejectClick = () => {
    setMode('REJECTING');
    addEvent('Reject Workflow', 'Operator opened rejection modal');
  };

  const confirmReject = async () => {
    if (!primary) return;
    setMode('AUTHORIZING');
    addEvent('Submitting Rejection', `Reason: ${rejectReason}`);
    try {
      await api.submitDecision(primary.id, 'REJECT');
      if (currentDecisionId) decisionStore.updateDecisionStatus(currentDecisionId, 'REJECTED', 'REJECT STRATEGY', rejectReason);
      setMode('REJECTED');
      addEvent('Decision Rejected', 'System awaits new instruction');
    } catch (e) {
      setMode('REVIEW');
    }
  };

  const handleModifyClick = () => {
    if (primary) {
      setEditableActions([...primary.actions]);
    }
    setMode('MODIFYING');
    addEvent('Modify Workflow', 'Operator entering modification mode');
  };

  const simulateMod = async () => {
    setMode('SIMULATING_MOD');
    addEvent('Counterfactual Simulation', 'Simulating modified strategy consequences');
    try {
      const result = await api.simulateScenario({
        modifications: [],
        strategy_actions: editableActions
      });
      // Mock update to the current strategy based on deterministic result
      if (primary) {
        const updated = { 
          ...primary, 
          projected_risk: result.projected_risk, 
          estimated_response_time: result.projected_response_time,
          resource_consumption: result.projected_resource_usage,
          constraint_violations: result.constraint_violations,
          actions: editableActions 
        };
        setStrategies(strategies.map(s => s.id === primary.id ? updated : s));
        if (currentDecisionId) {
          decisionStore.updateDecisionStatus(currentDecisionId, 'MODIFIED', 'MODIFY STRATEGY', null, updated);
        }
      }
      setMode('REVIEW');
      addEvent('Simulation Complete', 'New deterministic metrics applied');
    } catch (e) {
      setMode('REVIEW');
    }
  };

  return (
    <div className="panel" style={{ gridColumn: '3', gridRow: '2 / span 2', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ borderBottomColor: (mode === 'APPROVED' || mode === 'REVIEW') ? 'rgba(16, 185, 129, 0.5)' : mode === 'REJECTED' ? 'rgba(239, 68, 68, 0.5)' : 'var(--border)' }}>
        <span>DECISION INTELLIGENCE</span>
        <span className="mono" style={{ color: mode === 'REVIEW' ? 'var(--success)' : 'var(--text-muted)' }}>
          {mode === 'ANALYZING' ? 'ANALYZING...' : mode === 'REVIEW' ? 'ANALYSIS COMPLETE' : mode}
        </span>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, overflow: 'hidden' }}>
        
        {/* Trigger Area (When Empty) */}
        {(mode === 'STANDBY' && strategies.length === 0) && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            <div style={{ opacity: 0.3 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', letterSpacing: '0.5px' }}>
              AWAITING OPERATOR TRIGGER<br/>
              <span style={{ fontSize: '0.7rem' }}>AI Situation Analysis Engine</span>
            </span>
            <button className="btn btn-accent" onClick={handleGenerateClick} style={{ width: '80%' }}>RUN AI ANALYSIS</button>
          </div>
        )}

        {(mode === 'ANALYZING' || mode === 'AUTHORIZING' || mode === 'SIMULATING_MOD') && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            <div className="blink mono" style={{ color: mode === 'AUTHORIZING' ? 'var(--success)' : 'var(--accent)', letterSpacing: '2px', fontSize: '0.85rem' }}>
              {mode === 'AUTHORIZING' ? 'PROCESSING DECISION...' : 'COMPUTING COUNTERFACTUALS...'}
            </div>
            <div className="metric-bar" style={{ width: '70%', background: 'rgba(255,255,255,0.05)' }}>
              <div className="metric-fill" style={{ width: '100%', background: mode === 'AUTHORIZING' ? 'var(--success)' : 'var(--accent)', animation: 'blink 1s infinite' }}></div>
            </div>
            <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {mode === 'AUTHORIZING' ? 'SYNCING WITH COMMAND' : 'EVALUATING 2,492 PERMUTATIONS'}
            </div>
          </div>
        )}

        {(mode === 'APPROVED' || mode === 'REJECTED') && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '50%', 
              background: mode === 'APPROVED' ? 'var(--success-dark)' : 'var(--hazard-dark)', 
              boxShadow: mode === 'APPROVED' ? '0 0 30px var(--success-glow)' : '0 0 30px var(--hazard-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: mode === 'APPROVED' ? 'var(--success)' : 'var(--hazard)', fontSize: '32px' 
            }}>
              {mode === 'APPROVED' ? '✓' : '✗'}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '1px' }}>{mode === 'APPROVED' ? 'STRATEGY EXECUTED' : 'STRATEGY REJECTED'}</h2>
            <button className="btn" onClick={() => setMode('STANDBY')} style={{ marginTop: '1rem' }}>RETURN TO STANDBY</button>
          </div>
        )}

        {/* Primary Recommendation */}
        {(mode === 'REVIEW' || mode === 'REJECTING' || mode === 'MODIFYING') && primary && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ 
              padding: '1.25rem', 
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)', 
              borderBottom: '1px solid var(--border)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1.5px' }}>PRIMARY RECOMMENDATION</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--accent-glow), transparent)' }}></div>
              </div>
              
              <h2 style={{ margin: '0.75rem 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '0.5px' }}>{primary.title}</h2>
              
              <div style={{ marginTop: '1.25rem' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>DETERMINISTIC METRICS</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  
                  <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projected Risk</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: primary.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>{primary.projected_risk}</span>
                      <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--success)' }}>↓2.4</span>
                    </div>
                  </div>
                  
                  <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Response Time</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>{primary.estimated_response_time}</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color:'var(--text-muted)' }}>min</span>
                    </div>
                  </div>
                  
                  <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resources Used</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>{primary.resource_consumption}</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color:'var(--text-muted)' }}>units</span>
                    </div>
                  </div>
                  
                  <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', borderColor: primary.constraint_violations.length > 0 ? 'var(--hazard)' : 'var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Constraint Status</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: primary.constraint_violations.length > 0 ? 'var(--hazard)' : 'var(--success)' }}>
                        {primary.constraint_violations.length === 0 ? 'PASS' : `${primary.constraint_violations.length} FAIL`}
                      </span>
                    </div>
                  </div>
                  
                </div>
              </div>

              {mode === 'REVIEW' && (
                <div style={{ marginTop: '1.25rem' }}>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>STRATEGY RATIONALE</span>
                  <ul style={{ margin: '0.75rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {primary.explanation.split('.').filter(e => e.trim().length > 0).slice(0, 3).map((pt, i) => (
                      <li key={i}>{pt.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Editing / Rejecting Interfaces */}
            {mode === 'REJECTING' && (
              <div style={{ padding: '1.25rem', background: 'var(--hazard-dark)', flex: 1 }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--hazard)', fontWeight: 700, letterSpacing: '1px' }}>REJECTION REASON REQUIRED</span>
                <textarea 
                  style={{ width: '100%', marginTop: '0.75rem', background: 'var(--bg-panel-nested)', color: 'var(--text-main)', border: '1px solid rgba(239,68,68,0.5)', padding: '0.75rem', borderRadius: 4, resize: 'none', height: '100px', fontSize: '0.85rem' }} 
                  placeholder="Enter operational reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                ></textarea>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button className="btn btn-reject" style={{ flex: 1, padding: '0.75rem' }} onClick={confirmReject}>CONFIRM REJECT</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setMode('REVIEW')}>CANCEL</button>
                </div>
              </div>
            )}

            {mode === 'MODIFYING' && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-panel-light)', flex: 1, overflowY: 'auto' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>EDIT STRATEGY ACTIONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {editableActions.map((act, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-panel-nested)', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <span className="badge" style={{ background: 'var(--border-light)' }}>{act.type}</span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>TGT: {act.target_id}</span>
                      {act.resource_id && <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>RES: {act.resource_id}</span>}
                      <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--hazard)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }} onClick={() => setEditableActions(editableActions.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                  ))}
                  <button 
                    className="btn" 
                    style={{ borderStyle: 'dashed', marginTop: '0.5rem' }} 
                    onClick={() => setEditableActions([...editableActions, { type: 'contain', target_id: 'z2', resource_id: null } as any])}
                  >
                    + ADD ACTION
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-accent" style={{ flex: 1 }} onClick={simulateMod}>SIMULATE</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setMode('REVIEW')}>CANCEL</button>
                </div>
              </div>
            )}

            {/* Alternatives */}
            {mode === 'REVIEW' && (
              <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>ALTERNATIVE OPTIONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {options.map((opt, i) => (
                    <div 
                      key={opt.id} 
                      className="interactive-row"
                      onClick={() => {
                        onSelectStrategy(opt.id);
                        addEvent('Strategy Selected', `Operator switched view to: ${opt.title}`);
                      }}
                      style={{ display: 'flex', padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-panel-light)', alignItems: 'center', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <div style={{ width: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>{String.fromCharCode(66 + i)}</div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{opt.title}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <span>RSK: {opt.projected_risk}</span>
                          <span>TIME: {opt.estimated_response_time}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Control */}
            {mode === 'REVIEW' && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-panel-nested)', marginTop: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%', boxShadow: '0 0 8px var(--warning)' }} className="blink"></div>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 700, letterSpacing: '1px' }}>HUMAN DECISION REQUIRED</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button className="btn btn-approve" style={{ gridColumn: '1 / -1', padding: '1rem', fontSize: '0.85rem' }} onClick={handleApprove}>
                    AUTHORIZE STRATEGY
                  </button>
                  <button className="btn btn-modify" onClick={handleModifyClick}>MODIFY</button>
                  <button className="btn btn-reject" onClick={handleRejectClick}>REJECT</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
