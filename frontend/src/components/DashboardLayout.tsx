import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Home, Compass } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

function getBreadcrumbs(pathname: string): { section: string; page: string } {
  if (pathname === '/dashboard') return { section: 'Command Center', page: 'Overview' };
  if (pathname.startsWith('/dashboard/resumes')) return { section: 'Career Dossier', page: 'Resume Vault' };
  if (pathname.startsWith('/dashboard/resume-maker')) return { section: 'Career Dossier', page: 'Resume Studio' };
  if (pathname.startsWith('/dashboard/ats-checker')) return { section: 'Career Dossier', page: 'ATS Intelligence' };
  if (pathname.startsWith('/dashboard/cover-letter')) return { section: 'Career Dossier', page: 'Cover Letter Studio' };
  if (pathname.startsWith('/dashboard/linkedin')) return { section: 'Career Dossier', page: 'LinkedIn Optimizer' };
  if (pathname.startsWith('/dashboard/jobs')) return { section: 'Opportunities', page: 'Smart Job Matcher' };
  if (pathname.startsWith('/dashboard/project-recommender')) return { section: 'Engineering & Prep', page: 'Project Architect' };
  if (pathname.startsWith('/dashboard/idea-prompt-generator')) return { section: 'Engineering & Prep', page: 'Prompt Studio' };
  if (pathname.startsWith('/dashboard/live-interview')) return { section: 'Engineering & Prep', page: 'Voice Mock Studio' };
  if (pathname.startsWith('/dashboard/ai-chatbot')) return { section: 'Engineering & Prep', page: 'AI Career Strategist' };
  if (pathname.startsWith('/dashboard/profile')) return { section: 'Account', page: 'Profile Dossier' };
  if (pathname.startsWith('/dashboard/settings')) return { section: 'Account', page: 'System Settings' };
  if (pathname.startsWith('/dashboard/sysadmin') || pathname.startsWith('/admin')) return { section: 'Governance', page: 'Admin Console' };
  return { section: 'Dashboard', page: 'Workspace' };
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const { section, page } = getBreadcrumbs(location.pathname);
  const initials = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase();

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
      {/* Primary Sidebar Menu */}
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {/* Main Workspace Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Unified Top Menu Bar (Desktop & Mobile) */}
        <header className="dashboard-top-bar">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="mobile-only-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink)',
                display: 'none',
                padding: 4,
              }}
            >
              <Menu size={20} />
            </button>

            <nav aria-label="Breadcrumbs" className="topbar-breadcrumbs">
              <Link to="/dashboard" className="breadcrumb-item-link" title="Command Center Overview">
                <Home size={14} />
                <span>Dashboard</span>
              </Link>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-section">{section}</span>
              <ChevronRight size={12} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{page}</span>
            </nav>
          </div>

          {/* Right: Health Status, Docs, Theme, User Avatar */}
          <div className="topbar-right-group">
            <div className="topbar-status-beacon" title="NVIDIA Inference Microservice Connected">
              <span className="pulse-dot" />
              <span>AI Engine Active</span>
            </div>

            <Link to="/docs" className="topbar-action-link" title="Read Documentation">
              <Compass size={14} />
              <span>Docs</span>
            </Link>

            <ThemeSwitcher variant="compact" />

            <Link
              to="/dashboard/profile"
              className="topbar-user-avatar"
              title={`${user?.full_name || 'Candidate'} - View Profile`}
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page Content Shell */}
        <main className="dashboard-main fade-in">{children}</main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only-btn { display: inline-flex !important; }
          .dashboard-top-bar { padding: 0 16px !important; }
          .breadcrumb-section { display: none !important; }
          .topbar-status-beacon { display: none !important; }
        }
      `}</style>
    </div>
  );
}
