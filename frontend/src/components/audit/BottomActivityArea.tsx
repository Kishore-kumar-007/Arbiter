import React from 'react';
import type { AuditRecord } from '../../types/domain';

interface Props {
  trail: AuditRecord[];
}

export const BottomActivityArea: React.FC<Props> = ({ trail }) => {
  return (
    <div className="panel" style={{ gridColumn: '2', gridRow: '3', display: 'flex', flexDirection: 'row' }}>
      
      {/* Event Stream */}
      <div style={{ flex: 1, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="panel-header" style={{ padding: '0.6rem 1rem' }}>
          <span>LIVE EVENT STREAM</span>
        </div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0', overflowY: 'auto', background: 'var(--bg-panel-nested)' }}>
          {trail.map((record, i) => (
            <div 
              key={record.id} 
              className="interactive-row"
              style={{ 
                display: 'flex', gap: '1rem', alignItems: 'flex-start', 
                padding: '0.6rem 1rem', 
                borderLeft: i === 0 ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                background: i === 0 ? 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, transparent 100%)' : 'transparent',
                opacity: i === 0 ? 1 : Math.max(0.4, 1 - (i * 0.15))
              }}
            >
              <span className="mono" style={{ fontSize: '0.65rem', color: i === 0 ? 'var(--text-main)' : 'var(--text-muted)', width: '60px', flexShrink: 0, marginTop: '2px', letterSpacing: '0.5px' }}>
                {record.timestamp}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: i === 0 ? 'var(--accent)' : 'var(--text-main)', letterSpacing: '0.25px' }}>{record.event}</span>
                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{record.details}</span>
              </div>
            </div>
          ))}
          {trail.length === 0 && (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
              System nominal. Awaiting events...
            </div>
          )}
        </div>
      </div>

      {/* Decision Timeline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ padding: '0.6rem 1rem' }}>
          <span>DECISION WORKFLOW</span>
        </div>
        <div className="panel-content" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-panel)' }}>
          
          <div style={{ display: 'flex', width: '90%', justifyContent: 'space-between', position: 'relative' }}>
            {/* Active Track Background */}
            <div style={{ position: 'absolute', top: '7px', left: '0', right: '0', height: '2px', background: 'var(--border)', zIndex: 0 }}></div>
            {/* Active Track Fill */}
            <div style={{ 
              position: 'absolute', top: '7px', left: '0', 
              width: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? '100%' : (trail.length > 2 ? '66%' : '33%'), 
              height: '2px', 
              background: 'var(--success)', 
              zIndex: 0,
              transition: 'width 0.5s ease-out',
              boxShadow: '0 0 5px var(--success-glow)'
            }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--success-dark)', border: '2px solid var(--success)', boxShadow: '0 0 10px var(--success-glow)' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.5px' }}>SITUATION<br/>DETECTED</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: trail.length > 2 ? 'var(--success-dark)' : 'var(--bg-panel-nested)', border: `2px solid ${trail.length > 2 ? 'var(--success)' : 'var(--border)'}`, boxShadow: trail.length > 2 ? '0 0 10px var(--success-glow)' : 'none' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: trail.length > 2 ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', fontWeight: trail.length > 2 ? 600 : 400, letterSpacing: '0.5px' }}>ANALYSIS<br/>COMPLETE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
              <div style={{ 
                width: 16, height: 16, borderRadius: '50%', 
                background: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'var(--success-dark)' : 'var(--bg-panel-nested)', 
                border: `2px solid ${trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'var(--success)' : 'var(--accent)'}`,
                boxShadow: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? '0 0 10px var(--success-glow)' : '0 0 15px var(--accent-glow)' 
              }}></div>
              <span className="mono blink" style={{ fontSize: '0.6rem', color: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'var(--text-muted)' : 'var(--accent)', textAlign: 'center', fontWeight: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 400 : 700, letterSpacing: '0.5px' }}>
                HUMAN<br/>PENDING
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
              <div style={{ 
                width: 16, height: 16, borderRadius: '50%', 
                background: trail.some(t => t.event.includes('Approved')) ? 'var(--success-dark)' : trail.some(t => t.event.includes('Rejected')) ? 'var(--hazard-dark)' : 'var(--bg-panel-nested)', 
                border: `2px solid ${trail.some(t => t.event.includes('Approved')) ? 'var(--success)' : trail.some(t => t.event.includes('Rejected')) ? 'var(--hazard)' : 'var(--border)'}`,
                boxShadow: trail.some(t => t.event.includes('Approved')) ? '0 0 10px var(--success-glow)' : trail.some(t => t.event.includes('Rejected')) ? '0 0 10px var(--hazard-glow)' : 'none'
              }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: trail.some(t => t.event.includes('Approved')) ? 'var(--success)' : trail.some(t => t.event.includes('Rejected')) ? 'var(--hazard)' : 'var(--text-muted)', textAlign: 'center', fontWeight: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 700 : 400, letterSpacing: '0.5px' }}>
                ACTION<br/>RESOLVED
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
