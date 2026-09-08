import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Mic, Star, ArrowRight, ScanSearch, Wand2, Video, CheckCircle2, AlertCircle, Sparkles, TrendingUp, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';
import { SkeletonCard } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import type { DashboardStats } from '../../api/types';

const STAT_CARDS = [
  { key: 'total_resumes' as const, label: 'Resumes Stored', icon: FileText, suffix: '', desc: 'Active tailored documents' },
  { key: 'total_interviews' as const, label: 'Interviews Practiced', icon: Mic, suffix: '', desc: 'Live sessions completed' },
  { key: 'avg_ats_score' as const, label: 'Average ATS Score', icon: Star, suffix: '%', desc: 'Targeting 85%+ pass score' },
];

const STUDIO_TOOLS = [
  {
    to: '/dashboard/ats-checker',
    title: 'ATS Scanner & Keyword Optimizer',
    description: 'Score your resume against any job description with instant keyword gap analysis.',
    icon: ScanSearch,
    tag: 'Popular',
    color: '#4f6ef7',
  },
  {
    to: '/dashboard/live-interview',
    title: 'Real-Time Voice Mock Interview',
    description: 'Practice live behavioral and coding interviews with AI speech analysis & Judge0 code sandbox.',
    icon: Video,
    tag: 'Live Voice',
    color: '#10b981',
  },
  {
    to: '/dashboard/resumes',
    title: '1-Click Resume Tailor',
    description: 'Rewrite and re-align experience bullets into high-impact, metrics-driven achievements.',
    icon: Wand2,
    tag: 'AI Tailor',
    color: '#f59e0b',
  },
  {
    to: '/dashboard/idea-prompt-generator',
    title: 'Idea Prompt Studio',
    description: 'Convert raw software concepts into comprehensive v0, Bolt, and Cursor specification prompts.',
    icon: Sparkles,
    tag: 'New',
    color: '#8b5cf6',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<DashboardStats>('/stats/dashboard');
        if (res.ok) setStats(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Recently';
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="container">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'there'}`}
        subtitle="Your central command center for resume optimization, voice interviews, and tech career acceleration."
      />

      {/* ── Stat Metrics ──────────────────────────────────────────── */}
      <div className="grid-auto-fit" style={{ marginBottom: 28 }}>
        {loading
          ? STAT_CARDS.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <SkeletonCard variant="stat" />
              </motion.div>
            ))
          : STAT_CARDS.map((stat, i) => (
              <motion.div
                key={stat.key}
                className="card"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="eyebrow" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', letterSpacing: '0.04em' }}>
                    {stat.label}
                  </span>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'var(--accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--accent-soft-border)',
                    }}
                  >
                    <stat.icon size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>

                <div className="stat-number" style={{ fontSize: 38, fontWeight: 800, marginTop: 10, color: 'var(--ink)' }}>
                  {stats?.[stat.key] ?? 0}
                  {stat.suffix}
                </div>

                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
                  {stat.desc}
                </div>
              </motion.div>
            ))}
      </div>

      {/* ── Core Studio Tools Grid ─────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Studio Applications</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Choose a tool to start practicing</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {STUDIO_TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="card"
              style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px 20px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                transition: 'all var(--transition-base)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface-sunken)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <tool.icon size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    {tool.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                  {tool.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginTop: 18 }}>
                Launch Tool <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom Account & Readiness Status ──────────────────────── */}
      <div className="grid-auto-fit">
        {loading ? (
          <SkeletonCard variant="card" />
        ) : (
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ borderRadius: 16, border: '1px solid var(--border)' }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Candidate Profile & Readiness</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                <span className="text-muted">Account Registered</span>
                <span style={{ fontWeight: 600 }}>{formatDate(stats?.member_since)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                <span className="text-muted">Primary Email</span>
                <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: user?.is_verified ? 'var(--success)' : 'var(--warning)' }}>
                {user?.is_verified ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span style={{ fontWeight: 600 }}>
                  {user?.is_verified ? 'Account verified and ready for applications' : 'Email verification recommended'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <Link to="/dashboard/profile" className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>
                  Manage Profile
                </Link>
                <Link to="/docs" className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}>
                  System Documentation
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
