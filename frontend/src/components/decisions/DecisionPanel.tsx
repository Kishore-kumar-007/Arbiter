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
      <div className="panel-header" style={{ borderBottomColor: (mode === 'APPROVED' || mode === 'REVIEW') ? 'var(--success)' : mode === 'REJECTED' ? 'var(--hazard)' : 'var(--border)' }}>
        <span>DECISION INTELLIGENCE</span>
        <span className="mono" style={{ color: mode === 'REVIEW' ? 'var(--success)' : 'var(--text-muted)' }}>
          {mode === 'ANALYZING' ? 'ANALYZING...' : mode === 'REVIEW' ? 'ANALYSIS COMPLETE' : mode}
        </span>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, overflow: 'hidden' }}>
        
        {/* Trigger Area (When Empty) */}
        {(mode === 'STANDBY' && strategies.length === 0) && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting operator analysis trigger.</span>
            <button className="btn btn-accent" onClick={handleGenerateClick} style={{ width: '100%' }}>RUN AI ANALYSIS</button>
          </div>
        )}

        {(mode === 'ANALYZING' || mode === 'AUTHORIZING' || mode === 'SIMULATING_MOD') && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
            <div className="blink mono" style={{ color: mode === 'AUTHORIZING' ? 'var(--success)' : 'var(--accent)' }}>
              {mode === 'AUTHORIZING' ? 'PROCESSING DECISION...' : 'COMPUTING...'}
            </div>
            <div className="metric-bar" style={{ width: '60%' }}>
              <div className="metric-fill" style={{ width: '100%', background: mode === 'AUTHORIZING' ? 'var(--success)' : 'var(--accent)', animation: 'blink 1s infinite' }}></div>
            </div>
          </div>
        )}

        {(mode === 'APPROVED' || mode === 'REJECTED') && (
          <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: mode === 'APPROVED' ? 'var(--success-dark)' : 'var(--hazard-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mode === 'APPROVED' ? 'var(--success)' : 'var(--hazard)', fontSize: '24px' }}>
              {mode === 'APPROVED' ? '✓' : '✗'}
            </div>
            <h2 style={{ margin: 0 }}>{mode === 'APPROVED' ? 'STRATEGY EXECUTED' : 'STRATEGY REJECTED'}</h2>
            <button className="btn" onClick={() => setMode('STANDBY')}>RETURN TO STANDBY</button>
          </div>
        )}

        {/* Primary Recommendation */}
        {(mode === 'REVIEW' || mode === 'REJECTING' || mode === 'MODIFYING') && primary && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderBottom: '1px solid var(--border)' }}>
              <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>PRIMARY RECOMMENDATION</span>
              <h2 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700 }}>{primary.title}</h2>
              
              <div style={{ marginTop: '1rem' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DETERMINISTIC METRICS</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projected Risk</div>
                    <div className="mono" style={{ fontSize: '1.1rem', color: primary.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>{primary.projected_risk}</div>
                  </div>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response Time</div>
                    <div className="mono" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{primary.estimated_response_time} <span style={{ fontSize: '0.75rem', color:'var(--text-muted)' }}>min</span></div>
                  </div>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resources Used</div>
                    <div className="mono" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{primary.resource_consumption}</div>
                  </div>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Constraint Status</div>
                    <div className="mono" style={{ fontSize: '1.1rem', color: primary.constraint_violations.length > 0 ? 'var(--hazard)' : 'var(--success)' }}>
                      {primary.constraint_violations.length === 0 ? 'PASS' : `${primary.constraint_violations.length} FAIL`}
                    </div>
                  </div>
                </div>
              </div>

              {mode === 'REVIEW' && (
                <div style={{ marginTop: '1rem' }}>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>WHY THIS STRATEGY?</span>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {primary.explanation.split('.').filter(e => e.trim().length > 0).slice(0, 3).map((pt, i) => (
                      <li key={i}>{pt.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Editing / Rejecting Interfaces */}
            {mode === 'REJECTING' && (
              <div style={{ padding: '1rem', background: 'var(--hazard-dark)', flex: 1 }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--hazard)', fontWeight: 700 }}>REJECTION REASON REQUIRED</span>
                <textarea 
                  style={{ width: '100%', marginTop: '0.5rem', background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--hazard)', padding: '0.5rem', borderRadius: 2, resize: 'none', height: '80px', fontFamily: 'var(--font-sans)', fontSize: '0.85rem' }} 
                  placeholder="Enter operational reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                ></textarea>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-reject" style={{ flex: 1 }} onClick={confirmReject}>CONFIRM REJECT</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setMode('REVIEW')}>CANCEL</button>
                </div>
              </div>
            )}

            {mode === 'MODIFYING' && (
              <div style={{ padding: '1rem', background: 'var(--bg-panel-light)', flex: 1, overflowY: 'auto' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>EDIT STRATEGY ACTIONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {editableActions.map((act, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                      <span className="badge" style={{ background: 'var(--border-light)' }}>{act.type}</span>
                      <span style={{ fontSize: '0.75rem' }}>TGT: {act.target_id}</span>
                      {act.resource_id && <span style={{ fontSize: '0.75rem' }}>RES: {act.resource_id}</span>}
                      <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--hazard)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => setEditableActions(editableActions.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                  ))}
                  <button 
                    className="btn" 
                    style={{ borderStyle: 'dashed' }} 
                    onClick={() => setEditableActions([...editableActions, { type: 'contain', target_id: 'z2', resource_id: null } as any])}
                  >
                    + ADD ACTION
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-accent" style={{ flex: 1 }} onClick={simulateMod}>SIMULATE</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setMode('REVIEW')}>CANCEL</button>
                </div>
              </div>
            )}

            {/* Alternatives */}
            {mode === 'REVIEW' && (
              <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>STRATEGY OPTIONS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {options.map((opt, i) => (
                    <div 
                      key={opt.id} 
                      onClick={() => {
                        onSelectStrategy(opt.id);
                        addEvent('Strategy Selected', `Operator switched view to: ${opt.title}`);
                      }}
                      style={{ display: 'flex', padding: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-panel-light)', alignItems: 'center', cursor: 'pointer', transition: 'border 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ width: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{String.fromCharCode(66 + i)}</div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{opt.title}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span>Rsk: {opt.projected_risk}</span>
                          <span>Time: {opt.estimated_response_time}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Control */}
            {mode === 'REVIEW' && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%' }} className="blink"></div>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 700, letterSpacing: '1px' }}>HUMAN DECISION REQUIRED</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn btn-approve" style={{ gridColumn: '1 / -1', padding: '0.75rem' }} onClick={handleApprove}>
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
