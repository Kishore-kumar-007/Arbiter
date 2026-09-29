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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>LOADING RESOURCE TELEMETRY...</div>;
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
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px' }}>RESOURCE COMMAND</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>RESPONSE CAPACITY & UNIT STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>ACTIVE SCENARIO: <strong style={{ color: 'var(--text-main)' }}>{currentScenario}</strong></span>
              <span>SYSTEM STATUS: <strong style={{ color: 'var(--success)' }}>OPERATIONAL</strong></span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>RESOURCE PRESSURE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{telemetry.available} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {telemetry.total}</span></span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>AVAILABLE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)' }}>{telemetry.deployed} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {telemetry.total}</span></span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>DEPLOYED</span>
                </div>
                <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: capacityPressure.color }}>{capacityPressure.label}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>NETWORK CAPACITY</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'TOTAL UNITS', count: telemetry.total, color: 'var(--text-main)' },
            { label: 'AVAILABLE', count: telemetry.available, color: 'var(--success)' },
            { label: 'DEPLOYED', count: telemetry.deployed, color: 'var(--warning)' },
            { label: 'MEDICAL', count: telemetry.medical, color: 'var(--telemetry)' },
            { label: 'FIRE', count: telemetry.fire, color: 'var(--hazard)' },
            { label: 'SECURITY', count: telemetry.security, color: 'var(--accent)' },
            { label: 'AVAILABILITY', count: `${telemetry.availPercent}%`, color: capacityPressure.color },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: stat.color }}>{stat.count}</span>
            </div>
          ))}
        </div>

        {/* CONTROLS (Filter, Search, Sort) */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL', 'AVAILABLE', 'DEPLOYED'].map(f => (
                <button 
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{ 
                    background: statusFilter === f ? 'var(--accent)' : 'transparent',
                    color: statusFilter === f ? '#000' : 'var(--text-main)',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: statusFilter === f ? 700 : 400,
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL TYPES', 'MEDICAL', 'FIRE', 'SECURITY'].map(f => (
                <button 
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{ 
                    background: typeFilter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: 'var(--text-main)',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: typeFilter === f ? 700 : 400,
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="SEARCH UNITS..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mono"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                width: '200px',
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
              <option value="status">SORT: STATUS</option>
              <option value="type">SORT: TYPE</option>
              <option value="id">SORT: UNIT ID</option>
              <option value="location">SORT: LOCATION</option>
            </select>

            <button 
              className="btn" 
              onClick={handleRefresh} 
              disabled={refreshing}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {refreshing ? 'SYNCHRONIZING...' : 'REFRESH STATE'}
            </button>
          </div>
        </div>

        {/* MAIN RESOURCE TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {processedResources.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              EMPTY: No response units available matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Table Header */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 80px 120px 1fr 1fr 100px', 
                gap: '1rem', 
                padding: '0 1rem 0.5rem 1rem', 
                borderBottom: '1px solid var(--border)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)'
              }}>
                <div>STATUS</div>
                <div>UNIT</div>
                <div>TYPE</div>
                <div>CURRENT LOCATION</div>
                <div>CURRENT ASSIGNMENT</div>
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
                    onClick={() => setSelectedId(res.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 80px 120px 1fr 1fr 100px',
                      gap: '1rem',
                      padding: '1rem',
                      background: isSelected ? 'rgba(0, 229, 255, 0.05)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(res.status) }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getStatusColor(res.status) }}>
                        {getStatusLabel(res.status)}
                      </span>
                    </div>

                    {/* Unit ID */}
                    <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {res.id.toUpperCase()}
                    </div>

                    {/* Type */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {res.type}
                    </div>

                    {/* Location */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={zone?.name}>
                      {zone ? zone.name : (res.current_zone_id || 'UNKNOWN')}
                    </div>

                    {/* Assignment */}
                    <div style={{ fontSize: '0.75rem', fontWeight: res.status === 'available' ? 400 : 700, color: assignmentColor, textTransform: 'uppercase' }}>
                      {assignmentText}
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

      {/* RIGHT COLUMN: Resource Details */}
      {selectedResource && (
        <ResourceDetailPanel 
          resource={selectedResource} 
          state={state} 
          onClose={() => setSelectedId(null)} 
        />
      )}
    </div>
  );
};
