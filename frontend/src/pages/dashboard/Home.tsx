import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Mic,
  Star,
  ArrowRight,
  ScanSearch,
  Wand2,
  Video,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Compass,
  Map,
  Lightbulb,
  FolderGit2,
  Layers,
  Award,
  ExternalLink,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';
import { SkeletonCard } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import type { DashboardStats } from '../../api/types';
import '../../styles/dashboard.css';

interface ReadinessData {
  overall_score: number;
  target_career: string;
  components: {
    skills: number;
    projects: number;
    resume_ats: number;
    interview: number;
    proof_github: number;
  };
  summary: string;
}

interface GapItem {
  skill: string;
  current: number;
  target: number;
  priority: string;
}

interface GapResponse {
  skill_gaps: GapItem[];
}

interface RoadmapResponse {
  title: string;
  milestones: any[];
  completed_tasks: string[];
}

const STUDIO_TOOLS = [
  {
    to: '/dashboard/ats-checker',
    title: 'ATS Scanner & Keyword Optimizer',
    description: 'Score your resume against any job description with instant keyword gap analysis.',
    icon: ScanSearch,
    tag: 'Career',
    color: '#4f6ef7',
  },
  {
    to: '/dashboard/live-interview',
    title: 'Real-Time Voice Mock Studio',
    description: 'Practice live behavioral and coding interviews with AI speech analysis & Judge0 code sandbox.',
    icon: Video,
    tag: 'Interview',
    color: '#10b981',
  },
  {
    to: '/dashboard/resumes',
    title: 'Resume Vault & Tailor',
    description: 'Manage, rewrite, and align experience bullets into high-impact, metrics-driven achievements.',
    icon: Wand2,
    tag: 'Resume',
    color: '#f59e0b',
  },
  {
    to: '/dashboard/project-recommender',
    title: 'Project Architect',
    description: 'Generate portfolio project recommendations aligned with your target career and missing skills.',
    icon: Lightbulb,
    tag: 'Build',
    color: '#8b5cf6',
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [roadmapInfo, setRoadmapInfo] = useState<{ total: number; done: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const targetGoal = localStorage.getItem('skillhub_career_goal') || 'Software Engineer';

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiFetch<DashboardStats>('/stats/dashboard'),
      apiFetch<ReadinessData>(`/skills/readiness?target_career=${encodeURIComponent(targetGoal)}`),
      apiFetch<GapResponse>(`/skills/gaps?target_career=${encodeURIComponent(targetGoal)}`),
      apiFetch<RoadmapResponse>('/skills/roadmap'),
    ])
      .then(([statsRes, readyRes, gapsRes, roadRes]) => {
        if (!mounted) return;
        if (statsRes.ok && statsRes.data) setStats(statsRes.data);
        if (readyRes.ok && readyRes.data) setReadiness(readyRes.data);
        if (gapsRes.ok && gapsRes.data?.skill_gaps) {
          setGaps(gapsRes.data.skill_gaps.slice(0, 3));
        }
        if (roadRes.ok && roadRes.data?.milestones) {
          const total = roadRes.data.milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
          const done = roadRes.data.completed_tasks?.length || 0;
          setRoadmapInfo({ total, done });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [targetGoal]);

  const score = readiness?.overall_score ?? 78;

  return (
    <div className="container">
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'there'}`}
        subtitle="SkillHub Command Center — your unified platform for student skill development, project evidence, and career applications."
      />

      {/* ── Top Unified Intelligence Card (Career Readiness + Goal) ─────────── */}
      <div
        className="card"
        style={{
          padding: 24,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 28,
          background: 'var(--gradient-glow-card)',
          border: '1.5px solid var(--accent-soft-border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
          {/* Left: Target Goal & Composite Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Target Career Path
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 8px',
                  borderRadius: 999,
                  background: 'var(--success-soft)',
                  color: 'var(--success)',
                  border: '1px solid var(--success-border)',
                }}
              >
                ACTIVE
              </span>
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              {targetGoal}
            </h2>

            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 16px', maxWidth: 460 }}>
              {readiness?.summary || 'Actively monitoring your technical skills, portfolio projects, resume ATS compatibility, and live mock interview readiness.'}
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/assess/skills')}
                style={{ borderRadius: 999 }}
              >
                Skill Assessment
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate('/discover/careers')}
                style={{ borderRadius: 999 }}
              >
                Change Career Goal
              </button>
            </div>
          </div>

          {/* Right: Score Gauge & Component Breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 20,
              padding: '16px 20px',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: 'var(--surface-sunken)',
                  border: '5px solid var(--accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.25)',
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', marginTop: 2 }}>/ 100</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>Career Readiness</span>
            </div>

            {/* Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Technical Skills</span>
                  <strong style={{ color: 'var(--ink)' }}>{readiness?.components.skills ?? 82}%</strong>
                </div>
                <div style={{ height: 5, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readiness?.components.skills ?? 82}%`, background: 'var(--accent)', borderRadius: 999 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Projects Portfolio</span>
                  <strong style={{ color: 'var(--ink)' }}>{readiness?.components.projects ?? 75}%</strong>
                </div>
                <div style={{ height: 5, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readiness?.components.projects ?? 75}%`, background: '#a855f7', borderRadius: 999 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Resume ATS Pass</span>
                  <strong style={{ color: 'var(--ink)' }}>{readiness?.components.resume_ats ?? (stats?.avg_ats_score || 85)}%</strong>
                </div>
                <div style={{ height: 5, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readiness?.components.resume_ats ?? (stats?.avg_ats_score || 85)}%`, background: 'var(--success)', borderRadius: 999 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Interview &amp; Code</span>
                  <strong style={{ color: 'var(--ink)' }}>{readiness?.components.interview ?? 70}%</strong>
                </div>
                <div style={{ height: 5, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${readiness?.components.interview ?? 70}%`, background: '#3b82f6', borderRadius: 999 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Skill Gaps & Active Roadmap Row ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* Left: Top Skill Gaps */}
        <div className="card" style={{ padding: 22, borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--danger)' }} /> Top Skill Gaps
            </h3>
            <Link to="/assess/gaps" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              View All Gaps &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gaps.map((g) => (
              <div
                key={g.skill}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{g.skill}</span>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Current: {g.current}% &bull; Target: {g.target}%</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: g.priority === 'High Priority' ? 'var(--danger-soft)' : 'var(--warning-soft)',
                    color: g.priority === 'High Priority' ? 'var(--danger)' : 'var(--warning)',
                  }}
                >
                  {g.priority}
                </span>
              </div>
            ))}
            {gaps.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                No active gaps recorded. Take an assessment to discover deficit areas.
              </div>
            )}
          </div>
        </div>

        {/* Right: Roadmap Tracker */}
        <div className="card" style={{ padding: 22, borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Map size={16} style={{ color: 'var(--accent)' }} /> Learning Roadmap Progress
            </h3>
            <Link to="/learn/roadmap" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Full Roadmap &rarr;
            </Link>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Curriculum Milestones</span>
              <strong style={{ color: 'var(--ink)' }}>
                {roadmapInfo?.done ?? 2} of {roadmapInfo?.total ?? 12} Complete
              </strong>
            </div>
            <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${roadmapInfo ? Math.round((roadmapInfo.done / Math.max(roadmapInfo.total, 1)) * 100) : 18}%`,
                  background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)',
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => navigate('/learn/roadmap')}
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
            >
              Check Milestones
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/learn/resources')}
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
            >
              Start Learning
            </button>
          </div>
        </div>
      </div>

      {/* ── Studio Applications Grid (Preserved SmartApply Core) ────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Career &amp; Engineering Studio</h2>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Integrated SmartApply career applications</span>
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
    </div>
  );
}
