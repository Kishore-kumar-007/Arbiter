import React from 'react';
import type { SimulationModification } from '../../types/domain';

interface Props {
  modifications: SimulationModification[];
  onRemove: (index: number) => void;
  onClear: () => void;
  onRun: () => void;
  isSimulating: boolean;
}

export const ModificationList: React.FC<Props> = ({ modifications, onRemove, onClear, onRun, isSimulating }) => {
  const renderLabel = (mod: SimulationModification) => {
    switch (mod.type) {
      case 'block_route': return `Block route/zone: ${mod.target_id}`;
      case 'add_incident': return `Add ${mod.details} incident (sev: ${mod.value}) to ${mod.target_id}`;
      case 'increase_population': return `Increase population of ${mod.target_id} to ${mod.value}`;
      case 'reduce_capacity': return `Reduce capacity of ${mod.target_id} to ${mod.value}`;
      case 'disable_resource': return `Disable resource: ${mod.target_id}`;
      default: return `Unknown mod: ${mod.type}`;
    }
  };

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '1px', display: 'flex', justifyContent: 'space-between' }}>
        <span>ACTIVE COUNTERFACTUAL CHANGES</span>
        <span className="mono" style={{ color: 'var(--accent)' }}>{modifications.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {modifications.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0', fontStyle: 'italic' }}>
            No modifications applied to baseline state.
          </div>
        ) : (
          modifications.map((mod, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '0.5rem 0.75rem', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
              <span className="mono" style={{ color: 'var(--text-main)' }}>+ {renderLabel(mod)}</span>
              <button onClick={() => onRemove(i)} style={{ background: 'transparent', border: 'none', color: 'var(--hazard)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'auto' }}>
        <button className="btn" onClick={onClear} disabled={modifications.length === 0 || isSimulating}>CLEAR ALL</button>
        <button className="btn btn-accent" onClick={onRun} disabled={isSimulating}>
          {isSimulating ? 'SIMULATING...' : 'RUN SIMULATION'}
        </button>
      </div>
    </div>
  );
};
