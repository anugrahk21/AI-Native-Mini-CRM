'use client';

export default function Header() {
  return (
    <header className="header">
      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search customers, segments, campaigns..."
          aria-label="Search"
        />
      </div>

      <div className="header-actions">
        <span className="badge badge-green">● Live</span>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-full)',
          background: 'var(--gradient-primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', fontWeight: 600, color: 'white',
          cursor: 'pointer'
        }}>
          M
        </div>
      </div>
    </header>
  );
}
