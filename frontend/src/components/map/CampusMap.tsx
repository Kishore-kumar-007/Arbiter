import React, { useState } from 'react';
import type { AppState, Strategy } from '../../types/domain';

interface Props {
  state: AppState | null;
  selectedStrategy: Strategy | null;
}

export const CampusMap: React.FC<Props> = ({ state, selectedStrategy }) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!state) return <div className="panel"><div className="panel-content">Loading...</div></div>;

  const mapLayout: Record<string, any> = {
    z1: { x: 100, y: 100, w: 220, h: 160, label: 'North Wing', type: 'building' },
    z2: { x: 420, y: 180, w: 280, h: 220, label: 'Main Quad', type: 'safe_zone' },
    z3: { x: 780, y: 80, w: 120, h: 420, label: 'East Access', type: 'road' }
  };

  const getCenter = (id: string) => {
    const layout = mapLayout[id];
    if (!layout) return { x: 0, y: 0 };
    return { x: layout.x + layout.w / 2, y: layout.y + layout.h / 2 };
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom(z => Math.min(Number((z + 0.15).toFixed(2)), 3.0));
    } else {
      setZoom(z => Math.max(Number((z - 0.15).toFixed(2)), 0.5));
    }
  };

  return (
    <div className="panel" style={{ gridColumn: '2', gridRow: '2' }}>
      <div className="panel-header">
        <span>SPATIAL INTELLIGENCE</span>
        <span className="mono" style={{ color: 'var(--accent)' }}>LIVE TRACKING</span>
      </div>
      <div 
        className="panel-content" 
        style={{ 
          padding: 0, 
          position: 'relative', 
          background: '#020203', 
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        
        {/* Map Controls */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 5 }}>
          <button className="btn" style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }} onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}>+</button>
          <button className="btn" style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }} onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}>-</button>
          <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6rem', marginTop: '0.5rem' }} onClick={(e) => { e.stopPropagation(); handleReset(); }}>RST</button>
        </div>

        {/* Map Layers Toggle */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', zIndex: 5 }}>
          <span className="badge" style={{ background: 'var(--text-main)', color: '#000' }}>INCIDENTS</span>
          <span className="badge">RESOURCES</span>
          <span className="badge">ROUTES</span>
        </div>

        <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: '500px 300px', 
            transition: isDragging ? 'none' : 'transform 0.2s ease-out' 
          }}>
            {/* Draw routes based on selected strategy actions */}
            {selectedStrategy && selectedStrategy.actions.map((act, i) => {
              if (act.type === 'dispatch' && act.resource_id) {
                const res = state.resources[act.resource_id];
                if (res && res.current_zone_id) {
                  const start = getCenter(res.current_zone_id);
                  const end = getCenter(act.target_id);
                  return (
                    <path key={`route-${i}`} d={`M ${start.x} ${start.y + 40} Q ${start.x} ${end.y} ${end.x} ${end.y}`} fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="8,8">
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                    </path>
                  );
                }
              } else if (act.type === 'evacuate') {
                const start = getCenter(act.target_id);
                const end = getCenter('z2'); 
                return (
                  <path key={`evac-${i}`} d={`M ${start.x} ${start.y} Q ${end.x} ${start.y} ${end.x} ${end.y}`} fill="none" stroke="var(--success)" strokeWidth="4" strokeDasharray="8,8">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                  </path>
                );
              }
              return null;
            })}

            {Object.entries(state.zones).map(([id, zone]) => {
              const layout = mapLayout[id];
              if (!layout) return null;
              
              const zoneIncidents = Object.values(state.incidents).filter(i => i.zone_id === id && i.status !== 'resolved');
              const hasFire = zoneIncidents.some(i => i.type === 'fire');
              const hasMedical = zoneIncidents.some(i => i.type === 'medical_emergency');
              const isTargeted = selectedStrategy?.actions.some(a => a.target_id === id);

              let stroke = 'var(--border-light)';
              let fill = 'rgba(255,255,255,0.02)';
              
              if (zone.type === 'safe_zone') {
                stroke = 'var(--success)';
                fill = 'var(--success-dark)';
              } else if (zone.type === 'road') {
                stroke = 'var(--telemetry)';
                fill = 'var(--telemetry-dark)';
              }
              
              if (hasFire) stroke = 'var(--hazard)';
              else if (hasMedical) stroke = 'var(--warning)';
              if (isTargeted) stroke = 'var(--accent)';

              return (
                <g key={id}>
                  <rect 
                    x={layout.x} y={layout.y} width={layout.w} height={layout.h} 
                    fill={fill} stroke={stroke} strokeWidth={isTargeted ? 3 : (hasFire ? 3 : 2)} rx={4}
                  />
                  
                  {/* Internal UI for Zone */}
                  <rect x={layout.x} y={layout.y} width={layout.w} height="32" fill="rgba(0,0,0,0.6)" rx="4" />
                  <text x={layout.x + 10} y={layout.y + 20} fill={isTargeted ? 'var(--accent)' : 'var(--text-main)'} fontSize="14" fontFamily="var(--font-mono)" fontWeight="700">
                    {id.toUpperCase()} - {zone.name.toUpperCase()}
                  </text>
                  
                  <text x={layout.x + 10} y={layout.y + 55} fill="var(--text-muted)" fontSize="12" fontFamily="var(--font-mono)">
                    POPULATION:
                  </text>
                  <text x={layout.x + 100} y={layout.y + 55} fill="var(--text-main)" fontSize="14" fontFamily="var(--font-mono)" fontWeight="700">
                    {zone.current_population} {zone.capacity > 0 ? `/ ${zone.capacity}` : ''}
                  </text>

                  {zoneIncidents.map((inc, idx) => (
                    <g key={inc.id} transform={`translate(${layout.x + layout.w - 40 - (idx * 35)}, ${layout.y + layout.h/2})`}>
                      <circle cx="0" cy="0" r="16" fill={inc.type === 'fire' ? 'var(--hazard-dark)' : 'var(--warning-dark)'} stroke={inc.type === 'fire' ? 'var(--hazard)' : 'var(--warning)'}>
                        <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="0" cy="0" r="8" fill={inc.type === 'fire' ? 'var(--hazard)' : 'var(--warning)'} />
                    </g>
                  ))}
                </g>
              );
            })}

            {Object.values(state.resources).map(res => {
              if (!res.current_zone_id) return null;
              const layout = mapLayout[res.current_zone_id];
              if (!layout) return null;
              const offset = parseInt(res.id.replace(/\D/g, '')) * 45 || 0;
              
              const isResourceTargeted = selectedStrategy?.actions.some(a => a.resource_id === res.id);

              return (
                <g key={res.id} transform={`translate(${layout.x + 40 + offset}, ${layout.y + layout.h - 40})`}>
                  <rect x="-18" y="-18" width="36" height="36" fill="var(--bg-panel)" stroke={isResourceTargeted ? 'var(--accent)' : 'var(--telemetry)'} strokeWidth="2" rx="4" />
                  <rect x="-14" y="-14" width="28" height="28" fill={isResourceTargeted ? 'var(--accent)' : (res.status === 'dispatched' ? 'var(--warning)' : 'var(--telemetry)')} rx="2" />
                  <text x="0" y="4" fill="#000" fontSize="12" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                    {res.type.substring(0, 3).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(5,5,8,0.8)', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--hazard)', borderRadius: '2px' }}></div> CRITICAL HAZARD</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '2px' }}></div> SAFE / AVAILABLE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--telemetry)', borderRadius: '2px' }}></div> NORMAL TELEMETRY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '2px' }}></div> DECISION PATH</div>
        </div>
      </div>
    </div>
  );
};
