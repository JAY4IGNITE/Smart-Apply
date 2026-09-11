import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminSpotlight from './AdminSpotlight';
import '../styles/dashboard.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <AdminSpotlight />
      <AdminSidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-dashboard-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="SkillHub" style={{ height: 26, width: 26, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
              Skill<span style={{ color: 'var(--accent)' }}>Hub</span>
            </span>
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}
          >
            <Menu size={22} />
          </button>
        </div>

        <main className="dashboard-main fade-in">{children}</main>
      </div>
    </div>
  );
}
