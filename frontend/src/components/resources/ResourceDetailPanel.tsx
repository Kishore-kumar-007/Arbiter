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
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border)' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>RESOURCE INTELLIGENCE</span>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
        >
          ×
        </button>
      </div>
      
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem' }}>{getTypeIcon(resource.type)}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  UNIT {resource.id.replace('r_', '').toUpperCase()}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  {resource.type} RESOURCE
                </div>
              </div>
            </div>
            
            <div style={{ 
              padding: '0.25rem 0.5rem', 
              border: `1px solid ${getStatusColor(resource.status)}`,
              color: getStatusColor(resource.status),
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              background: `${getStatusColor(resource.status)}15`,
              textTransform: 'uppercase'
            }}>
              {resource.status}
            </div>
          </div>
        </div>

        {/* Current Assignment / Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CURRENT ZONE</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {zone ? zone.name : (resource.current_zone_id || 'UNASSIGNED')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CURRENT ASSIGNMENT</div>
            <div style={{ color: resource.status === 'available' ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: 600 }}>
              {resource.status === 'available' ? 'STANDBY / UNASSIGNED' : 'ACTIVE DEPLOYMENT'}
            </div>
          </div>
        </div>

        {/* Zone Context */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DEPLOYMENT SECTOR CONTEXT</div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SECTOR STATUS</span>
                <span style={{ 
                  fontWeight: 700, 
                  textTransform: 'uppercase',
                  color: zone.status === 'critical' ? 'var(--hazard)' : zone.status === 'congested' || zone.status === 'overcrowded' ? 'var(--warning)' : 'var(--success)' 
                }}>
                  {zone.status || 'NORMAL'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>POPULATION</span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {zone.current_population.toLocaleString()} / {zone.capacity > 0 ? zone.capacity.toLocaleString() : '∞'}
                </span>
              </div>
              
              {zone.capacity > 0 && (
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-panel)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, popRatio)}%`, 
                    height: '100%', 
                    background: popRatio > 90 ? 'var(--hazard)' : popRatio > 75 ? 'var(--warning)' : 'var(--telemetry)' 
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Incidents Context */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ACTIVE INCIDENTS IN ZONE</div>
          {zoneIncidents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {zoneIncidents.map(inc => (
                <div key={inc.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem', 
                  border: '1px solid var(--border-light)',
                  background: 'rgba(255, 23, 68, 0.05)',
                  borderRadius: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {inc.type === 'fire' ? '🔥' : inc.type === 'medical_emergency' ? '⚕' : inc.type === 'blocked_exit' ? '🚫' : '👥'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: getSeverityColor(inc.severity) }}>
                        {inc.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inc.description}</div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '2px',
                    background: 'var(--bg-main)',
                    color: getSeverityColor(inc.severity),
                    border: `1px solid ${getSeverityColor(inc.severity)}`,
                    fontWeight: 700
                  }}>
                    SEV {inc.severity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--success)', border: '1px dashed var(--success)', opacity: 0.8, borderRadius: '4px', fontSize: '0.85rem' }}>
              No active incidents detected in current assignment zone.
            </div>
          )}
        </div>
        
        {/* Spatial Location Indicator (Text Based/Mini Map Box) */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SPATIAL POSITION</div>
            <div style={{ 
              padding: '1.5rem', 
              background: '#020203',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Very simplistic radar/grid visual */}
              <svg width="100%" height="80" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <pattern id="minigrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#minigrid)" />
                <circle cx="50%" cy="50%" r="30" fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="60" fill="none" stroke="rgba(0, 229, 255, 0.05)" strokeWidth="1" />
              </svg>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1, background: 'rgba(5,5,8,0.9)', padding: '0.5rem 1rem', borderRadius: '4px', border: `1px solid ${getStatusColor(resource.status)}`, boxShadow: `0 0 10px ${getStatusColor(resource.status)}40` }}>
                <span style={{ color: getStatusColor(resource.status), fontSize: '1.2rem' }}>◎</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOCATED AT</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.5px' }}>{zone.name.toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
