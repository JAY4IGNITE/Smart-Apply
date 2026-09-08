import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import '../styles/dashboard.css';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="sidebar-header" style={{ padding: '24px 20px 16px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 6 }}>
              <img src="/logo.png" alt="Smart Apply" style={{ height: 28, width: 28, objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
                Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
              </span>
            </Link>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin Console
            </div>
          </div>

          <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Navigation</div>
              <NavLink to="/dashboard/sysadmin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                <LayoutDashboard size={18} /> Overview
              </NavLink>
              <NavLink to="/dashboard/sysadmin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                <Users size={18} /> Users
              </NavLink>
              <NavLink to="/dashboard/sysadmin/resume-templates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                <LayoutDashboard size={18} /> Templates
              </NavLink>
              <NavLink to="/dashboard/sysadmin/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                <SettingsIcon size={18} /> Settings
              </NavLink>
            </div>
          </nav>

          <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
            <ThemeSwitcher />
            
            <NavLink to="/dashboard" className="sidebar-link" onClick={onCloseMobile} style={{ marginTop: 8 }}>
              <ArrowLeft size={18} /> Back to App
            </NavLink>
            
            <button
              onClick={() => {
                logout();
                onCloseMobile();
              }}
              className="sidebar-link"
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--danger)', marginTop: 8 }}
            >
              <LogOut size={18} /> Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
