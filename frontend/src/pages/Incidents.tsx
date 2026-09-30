import React, { useEffect, useState, useMemo } from 'react';
import type { AppState, ScenarioDefinition } from '../types/domain';
import { api } from '../services/api';
import { IncidentDetailPanel } from '../components/incidents/IncidentDetailPanel';

export const Incidents: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // View Controls
  const [filter, setFilter] = useState<string>('ALL'); // ALL, CRITICAL, HIGH, MEDIUM, MITIGATING, RESOLVED
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<'severity_desc' | 'severity_asc' | 'newest' | 'oldest'>('severity_desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const [stateData, scenariosData] = await Promise.all([
        api.getState(),
        api.getScenarios()
      ]);
      setState(stateData);
      setScenarios(scenariosData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to synchronize incident state.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchState();
  };

  // Derive Current Scenario (Best effort based on active incidents/zones if not explicitly provided)
  const currentScenario = useMemo(() => {
    if (!state || scenarios.length === 0) return null;
    // Attempt to match by finding a scenario whose initial zones match the current state zones
    const stateZoneIds = Object.keys(state.zones).sort().join(',');
    const match = scenarios.find(s => Object.keys(s.initial_state.zones).sort().join(',') === stateZoneIds);
    return match ? match.name : "LIVE FEED";
  }, [state, scenarios]);

  // Telemetry Calculation
  const telemetry = useMemo(() => {
    if (!state) return { active: 0, critical: 0, high: 0, medium: 0, low: 0, mitigating: 0, resolved: 0 };
    const incs = Object.values(state.incidents);
    return {
      active: incs.filter(i => i.status === 'active').length,
      critical: incs.filter(i => i.severity >= 8 && i.status !== 'resolved').length,
      high: incs.filter(i => i.severity >= 5 && i.severity < 8 && i.status !== 'resolved').length,
      medium: incs.filter(i => i.severity >= 3 && i.severity < 5 && i.status !== 'resolved').length,
      low: incs.filter(i => i.severity < 3 && i.status !== 'resolved').length,
      mitigating: incs.filter(i => i.status === 'mitigating').length,
      resolved: incs.filter(i => i.status === 'resolved').length,
    };
  }, [state]);

  // Derived filtered & sorted incidents
  const processedIncidents = useMemo(() => {
    if (!state) return [];
    let incs = Object.values(state.incidents);

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      incs = incs.filter(i => 
        i.id.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (state.zones[i.zone_id] && state.zones[i.zone_id].name.toLowerCase().includes(q))
      );
    }

    // 2. Status/Severity Filter
    if (filter !== 'ALL') {
      if (filter === 'CRITICAL') incs = incs.filter(i => i.severity >= 8 && i.status !== 'resolved');
      else if (filter === 'HIGH') incs = incs.filter(i => i.severity >= 5 && i.severity < 8 && i.status !== 'resolved');
      else if (filter === 'MEDIUM') incs = incs.filter(i => i.severity >= 3 && i.severity < 5 && i.status !== 'resolved');
      else if (filter === 'MITIGATING') incs = incs.filter(i => i.status === 'mitigating');
      else if (filter === 'RESOLVED') incs = incs.filter(i => i.status === 'resolved');
    }

    // 3. Sort
    incs.sort((a, b) => {
      if (sort === 'severity_desc') return b.severity - a.severity;
      if (sort === 'severity_asc') return a.severity - b.severity;
      if (sort === 'newest') return b.id.localeCompare(a.id); // Hack for newest since no timestamps
      if (sort === 'oldest') return a.id.localeCompare(b.id);
      return 0;
    });

    return incs;
  }, [state, search, filter, sort]);

  // Helper styles
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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>INITIALIZING INCIDENT TELEMETRY...</div>;
  }

  if (error || !state) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--hazard)' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>ERROR</h2>
        <p>{error || "State unavailable."}</p>
        <button className="btn" onClick={handleRefresh} style={{ marginTop: '1rem' }}>RETRY</button>
      </div>
    );
  }

  const selectedIncident = selectedId ? state.incidents[selectedId] : null;

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: selectedIncident ? '1fr 400px' : '1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-panel-light)' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--hazard)' }}>⚠</span> INCIDENT COMMAND
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '1px' }}>THREAT DETECTION & EVENT MANAGEMENT</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-panel-nested)', padding: '0.5rem 1rem', borderRadius: 4, border: '1px solid var(--border)' }}>
              <span style={{ letterSpacing: '0.5px' }}>ENVIRONMENT: <strong style={{ color: 'var(--text-main)', letterSpacing: '1px' }}>{currentScenario?.toUpperCase()}</strong></span>
              <div style={{ width: 1, height: '1rem', background: 'var(--border)' }}></div>
              <span style={{ letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
                SYSTEM STATUS: <strong style={{ color: 'var(--success)', letterSpacing: '1px' }}>OPERATIONAL</strong>
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right', background: 'var(--bg-panel-nested)', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>ACTIVE EVENTS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{telemetry.active + telemetry.mitigating}</div>
              </div>
              <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-light)', textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>CRITICAL</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--hazard)', lineHeight: 1, textShadow: telemetry.critical > 0 ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none' }}>{telemetry.critical}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 10 }}>
          {[
            { label: 'ACTIVE', count: telemetry.active, color: 'var(--hazard)' },
            { label: 'CRITICAL', count: telemetry.critical, color: 'var(--hazard)' },
            { label: 'HIGH', count: telemetry.high, color: 'var(--warning)' },
            { label: 'MEDIUM', count: telemetry.medium, color: 'var(--telemetry)' },
            { label: 'MITIGATING', count: telemetry.mitigating, color: 'var(--warning)' },
            { label: 'RESOLVED', count: telemetry.resolved, color: 'var(--success)' },
          ].map((stat, idx) => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: idx === 5 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: stat.count > 0 ? stat.color : 'var(--text-muted)', textShadow: stat.count > 0 && stat.color !== 'var(--text-main)' ? `0 0 10px ${stat.color}40` : 'none' }}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* CONTROLS (Filter, Search, Sort) */}
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-base)' }}>
          
          <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', background: 'var(--bg-panel-nested)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'MITIGATING', 'RESOLVED'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{ 
                  background: filter === f ? 'var(--accent)' : 'transparent',
                  color: filter === f ? '#000' : 'var(--text-main)',
                  border: 'none',
                  padding: '0.35rem 1rem',
                  fontSize: '0.7rem',
                  fontWeight: filter === f ? 700 : 500,
                  letterSpacing: '0.5px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>⌕</span>
              <input 
                type="text" 
                placeholder="SEARCH INCIDENTS..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mono"
                style={{
                  background: 'var(--bg-panel-nested)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '0.75rem',
                  width: '260px',
                  borderRadius: 4,
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="mono"
              style={{
                background: 'var(--bg-panel-nested)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                borderRadius: 4,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="severity_desc">SEVERITY (HIGH-LOW)</option>
              <option value="severity_asc">SEVERITY (LOW-HIGH)</option>
              <option value="newest">NEWEST FIRST</option>
              <option value="oldest">OLDEST FIRST</option>
            </select>

            <button 
              className="btn btn-accent" 
              onClick={handleRefresh} 
              disabled={refreshing}
              style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {refreshing ? (
                <><span className="blink">↻</span> SYNCING...</>
              ) : (
                <><span>↻</span> REFRESH</>
              )}
            </button>
          </div>
        </div>

        {/* MAIN INCIDENT TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', background: 'var(--bg-base)' }}>
          {processedIncidents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <div style={{ opacity: 0.3, fontSize: '3rem' }}>✓</div>
              <span style={{ letterSpacing: '1px' }}>NO INCIDENTS MATCHING CRITERIA</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '100px 180px 180px 100px 1fr 100px', 
                gap: '1.5rem', 
                padding: '0 1rem 0.75rem 1rem', 
                borderBottom: '1px solid var(--border)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                <div>SEVERITY</div>
                <div>INCIDENT</div>
                <div>LOCATION</div>
                <div>STATUS</div>
                <div>DESCRIPTION</div>
                <div style={{ textAlign: 'right' }}>ACTION</div>
              </div>

              {/* Rows */}
              {processedIncidents.map(inc => {
                const zone = state.zones[inc.zone_id];
                const isSelected = selectedId === inc.id;

                return (
                  <div 
                    key={inc.id}
                    className="interactive-row panel-nested"
                    onClick={() => setSelectedId(inc.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 180px 180px 100px 1fr 100px',
                      gap: '1.5rem',
                      padding: '1.25rem 1rem',
                      background: isSelected ? 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                      borderLeft: `3px solid ${isSelected ? 'var(--accent)' : getSeverityColor(inc.severity)}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Background warning glow for critical incidents */}
                    {inc.severity >= 8 && inc.status !== 'resolved' && !isSelected && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: `linear-gradient(90deg, var(--hazard), transparent)`, opacity: 0.05, pointerEvents: 'none' }}></div>
                    )}
                    
                    {/* Severity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: getSeverityColor(inc.severity), letterSpacing: '0.5px' }}>
                        {getSeverityLabel(inc.severity)}
                      </span>
                    </div>

                    {/* Incident Type */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)' }}>
                      {inc.type.replace('_', ' ')}
                    </div>

                    {/* Location */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.4rem' }} title={zone?.name}>
                      <span style={{ color: 'var(--text-muted)' }}>📍</span> {zone ? zone.name : inc.zone_id}
                    </div>

                    {/* Status */}
                    <div className="mono" style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: getStatusColor(inc.status),
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(inc.status), boxShadow: `0 0 8px ${getStatusColor(inc.status)}` }} className={inc.status === 'active' ? 'blink' : ''}></div>
                      {inc.status}
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.description}
                    </div>

                    {/* Action */}
                    <div style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ 
                        background: isSelected ? 'var(--accent)' : 'transparent', 
                        color: isSelected ? '#000' : 'var(--accent)',
                        borderColor: 'var(--accent)',
                        padding: '0.4rem 1rem',
                        fontSize: '0.7rem'
                      }}>
                        {isSelected ? 'INSPECTING' : 'INSPECT →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Incident Details */}
      {selectedIncident && (
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-panel-light)', height: '100%', overflowY: 'auto' }}>
          <IncidentDetailPanel 
            incident={selectedIncident} 
            state={state} 
            onClose={() => setSelectedId(null)} 
          />
        </div>
      )}
    </div>
  );
};
