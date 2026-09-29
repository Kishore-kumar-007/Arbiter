import React, { useEffect, useState, useMemo } from 'react';
import type { DecisionRecord } from '../types/domain';
import { api } from '../services/api';
import { decisionStore } from '../services/decisionStore';
import { DecisionDetailPanel } from '../components/decisions/DecisionDetailPanel';

interface Props {
  onTabChange?: (tab: string) => void;
}

export const Decisions: React.FC<Props> = ({ onTabChange }) => {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('LIVE FEED');

  // View Controls
  const [filter, setFilter] = useState<string>('ALL'); // ALL, PENDING, APPROVED, REJECTED, MODIFIED
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest_risk' | 'highest_score'>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchContext = async () => {
    try {
      const [stateData, scenariosData] = await Promise.all([
        api.getState(),
        api.getScenarios()
      ]);
      const stateZoneIds = Object.keys(stateData.zones).sort().join(',');
      const match = scenariosData.find(s => Object.keys(s.initial_state.zones).sort().join(',') === stateZoneIds);
      if (match) setActiveScenario(match.name);
    } catch (err) {
      console.error('Failed to sync state for scenario context', err);
    }
  };

  useEffect(() => {
    const updateDecisions = () => {
      setDecisions(decisionStore.getDecisions());
    };
    
    // Subscribe to store
    const unsubscribe = decisionStore.subscribe(updateDecisions);
    
    // Initial load
    updateDecisions();
    fetchContext().finally(() => setLoading(false));

    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app we'd fetch decisions from backend. 
    // Here we just refresh context and force store update.
    await fetchContext();
    setDecisions(decisionStore.getDecisions());
    setRefreshing(false);
  };

  // Telemetry Calculation
  const telemetry = useMemo(() => {
    const total = decisions.length;
    const pending = decisions.filter(d => d.status === 'PENDING').length;
    const approved = decisions.filter(d => d.status === 'APPROVED').length;
    const rejected = decisions.filter(d => d.status === 'REJECTED').length;
    const modified = decisions.filter(d => d.status === 'MODIFIED').length;
    return { total, pending, approved, rejected, modified };
  }, [decisions]);

  // Derived filtered & sorted decisions
  const processedDecisions = useMemo(() => {
    let res = [...decisions];

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(d => 
        d.id.toLowerCase().includes(q) ||
        d.strategy.title.toLowerCase().includes(q) ||
        d.scenario_name.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (filter !== 'ALL') {
      res = res.filter(d => d.status === filter);
    }

    // 3. Sort
    res.sort((a, b) => {
      if (sort === 'newest') return b.id.localeCompare(a.id);
      if (sort === 'oldest') return a.id.localeCompare(b.id);
      if (sort === 'highest_risk') return (b.strategy.projected_risk || 0) - (a.strategy.projected_risk || 0);
      if (sort === 'highest_score') return (b.strategy.score || 0) - (a.strategy.score || 0);
      return 0;
    });

    return res;
  }, [decisions, search, filter, sort]);

  const activePendingDecision = decisions.find(d => d.status === 'PENDING');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--warning)';
      case 'APPROVED': return 'var(--success)';
      case 'REJECTED': return 'var(--hazard)';
      case 'MODIFIED': return 'var(--accent)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>LOADING DECISION STATE...</div>;
  }

  const selectedDecision = selectedId ? decisions.find(d => d.id === selectedId) : null;

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: selectedDecision ? '1fr 450px' : '1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '1px' }}>DECISION COMMAND</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>STRATEGY REVIEW & HUMAN AUTHORIZATION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>CURRENT SCENARIO: <strong style={{ color: 'var(--text-main)' }}>{activeScenario}</strong></span>
              <span>SYSTEM STATUS: <strong style={{ color: 'var(--success)' }}>OPERATIONAL</strong></span>
            </div>
          </div>
          
          <button 
            className="btn" 
            onClick={handleRefresh} 
            disabled={refreshing}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            {refreshing ? 'SYNCHRONIZING...' : 'REFRESH'}
          </button>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'TOTAL DECISIONS', count: telemetry.total, color: 'var(--text-main)' },
            { label: 'PENDING REVIEW', count: telemetry.pending, color: telemetry.pending > 0 ? 'var(--warning)' : 'var(--text-muted)' },
            { label: 'APPROVED', count: telemetry.approved, color: 'var(--success)' },
            { label: 'REJECTED', count: telemetry.rejected, color: 'var(--hazard)' },
            { label: 'MODIFIED', count: telemetry.modified, color: 'var(--accent)' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: stat.count > 0 ? stat.color : 'var(--text-muted)' }}>{stat.count}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* EMPHASIZED ACTIVE DECISION (If Pending) */}
          {activePendingDecision && filter === 'ALL' && !search && (
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--warning)', background: 'rgba(255, 183, 77, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%' }} className="blink"></div>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, letterSpacing: '1px' }}>HUMAN REVIEW REQUIRED</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activePendingDecision.id}</span>
              </div>
              
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.4rem', color: 'var(--text-main)' }}>{activePendingDecision.strategy.title}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AI RATIONALE</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, padding: '1rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                    {activePendingDecision.strategy.explanation}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PROJECTED CONSEQUENCES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk</div>
                      <div className="mono" style={{ fontSize: '1rem', color: activePendingDecision.strategy.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>{activePendingDecision.strategy.projected_risk}</div>
                    </div>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</div>
                      <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{activePendingDecision.strategy.estimated_response_time}m</div>
                    </div>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resources</div>
                      <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{activePendingDecision.strategy.resource_consumption}</div>
                    </div>
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '0.5rem' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                      <div className="mono" style={{ fontSize: '1rem', color: 'var(--accent)' }}>{activePendingDecision.strategy.score}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn btn-accent" onClick={() => onTabChange?.('Overview')}>REVIEW IN COMMAND CENTER →</button>
                <button className="btn" onClick={() => setSelectedId(activePendingDecision.id)}>INSPECT DETAILS</button>
              </div>
            </div>
          )}

          {/* CONTROLS (Filter, Search, Sort) */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-main)' }}>
            
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ 
                    background: filter === f ? 'var(--accent)' : 'transparent',
                    color: filter === f ? '#000' : 'var(--text-main)',
                    border: 'none',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: filter === f ? 700 : 400,
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="SEARCH DECISIONS..." 
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
                <option value="newest">NEWEST FIRST</option>
                <option value="oldest">OLDEST FIRST</option>
                <option value="highest_risk">HIGHEST RISK</option>
                <option value="highest_score">HIGHEST SCORE</option>
              </select>
            </div>
          </div>

          {/* MAIN DECISION TABLE */}
          <div style={{ flex: 1, padding: '1.5rem' }}>
            {processedDecisions.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                NO DECISIONS RECORDED. Run AI Analysis in the Command Center to generate strategies.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '90px 70px 150px 1fr 60px 60px 60px 50px 150px 60px', 
                  gap: '1rem', 
                  padding: '0 1rem 0.5rem 1rem', 
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)'
                }}>
                  <div>STATUS</div>
                  <div>ID</div>
                  <div>SCENARIO</div>
                  <div>STRATEGY</div>
                  <div>SCORE</div>
                  <div>RISK</div>
                  <div>TIME</div>
                  <div>RES</div>
                  <div>HUMAN ACTION</div>
                  <div style={{ textAlign: 'right' }}>TIME</div>
                </div>

                {/* Rows */}
                {processedDecisions.map(d => {
                  const isSelected = selectedId === d.id;
                  
                  return (
                    <div 
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 70px 150px 1fr 60px 60px 60px 50px 150px 60px',
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
                      <div style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        color: getStatusColor(d.status),
                        padding: '0.2rem 0.4rem',
                        border: `1px solid ${getStatusColor(d.status)}`,
                        borderRadius: '2px',
                        textAlign: 'center'
                      }}>
                        {d.status}
                      </div>

                      {/* ID */}
                      <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {d.id}
                      </div>

                      {/* Scenario */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.scenario_name}
                      </div>

                      {/* Strategy */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.strategy.title}
                      </div>

                      {/* Score */}
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                        {d.strategy.score}
                      </div>
                      
                      {/* Risk */}
                      <div className="mono" style={{ fontSize: '0.8rem', color: d.strategy.projected_risk! > 10 ? 'var(--warning)' : 'var(--success)' }}>
                        {d.strategy.projected_risk}
                      </div>
                      
                      {/* Time */}
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {d.strategy.estimated_response_time}m
                      </div>
                      
                      {/* Resources */}
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        {d.strategy.resource_consumption}
                      </div>

                      {/* Human Action */}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {d.human_action || 'WAITING'}
                      </div>

                      {/* Timestamp */}
                      <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {d.timestamp}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Decision Details */}
      {selectedDecision && (
        <DecisionDetailPanel 
          decision={selectedDecision} 
          onClose={() => setSelectedId(null)} 
          onNavigateHome={selectedDecision.status === 'PENDING' ? () => onTabChange?.('Overview') : undefined}
        />
      )}
    </div>
  );
};
