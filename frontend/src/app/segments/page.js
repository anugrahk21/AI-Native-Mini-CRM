'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AIChatPanel from '@/components/layout/AIChatPanel';

export default function SegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSegments();

    const handleRefresh = () => fetchSegments();
    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, []);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/segments');
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Segments</h1>
              <p className="page-subtitle">Group your customers for targeted campaigns.</p>
            </div>
            <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { prompt: 'Create a segment of ' } }))}>✨ Create with AI</button>
          </div>

          <div className="grid-3">
            {/* Create New Card */}
            <div className="glass-card" onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { prompt: 'Create a segment of ' } }))} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, borderStyle: 'dashed', cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>+</div>
              <h3 style={{ fontWeight: 600 }}>Create Segment</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>Build rules manually or ask AI to generate an audience.</p>
            </div>

            {loading ? (
              [1, 2].map(i => (
                <div key={i} className="glass-card" style={{ minHeight: 200 }}>
                  <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }}></div>
                  <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 24 }}></div>
                  <div className="skeleton" style={{ height: 40, width: '100%' }}></div>
                </div>
              ))
            ) : segments.map(seg => (
              <div key={seg._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{seg.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1, marginBottom: 20 }}>{seg.description || 'No description provided.'}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>👥</span>
                    <span style={{ fontWeight: 700 }}>{seg.customerCount || 0}</span>
                  </div>
                  <a href={`/campaigns?segment=${seg._id}`} className="btn btn-secondary btn-sm">Use in Campaign</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <AIChatPanel />
    </div>
  );
}
