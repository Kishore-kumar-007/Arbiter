import React from 'react';
import { AuditTimeline } from '../components/audit/AuditTimeline';

export const AuditTrail: React.FC = () => {
  return (
    <div className="main-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <AuditTimeline />
    </div>
  );
};
