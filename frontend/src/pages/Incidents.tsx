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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>LOADING INCIDENT TELEMETRY...</div>;
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
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px' }}>INCIDENT COMMAND</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>CURRENT SCENARIO: <strong style={{ color: 'var(--text-main)' }}>{currentScenario}</strong></span>
              <span>SYSTEM STATUS: <strong style={{ color: 'var(--success)' }}>OPERATIONAL</strong></span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>ACTIVE INCIDENTS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{telemetry.active + telemetry.mitigating}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>CRITICAL</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--hazard)', lineHeight: 1 }}>{telemetry.critical}</div>
            </div>
          </div>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'ACTIVE', count: telemetry.active, color: 'var(--hazard)' },
            { label: 'CRITICAL', count: telemetry.critical, color: 'var(--hazard)' },
            { label: 'HIGH', count: telemetry.high, color: 'var(--warning)' },
            { label: 'MEDIUM', count: telemetry.medium, color: 'var(--telemetry)' },
            { label: 'MITIGATING', count: telemetry.mitigating, color: 'var(--warning)' },
            { label: 'RESOLVED', count: telemetry.resolved, color: 'var(--success)' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: stat.count > 0 ? stat.color : 'var(--text-muted)' }}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* CONTROLS (Filter, Search, Sort) */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'MITIGATING', 'RESOLVED'].map(f => (
              <button 
                key={f}
                className="btn"
                onClick={() => setFilter(f)}
                style={{ 
                  background: filter === f ? 'var(--accent)' : 'transparent',
                  color: filter === f ? '#000' : 'var(--text-main)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.7rem'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="SEARCH INCIDENTS..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mono"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                width: '250px',
                outline: 'none'
              }}
            />
            
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="mono"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
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
              className="btn" 
              onClick={handleRefresh} 
              disabled={refreshing}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {refreshing ? '...' : 'REFRESH'}
            </button>
          </div>
        </div>

        {/* MAIN INCIDENT TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {processedIncidents.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              EMPTY: No incidents match the current criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '100px 150px 200px 100px 1fr 100px', 
                gap: '1rem', 
                padding: '0 1rem 0.5rem 1rem', 
                borderBottom: '1px solid var(--border)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)'
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
                    onClick={() => setSelectedId(inc.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 150px 200px 100px 1fr 100px',
                      gap: '1rem',
                      padding: '1rem',
                      background: isSelected ? 'rgba(255, 183, 77, 0.05)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Severity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '4px', height: '16px', background: getSeverityColor(inc.severity), borderRadius: '2px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getSeverityColor(inc.severity) }}>
                        {getSeverityLabel(inc.severity)}
                      </span>
                    </div>

                    {/* Incident Type */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {inc.type.replace('_', ' ')}
                    </div>

                    {/* Location */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={zone?.name}>
                      {zone ? zone.name : inc.zone_id}
                    </div>

                    {/* Status */}
                    <div style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      color: getStatusColor(inc.status),
                      textTransform: 'uppercase'
                    }}>
                      {inc.status}
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.description}
                    </div>

                    {/* Action */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
                        {isSelected ? 'INSPECTING' : 'INSPECT →'}
                      </span>
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
        <IncidentDetailPanel 
          incident={selectedIncident} 
          state={state} 
          onClose={() => setSelectedId(null)} 
        />
      )}
    </div>
  );
};
