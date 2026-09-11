import { useEffect, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import '../styles/dashboard.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile drawer on Escape and lock scroll
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  return (
    <div className="dashboard-layout">
      {/* Primary Rounded Sidebar Menu */}
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {/* Main Workspace Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header (only visible on mobile screens <= 1024px) */}
        <div className="mobile-dashboard-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Smart Apply" style={{ height: 26, width: 26, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink)' }}>
              Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
            </span>
          </div>
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--ink)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Page Content Shell */}
        <main className="dashboard-main fade-in">{children}</main>
      </div>
    </div>
  );
}
