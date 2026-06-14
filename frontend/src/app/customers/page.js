'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?page=${page}&limit=10&search=${search}`);
        const data = await res.json();
        if (active) {
          setCustomers(data.customers || []);
          setTotalPages(data.totalPages || 1);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCustomers();
    
    return () => { active = false; };
  }, [page, search]);

  const getBadgeClass = (tag) => {
    const map = {
      vip: 'badge-purple',
      loyal: 'badge-blue',
      new: 'badge-green',
      churning: 'badge-red',
      high_aov: 'badge-yellow'
    };
    return map[tag] || 'badge-cyan';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Customers</h1>
              <p className="page-subtitle">Manage and view your {total} shoppers.</p>
            </div>
            <button className="btn btn-primary">Import CSV</button>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Search by name, email or phone..." 
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                style={{ maxWidth: 300 }}
              />
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner" style={{ display: 'inline-block' }}></span>
              </div>
            ) : customers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No customers found</h3>
                <p>Try adjusting your search or add new customers.</p>
              </div>
            ) : (
              <>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>City</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Last Active</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c._id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem' }}>{c.email}</div>
                          </td>
                          <td>{c.city}</td>
                          <td>{c.totalOrders || 0}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(c.totalSpent || 0)}</td>
                          <td>{c.lastOrderDate ? formatDate(new Date(c.lastOrderDate)) : 'Never'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {(c.tags || []).map(tag => (
                                <span key={tag} className={`badge ${getBadgeClass(tag)}`}>{tag.replace('_', ' ')}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      ← Prev
                    </button>
                    <span style={{ padding: '4px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Page {page} of {totalPages}
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
