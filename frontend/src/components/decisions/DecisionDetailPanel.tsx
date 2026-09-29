import React from 'react';
import type { DecisionRecord } from '../../types/domain';

interface Props {
  decision: DecisionRecord;
  onClose: () => void;
  onNavigateHome?: () => void;
}

export const DecisionDetailPanel: React.FC<Props> = ({ decision, onClose, onNavigateHome }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--warning)';
      case 'APPROVED': return 'var(--success)';
      case 'REJECTED': return 'var(--hazard)';
      case 'MODIFIED': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'HUMAN DECISION REQUIRED';
      case 'APPROVED': return 'AUTHORIZED BY OPERATOR';
      case 'REJECTED': return 'REJECTED BY OPERATOR';
      case 'MODIFIED': return 'MODIFIED BY OPERATOR';
      default: return status;
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border)' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>DECISION INTELLIGENCE</span>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
        >
          ×
        </button>
      </div>
      
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: 0 }}>
        
        {/* Header Section */}
        <div style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h2 className="mono" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {decision.id}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                {decision.scenario_name}
              </div>
            </div>
            
            <div style={{ 
              padding: '0.25rem 0.5rem', 
              border: `1px solid ${getStatusColor(decision.status)}`,
              color: getStatusColor(decision.status),
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              background: `${getStatusColor(decision.status)}15`,
              textTransform: 'uppercase'
            }}>
              {decision.status}
            </div>
          </div>
        </div>

        {/* Selected Strategy */}
        <div style={{ padding: '0 1.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>SELECTED STRATEGY</div>
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg-panel-light)', 
            border: '1px solid var(--border)', 
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{decision.strategy.title}</h3>
            
            {/* Actions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Strategy Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {decision.strategy.actions.map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <span className="badge" style={{ background: 'var(--border-light)' }}>{act.type}</span>
                    <span style={{ fontSize: '0.75rem' }}>TGT: {act.target_id}</span>
                    {act.resource_id && <span style={{ fontSize: '0.75rem' }}>RES: {act.resource_id}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Deterministic Evaluation</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Projected Risk</div>
                  <div className="mono" style={{ fontSize: '1.1rem', color: decision.strategy.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>{decision.strategy.projected_risk}</div>
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response Time</div>
                  <div className="mono" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{decision.strategy.estimated_response_time} <span style={{ fontSize: '0.75rem', color:'var(--text-muted)' }}>min</span></div>
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resources Used</div>
                  <div className="mono" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{decision.strategy.resource_consumption}</div>
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Constraint Status</div>
                  <div className="mono" style={{ fontSize: '1.1rem', color: decision.strategy.constraint_violations.length > 0 ? 'var(--hazard)' : 'var(--success)' }}>
                    {decision.strategy.constraint_violations.length === 0 ? 'PASS' : `${decision.strategy.constraint_violations.length} FAIL`}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>AI Rationale</div>
              <div style={{ 
                padding: '0.75rem', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '4px',
                lineHeight: 1.5,
                fontSize: '0.8rem',
                color: 'var(--text-main)'
              }}>
                {decision.strategy.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Alternatives */}
        {decision.candidate_strategies.length > 1 && (
          <div style={{ padding: '0 1.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>CANDIDATE ALTERNATIVES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {decision.candidate_strategies.filter(s => s.id !== decision.strategy.id).map(opt => (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{opt.title}</div>
                  <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                    <span>Risk: {opt.projected_risk}</span>
                    <span>Time: {opt.estimated_response_time}m</span>
                    <span>Res: {opt.resource_consumption}</span>
                    <span>Score: {opt.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Human Action Context */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-panel-light)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: getStatusColor(decision.status) }} className={decision.status === 'PENDING' ? 'blink' : ''}></div>
            <span className="mono" style={{ fontSize: '0.75rem', color: getStatusColor(decision.status), fontWeight: 700, letterSpacing: '1px' }}>
              {getStatusLabel(decision.status)}
            </span>
            <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{decision.timestamp}</span>
          </div>
          
          {decision.reason && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', border: '1px solid var(--border)', fontStyle: 'italic' }}>
              "{decision.reason}"
            </div>
          )}

          {decision.status === 'PENDING' && onNavigateHome && (
            <button className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }} onClick={onNavigateHome}>
              REVIEW IN COMMAND CENTER →
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};
