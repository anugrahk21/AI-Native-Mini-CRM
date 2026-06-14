'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: '📊' },
    ]
  },
  {
    section: 'Manage',
    items: [
      { name: 'Customers', href: '/customers', icon: '👥' },
      { name: 'Segments', href: '/segments', icon: '🎯' },
      { name: 'Campaigns', href: '/campaigns', icon: '📣' },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AI</div>
        <div className="logo-text">
          <span>crm.ai</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigation.map((group) => (
          <div key={group.section} className="sidebar-section">
            <div className="sidebar-section-title">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="link-icon">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-primary)' }}>
        <div className="sidebar-link" style={{ cursor: 'default', opacity: 0.7 }}>
          <span className="link-icon">⚡</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Powered by Gemini + Groq
          </span>
        </div>
      </div>
    </aside>
  );
}
