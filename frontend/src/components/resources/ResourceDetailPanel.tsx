import React from 'react';
import type { AppState, Resource } from '../../types/domain';

interface Props {
  resource: Resource;
  state: AppState;
  onClose: () => void;
}

export const ResourceDetailPanel: React.FC<Props> = ({ resource, state, onClose }) => {
  const zone = resource.current_zone_id ? state.zones[resource.current_zone_id] : null;
  
  // Find incidents in the same zone
  const zoneIncidents = resource.current_zone_id ? Object.values(state.incidents).filter(
    (inc) => inc.zone_id === resource.current_zone_id && inc.status !== 'resolved'
  ) : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'var(--success)';
      case 'dispatched': return 'var(--warning)';
      case 'en_route': return 'var(--accent)';
      default: return 'var(--telemetry)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'medical': return '🚑';
      case 'fire': return '🚒';
      case 'security': return '🛡';
      default: return '⚙';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'var(--hazard)';
    if (severity >= 5) return 'var(--warning)';
    return 'var(--telemetry)';
  };

  const popRatio = zone && zone.capacity > 0 ? (zone.current_population / zone.capacity) * 100 : 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'var(--bg-panel)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
          RESOURCE INTELLIGENCE
        </span>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.2rem 0.5rem' }}
        >
          ×
        </button>
      </div>
      
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem' }}>
        
        {/* Header Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: 48, height: 48, 
                borderRadius: '8px', 
                background: 'var(--bg-panel-nested)', 
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {getTypeIcon(resource.type)}
              </div>
              <div>
                <h2 className="mono" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', letterSpacing: '1px' }}>
                  UNIT {resource.id.replace('r_', '').toUpperCase()}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '0.2rem' }}>
                  {resource.type} RESPONSE UNIT
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-panel-nested)', border: `1px solid ${getStatusColor(resource.status)}`, borderRadius: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(resource.status), boxShadow: `0 0 10px ${getStatusColor(resource.status)}` }} className={resource.status !== 'available' ? 'blink' : ''}></div>
            <span className="mono" style={{ color: getStatusColor(resource.status), fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              STATUS: {resource.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Current Assignment / Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="panel-nested" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>CURRENT SECTOR</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9rem' }}>
              {zone ? zone.name : (resource.current_zone_id || 'UNASSIGNED')}
            </div>
          </div>
          <div className="panel-nested" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>ACTIVE ASSIGNMENT</div>
            <div className="mono" style={{ color: resource.status === 'available' ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem' }}>
              {resource.status === 'available' ? 'STANDBY' : 'DEPLOYED'}
            </div>
          </div>
        </div>

        {/* Zone Context */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>SECTOR TELEMETRY</div>
            <div className="panel-nested" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</span>
                <span className="badge" style={{ 
                  background: zone.status === 'critical' ? 'var(--hazard-dark)' : zone.status === 'congested' || zone.status === 'overcrowded' ? 'rgba(255,145,0,0.2)' : 'var(--success-dark)',
                  color: zone.status === 'critical' ? 'var(--hazard)' : zone.status === 'congested' || zone.status === 'overcrowded' ? 'var(--warning)' : 'var(--success)',
                  border: `1px solid ${zone.status === 'critical' ? 'var(--hazard)' : zone.status === 'congested' || zone.status === 'overcrowded' ? 'var(--warning)' : 'var(--success)'}`
                }}>
                  {zone.status || 'NORMAL'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POPULATION LOAD</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span className="mono" style={{ fontWeight: 700, fontSize: '1.2rem', color: popRatio > 90 ? 'var(--hazard)' : 'var(--text-main)' }}>{zone.current_population.toLocaleString()}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {zone.capacity > 0 ? zone.capacity.toLocaleString() : '∞'}</span>
                </div>
              </div>
              
              {zone.capacity > 0 && (
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.5rem' }}>
                  <div style={{ 
                    width: `${Math.min(100, popRatio)}%`, 
                    height: '100%', 
                    background: popRatio > 90 ? 'var(--hazard)' : popRatio > 75 ? 'var(--warning)' : 'var(--telemetry)',
                    boxShadow: `0 0 10px ${popRatio > 90 ? 'var(--hazard)' : popRatio > 75 ? 'var(--warning)' : 'var(--telemetry)'}`
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Incidents Context */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>LOCAL THREAT ENVIRONMENT</div>
          {zoneIncidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {zoneIncidents.map(inc => (
                <div key={inc.id} className="interactive-row" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${getSeverityColor(inc.severity)}`,
                  background: 'var(--bg-panel-nested)',
                  borderRadius: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', opacity: 0.8 }}>
                      {inc.type === 'fire' ? '🔥' : inc.type === 'medical_emergency' ? '⚕' : inc.type === 'blocked_exit' ? '🚫' : '👥'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                        {inc.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{inc.description}</div>
                    </div>
                  </div>
                  <div className="mono" style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '2px',
                    background: 'rgba(0,0,0,0.5)',
                    color: getSeverityColor(inc.severity),
                    border: `1px solid ${getSeverityColor(inc.severity)}`,
                    fontWeight: 700,
                    letterSpacing: '1px'
                  }}>
                    SEV {inc.severity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--success)', border: '1px dashed var(--success)', opacity: 0.7, borderRadius: '4px', fontSize: '0.8rem', background: 'var(--success-dark)' }}>
              No active threats detected in current sector.
            </div>
          )}
        </div>
        
        {/* Spatial Location Indicator (Text Based/Mini Map Box) */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>SPATIAL POSITION</div>
            <div style={{ 
              height: '140px',
              background: '#020203',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Very simplistic radar/grid visual */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <pattern id="minigrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#minigrid)" />
                <circle cx="50%" cy="50%" r="30" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="60" fill="none" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="1" />
                {/* Radar sweep */}
                <path d="M 50% 50% L 50% 0 A 50% 50% 0 0 1 100% 50% Z" fill="url(#radar-gradient)" className="radar-sweep" />
                <defs>
                  <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(0, 229, 255, 0.1)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1, background: 'rgba(5,5,8,0.95)', padding: '0.75rem 1.25rem', borderRadius: '4px', border: `1px solid ${getStatusColor(resource.status)}`, boxShadow: `0 0 15px ${getStatusColor(resource.status)}40` }}>
                <div style={{ position: 'relative', width: 16, height: 16 }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: getStatusColor(resource.status), zIndex: 2 }}></div>
                  <div className="pulse-ring" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200%', height: '200%', borderRadius: '50%', border: `1px solid ${getStatusColor(resource.status)}`, zIndex: 1 }}></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>TRACKING SIGNAL</div>
                  <div className="mono" style={{ fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{zone.name.toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
