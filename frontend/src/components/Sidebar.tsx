import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ScanSearch,
  MessageSquareText,
  Lightbulb,
  Video,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Mail,
  Briefcase,
  Wand2,
  BookOpen,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Linkedin } from './Icons';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
import '../styles/dashboard.css';

interface NavLinkItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
}

interface NavSection {
  title: string;
  links: NavLinkItem[];
}

const CORE_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Command Center',
    links: [
      { to: '/dashboard', label: 'Executive Overview', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'Career Dossier',
    links: [
      { to: '/dashboard/resumes', label: 'Resume Vault', icon: FileText },
      { to: '/dashboard/resume-maker', label: 'Resume Studio', icon: Sparkles },
      { to: '/dashboard/ats-checker', label: 'ATS Intelligence', icon: ScanSearch },
      { to: '/dashboard/cover-letter', label: 'Cover Letter Studio', icon: Mail },
      { to: '/dashboard/linkedin', label: 'LinkedIn Optimizer', icon: Linkedin },
    ],
  },
  {
    title: 'Opportunities',
    links: [
      { to: '/dashboard/jobs', label: 'Smart Job Matcher', icon: Briefcase },
    ],
  },
  {
    title: 'Engineering & Prep',
    links: [
      { to: '/dashboard/project-recommender', label: 'Project Architect', icon: Lightbulb },
      { to: '/dashboard/idea-prompt-generator', label: 'Prompt Studio', icon: Wand2 },
      { to: '/dashboard/live-interview', label: 'Voice Mock Studio', icon: Video },
      { to: '/dashboard/ai-chatbot', label: 'AI Career Strategist', icon: MessageSquareText },
    ],
  },
];

const REMAINING_FEATURES: NavLinkItem[] = [
  { to: '/docs', label: 'Platform Docs', icon: BookOpen },
  { to: '/dashboard/profile', label: 'Profile Dossier', icon: UserIcon },
  { to: '/dashboard/settings', label: 'Account Settings', icon: SettingsIcon },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Upper Card: Features Menu */}
        <div className="sidebar-features-card">
          {/* Brand Header */}
          <div className="sidebar-logo">
            <Link
              to="/dashboard"
              onClick={onCloseMobile}
              style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}
            >
              <img
                src="/logo.png"
                alt="Smart Apply"
                style={{ height: 28, width: 28, objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
                Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
              </span>
            </Link>
          </div>

          {/* Navigation Sections */}
          <nav className="sidebar-nav">
            {CORE_NAV_SECTIONS.map((section) => (
              <div key={section.title} className="sidebar-section-card">
                <div className="sidebar-section-title">
                  <span>{section.title}</span>
                </div>
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={'end' in link ? link.end : false}
                    onClick={onCloseMobile}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-content">
                      <span className="sidebar-icon-wrap">
                        <link.icon size={16} />
                      </span>
                      <span>{link.label}</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Card: Remaining Features & User Dossier */}
        <div className="sidebar-bottom-card">
          <div className="sidebar-section-card remaining-features-group">
            <div className="sidebar-section-title">
              <span>Remaining Features</span>
            </div>
            {REMAINING_FEATURES.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onCloseMobile}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-content">
                  <span className="sidebar-icon-wrap">
                    <link.icon size={15} />
                  </span>
                  <span>{link.label}</span>
                </span>
              </NavLink>
            ))}

            {user?.is_admin && (
              <NavLink
                to="/dashboard/sysadmin"
                onClick={onCloseMobile}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-content">
                  <span className="sidebar-icon-wrap">
                    <ShieldCheck size={15} />
                  </span>
                  <span>Admin Console</span>
                </span>
              </NavLink>
            )}
          </div>

          {/* User Dossier Card */}
          <div className="sidebar-user-card">
            <div className="sidebar-avatar-wrap">
              {user?.profile_pic_url ? (
                <img src={user.profile_pic_url} alt="" className="sidebar-avatar-img" />
              ) : (
                <div className="sidebar-avatar-initials">{initials}</div>
              )}
            </div>

            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.full_name || 'Engineering Candidate'}
              </div>
              <div className="sidebar-user-role">
                {user?.email || 'Pro Member'}
              </div>
            </div>

            <div className="sidebar-user-actions">
              <ThemeSwitcher variant="compact" />
              <button
                onClick={logout}
                aria-label="Log out"
                className="sidebar-mini-btn danger"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
