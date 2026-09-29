import React from 'react';
import type { AppState, Incident } from '../../types/domain';

interface Props {
  incident: Incident;
  state: AppState;
  onClose: () => void;
}

export const IncidentDetailPanel: React.FC<Props> = ({ incident, state, onClose }) => {
  const zone = state.zones[incident.zone_id];
  
  // Find resources in the same zone
  const relatedResources = Object.values(state.resources).filter(
    (res) => res.current_zone_id === incident.zone_id
  );

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'var(--hazard)';
    if (severity >= 5) return 'var(--warning)';
    return 'var(--telemetry)';
  };
  
  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'CRITICAL';
    if (severity >= 5) return 'HIGH';
    if (severity >= 3) return 'MEDIUM';
    return 'LOW';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'var(--hazard)';
      case 'mitigating': return 'var(--warning)';
      case 'resolved': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const popRatio = zone && zone.capacity > 0 ? (zone.current_population / zone.capacity) * 100 : 0;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border)' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>INCIDENT DETAILS</span>
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>
              {incident.type.replace('_', ' ')}
            </h2>
            <div style={{ 
              padding: '0.25rem 0.5rem', 
              border: `1px solid ${getSeverityColor(incident.severity)}`,
              color: getSeverityColor(incident.severity),
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '2px',
              background: `${getSeverityColor(incident.severity)}20`
            }}>
              {getSeverityLabel(incident.severity)} (SEV {incident.severity})
            </div>
          </div>
          
          <div className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ID: {incident.id.toUpperCase()} | DETECTED: T+0:00
          </div>
        </div>

        {/* Status & Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CURRENT STATUS</div>
            <div style={{ 
              color: getStatusColor(incident.status), 
              fontWeight: 700, 
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: getStatusColor(incident.status) 
              }} />
              {incident.status}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>LOCATION</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {zone ? zone.name : incident.zone_id}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DESCRIPTION</div>
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '4px',
            lineHeight: 1.5,
            fontSize: '0.9rem'
          }}>
            {incident.description}
          </div>
        </div>

        {/* Affected Zone Data */}
        {zone && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AFFECTED ZONE TELEMETRY</div>
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '4px'
            }}>
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

        {/* Related Resources */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RESOURCES IN ZONE</div>
          {relatedResources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {relatedResources.map(res => (
                <div key={res.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.5rem', 
                  border: '1px solid var(--border-light)',
                  background: 'rgba(0, 229, 255, 0.05)',
                  borderRadius: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {res.type === 'fire' ? '🚒' : res.type === 'medical' ? '🚑' : '🛡'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{res.id.toUpperCase()}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{res.type}</div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '2px',
                    background: res.status === 'dispatched' ? 'var(--warning-dark)' : 'var(--telemetry-dark)',
                    color: res.status === 'dispatched' ? 'var(--warning)' : 'var(--telemetry)',
                    border: `1px solid ${res.status === 'dispatched' ? 'var(--warning)' : 'var(--telemetry)'}`
                  }}>
                    {res.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }}>
              No resources currently positioned in this zone.
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>INCIDENT TIMELINE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', paddingLeft: '0.5rem' }}>
            <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-light)' }} />
            
            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--hazard)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Incident Detected</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Initial automated alert received from sector sensors.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--telemetry)', marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Situation Analyzed</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Severity assessed as {getSeverityLabel(incident.severity)} (Level {incident.severity}).</div>
              </div>
            </div>
            
            {incident.status !== 'active' && (
               <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
               <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg-main)', border: `2px solid ${getStatusColor(incident.status)}`, marginTop: '2px' }} />
               <div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status Updated: {incident.status.toUpperCase()}</div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Response actions are affecting the incident state.</div>
               </div>
             </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
