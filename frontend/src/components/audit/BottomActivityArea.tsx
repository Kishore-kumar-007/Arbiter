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
        <div className="panel-header">
          <span>LIVE EVENT STREAM</span>
        </div>
        <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', overflowY: 'auto' }}>
          {trail.map((record, i) => (
            <div key={record.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', opacity: i === 0 ? 1 : 0.7 }}>
              <span className="mono" style={{ fontSize: '0.65rem', color: i === 0 ? 'var(--text-main)' : 'var(--text-muted)', width: '55px', flexShrink: 0 }}>
                {record.timestamp}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: i === 0 ? 'var(--accent)' : 'var(--text-main)' }}>{record.event}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{record.details}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Timeline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">
          <span>DECISION TIMELINE</span>
        </div>
        <div className="panel-content" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '4px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 0 }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-panel)' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>SITUATION<br/>DETECTED</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: trail.length > 2 ? 'var(--success)' : 'var(--border)', border: '2px solid var(--bg-panel)' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: trail.length > 2 ? 'var(--text-muted)' : 'var(--border-light)', textAlign: 'center' }}>ANALYSIS<br/>COMPLETE</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'var(--success)' : 'var(--accent)', border: '2px solid var(--bg-panel)', boxShadow: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'none' : '0 0 8px var(--accent)' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 'var(--text-muted)' : 'var(--accent)', textAlign: 'center', fontWeight: trail.some(t => t.event.includes('Approved') || t.event.includes('Rejected')) ? 400 : 700 }}>HUMAN<br/>PENDING</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: trail.some(t => t.event.includes('Approved')) ? 'var(--success)' : trail.some(t => t.event.includes('Rejected')) ? 'var(--hazard)' : 'var(--border)', border: '2px solid var(--bg-panel)' }}></div>
              <span className="mono" style={{ fontSize: '0.6rem', color: trail.some(t => t.event.includes('Approved')) ? 'var(--success)' : trail.some(t => t.event.includes('Rejected')) ? 'var(--hazard)' : 'var(--border-light)', textAlign: 'center' }}>ACTION<br/>RESOLVED</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
