import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [strategies, setStrategies] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        setState(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/strategies/generate', { method: 'POST' })
      const data = await res.json()
      setStrategies(data)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8' }}>Initializing Arbiter Systems...</div>
  }

  if (!state) return null;

  return (
    <div className="dashboard-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Arbiter</h1>
          <p>Human-in-the-Loop Decision Intelligence - Live Situation Monitor</p>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={generating}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1
          }}>
          {generating ? 'AI Analyzing...' : 'Generate AI Strategies'}
        </button>
      </header>

      <div className="grid">
        {/* Incidents Card */}
        <div className="card">
          <h2 className="card-title">Active Incidents</h2>
          <div className="item-list">
            {Object.values(state.incidents || {}).map((inc: any) => (
              <div key={inc.id} className="item incident">
                <div className="item-header">
                  <p className="item-title">{inc.type.replace('_', ' ').toUpperCase()}</p>
                  <span className="badge danger">Severity {inc.severity}</span>
                </div>
                <p className="item-detail">{inc.description}</p>
                <p className="item-detail">Location ID: {inc.zone_id}</p>
              </div>
            ))}
            {Object.keys(state.incidents || {}).length === 0 && (
               <p className="item-detail">No active incidents.</p>
            )}
          </div>
        </div>

        {/* Resources Card */}
        <div className="card">
          <h2 className="card-title">Deployed Resources</h2>
          <div className="item-list">
            {Object.values(state.resources || {}).map((res: any) => (
              <div key={res.id} className="item resource">
                <div className="item-header">
                  <p className="item-title">{res.type.toUpperCase()} TEAM</p>
                  <span className="badge">{res.status}</span>
                </div>
                <p className="item-detail">Unit ID: {res.id}</p>
                <p className="item-detail">Current Zone: {res.current_zone_id}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Zones Card */}
        <div className="card">
          <h2 className="card-title">Campus Zones</h2>
          <div className="item-list">
            {Object.values(state.zones || {}).map((zone: any) => (
              <div key={zone.id} className="item">
                <div className="item-header">
                  <p className="item-title">{zone.name}</p>
                  <span className="badge">{zone.type}</span>
                </div>
                <p className="item-detail">Population: {zone.current_population} / {zone.capacity || '∞'}</p>
                <p className="item-detail">Status: {zone.status.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {strategies.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>AI Proposed Strategies</h2>
          <div className="grid">
            {strategies.map((strat: any) => (
              <div key={strat.id} className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{strat.title}</h3>
                  <span className="badge" style={{ background: 'var(--success)', color: 'white' }}>Score: {strat.score}</span>
                </div>
                <p className="item-detail" style={{ color: 'var(--text-main)' }}>{strat.explanation}</p>
                
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <p className="item-detail" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Deterministic Projections:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <p className="item-detail">Risk Score: {strat.projected_risk}</p>
                    <p className="item-detail">Response Time: {strat.estimated_response_time}</p>
                    <p className="item-detail">Resources: {strat.resource_consumption}</p>
                    <p className="item-detail">AI Confidence: {(strat.confidence * 100).toFixed(0)}%</p>
                  </div>
                  {strat.constraint_violations && strat.constraint_violations.length > 0 && (
                    <div style={{ marginTop: '0.5rem', color: '#fca5a5', fontSize: '0.85rem' }}>
                      <strong>Violations:</strong>
                      <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem' }}>
                        {strat.constraint_violations.map((v: string, i: number) => <li key={i}>{v}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button style={{ flex: 1, padding: '0.5rem', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                  <button style={{ flex: 1, padding: '0.5rem', background: 'var(--warning)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Modify</button>
                  <button style={{ flex: 1, padding: '0.5rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
