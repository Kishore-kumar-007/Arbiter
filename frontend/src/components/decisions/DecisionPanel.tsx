import React, { useState } from 'react';
import type { Strategy } from '../../types/domain';
import { api } from '../../services/api';

interface Props {
  strategies: Strategy[];
  onGenerate: () => void;
  generating: boolean;
}

export const DecisionPanel: React.FC<Props> = ({ strategies, onGenerate, generating }) => {
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setApproving(id);
    await api.submitDecision(id, 'APPROVE');
    setApproving(null);
    // Ideally this would refresh the state
    alert("Decision recorded. System state updated in MVP mock.");
  };

  return (
    <div className="panel decision-panel">
      <div className="panel-header">
        <span>DECISION INTELLIGENCE</span>
        {strategies.length > 0 ? (
          <span style={{ color: 'var(--success)' }}>ANALYSIS COMPLETE</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>STANDBY</span>
        )}
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Candidate Strategies</h2>
            <p className="mono" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deterministic Evaluation Engine v2.4</p>
          </div>
          <button className="btn btn-accent" onClick={onGenerate} disabled={generating}>
            {generating ? 'ANALYZING...' : 'RUN AI ANALYSIS'}
          </button>
        </div>

        {strategies.length === 0 && !generating && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-light)', border: '1px dashed var(--border)', borderRadius: 4 }}>
            Awaiting Situation Analysis Trigger
          </div>
        )}

        {strategies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {strategies.map((strat, idx) => (
              <div key={strat.id} style={{ 
                background: 'rgba(0,0,0,0.2)', 
                border: idx === 0 ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '4px',
                padding: '1rem',
                position: 'relative'
              }}>
                {idx === 0 && (
                  <div style={{ position: 'absolute', top: -10, left: 10, background: 'var(--accent)', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2 }}>
                    PRIMARY RECOMMENDATION
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: idx === 0 ? 'var(--accent)' : 'var(--text-main)' }}>{strat.title}</h3>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SCORE: {strat.score}</span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {strat.explanation}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'var(--bg-panel)', padding: '0.5rem', borderRadius: 2, border: '1px solid var(--border)' }}>
                    <div className="stat-label">Projected Risk</div>
                    <div className="stat-value" style={{ color: strat.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>
                      {strat.projected_risk}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-panel)', padding: '0.5rem', borderRadius: 2, border: '1px solid var(--border)' }}>
                    <div className="stat-label">Response Time</div>
                    <div className="stat-value">{strat.estimated_response_time}u</div>
                  </div>
                  <div style={{ background: 'var(--bg-panel)', padding: '0.5rem', borderRadius: 2, border: '1px solid var(--border)' }}>
                    <div className="stat-label">Resources</div>
                    <div className="stat-value">{strat.resource_consumption} deployed</div>
                  </div>
                  <div style={{ background: 'var(--bg-panel)', padding: '0.5rem', borderRadius: 2, border: '1px solid var(--border)' }}>
                    <div className="stat-label">AI Confidence</div>
                    <div className="stat-value">{(strat.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {strat.constraint_violations.length > 0 && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '2px solid var(--hazard)', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#fca5a5' }}>
                    <strong>CONSTRAINT VIOLATIONS:</strong>
                    <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1rem' }}>
                      {strat.constraint_violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-approve" 
                    style={{ flex: 1 }} 
                    onClick={() => handleApprove(strat.id)}
                    disabled={approving !== null}
                  >
                    {approving === strat.id ? 'EXECUTING...' : 'APPROVE'}
                  </button>
                  <button className="btn" style={{ flex: 1 }}>MODIFY</button>
                  <button className="btn btn-reject" style={{ flex: 1 }}>REJECT</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
