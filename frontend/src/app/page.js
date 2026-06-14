'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AIChatPanel from '@/components/layout/AIChatPanel';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, segmentsRes, campaignsRes] = await Promise.all([
        fetch('/api/customers?limit=1'),
        fetch('/api/segments'),
        fetch('/api/campaigns')
      ]);

      const customersData = await customersRes.json();
      const segmentsData = await segmentsRes.json();
      const campaignsData = await campaignsRes.json();

      // Calculate overall stats
      const totalCustomers = customersData.total || 0;
      const totalSegments = segmentsData.segments?.length || 0;
      const allCampaigns = campaignsData.campaigns || [];
      const totalCampaigns = allCampaigns.length;

      const totalDelivered = allCampaigns.reduce((sum, c) => sum + (c.stats?.delivered || 0), 0);
      const totalSent = allCampaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
      const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0;

      setStats({
        totalCustomers,
        totalSegments,
        totalCampaigns,
        deliveryRate
      });

      setCampaigns(allCampaigns.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Seeded successfully!\n${data.counts.customers} customers\n${data.counts.orders} orders\n${data.counts.segments} segments`);
        fetchDashboardData();
      } else {
        alert('❌ Seed failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Seed failed: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num?.toString() || '0';
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

  const getChannelEmoji = (channel) => {
    const map = { whatsapp: '💬', sms: '📱', email: '📧', rcs: '💎' };
    return map[channel] || '📨';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />

      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Welcome back! Here&apos;s your CRM overview.</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleSeedData}
              disabled={seeding}
            >
              {seeding ? (
                <><span className="spinner" style={{ width: 14, height: 14 }}></span> Seeding...</>
              ) : (
                <>🌱 Seed Demo Data</>
              )}
            </button>
          </div>

          {loading ? (
            <div className="stats-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-card">
                  <div className="skeleton" style={{ width: 44, height: 44, marginBottom: 16 }}></div>
                  <div className="skeleton" style={{ width: 80, height: 28, marginBottom: 8 }}></div>
                  <div className="skeleton" style={{ width: 120, height: 16 }}></div>
                </div>
              ))}
            </div>
          ) : stats?.totalCustomers === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Welcome to crm.ai
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Your CRM is empty. Seed demo data to explore the platform with 200 customers, 800 orders, and pre-built segments.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSeedData}
                disabled={seeding}
              >
                {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
              </button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">👥</div>
                  <div className="stat-value">{formatNumber(stats?.totalCustomers)}</div>
                  <div className="stat-label">Total Customers</div>
                  <div className="stat-change positive">↑ Active base</div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-value">{stats?.totalSegments}</div>
                  <div className="stat-label">Active Segments</div>
                  <div className="stat-change positive">AI-powered</div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">📣</div>
                  <div className="stat-value">{stats?.totalCampaigns}</div>
                  <div className="stat-label">Campaigns</div>
                  <div className="stat-change positive">Ready to send</div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-icon">📈</div>
                  <div className="stat-value">{stats?.deliveryRate}%</div>
                  <div className="stat-label">Delivery Rate</div>
                  <div className="stat-change positive">↑ On track</div>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="glass-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Campaigns</h2>
                  <a href="/campaigns" className="btn btn-ghost btn-sm">View All →</a>
                </div>

                {campaigns.length > 0 ? (
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Channel</th>
                          <th>Status</th>
                          <th>Sent</th>
                          <th>Delivered</th>
                          <th>Opened</th>
                          <th>Clicked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign._id}>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {campaign.name}
                            </td>
                            <td>
                              <span className={`channel-icon ${campaign.channel}`}>
                                {getChannelEmoji(campaign.channel)} {campaign.channel}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(campaign.status)}`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td>{campaign.stats?.sent || 0}</td>
                            <td>{campaign.stats?.delivered || 0}</td>
                            <td>{campaign.stats?.opened || 0}</td>
                            <td>{campaign.stats?.clicked || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📣</div>
                    <h3>No campaigns yet</h3>
                    <p>Create your first campaign to start reaching customers.</p>
                    <a href="/campaigns" className="btn btn-primary">Create Campaign</a>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid-3">
                <a href="/customers" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>👥</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Manage Customers</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    View, search, and import customer data
                  </p>
                </a>

                <a href="/segments" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>🎯</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Build Segments</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Create audience segments with AI or rules
                  </p>
                </a>

                <a href="/campaigns" className="glass-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 12 }}>📣</div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>Run Campaigns</h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Send personalized messages across channels
                  </p>
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      <AIChatPanel />
    </div>
  );
}
