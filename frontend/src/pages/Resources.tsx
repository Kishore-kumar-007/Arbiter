import React, { useEffect, useState, useMemo } from 'react';
import type { AppState, ScenarioDefinition } from '../types/domain';
import { api } from '../services/api';
import { ResourceDetailPanel } from '../components/resources/ResourceDetailPanel';

export const Resources: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // View Controls
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, AVAILABLE, DEPLOYED
  const [typeFilter, setTypeFilter] = useState<string>('ALL TYPES'); // ALL TYPES, MEDICAL, FIRE, SECURITY
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<'status' | 'type' | 'id' | 'location'>('status');
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
      setError("Unable to synchronize resource state.");
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

  // Derive Current Scenario
  const currentScenario = useMemo(() => {
    if (!state || scenarios.length === 0) return null;
    const stateZoneIds = Object.keys(state.zones).sort().join(',');
    const match = scenarios.find(s => Object.keys(s.initial_state.zones).sort().join(',') === stateZoneIds);
    return match ? match.name : "LIVE FEED";
  }, [state, scenarios]);

  // Telemetry Calculation
  const telemetry = useMemo(() => {
    if (!state) return { total: 0, available: 0, deployed: 0, medical: 0, fire: 0, security: 0, availPercent: 0 };
    const resList = Object.values(state.resources);
    const total = resList.length;
    const available = resList.filter(r => r.status === 'available').length;
    const deployed = total - available; // anything not available is considered deployed for this dashboard
    
    return {
      total,
      available,
      deployed,
      medical: resList.filter(r => r.type === 'medical').length,
      fire: resList.filter(r => r.type === 'fire').length,
      security: resList.filter(r => r.type === 'security').length,
      availPercent: total > 0 ? Math.round((available / total) * 100) : 0
    };
  }, [state]);

  const capacityPressure = useMemo(() => {
    if (telemetry.availPercent < 20) return { label: 'CRITICAL', color: 'var(--hazard)' };
    if (telemetry.availPercent < 50) return { label: 'CONSTRAINED', color: 'var(--warning)' };
    return { label: 'HEALTHY', color: 'var(--success)' };
  }, [telemetry]);

  // Derived filtered & sorted resources
  const processedResources = useMemo(() => {
    if (!state) return [];
    let resList = Object.values(state.resources);

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      resList = resList.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.current_zone_id && state.zones[r.current_zone_id]?.name.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'AVAILABLE') resList = resList.filter(r => r.status === 'available');
      if (statusFilter === 'DEPLOYED') resList = resList.filter(r => r.status !== 'available');
    }

    // 3. Type Filter
    if (typeFilter !== 'ALL TYPES') {
      resList = resList.filter(r => r.type.toUpperCase() === typeFilter);
    }

    // 4. Sort
    resList.sort((a, b) => {
      if (sort === 'status') {
        const aDeployed = a.status !== 'available';
        const bDeployed = b.status !== 'available';
        if (aDeployed !== bDeployed) return aDeployed ? -1 : 1; // deployed first
        return a.id.localeCompare(b.id);
      }
      if (sort === 'type') {
        const typeCmp = a.type.localeCompare(b.type);
        if (typeCmp !== 0) return typeCmp;
        return a.id.localeCompare(b.id);
      }
      if (sort === 'id') {
        return a.id.localeCompare(b.id);
      }
      if (sort === 'location') {
        const aLoc = (a.current_zone_id && state.zones[a.current_zone_id]) ? state.zones[a.current_zone_id].name : '';
        const bLoc = (b.current_zone_id && state.zones[b.current_zone_id]) ? state.zones[b.current_zone_id].name : '';
        const locCmp = aLoc.localeCompare(bLoc);
        if (locCmp !== 0) return locCmp;
        return a.id.localeCompare(b.id);
      }
      return 0;
    });

    return resList;
  }, [state, search, statusFilter, typeFilter, sort]);

  // Helper styling
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'var(--success)';
      case 'dispatched': return 'var(--warning)';
      case 'en_route': return 'var(--accent)';
      default: return 'var(--telemetry)';
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'available' ? 'AVAILABLE' : 'DEPLOYED';
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>INITIALIZING RESOURCE TELEMETRY...</div>;
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

  const selectedResource = selectedId ? state.resources[selectedId] : null;

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: selectedResource ? '1fr 400px' : '1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-panel-light)' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)' }}>⛊</span> RESOURCE COMMAND
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '1px' }}>RESPONSE CAPACITY & UNIT STATUS MATRIX</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-panel-nested)', padding: '0.5rem 1rem', borderRadius: 4, border: '1px solid var(--border)' }}>
              <span style={{ letterSpacing: '0.5px' }}>ENVIRONMENT: <strong style={{ color: 'var(--text-main)', letterSpacing: '1px' }}>{currentScenario?.toUpperCase()}</strong></span>
              <div style={{ width: 1, height: '1rem', background: 'var(--border)' }}></div>
              <span style={{ letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
                SYSTEM STATUS: <strong style={{ color: 'var(--success)', letterSpacing: '1px' }}>NOMINAL</strong>
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right', background: 'var(--bg-panel-nested)', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>RESOURCE PRESSURE METRICS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>{telemetry.available} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {telemetry.total}</span></span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--success)', letterSpacing: '1px', marginTop: '0.2rem' }}>AVAILABLE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{telemetry.deployed} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {telemetry.total}</span></span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--warning)', letterSpacing: '1px', marginTop: '0.2rem' }}>DEPLOYED</span>
                </div>
                <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: capacityPressure.color, textShadow: capacityPressure.color === 'var(--hazard)' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>{capacityPressure.label}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '1px', marginTop: '0.2rem' }}>NETWORK CAPACITY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 10 }}>
          {[
            { label: 'TOTAL UNITS', count: telemetry.total, color: 'var(--text-main)' },
            { label: 'AVAILABLE', count: telemetry.available, color: 'var(--success)' },
            { label: 'DEPLOYED', count: telemetry.deployed, color: 'var(--warning)' },
            { label: 'MEDICAL', count: telemetry.medical, color: 'var(--telemetry)' },
            { label: 'FIRE', count: telemetry.fire, color: 'var(--hazard)' },
            { label: 'SECURITY', count: telemetry.security, color: 'var(--accent)' },
            { label: 'AVAILABILITY', count: `${telemetry.availPercent}%`, color: capacityPressure.color },
          ].map((stat, idx) => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: idx === 6 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: stat.color, textShadow: stat.color !== 'var(--text-main)' ? `0 0 10px ${stat.color}40` : 'none' }}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* CONTROLS (Filter, Search, Sort) */}
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-base)' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-panel-nested)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL', 'AVAILABLE', 'DEPLOYED'].map(f => (
                <button 
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{ 
                    background: statusFilter === f ? 'var(--accent)' : 'transparent',
                    color: statusFilter === f ? '#000' : 'var(--text-main)',
                    border: 'none',
                    padding: '0.35rem 1rem',
                    fontSize: '0.7rem',
                    fontWeight: statusFilter === f ? 700 : 500,
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

            {/* Type Filters */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-panel-nested)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL TYPES', 'MEDICAL', 'FIRE', 'SECURITY'].map(f => (
                <button 
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{ 
                    background: typeFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: typeFilter === f ? 'var(--text-main)' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.35rem 1rem',
                    fontSize: '0.7rem',
                    fontWeight: typeFilter === f ? 700 : 500,
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
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>⌕</span>
              <input 
                type="text" 
                placeholder="SEARCH UNITS..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mono"
                style={{
                  background: 'var(--bg-panel-nested)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '0.75rem',
                  width: '240px',
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
              <option value="status">SORT: STATUS</option>
              <option value="type">SORT: TYPE</option>
              <option value="id">SORT: UNIT ID</option>
              <option value="location">SORT: LOCATION</option>
            </select>

            <button 
              className="btn btn-accent" 
              onClick={handleRefresh} 
              disabled={refreshing}
              style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {refreshing ? (
                <><span className="blink">↻</span> SYNCHRONIZING...</>
              ) : (
                <><span>↻</span> REFRESH STATE</>
              )}
            </button>
          </div>
        </div>

        {/* MAIN RESOURCE TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', background: 'var(--bg-base)' }}>
          {processedResources.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <div style={{ opacity: 0.3, fontSize: '3rem' }}>⛊</div>
              <span style={{ letterSpacing: '1px' }}>NO RESOURCES MATCHING CURRENT FILTERS</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 100px 140px 1fr 1fr 120px', 
                gap: '1.5rem', 
                padding: '0 1rem 0.75rem 1rem', 
                borderBottom: '1px solid var(--border)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}>
                <div>STATUS</div>
                <div>UNIT ID</div>
                <div>CLASSIFICATION</div>
                <div>CURRENT SECTOR</div>
                <div>ACTIVE ASSIGNMENT</div>
                <div style={{ textAlign: 'right' }}>ACTION</div>
              </div>

              {/* Rows */}
              {processedResources.map(res => {
                const zone = res.current_zone_id ? state.zones[res.current_zone_id] : null;
                const isSelected = selectedId === res.id;
                
                // Purely derived assignment logic as per constraints
                const assignmentText = res.status === 'available' ? 'UNASSIGNED / STANDBY' : 'ACTIVE RESPONSE';
                const assignmentColor = res.status === 'available' ? 'var(--text-muted)' : 'var(--text-main)';

                return (
                  <div 
                    key={res.id}
                    className="interactive-row panel-nested"
                    onClick={() => setSelectedId(res.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 100px 140px 1fr 1fr 120px',
                      gap: '1.5rem',
                      padding: '1.25rem 1rem',
                      background: isSelected ? 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                      borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(res.status), boxShadow: `0 0 8px ${getStatusColor(res.status)}` }} className={res.status !== 'available' ? 'blink' : ''} />
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: getStatusColor(res.status), letterSpacing: '0.5px' }}>
                        {getStatusLabel(res.status)}
                      </span>
                    </div>

                    {/* Unit ID */}
                    <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '1px' }}>
                      {res.id.toUpperCase()}
                    </div>

                    {/* Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ background: 'var(--bg-panel-nested)', border: '1px solid var(--border)' }}>{res.type}</span>
                    </div>

                    {/* Location */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.4rem' }} title={zone?.name}>
                      <span style={{ color: 'var(--text-muted)' }}>📍</span> {zone ? zone.name : (res.current_zone_id || 'UNKNOWN')}
                    </div>

                    {/* Assignment */}
                    <div className="mono" style={{ fontSize: '0.75rem', fontWeight: res.status === 'available' ? 400 : 700, color: assignmentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {assignmentText}
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

      {/* RIGHT COLUMN: Resource Details */}
      {selectedResource && (
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-panel-light)', height: '100%', overflowY: 'auto' }}>
          <ResourceDetailPanel 
            resource={selectedResource} 
            state={state} 
            onClose={() => setSelectedId(null)} 
          />
        </div>
      )}
    </div>
  );
};
