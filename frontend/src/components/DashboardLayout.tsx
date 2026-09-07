import { useEffect, useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import '../styles/dashboard.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // While the mobile nav is open, close it on Escape and stop the page
  // behind it from scrolling — both are expected behaviors for an
  // overlay drawer and keep keyboard users from getting trapped.
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
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-dashboard-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="Smart Apply" style={{ height: 26, width: 26, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
              Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
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
