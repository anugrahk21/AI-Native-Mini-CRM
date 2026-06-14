'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AIChatPanel from '@/components/layout/AIChatPanel';
import { calcPercentage, getChannelIcon } from '@/lib/utils';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [segment, setSegment] = useState(null);
  const [stats, setStats] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    // Poll for stats if campaign is sending or sent
    const interval = setInterval(() => {
      if (campaign && (campaign.status === 'sending' || campaign.status === 'sent')) {
        fetchStats();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [campaign?.status]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        router.push('/campaigns');
        return;
      }
      setCampaign(data.campaign);
      setSegment(data.segment);
      fetchStats();
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}/stats`);
      const data = await res.json();
      if (!data.error) {
        setStats(data.stats);
        setRates(data.rates);
        
        // Also update local campaign state if stats changed
        if (campaign && campaign.status === 'sending' && data.stats.total > 0 && data.stats.total === data.stats.sent + data.stats.failed) {
            // we could refresh campaign status here
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSend = async () => {
    if (!confirm(`Are you sure you want to send this campaign to ${segment?.customerCount || 0} customers?`)) return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${params.id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Campaign sending started!');
        fetchData();
      } else {
        alert('Failed to send: ' + data.error);
      }
    } catch (error) {
      alert('Error sending campaign: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="app-layout"><Sidebar /><Header /><main className="main-content"><div style={{padding: 40}}><span className="spinner"></span></div></main></div>;
  if (!campaign) return null;

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push('/campaigns')}>
              ← Back to Campaigns
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h1 className="page-title" style={{ marginBottom: 0 }}>{campaign.name}</h1>
                  <span className={`badge badge-${campaign.status === 'draft' ? 'yellow' : campaign.status === 'sending' ? 'blue' : 'green'}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="page-subtitle">Targeting: <strong>{segment?.name || 'Unknown segment'}</strong> ({segment?.customerCount || 0} customers)</p>
              </div>
              
              {campaign.status === 'draft' && (
                <button 
                  className="btn btn-primary" 
                  onClick={handleSend}
                  disabled={sending || !segment?.customerCount}
                >
                  {sending ? 'Sending...' : `🚀 Send to ${segment?.customerCount || 0} customers`}
                </button>
              )}
            </div>
          </div>

          <div className="grid-2">
            {/* Message Preview Card */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Message Preview</h3>
              
              <div style={{ marginBottom: 16 }}>
                <span className="text-sm text-muted">Channel:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: '1.2rem' }}>{getChannelIcon(campaign.channel)}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{campaign.channel}</span>
                </div>
              </div>

              <div style={{ 
                background: 'var(--bg-tertiary)', 
                padding: 16, 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem'
              }}>
                {campaign.messageTemplate}
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Performance</h3>
              
              {campaign.status === 'draft' ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-icon" style={{ fontSize: '2rem' }}>📊</div>
                  <p>Send the campaign to see real-time performance stats.</p>
                </div>
              ) : stats ? (
                <div>
                  <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-muted text-xs mb-1">Total Target</div>
                      <div className="text-lg font-bold">{stats.total || 0}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-muted text-xs mb-1">Delivered</div>
                      <div className="text-lg font-bold text-green-500">{stats.delivered || 0}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-muted text-xs mb-1">Opened</div>
                      <div className="text-lg font-bold text-purple-400">{stats.opened || 0}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-muted text-xs mb-1">Clicked</div>
                      <div className="text-lg font-bold text-orange-400">{stats.clicked || 0}</div>
                    </div>
                  </div>

                  {/* Funnel Visualization */}
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-secondary)' }}>Conversion Funnel</h4>
                  <div className="funnel">
                    <div className="funnel-bar" style={{ background: 'var(--accent-blue)', height: '100%' }}>
                      <span className="funnel-value">{stats.sent || 0}</span>
                      <span className="funnel-label">Sent</span>
                    </div>
                    <div className="funnel-bar" style={{ background: 'var(--accent-green)', height: `${Math.max(5, rates.deliveryRate || 0)}%` }}>
                      <span className="funnel-value">{stats.delivered || 0}</span>
                      <span className="funnel-label">Delivered ({rates?.deliveryRate?.toFixed(1) || 0}%)</span>
                    </div>
                    <div className="funnel-bar" style={{ background: 'var(--accent-purple)', height: `${Math.max(5, (rates.openRate || 0) * (rates.deliveryRate || 0) / 100)}%` }}>
                      <span className="funnel-value">{stats.opened || 0}</span>
                      <span className="funnel-label">Opened ({rates?.openRate?.toFixed(1) || 0}%)</span>
                    </div>
                    <div className="funnel-bar" style={{ background: 'var(--accent-orange)', height: `${Math.max(5, (rates.clickRate || 0) * (rates.openRate || 0) * (rates.deliveryRate || 0) / 10000)}%` }}>
                      <span className="funnel-value">{stats.clicked || 0}</span>
                      <span className="funnel-label">Clicked ({rates?.clickRate?.toFixed(1) || 0}%)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner"></span></div>
              )}
            </div>
          </div>
        </div>
      </main>
      <AIChatPanel />
    </div>
  );
}
