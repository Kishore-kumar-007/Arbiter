import React from 'react';
import type { SimulationResult } from '../../types/domain';

interface Props {
  result: SimulationResult | null;
  onReset: () => void;
}

export const SimulationResultPanel: React.FC<Props> = ({ result, onReset }) => {
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', letterSpacing: '1px' }}>SIMULATION COMPLETE</h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROJECTED DETERMINISTIC OUTCOME</div>
        </div>
        <button className="btn" onClick={onReset} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>RESET SIMULATION</button>
      </div>

      {/* SUMMARY STATEMENT */}
      <div style={{ background: 'rgba(0, 229, 255, 0.05)', borderLeft: '4px solid var(--accent)', padding: '1rem', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        {result.simulation_summary}
      </div>

      {/* METRICS COMPARISON */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.75rem' }}>BASELINE VS COUNTERFACTUAL</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>BASELINE STATE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem' }}>Risk</span><span className="mono">{result.baseline_risk}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem' }}>Response Time</span><span className="mono">{result.baseline_response_time}m</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem' }}>Resources</span><span className="mono">{result.baseline_resource_usage}</span></div>
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 600 }}>PROJECTED STATE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>Risk</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="mono" style={{ color: result.risk_delta > 0 ? 'var(--warning)' : result.risk_delta < 0 ? 'var(--success)' : 'var(--text-main)' }}>
                    {result.projected_risk}
                  </span>
                  <span className="mono" style={{ fontSize: '0.65rem', color: result.risk_delta > 0 ? 'var(--warning)' : result.risk_delta < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    ({result.risk_delta > 0 ? '+' : ''}{result.risk_delta})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>Response Time</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="mono">{result.projected_response_time}m</span>
                  <span className="mono" style={{ fontSize: '0.65rem', color: result.response_time_delta > 0 ? 'var(--warning)' : result.response_time_delta < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    ({result.response_time_delta > 0 ? '+' : ''}{result.response_time_delta})
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>Resources</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="mono">{result.projected_resource_usage}</span>
                  <span className="mono" style={{ fontSize: '0.65rem', color: result.resource_usage_delta > 0 ? 'var(--warning)' : result.resource_usage_delta < 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    ({result.resource_usage_delta > 0 ? '+' : ''}{result.resource_usage_delta})
                  </span>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>

      {/* CONSTRAINTS */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.75rem' }}>CONSTRAINT REPORT</div>
        {result.constraint_violations.length === 0 ? (
          <div style={{ background: 'var(--success-dark)', color: 'var(--success)', padding: '0.75rem', fontSize: '0.8rem', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✓ PASS: No constraint violations detected in projected state.
          </div>
        ) : (
          <div style={{ background: 'var(--hazard-dark)', border: '1px solid var(--hazard)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ color: 'var(--hazard)', fontWeight: 700, fontSize: '0.8rem' }}>✗ {result.constraint_violations.length} VIOLATIONS FOUND</div>
            {result.constraint_violations.map((v, i) => (
              <div key={i} className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>- {v}</div>
            ))}
          </div>
        )}
      </div>

      {/* AFFECTED ENTITIES SUMMARY */}
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.75rem' }}>PROJECTED STATE IMPACTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          
          <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AFFECTED ZONES</div>
            <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{result.affected_zones.length}</div>
          </div>
          
          <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AFFECTED INCIDENTS</div>
            <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{result.affected_incidents.length}</div>
          </div>
          
          <div style={{ background: 'var(--bg-panel-light)', border: '1px solid var(--border)', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AFFECTED RESOURCES</div>
            <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{result.affected_resources.length}</div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
};
