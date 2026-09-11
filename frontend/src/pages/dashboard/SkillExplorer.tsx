import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../components/Toast';
import '../../styles/dashboard.css';

interface SkillItem {
  name: string;
  category: string;
  description: string;
  typical_roles: string[];
}

interface StudentSkill {
  skill_name: string;
  proficiency: number;
  evidence_source: string;
}

const CATEGORIES = ['All', 'Languages', 'Frontend', 'Backend', 'Data & Storage', 'Data & AI', 'DevOps & Tools', 'Core CS', 'Cloud'];

export default function SkillExplorer() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [studentSkills, setStudentSkills] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<{ name: string; value: number } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<SkillItem[]>('/skills/catalog'),
      apiFetch<StudentSkill[]>('/skills/my-skills'),
    ])
      .then(([catRes, stuRes]) => {
        if (!mounted) return;
        if (catRes.ok && Array.isArray(catRes.data)) {
          setSkills(catRes.data);
        }
        if (stuRes.ok && Array.isArray(stuRes.data)) {
          const map: Record<string, number> = {};
          stuRes.data.forEach((s) => {
            map[s.skill_name.toLowerCase()] = s.proficiency;
          });
          setStudentSkills(map);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProficiency = async (skillName: string, proficiency: number) => {
    try {
      const res = await apiFetch('/skills/my-skills', {
        method: 'POST',
        body: JSON.stringify({
          skill_name: skillName,
          proficiency,
          evidence_source: 'manual',
        }),
      });
      if (res.ok) {
        setStudentSkills((prev) => ({
          ...prev,
          [skillName.toLowerCase()]: proficiency,
        }));
        setEditingSkill(null);
        showToast('success', `Updated proficiency for ${skillName} to ${proficiency}%`);
      } else {
        showToast('error', 'Failed to update skill proficiency.');
      }
    } catch {
      showToast('error', 'Network error.');
    }
  };

  const filtered = skills.filter((s) => {
    const matchesCat = selectedCategory === 'All' ? true : s.category === selectedCategory;
    const matchesSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
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
            <Cpu size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Skill Explorer & Taxonomy
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Browse verified technical skills, benchmark your proficiency, and track evidence across your dossier.
            </p>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--ink-faint)' }} />
            <input
              type="text"
              placeholder="Search by skill name or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0 4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 999, fontSize: 12.5, whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Skill Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((skill) => {
          const currentProf = studentSkills[skill.name.toLowerCase()] ?? null;
          const isEditing = editingSkill?.name === skill.name;

          return (
            <motion.div
              key={skill.name}
              className="card"
              whileHover={{ y: -2 }}
              style={{
                padding: 18,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                      {skill.name}
                    </h3>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{skill.category}</span>
                  </div>

                  {currentProf !== null ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: currentProf >= 70 ? 'var(--success-soft)' : 'var(--accent-soft)',
                        color: currentProf >= 70 ? 'var(--success)' : 'var(--accent)',
                        border: `1px solid ${currentProf >= 70 ? 'var(--success-border)' : 'var(--accent-soft-border)'}`,
                      }}
                    >
                      {currentProf}% Proficient
                    </span>
                  ) : (
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Not logged</span>
                  )}
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '8px 0 12px' }}>
                  {skill.description}
                </p>

                {/* Progress bar if logged */}
                {currentProf !== null && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        height: 6,
                        width: '100%',
                        borderRadius: 999,
                        background: 'var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${currentProf}%`,
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Edit slider or trigger */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                {isEditing ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--ink-soft)' }}>Set Proficiency:</span>
                      <strong style={{ color: 'var(--ink)' }}>{editingSkill.value}%</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={editingSkill.value}
                      onChange={(e) => setEditingSkill({ name: skill.name, value: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSaveProficiency(skill.name, editingSkill.value)}
                        style={{ flex: 1, fontSize: 11.5, padding: '4px 8px' }}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setEditingSkill(null)}
                        style={{ fontSize: 11.5, padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSkill({ name: skill.name, value: currentProf || 60 })}
                    className="btn btn-sm btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 12, gap: 6 }}
                  >
                    <Sliders size={13} /> {currentProf !== null ? 'Adjust Proficiency' : 'Log This Skill'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
