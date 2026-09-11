import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Settings, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api/client';

interface SearchResult {
  id: string;
  type: 'user' | 'page';
  title: string;
  subtitle: string;
  url: string;
  is_admin?: boolean;
}

export default function AdminSpotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(getStaticPages(''));
    }
  }, [open]);

  // Perform search
  useEffect(() => {
    if (!open) return;
    
    const staticResults = getStaticPages(query);
    
    if (query.length < 2) {
      setResults(staticResults);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiFetch<{ users: any[] }>(`/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const userResults: SearchResult[] = res.data.users.map(u => ({
            id: u.id,
            type: 'user',
            title: u.full_name || u.email,
            subtitle: u.email,
            url: `/dashboard/sysadmin/users`,
            is_admin: u.is_admin
          }));
          setResults([...staticResults, ...userResults]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, open]);

  const getStaticPages = (q: string): SearchResult[] => {
    const pages: SearchResult[] = [
      { id: 'p1', type: 'page', title: 'Admin Overview', subtitle: 'System stats and metrics', url: '/dashboard/sysadmin' },
      { id: 'p2', type: 'page', title: 'User Management', subtitle: 'View and edit users', url: '/dashboard/sysadmin/users' },
      { id: 'p3', type: 'page', title: 'System Settings', subtitle: 'Maintenance, API keys, Announcements', url: '/dashboard/sysadmin/settings' }
    ];
    if (!q) return pages;
    const lowerQ = q.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(lowerQ) || p.subtitle.toLowerCase().includes(lowerQ));
  };

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => setOpen(false)}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ 
              width: '100%', maxWidth: 600, background: 'var(--surface)', 
              borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
              position: 'relative', overflow: 'hidden', border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <Search size={22} color="var(--ink-faint)" />
              <input 
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users, settings, and pages..."
                style={{ 
                  flex: 1, border: 'none', background: 'transparent', 
                  fontSize: '1.1rem', padding: '0 16px', outline: 'none', color: 'var(--ink)'
                }}
              />
              <div style={{ fontSize: '0.75rem', background: 'var(--surface-sunken)', padding: '4px 8px', borderRadius: 4, color: 'var(--ink-faint)', fontWeight: 600 }}>
                ESC
              </div>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto', padding: 8 }}>
              {loading && results.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-faint)' }}>Searching...</div>
              )}
              {!loading && results.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-faint)' }}>No results found.</div>
              )}

              {results.map(res => (
                <button
                  key={res.id}
                  onClick={() => handleSelect(res.url)}
                  className="spotlight-item"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 16, 
                    padding: '12px 16px', border: 'none', background: 'transparent', 
                    cursor: 'pointer', borderRadius: 8, textAlign: 'left', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-sunken)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ 
                    background: 'var(--primary-faint)', color: 'var(--primary)', 
                    padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {res.type === 'page' ? (
                      res.title.includes('Settings') ? <Settings size={18} /> : 
                      res.title.includes('User') ? <Users size={18} /> : 
                      <LayoutDashboard size={18} />
                    ) : (
                      res.is_admin ? <ShieldCheck size={18} /> : <Users size={18} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{res.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginTop: 2 }}>{res.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <div style={{ padding: '8px 20px', background: 'var(--surface-sunken)', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--ink-faint)', display: 'flex', justifyContent: 'center' }}>
              Search globally across the platform. Powered by SmartApply God Mode.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
