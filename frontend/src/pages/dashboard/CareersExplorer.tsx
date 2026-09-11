import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Briefcase,
  TrendingUp,
  DollarSign,
  Award,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Filter,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import '../../styles/dashboard.css';

interface Career {
  slug: string;
  title: string;
  category: string;
  description: string;
  average_salary: string;
  growth_rate: string;
  required_skills: string[];
  interview_topics?: string[];
  certifications?: string[];
}

const CATEGORIES = ['All Tracks', 'Core Engineering', 'Web & Cloud', 'Artificial Intelligence', 'Cloud & Infrastructure', 'Data Science', 'Security & Defense'];

export default function CareersExplorer() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [activeGoal, setActiveGoal] = useState<string>(() => localStorage.getItem('skillhub_career_goal') || 'Software Engineer');
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    apiFetch<Career[]>('/skills/careers')
      .then((res) => {
        if (mounted && res.ok && Array.isArray(res.data)) {
          setCareers(res.data);
          if (res.data.length > 0) {
            const current = res.data.find((c) => c.title === activeGoal) || res.data[0];
            setSelectedCareer(current);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeGoal]);

  const handleSetGoal = (careerTitle: string) => {
    localStorage.setItem('skillhub_career_goal', careerTitle);
    setActiveGoal(careerTitle);
    showToast('success', `Active career goal set to ${careerTitle}!`);
  };

  const filtered = careers.filter((c) =>
    selectedCategory === 'All Tracks' ? true : c.category === selectedCategory
  );

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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
            <Compass size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Career Explorer
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Discover in-demand tech roles, explore required competencies, and set your career trajectory.
            </p>
          </div>
        </div>

        {/* Active Target Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 10px var(--success)',
              }}
            />
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>
              Current Target Career Goal: <strong style={{ color: 'var(--accent)' }}>{activeGoal}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => navigate('/assess/skills')}
              style={{ borderRadius: 999, fontSize: 12.5 }}
            >
              Assess Competencies
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/learn/roadmap')}
              style={{ borderRadius: 999, fontSize: 12.5 }}
            >
              View Learning Roadmap <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 24,
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              borderRadius: 999,
              fontSize: 13,
              padding: '6px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Left List, Right Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left: Careers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((career) => {
            const isSelected = selectedCareer?.slug === career.slug;
            const isGoal = activeGoal === career.title;

            return (
              <motion.div
                key={career.slug}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedCareer(career)}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                  padding: '18px 20px',
                  borderRadius: 'var(--radius)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{career.title}</span>
                      {isGoal && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'var(--success-soft)',
                            color: 'var(--success)',
                            border: '1px solid var(--success-border)',
                          }}
                        >
                          ACTIVE GOAL
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{career.category}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                      {career.average_salary}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--success)', fontWeight: 600 }}>
                      {career.growth_rate}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0 12px', lineHeight: 1.5 }}>
                  {career.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {career.required_skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11.5,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'var(--surface-sunken)',
                        color: 'var(--ink)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                  {career.required_skills.length > 4 && (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', alignSelf: 'center' }}>
                      +{career.required_skills.length - 4} more
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Career Deep Dive */}
        {selectedCareer && (
          <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
            <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Career Dossier
                  </span>
                  <h2 style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
                    {selectedCareer.title}
                  </h2>
                  <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{selectedCareer.category}</span>
                </div>

                {activeGoal !== selectedCareer.title ? (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleSetGoal(selectedCareer.title)}
                    style={{ borderRadius: 999, fontWeight: 600 }}
                  >
                    Set as Career Goal
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--success)',
                    }}
                  >
                    <CheckCircle2 size={16} /> Target Goal
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: 14,
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-sunken)',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Average Salary
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                    {selectedCareer.average_salary}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Industry Growth
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>
                    {selectedCareer.growth_rate}
                  </div>
                </div>
              </div>

              {/* Required Core Skills */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={15} style={{ color: 'var(--accent)' }} /> Required Technical Competencies
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedCareer.required_skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'var(--surface-sunken)',
                        color: 'var(--ink)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interview Topics */}
              {selectedCareer.interview_topics && selectedCareer.interview_topics.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={15} style={{ color: 'var(--accent)' }} /> Target Interview Topics
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                    {selectedCareer.interview_topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Certifications */}
              {selectedCareer.certifications && selectedCareer.certifications.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={15} style={{ color: 'var(--accent)' }} /> High-Value Certifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedCareer.certifications.map((c) => (
                      <div
                        key={c}
                        style={{
                          fontSize: 12.5,
                          color: 'var(--ink)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: 'var(--surface-sunken)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/assess/skills')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Assess My Skills Against Role
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate('/learn/roadmap')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Generate Roadmap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
