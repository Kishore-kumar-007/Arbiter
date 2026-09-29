import React, { useState } from 'react';
import type { AppState, SimulationModification, SimulationModificationType } from '../../types/domain';

interface Props {
  state: AppState | null;
  onAddModification: (mod: SimulationModification) => void;
}

export const ModificationBuilder: React.FC<Props> = ({ state, onAddModification }) => {
  const [activeTab, setActiveTab] = useState<SimulationModificationType>('block_route');
  
  // State for form inputs
  const [targetId, setTargetId] = useState('');
  const [val, setVal] = useState<number | ''>('');
  const [details, setDetails] = useState('');

  if (!state) return null;

  const handleAdd = () => {
    if (!targetId) return;
    
    onAddModification({
      type: activeTab,
      target_id: targetId,
      value: val === '' ? undefined : val,
      details: details || undefined
    });
    
    // Reset form
    setTargetId('');
    setVal('');
    setDetails('');
  };

  const tabs: { type: SimulationModificationType, label: string }[] = [
    { type: 'block_route', label: 'Block Route' },
    { type: 'add_incident', label: 'Add Incident' },
    { type: 'increase_population', label: 'Inc Population' },
    { type: 'reduce_capacity', label: 'Red Capacity' },
    { type: 'disable_resource', label: 'Disable Res' }
  ];

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>ENVIRONMENT MODIFICATIONS</div>
      
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button 
            key={t.type}
            onClick={() => { setActiveTab(t.type); setTargetId(''); setVal(''); setDetails(''); }}
            style={{ 
              background: activeTab === t.type ? 'var(--text-main)' : 'transparent',
              color: activeTab === t.type ? '#000' : 'var(--text-muted)',
              border: `1px solid ${activeTab === t.type ? 'var(--text-main)' : 'var(--border)'}`,
              padding: '0.25rem 0.5rem',
              fontSize: '0.65rem',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-base)', padding: '1rem', border: '1px solid var(--border)' }}>
        
        {activeTab === 'block_route' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SELECT ROUTE / ZONE</label>
              <select className="mono" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                {Object.values(state.zones).map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                ))}
              </select>
            </div>
          </>
        )}

        {activeTab === 'add_incident' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SELECT ZONE</label>
              <select className="mono" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                {Object.values(state.zones).map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>INCIDENT TYPE</label>
              <select className="mono" value={details} onChange={e => setDetails(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                <option value="fire">Fire</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="crowd_surge">Crowd Surge</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SEVERITY (1-10)</label>
              <input type="number" min="1" max="10" className="mono" value={val} onChange={e => setVal(parseInt(e.target.value))} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }} />
            </div>
          </>
        )}

        {activeTab === 'increase_population' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SELECT ZONE</label>
              <select className="mono" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                {Object.values(state.zones).map(z => (
                  <option key={z.id} value={z.id}>{z.name} (Cur: {z.current_population})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEW PROJECTED POPULATION</label>
              <input type="number" min="0" className="mono" value={val} onChange={e => setVal(parseInt(e.target.value))} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }} />
            </div>
          </>
        )}

        {activeTab === 'reduce_capacity' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SELECT SAFE ZONE</label>
              <select className="mono" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                {Object.values(state.zones).filter(z => z.type === 'safe_zone' || z.capacity > 0).map(z => (
                  <option key={z.id} value={z.id}>{z.name} (Cap: {z.capacity})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEW PROJECTED CAPACITY</label>
              <input type="number" min="0" className="mono" value={val} onChange={e => setVal(parseInt(e.target.value))} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }} />
            </div>
          </>
        )}

        {activeTab === 'disable_resource' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SELECT RESOURCE</label>
              <select className="mono" value={targetId} onChange={e => setTargetId(e.target.value)} style={{ padding: '0.4rem', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="">-- Select --</option>
                {Object.values(state.resources).map(r => (
                  <option key={r.id} value={r.id}>{r.id} ({r.type}) - {r.status}</option>
                ))}
              </select>
            </div>
          </>
        )}
        
        <button 
          className="btn" 
          disabled={!targetId}
          onClick={handleAdd}
          style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
        >
          + APPLY TO COUNTERFACTUAL
        </button>
      </div>
    </div>
  );
};
