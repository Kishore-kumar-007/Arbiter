import React from 'react';
import type { AppState } from '../../types/domain';

interface Props {
  state: AppState | null;
}

export const CampusMap: React.FC<Props> = ({ state }) => {
  if (!state) return <div className="panel map-container"><div className="panel-content">Loading Map...</div></div>;

  // Basic spatial mapping for the mock campus
  const mapLayout: Record<string, any> = {
    z1: { x: 50, y: 50, w: 200, h: 150, label: 'North Wing', type: 'building' },
    z2: { x: 300, y: 150, w: 250, h: 200, label: 'Main Quad', type: 'safe_zone' },
    z3: { x: 600, y: 50, w: 80, h: 400, label: 'East Access', type: 'road' }
  };

  return (
    <div className="panel map-container">
      <div className="panel-header">
        <span>SPATIAL INTELLIGENCE / CAMPUS GRID</span>
        <span style={{ color: 'var(--telemetry)' }}>LIVE</span>
      </div>
      <div className="panel-content" style={{ padding: 0, position: 'relative', background: '#050505', overflow: 'hidden' }}>
        
        {/* SVG Map */}
        <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zones */}
          {Object.entries(state.zones).map(([id, zone]) => {
            const layout = mapLayout[id];
            if (!layout) return null;
            
            // Check for incidents in this zone
            const zoneIncidents = Object.values(state.incidents).filter(i => i.zone_id === id && i.status !== 'resolved');
            const hasFire = zoneIncidents.some(i => i.type === 'fire');
            const hasMedical = zoneIncidents.some(i => i.type === 'medical_emergency');
            
            let stroke = 'var(--border-light)';
            let fill = 'rgba(255,255,255,0.02)';
            
            if (zone.type === 'safe_zone') {
              stroke = 'var(--success)';
              fill = 'rgba(16, 185, 129, 0.05)';
            } else if (zone.type === 'road') {
              fill = 'rgba(255,255,255,0.05)';
            }
            
            if (hasFire) stroke = 'var(--hazard)';
            if (hasMedical && !hasFire) stroke = 'var(--warning)';

            return (
              <g key={id}>
                <rect 
                  x={layout.x} y={layout.y} width={layout.w} height={layout.h} 
                  fill={fill} stroke={stroke} strokeWidth={hasFire ? 2 : 1}
                  rx={4}
                />
                <text x={layout.x + 10} y={layout.y + 20} fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-mono)">
                  [{id.toUpperCase()}] {zone.name}
                </text>
                
                <text x={layout.x + 10} y={layout.y + 40} fill="var(--text-main)" fontSize="10">
                  POP: {zone.current_population} {zone.capacity > 0 ? `/ ${zone.capacity}` : ''}
                </text>
                
                {/* Incident Markers */}
                {zoneIncidents.map((inc, idx) => (
                  <circle 
                    key={inc.id}
                    cx={layout.x + layout.w - 20 - (idx * 20)} cy={layout.y + 20} r="6" 
                    fill={inc.type === 'fire' ? 'var(--hazard)' : 'var(--warning)'}
                  >
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* Resources */}
          {Object.values(state.resources).map(res => {
            if (!res.current_zone_id) return null;
            const layout = mapLayout[res.current_zone_id];
            if (!layout) return null;

            // Offset based on ID so they don't overlap exactly
            const offset = parseInt(res.id.replace(/\D/g, '')) * 15 || 0;

            return (
              <g key={res.id} transform={`translate(${layout.x + layout.w/2 + offset}, ${layout.y + layout.h/2})`}>
                <rect x="-12" y="-12" width="24" height="24" rx="12" fill={res.status === 'dispatched' ? 'var(--accent)' : 'var(--telemetry)'} />
                <text x="0" y="4" fill="#000" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {res.type.charAt(0).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'var(--bg-panel)', padding: '0.5rem', border: '1px solid var(--border)', fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: 'var(--hazard)', borderRadius: '50%' }}></div> Fire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%' }}></div> Medical</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--telemetry)', borderRadius: '50%' }}></div> Unit (Avail)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: '50%' }}></div> Unit (Busy)</div>
        </div>

      </div>
    </div>
  );
};
