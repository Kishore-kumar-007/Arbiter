import React, { useEffect, useState } from 'react';
import type { AppState, Strategy } from '../types/domain';
import { api } from '../services/api';

import { TelemetryCards } from '../components/telemetry/TelemetryCards';
import { CampusMap } from '../components/map/CampusMap';
import { DecisionPanel } from '../components/decisions/DecisionPanel';
import { AuditTimeline } from '../components/audit/AuditTimeline';

export const Overview: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getState()
      .then((data) => {
        setState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await api.generateStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>INITIALIZING TELEMETRY...</div>;
  }

  return (
    <div className="main-workspace">
      <TelemetryCards state={state} />
      <CampusMap state={state} />
      <DecisionPanel strategies={strategies} onGenerate={handleGenerate} generating={generating} />
      <AuditTimeline />
    </div>
  );
};
