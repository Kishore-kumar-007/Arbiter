import React, { useEffect, useState } from 'react';
import type { AuditRecord } from '../../types/domain';
import { api } from '../../services/api';

export const AuditTimeline: React.FC = () => {
  const [trail, setTrail] = useState<AuditRecord[]>([]);

  useEffect(() => {
    // Reverse so latest is first, matching BottomActivityArea
    api.getAuditTrail().then(data => setTrail(data.reverse()));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* HEADER */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel-light)' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--accent)' }}>⎍</span> IMMUTABLE AUDIT TRAIL
        </h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>CRYPTOGRAPHIC LOG OF ALL SYSTEM & OPERATOR EVENTS</div>
      </div>
      
      {/* TOOLBAR */}
      <div style={{ padding: '0.75rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel-nested)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ letterSpacing: '0.5px' }}>LOG STATUS: <strong style={{ color: 'var(--success)' }}>SECURE & VERIFIED</strong></span>
          <div style={{ width: 1, height: '1rem', background: 'var(--border)' }}></div>
          <span style={{ letterSpacing: '0.5px' }}>TOTAL EVENTS: <strong style={{ color: 'var(--text-main)' }}>{trail.length}</strong></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} className="blink"></div>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', letterSpacing: '1px', fontWeight: 700 }}>LIVE APPEND</span>
        </div>
      </div>

      {/* TIMELINE CONTENT */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
        {/* Vertical Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6.5rem', width: '2px', background: 'var(--border)' }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {trail.map((record, idx) => (
            <div key={record.id} className="interactive-row" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', padding: '1rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px', position: 'relative', transition: 'all 0.2s', zIndex: 1 }}>
              
              {/* Timestamp */}
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--telemetry)', width: '60px', flexShrink: 0, textAlign: 'right', paddingTop: '0.2rem' }}>
                {record.timestamp}
              </div>
              
              {/* Node Indicator */}
              <div style={{ position: 'absolute', left: '-13px', top: '1.2rem', width: '10px', height: '10px', borderRadius: '50%', background: idx === 0 ? 'var(--accent)' : 'var(--bg-base)', border: `2px solid ${idx === 0 ? 'var(--accent)' : 'var(--border)'}`, zIndex: 2, boxShadow: idx === 0 ? '0 0 10px var(--accent)' : 'none' }}></div>
              
              {/* Event Content */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.5px', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{record.event.toUpperCase()}</span>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID:{record.id}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{record.details}</div>
              </div>
            </div>
          ))}
          
          {trail.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              NO EVENTS RECORDED IN CURRENT SESSION.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
