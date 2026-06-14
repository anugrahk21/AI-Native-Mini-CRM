'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AIChatPanel from '@/components/layout/AIChatPanel';
import { getChannelIcon, getStatusColor, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: 'badge-yellow',
      sending: 'badge-blue',
      sent: 'badge-cyan',
      completed: 'badge-green'
    };
    return map[status] || 'badge-blue';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Campaigns</h1>
              <p className="page-subtitle">Create and track your messaging campaigns.</p>
            </div>
            <button className="btn btn-primary">✨ Create with AI</button>
          </div>

          <div className="glass-card">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner" style={{ display: 'inline-block' }}></span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📣</div>
                <h3>No campaigns yet</h3>
                <p>Create your first campaign to start reaching customers.</p>
                <button className="btn btn-primary">Create Campaign</button>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>Channel</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Opened</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                        <td>
                          <span className={`channel-icon ${c.channel}`}>
                            {getChannelIcon(c.channel)} <span style={{ textTransform: 'capitalize' }}>{c.channel}</span>
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                        </td>
                        <td>{c.stats?.sent || 0} / {c.stats?.total || 0}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{c.stats?.delivered || 0}</td>
                        <td style={{ color: 'var(--accent-purple)' }}>{c.stats?.opened || 0}</td>
                        <td>{formatDate(new Date(c.createdAt))}</td>
                        <td>
                          <Link href={`/campaigns/${c._id}`} className="btn btn-secondary btn-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <AIChatPanel />
    </div>
  );
}
