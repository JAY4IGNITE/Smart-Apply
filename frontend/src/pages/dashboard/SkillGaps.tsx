import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Code,
  ArrowRight,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import '../../styles/dashboard.css';

interface GapItem {
  skill: string;
  current: number;
  target: number;
  priority: string;
  status: string;
  recommended_actions: string[];
}

interface GapData {
  overall_score: number;
  target_career: string;
  skill_gaps: GapItem[];
  recommendations: string[];
}

export default function SkillGaps() {
  const [data, setData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const targetCareer = localStorage.getItem('skillhub_career_goal') || 'Software Engineer';
    apiFetch<GapData>(`/skills/gaps?target_career=${encodeURIComponent(targetCareer)}`)
      .then((res) => {
        if (mounted && res.ok && res.data) {
          setData(res.data);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const highGaps = data?.skill_gaps.filter((g) => g.priority === 'High Priority') || [];
  const medGaps = data?.skill_gaps.filter((g) => g.priority === 'Medium Priority') || [];
  const lowGaps = data?.skill_gaps.filter((g) => g.priority === 'Low Priority') || [];

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Skill Gap Analysis
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Targeted deficit breakdown between your current skill evidence and industry requirements.
            </p>
          </div>
        </div>

        {/* Target Career Banner */}
        <div
          style={{
            marginTop: 16,
            padding: '14px 20px',
            borderRadius: 'var(--radius)',
            background: 'var(--gradient-glow-card)',
            border: '1px solid var(--accent-soft-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Target Benchmark
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
              {data?.target_career || 'Software Engineer'} &bull; Readiness Index: <strong>{data?.overall_score ?? 68}%</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => navigate('/assess/skills')}
              style={{ borderRadius: 999 }}
            >
              Re-evaluate Skills
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/learn/roadmap')}
              style={{ borderRadius: 999 }}
            >
              Update Learning Roadmap <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Priority Gap Columns / Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* High Priority */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 10px var(--danger)',
              }}
            />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              High Priority Gaps (Deficit &gt; 35%)
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>({highGaps.length} areas requiring immediate focus)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {highGaps.map((gap) => (
              <div
                key={gap.skill}
                className="card"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius)',
                  borderLeft: '4px solid var(--danger)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{gap.skill}</h3>
                    <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{gap.priority}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{gap.current}% / {gap.target}%</div>
                    <span style={{ color: 'var(--ink-faint)' }}>Gap: -{gap.target - gap.current}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: `${gap.current}%`, background: 'var(--danger)', borderRadius: 999 }} />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => navigate('/learn/resources')}
                    style={{ fontSize: 11.5 }}
                  >
                    <BookOpen size={12} /> Learn Core
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate('/dashboard/project-recommender')}
                    style={{ fontSize: 11.5 }}
                  >
                    <Lightbulb size={12} /> Build Project
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate('/dashboard/live-interview')}
                    style={{ fontSize: 11.5 }}
                  >
                    <Code size={12} /> Live Practice
                  </button>
                </div>
              </div>
            ))}
            {highGaps.length === 0 && (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>
                No high priority gaps! Great work maintaining strong core technical proficiency.
              </div>
            )}
          </div>
        </div>

        {/* Medium Priority */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--warning)',
                boxShadow: '0 0 10px var(--warning)',
              }}
            />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              Medium Priority Gaps (Deficit 15–35%)
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>({medGaps.length} areas to solidify)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {medGaps.map((gap) => (
              <div
                key={gap.skill}
                className="card"
                style={{
                  padding: 18,
                  borderRadius: 'var(--radius)',
                  borderLeft: '4px solid var(--warning)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{gap.skill}</h3>
                    <span style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>{gap.priority}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{gap.current}% / {gap.target}%</div>
                    <span style={{ color: 'var(--ink-faint)' }}>Gap: -{gap.target - gap.current}%</span>
                  </div>
                </div>

                <div style={{ height: 6, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: `${gap.current}%`, background: 'var(--warning)', borderRadius: 999 }} />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => navigate('/learn/resources')}
                    style={{ fontSize: 11.5 }}
                  >
                    <BookOpen size={12} /> Learn
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => navigate('/dashboard/project-recommender')}
                    style={{ fontSize: 11.5 }}
                  >
                    <Lightbulb size={12} /> Project Ideas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Priority / Mastered */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 10px var(--success)',
              }}
            />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              On Track &amp; Mastered (Deficit &lt; 15%)
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {lowGaps.map((gap) => (
              <div
                key={gap.skill}
                className="card"
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  borderLeft: '4px solid var(--success)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="var(--success)" />
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{gap.skill}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
                    {gap.current}% (Mastered)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
