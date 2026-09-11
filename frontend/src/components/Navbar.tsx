import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Interactive Demo' },
  { href: '#interview-studio', label: 'Voice Studio' },
  { href: '/docs', label: 'Documentation', isRoute: true },
];

interface NavbarProps {
  visible?: boolean;
}

export default function Navbar({ visible = true }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== 'light';
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            top: 14,
            left: 0,
            right: 0,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
      <div
        style={{
          width: '100%',
          maxWidth: 1140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderRadius: 18,
          background: 'var(--nav-glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--nav-glass-border)',
          boxShadow: scrolled
            ? '0 16px 36px -8px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--glass-highlight) inset'
            : '0 8px 24px -4px rgba(0, 0, 0, 0.15)',
          transition: 'all 250ms ease',
        }}
      >
        {/* Brand Logo */}
        <Link to="/landing" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 11 }}>
          <img
            src="/logo.png"
            alt="SkillHub"
            style={{
              width: 32,
              height: 32,
              objectFit: 'contain',
              filter: isDark
                ? 'drop-shadow(0 2px 12px rgba(255, 159, 252, 0.45)) drop-shadow(0 4px 18px rgba(82, 39, 255, 0.35))'
                : 'drop-shadow(0 2px 10px rgba(82, 39, 255, 0.28))',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
          <span style={{ fontWeight: 800, fontSize: '1.18rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Skill<span style={{ color: 'var(--accent)' }}>Hub</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="desktop-nav-links">
          {NAV_LINKS.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href}
                className="nav-link"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink-soft)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="nav-link"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink-soft)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Actions Group + Embedded Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav-actions">
          <ThemeSwitcher variant="compact" />

          {isAuthenticated ? (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/dashboard')}
              style={{ borderRadius: 999, padding: '7px 18px', fontWeight: 600, fontSize: 13 }}
            >
              Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/login')}
                style={{
                  color: 'var(--ink)',
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: 999,
                  padding: '7px 16px',
                }}
              >
                Sign In
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/signup')}
                style={{
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: '0 4px 14px rgba(79, 110, 247, 0.3)',
                }}
              >
                Get Started Free
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink)',
            padding: 4,
          }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              maxWidth: 1140,
              margin: '8px auto 0',
              borderRadius: 20,
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {NAV_LINKS.map((l) =>
              l.isRoute ? (
                <Link
                  key={l.href}
                  to={l.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}
                >
                  {l.label}
                </a>
              )
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Theme</span>
              <ThemeSwitcher variant="compact" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
              {isAuthenticated ? (
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => navigate('/login')}>
                    Sign In
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/signup')}>
                    Get Started Free
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav-links, .desktop-nav-actions { display: none !important; }
          .mobile-nav-toggle { display: inline-flex !important; }
        }
        .nav-link:hover {
          color: var(--ink) !important;
        }
      `}</style>
    </motion.header>
      )}
    </AnimatePresence>
  );
}
