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
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: 'var(--text-muted)' }}>INITIALIZING DECISION TELEMETRY...</div>;
  }

  const selectedDecision = selectedId ? decisions.find(d => d.id === selectedId) : null;

  return (
    <div className="main-workspace" style={{ display: 'grid', gridTemplateColumns: selectedDecision ? '1fr 450px' : '1fr', overflow: 'hidden' }}>
      
      {/* LEFT COLUMN: Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* TOP HEADER */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-panel-light)' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)' }}>✦</span> DECISION COMMAND
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '1px' }}>STRATEGY REVIEW & HUMAN AUTHORIZATION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-panel-nested)', padding: '0.5rem 1rem', borderRadius: 4, border: '1px solid var(--border)' }}>
              <span style={{ letterSpacing: '0.5px' }}>ENVIRONMENT: <strong style={{ color: 'var(--text-main)', letterSpacing: '1px' }}>{activeScenario.toUpperCase()}</strong></span>
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
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>TOTAL DECISIONS</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>{telemetry.total}</div>
              </div>
              <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-light)', textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>PENDING REVIEW</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: telemetry.pending > 0 ? 'var(--warning)' : 'var(--text-muted)', lineHeight: 1, textShadow: telemetry.pending > 0 ? '0 0 15px rgba(255, 145, 0, 0.4)' : 'none' }} className={telemetry.pending > 0 ? 'blink' : ''}>{telemetry.pending}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TELEMETRY STRIP */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 10 }}>
          {[
            { label: 'TOTAL RECORDED', count: telemetry.total, color: 'var(--text-main)' },
            { label: 'AWAITING APPROVAL', count: telemetry.pending, color: telemetry.pending > 0 ? 'var(--warning)' : 'var(--text-muted)' },
            { label: 'AUTHORIZED', count: telemetry.approved, color: 'var(--success)' },
            { label: 'VETOED', count: telemetry.rejected, color: 'var(--hazard)' },
            { label: 'MODIFIED', count: telemetry.modified, color: 'var(--accent)' },
          ].map((stat, idx) => (
            <div key={stat.label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: idx === 4 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stat.label}</span>
              <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: stat.count > 0 ? stat.color : 'var(--text-muted)', textShadow: stat.count > 0 && stat.color !== 'var(--text-main)' ? `0 0 10px ${stat.color}40` : 'none' }}>{stat.count}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
          
          {/* EMPHASIZED ACTIVE DECISION (If Pending) */}
          {activePendingDecision && filter === 'ALL' && !search && (
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--warning)', background: 'linear-gradient(135deg, rgba(255, 145, 0, 0.08) 0%, rgba(255, 145, 0, 0.02) 100%)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--warning)', boxShadow: '0 0 15px var(--warning)' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%', boxShadow: '0 0 10px var(--warning)' }} className="blink"></div>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, letterSpacing: '1px' }}>HUMAN REVIEW REQUIRED</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activePendingDecision.id}</span>
              </div>
              
              <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.6rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>{activePendingDecision.strategy.title}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>AI RATIONALE</div>
                  <div className="panel-nested" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, padding: '1.25rem' }}>
                    {activePendingDecision.strategy.explanation}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>PROJECTED CONSEQUENCES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Risk</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: activePendingDecision.strategy.projected_risk! > 10 ? 'var(--hazard)' : 'var(--success)' }}>{activePendingDecision.strategy.projected_risk}</div>
                    </div>
                    <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Time</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{activePendingDecision.strategy.estimated_response_time}m</div>
                    </div>
                    <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Resources</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{activePendingDecision.strategy.resource_consumption}</div>
                    </div>
                    <div className="panel-nested" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent)', background: 'rgba(0, 229, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Score</div>
                      <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', textShadow: '0 0 10px rgba(0,229,255,0.4)' }}>{activePendingDecision.strategy.score}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-accent" onClick={() => onTabChange?.('Overview')} style={{ padding: '0.75rem 1.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="blink">◎</span> REVIEW IN COMMAND CENTER →
                </button>
                <button className="btn" onClick={() => setSelectedId(activePendingDecision.id)} style={{ padding: '0.75rem 1.5rem', fontSize: '0.8rem' }}>
                  INSPECT DETAILS
                </button>
              </div>
            </div>
          )}

          {/* CONTROLS (Filter, Search, Sort) */}
          <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-panel)' }}>
            
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-panel-nested)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED'].map(f => (
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
                  placeholder="SEARCH DECISIONS..." 
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
                <option value="newest">NEWEST FIRST</option>
                <option value="oldest">OLDEST FIRST</option>
                <option value="highest_risk">HIGHEST RISK</option>
                <option value="highest_score">HIGHEST SCORE</option>
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

          {/* MAIN DECISION TABLE */}
          <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
            {processedDecisions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <div style={{ opacity: 0.3, fontSize: '3rem' }}>◎</div>
                <span style={{ letterSpacing: '1px' }}>NO DECISIONS RECORDED. RUN AI ANALYSIS IN THE COMMAND CENTER.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 90px 160px 1fr 60px 60px 60px 60px 160px 80px', 
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
                      className="interactive-row panel-nested"
                      onClick={() => setSelectedId(d.id)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 90px 160px 1fr 60px 60px 60px 60px 160px 80px',
                        gap: '1.5rem',
                        padding: '1.25rem 1rem',
                        background: isSelected ? 'linear-gradient(90deg, rgba(0, 229, 255, 0.08) 0%, rgba(0, 229, 255, 0.02) 100%)' : 'var(--bg-panel)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                        borderLeft: `3px solid ${isSelected ? 'var(--accent)' : getStatusColor(d.status)}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Background warning glow for pending */}
                      {d.status === 'PENDING' && !isSelected && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', background: `linear-gradient(90deg, var(--warning), transparent)`, opacity: 0.05, pointerEvents: 'none' }}></div>
                      )}

                      {/* Status */}
                      <div className="mono" style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        color: getStatusColor(d.status),
                        padding: '0.25rem 0.5rem',
                        border: `1px solid ${getStatusColor(d.status)}`,
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '2px',
                        textAlign: 'center',
                        letterSpacing: '0.5px'
                      }}>
                        {d.status}
                      </div>

                      {/* ID */}
                      <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {d.id}
                      </div>

                      {/* Scenario */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        {d.scenario_name}
                      </div>

                      {/* Strategy */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.5px' }}>
                        {d.strategy.title}
                      </div>

                      {/* Score */}
                      <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {d.strategy.score}
                      </div>
                      
                      {/* Risk */}
                      <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: d.strategy.projected_risk! > 10 ? 'var(--hazard)' : 'var(--success)' }}>
                        {d.strategy.projected_risk}
                      </div>
                      
                      {/* Time */}
                      <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {d.strategy.estimated_response_time}m
                      </div>
                      
                      {/* Resources */}
                      <div className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {d.strategy.resource_consumption}
                      </div>

                      {/* Human Action */}
                      <div style={{ fontSize: '0.75rem', color: d.human_action ? 'var(--text-main)' : 'var(--warning)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {d.human_action || 'WAITING...'}
                      </div>

                      {/* Timestamp */}
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
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
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-panel-light)', height: '100%', overflowY: 'auto' }}>
          <DecisionDetailPanel 
            decision={selectedDecision} 
            onClose={() => setSelectedId(null)} 
            onNavigateHome={selectedDecision.status === 'PENDING' ? () => onTabChange?.('Overview') : undefined}
          />
        </div>
      )}
    </div>
  );
};
