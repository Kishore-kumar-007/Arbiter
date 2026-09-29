import React, { useEffect, useState } from 'react';
import type { AuditRecord } from '../../types/domain';
import { api } from '../../services/api';

export const AuditTimeline: React.FC = () => {
  const [trail, setTrail] = useState<AuditRecord[]>([]);

  useEffect(() => {
    api.getAuditTrail().then(setTrail);
  }, []);

  return (
    <div className="panel timeline-panel">
      <div className="panel-header">
        <span>LIVE EVENT FEED / AUDIT TRAIL</span>
        <span className="mono" style={{ color: 'var(--text-muted)' }}>{trail.length} EVENTS</span>
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {trail.map((record, idx) => (
          <div key={record.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--telemetry)', width: '60px', flexShrink: 0 }}>
              {record.timestamp}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-15px', top: '5px', width: '6px', height: '6px', borderRadius: '50%', background: idx === trail.length - 1 ? 'var(--accent)' : 'var(--border-light)' }}></div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{record.event}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
