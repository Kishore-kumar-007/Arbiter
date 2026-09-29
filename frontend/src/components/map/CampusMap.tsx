import React, { useState } from 'react';
import type { AppState, Strategy, ResourceType } from '../../types/domain';

interface Props {
  state: AppState | null;
  selectedStrategy: Strategy | null;
}

export const CampusMap: React.FC<Props> = ({ state, selectedStrategy }) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Hover state for interactive tooltips
  const [hoveredIncident, setHoveredIncident] = useState<string | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);

  if (!state) return <div className="panel"><div className="panel-content">Loading...</div></div>;

  const mapLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
    // Legacy / Fallback
    z1: { x: 80, y: 80, w: 280, h: 180 },
    z2: { x: 420, y: 160, w: 320, h: 240 },
    z3: { x: 800, y: 80, w: 180, h: 420 },
    
    // Scenario 1: Fire / Evacuation
    z_north: { x: 50, y: 50, w: 260, h: 150 },
    z_engineering: { x: 350, y: 50, w: 260, h: 150 },
    z_library: { x: 650, y: 50, w: 240, h: 150 },
    z_assembly: { x: 50, y: 240, w: 260, h: 170 },
    z_quad: { x: 350, y: 240, w: 260, h: 170 },
    z_east_road: { x: 650, y: 240, w: 240, h: 170 },
    z_west_exit: { x: 50, y: 450, w: 260, h: 100 },
    z_south_road: { x: 350, y: 450, w: 260, h: 100 },
    z_east_exit: { x: 650, y: 450, w: 240, h: 100 },

    // Scenario 2: Mass Casualty
    z_north_route: { x: 60, y: 40, w: 860, h: 100 },
    z_stadium: { x: 60, y: 170, w: 410, h: 230 },
    z_plaza: { x: 510, y: 170, w: 410, h: 230 },
    z_med_tent: { x: 60, y: 430, w: 410, h: 130 },
    z_south_route: { x: 510, y: 430, w: 410, h: 130 },

    // Scenario 3: Infrastructure
    z_science: { x: 60, y: 50, w: 410, h: 170 },
    z_admin: { x: 510, y: 50, w: 410, h: 170 },
    z_tunnel: { x: 60, y: 250, w: 410, h: 130 },
    z_hub: { x: 510, y: 250, w: 410, h: 150 },
    z_park: { x: 60, y: 420, w: 860, h: 140 },
  };

  const getCenter = (id: string) => {
    const layout = mapLayout[id];
    if (!layout) return { x: 500, y: 300 };
    return { x: layout.x + layout.w / 2, y: layout.y + layout.h / 2 };
  };

  const getZoneIdForTarget = (targetId: string): string => {
    if (state.incidents[targetId]) {
      return state.incidents[targetId].zone_id;
    }
    if (state.zones[targetId]) {
      return targetId;
    }
    return targetId;
  };

  const handleZoomIn = () => setZoom(z => Math.min(Number((z + 0.25).toFixed(2)), 3.0));
  const handleZoomOut = () => setZoom(z => Math.max(Number((z - 0.25).toFixed(2)), 0.5));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click
    if (e.button !== 0) return;
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

  // Safe zone for evacuation paths
  const safeZoneEntry = Object.entries(state.zones).find(([_, z]) => z.type === 'safe_zone');
  const fallbackSafeZoneId = safeZoneEntry ? safeZoneEntry[0] : (state.zones['z_assembly'] ? 'z_assembly' : (state.zones['z_quad'] ? 'z_quad' : 'z2'));

  // Group resources by zone
  const resourcesByZone: Record<string, typeof state.resources[string][]> = {};
  Object.values(state.resources).forEach(res => {
    if (res.current_zone_id) {
      if (!resourcesByZone[res.current_zone_id]) {
        resourcesByZone[res.current_zone_id] = [];
      }
      resourcesByZone[res.current_zone_id].push(res);
    }
  });

  const getResourceIcon = (type: ResourceType | string) => {
    switch (type) {
      case 'fire': return '🚒';
      case 'medical': return '🚑';
      case 'security': return '🛡';
      default: return '⚙';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'medical_emergency': return '⚕';
      case 'crowd_surge': return '👥';
      case 'blocked_exit': return '🚫';
      default: return '⚠';
    }
  };

  return (
    <div className="panel" style={{ gridColumn: '2', gridRow: '2' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>SPATIAL INTELLIGENCE</span>
          <span className="mono" style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>● LIVE TACTICAL GRID</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ZOOM: {Math.round(zoom * 100)}%</span>
        </div>
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
        
        {/* Map Navigation Controls */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 20 }}>
          <button 
            className="btn" 
            style={{ padding: '0.25rem 0.5rem', minWidth: '32px', background: 'rgba(10,12,18,0.9)', backdropFilter: 'blur(4px)' }} 
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            title="Zoom In"
          >+</button>
          <button 
            className="btn" 
            style={{ padding: '0.25rem 0.5rem', minWidth: '32px', background: 'rgba(10,12,18,0.9)', backdropFilter: 'blur(4px)' }} 
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            title="Zoom Out"
          >-</button>
          <button 
            className="btn" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.6rem', marginTop: '0.5rem', background: 'rgba(10,12,18,0.9)', backdropFilter: 'blur(4px)' }} 
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            title="Reset View"
          >RST</button>
        </div>

        {/* Interactive Layer Toggles */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.4rem', zIndex: 20 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowIncidents(!showIncidents); }}
            style={{
              padding: '4px 10px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              borderRadius: '3px',
              border: showIncidents ? '1px solid var(--hazard)' : '1px solid var(--border)',
              background: showIncidents ? 'var(--hazard-dark)' : 'rgba(10,10,15,0.7)',
              color: showIncidents ? 'var(--hazard)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🔥</span>
            <span>INCIDENTS</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>({Object.values(state.incidents).filter(i => i.status !== 'resolved').length})</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowResources(!showResources); }}
            style={{
              padding: '4px 10px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              borderRadius: '3px',
              border: showResources ? '1px solid var(--telemetry)' : '1px solid var(--border)',
              background: showResources ? 'var(--telemetry-dark)' : 'rgba(10,10,15,0.7)',
              color: showResources ? 'var(--telemetry)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🛡</span>
            <span>RESOURCES</span>
            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>({Object.keys(state.resources).length})</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowRoutes(!showRoutes); }}
            style={{
              padding: '4px 10px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              borderRadius: '3px',
              border: showRoutes ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: showRoutes ? 'rgba(255,183,77,0.15)' : 'rgba(10,10,15,0.7)',
              color: showRoutes ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⚡</span>
            <span>ROUTES</span>
            {selectedStrategy && (
              <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '2px', background: 'var(--accent)', color: '#000' }}>
                ACTIVE
              </span>
            )}
          </button>
        </div>

        {/* Tactical SVG Map */}
        <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }}>
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            </pattern>
            
            {/* Directional Arrowheads */}
            <marker id="arrow-dispatch" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="var(--accent)" />
            </marker>
            <marker id="arrow-evac" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="var(--success)" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: '500px 300px', 
            transition: isDragging ? 'none' : 'transform 0.2s ease-out' 
          }}>
            
            {/* LAYER: ROUTES (Dispatch & Evacuation Vectors) */}
            {showRoutes && selectedStrategy && selectedStrategy.actions.map((act, i) => {
              if (act.type === 'dispatch' && act.resource_id) {
                const res = state.resources[act.resource_id];
                const targetZoneId = getZoneIdForTarget(act.target_id);
                
                if (res && res.current_zone_id && targetZoneId) {
                  const start = getCenter(res.current_zone_id);
                  const end = getCenter(targetZoneId);
                  
                  // Compute curve control point
                  const midX = (start.x + end.x) / 2;
                  const midY = Math.min(start.y, end.y) - 45;

                  return (
                    <g key={`route-dispatch-${i}`}>
                      {/* Outer Glow */}
                      <path 
                        d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`} 
                        fill="none" 
                        stroke="var(--accent)" 
                        strokeWidth="6" 
                        strokeOpacity="0.25"
                      />
                      {/* Active Animated Dash Line */}
                      <path 
                        d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`} 
                        fill="none" 
                        stroke="var(--accent)" 
                        strokeWidth="2.5" 
                        strokeDasharray="6,6"
                        markerEnd="url(#arrow-dispatch)"
                      >
                        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.8s" repeatCount="indefinite" />
                      </path>
                      {/* Route Tactical Label */}
                      <g transform={`translate(${midX}, ${midY + 15})`}>
                        <rect x="-65" y="-12" width="130" height="20" rx="3" fill="#0c0d12" stroke="var(--accent)" strokeWidth="1" />
                        <text x="0" y="2" fill="var(--accent)" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                          ⚡ DISPATCH: {act.resource_id.toUpperCase()}
                        </text>
                      </g>
                    </g>
                  );
                }
              } else if (act.type === 'evacuate') {
                const startZoneId = getZoneIdForTarget(act.target_id);
                const start = getCenter(startZoneId);
                const end = getCenter(fallbackSafeZoneId); 
                const midX = (start.x + end.x) / 2;
                const midY = Math.max(start.y, end.y) + 35;

                return (
                  <g key={`route-evac-${i}`}>
                    {/* Outer Glow */}
                    <path 
                      d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`} 
                      fill="none" 
                      stroke="var(--success)" 
                      strokeWidth="6" 
                      strokeOpacity="0.2"
                    />
                    {/* Active Animated Dash Line */}
                    <path 
                      d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`} 
                      fill="none" 
                      stroke="var(--success)" 
                      strokeWidth="2.5" 
                      strokeDasharray="6,6"
                      markerEnd="url(#arrow-evac)"
                    >
                      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.8s" repeatCount="indefinite" />
                    </path>
                    {/* Evacuation Label */}
                    <g transform={`translate(${midX}, ${midY - 8})`}>
                      <rect x="-60" y="-12" width="120" height="20" rx="3" fill="#0c0d12" stroke="var(--success)" strokeWidth="1" />
                      <text x="0" y="2" fill="var(--success)" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">
                        ➔ EVAC CORRIDOR
                      </text>
                    </g>
                  </g>
                );
              }
              return null;
            })}

            {/* LAYER: ZONES & INTEGRATED TELEMETRY */}
            {Object.entries(state.zones).map(([id, zone]) => {
              const layout = mapLayout[id];
              if (!layout) return null;
              
              const zoneIncidents = Object.values(state.incidents).filter(i => i.zone_id === id && i.status !== 'resolved');
              const hasFire = zoneIncidents.some(i => i.type === 'fire');
              const hasMedical = zoneIncidents.some(i => i.type === 'medical_emergency');
              const hasBlocked = zoneIncidents.some(i => i.type === 'blocked_exit');
              const hasSurge = zoneIncidents.some(i => i.type === 'crowd_surge');
              const isTargeted = selectedStrategy?.actions.some(a => getZoneIdForTarget(a.target_id) === id);

              let stroke = 'var(--border-light)';
              let fill = 'rgba(255,255,255,0.02)';
              
              if (zone.type === 'safe_zone') {
                stroke = 'var(--success)';
                fill = 'rgba(0, 230, 118, 0.04)';
              } else if (zone.type === 'road') {
                stroke = 'rgba(0, 229, 255, 0.3)';
                fill = 'rgba(0, 229, 255, 0.02)';
              }
              
              if (hasFire) {
                stroke = 'var(--hazard)';
                fill = 'rgba(255, 23, 68, 0.08)';
              } else if (hasMedical || hasSurge) {
                stroke = 'var(--warning)';
                fill = 'rgba(255, 145, 0, 0.08)';
              } else if (hasBlocked) {
                stroke = 'var(--hazard)';
                fill = 'rgba(255, 23, 68, 0.05)';
              }

              if (isTargeted) stroke = 'var(--accent)';

              const zoneResources = resourcesByZone[id] || [];
              const occPercent = zone.capacity > 0 ? Math.min(100, Math.round((zone.current_population / zone.capacity) * 100)) : 0;

              return (
                <g key={id}>
                  {/* Outer Zone Frame */}
                  <rect 
                    x={layout.x} 
                    y={layout.y} 
                    width={layout.w} 
                    height={layout.h} 
                    fill={fill} 
                    stroke={stroke} 
                    strokeWidth={isTargeted ? 2.5 : (hasFire || hasBlocked ? 2 : 1.5)} 
                    rx={5}
                  />

                  {/* Header Highlight Strip */}
                  <rect 
                    x={layout.x} 
                    y={layout.y} 
                    width={layout.w} 
                    height="4" 
                    fill={isTargeted ? 'var(--accent)' : (hasFire ? 'var(--hazard)' : (zone.type === 'safe_zone' ? 'var(--success)' : 'transparent'))}
                    rx="2"
                  />
                  
                  {/* HTML/CSS ForeignObject for flawless text layout and telemetry */}
                  <foreignObject 
                    x={layout.x} 
                    y={layout.y} 
                    width={layout.w} 
                    height={layout.h}
                  >
                    <div style={{
                      width: '100%',
                      height: '100%',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-main)',
                      pointerEvents: 'auto'
                    }}>
                      {/* Top Sector Header */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          paddingBottom: '4px',
                          marginBottom: '6px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            minWidth: 0,
                            flex: 1
                          }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: isTargeted ? 'var(--accent)' : 'var(--text-muted)',
                              letterSpacing: '0.5px'
                            }}>
                              {id.toUpperCase()}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: isTargeted ? 'var(--accent)' : 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={zone.name}>
                              {zone.name}
                            </span>
                          </div>

                          {zone.status && (
                            <span style={{
                              fontSize: '0.55rem',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: zone.status === 'critical' || zone.status === 'blocked' ? 'var(--hazard-dark)' : 'rgba(255,145,0,0.25)',
                              color: zone.status === 'critical' || zone.status === 'blocked' ? 'var(--hazard)' : 'var(--warning)',
                              border: `1px solid ${zone.status === 'critical' || zone.status === 'blocked' ? 'var(--hazard)' : 'var(--warning)'}`,
                              flexShrink: 0
                            }}>
                              {zone.status}
                            </span>
                          )}
                        </div>

                        {/* Population Telemetry */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          <span>POPULATION:</span>
                          <span style={{ fontWeight: 700, color: occPercent > 90 ? 'var(--hazard)' : (occPercent > 70 ? 'var(--warning)' : 'var(--text-main)') }}>
                            {zone.current_population.toLocaleString()} {zone.capacity > 0 ? `/ ${zone.capacity.toLocaleString()}` : ''}
                          </span>
                        </div>

                        {/* Capacity Gauge Bar */}
                        {zone.capacity > 0 && (
                          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${occPercent}%`,
                              height: '100%',
                              background: occPercent > 90 ? 'var(--hazard)' : (occPercent > 70 ? 'var(--warning)' : (zone.type === 'safe_zone' ? 'var(--success)' : 'var(--telemetry)'))
                            }} />
                          </div>
                        )}
                      </div>

                      {/* Bottom Deck: Resources & Active Incidents */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginTop: '4px'
                      }}>
                        {/* LAYER: Stationed Resources */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {showResources && zoneResources.map(res => {
                            const isResTargeted = selectedStrategy?.actions.some(a => a.resource_id === res.id);
                            return (
                              <div 
                                key={res.id}
                                onMouseEnter={() => setHoveredResource(res.id)}
                                onMouseLeave={() => setHoveredResource(null)}
                                style={{
                                  padding: '2px 5px',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  borderRadius: '3px',
                                  background: isResTargeted ? 'var(--accent)' : 'rgba(0, 229, 255, 0.12)',
                                  color: isResTargeted ? '#000' : 'var(--telemetry)',
                                  border: `1px solid ${isResTargeted ? 'var(--accent)' : 'rgba(0, 229, 255, 0.4)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer',
                                  boxShadow: isResTargeted ? '0 0 8px rgba(255,183,77,0.5)' : 'none'
                                }}
                                title={`${res.id.toUpperCase()} - ${res.type.toUpperCase()} (${res.status.toUpperCase()})`}
                              >
                                <span>{getResourceIcon(res.type)}</span>
                                <span>{res.id.replace('r_', '').toUpperCase()}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* LAYER: Incident Badges */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {showIncidents && zoneIncidents.map(inc => (
                            <div 
                              key={inc.id}
                              onMouseEnter={() => setHoveredIncident(inc.id)}
                              onMouseLeave={() => setHoveredIncident(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 6px',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                borderRadius: '3px',
                                background: inc.type === 'fire' || inc.type === 'blocked_exit' ? 'var(--hazard-dark)' : 'rgba(255, 145, 0, 0.25)',
                                color: inc.type === 'fire' || inc.type === 'blocked_exit' ? 'var(--hazard)' : 'var(--warning)',
                                border: `1px solid ${inc.type === 'fire' || inc.type === 'blocked_exit' ? 'var(--hazard)' : 'var(--warning)'}`,
                                cursor: 'pointer',
                                boxShadow: '0 0 8px rgba(255,23,68,0.3)'
                              }}
                              title={`[SEV ${inc.severity}] ${inc.description}`}
                            >
                              <span>{getIncidentIcon(inc.type)}</span>
                              <span>SEV {inc.severity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Interactive Tactical Inspection Tooltip */}
        {hoveredIncident && state.incidents[hoveredIncident] && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(10,12,18,0.95)', border: '1px solid var(--hazard)', padding: '0.5rem 0.75rem', borderRadius: '4px', maxWidth: '320px', zIndex: 30, backdropFilter: 'blur(6px)', fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--hazard)', fontWeight: 700 }}>
              <span>{getIncidentIcon(state.incidents[hoveredIncident].type)}</span>
              <span>{hoveredIncident.toUpperCase()} — SEVERITY {state.incidents[hoveredIncident].severity}/10</span>
            </div>
            <div style={{ marginTop: '0.25rem', color: 'var(--text-main)', fontSize: '0.65rem' }}>
              {state.incidents[hoveredIncident].description}
            </div>
            <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.6rem' }}>
              SECTOR: {state.incidents[hoveredIncident].zone_id.toUpperCase()} • STATUS: {state.incidents[hoveredIncident].status.toUpperCase()}
            </div>
          </div>
        )}

        {hoveredResource && state.resources[hoveredResource] && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(10,12,18,0.95)', border: '1px solid var(--telemetry)', padding: '0.5rem 0.75rem', borderRadius: '4px', maxWidth: '300px', zIndex: 30, backdropFilter: 'blur(6px)', fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--telemetry)', fontWeight: 700 }}>
              <span>{getResourceIcon(state.resources[hoveredResource].type)}</span>
              <span>UNIT {hoveredResource.toUpperCase()} ({state.resources[hoveredResource].type.toUpperCase()})</span>
            </div>
            <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              ASSIGNED: {state.resources[hoveredResource].current_zone_id?.toUpperCase() || 'UNASSIGNED'} • STATUS: {state.resources[hoveredResource].status.toUpperCase()}
            </div>
          </div>
        )}

        {/* Tactical Legend Box */}
        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(5,5,8,0.85)', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', backdropFilter: 'blur(4px)', zIndex: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--hazard)', borderRadius: '2px' }}></div> CRITICAL HAZARD</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '2px' }}></div> WARNING / SURGE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--success)', borderRadius: '2px' }}></div> SAFE / AVAILABLE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '2px' }}></div> DECISION PATH</div>
        </div>
      </div>
    </div>
  );
};
