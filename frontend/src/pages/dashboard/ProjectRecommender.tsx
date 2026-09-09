import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Clock,
  Star,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Zap,
  Terminal,
  Copy,
  Check,
  Download,
  Layers,
  Database,
  Cloud,
  Users,
  Target,
  Circle,
  Cpu,
  Bookmark,
  Share2
} from 'lucide-react';

import { InlineLoader } from '../../components/LoadingSpinner';
import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import type { Project, RoadmapPhase } from '../../api/types';

interface ProjectArchetype {
  id: string;
  badge: string;
  title: string;
  skills: string[];
  time: string;
  interests: string;
}

const PROJECT_ARCHETYPES: ProjectArchetype[] = [
  {
    id: 'ai-agents',
    badge: '🤖 AI & Agents',
    title: 'Autonomous Multi-Agent System',
    skills: ['Python', 'FastAPI', 'PyTorch', 'LangChain', 'Vector DBs (Qdrant)'],
    time: '15 hours a week',
    interests: 'Build an autonomous agentic system with streaming LLM responses, tool calling, and human-in-the-loop review.',
  },
  {
    id: 'fullstack-saas',
    badge: '🌐 Micro-SaaS',
    title: 'B2B Real-Time Collaboration SaaS',
    skills: ['React 19', 'Next.js 15', 'TypeScript', 'Tailwind', 'PostgreSQL', 'Redis'],
    time: '20 hours a week',
    interests: 'Create a multi-tenant B2B collaboration dashboard with optimistic UI updates, live WebSockets, and Stripe billing.',
  },
  {
    id: 'distributed-core',
    badge: '⚡ Distributed Core',
    title: 'High-Throughput Task Scheduler',
    skills: ['Go', 'Docker', 'Kafka', 'Redis', 'PostgreSQL'],
    time: '10 hours a week',
    interests: 'Architect an event-driven distributed task execution engine with raft consensus, worker heartbeat monitoring, and idempotency.',
  },
  {
    id: 'fintech-telemetry',
    badge: '📈 Real-Time Data',
    title: 'Sub-Millisecond Financial Visualizer',
    skills: ['Rust', 'WebSockets', 'React', 'ClickHouse', 'TypeScript'],
    time: '12 hours a week',
    interests: 'Build a high-performance order book and telemetry visualizer with sub-millisecond data pipelines and WebGL canvas rendering.',
  },
];

const SKILL_CATEGORIES = [
  {
    name: 'Languages',
    icon: '⚡',
    skills: ['TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'SQL'],
  },
  {
    name: 'AI & Data',
    icon: '🧠',
    skills: ['PyTorch', 'LangChain', 'Llama 3', 'Vector DBs (Qdrant)', 'Ollama', 'vLLM', 'FastAPI'],
  },
  {
    name: 'Frontend & UI',
    icon: '🌐',
    skills: ['React 19', 'Next.js 15', 'Tailwind', 'Framer Motion', 'Three.js', 'Vue', 'GraphQL'],
  },
  {
    name: 'Backend & Cloud',
    icon: '🛠️',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kafka', 'Kubernetes', 'Supabase'],
  },
];

const AMBITION_TIERS = [
  {
    id: 'sprint',
    label: '⚡ Weekend Sprint',
    time: '8–12 hours',
    desc: 'High UI polish, single core feature, viral demo & GitHub appeal.',
  },
  {
    id: 'mvp',
    label: '🚀 Production MVP',
    time: '1–2 weeks',
    desc: 'Full-stack application with auth, persistent database, and clean APIs.',
  },
  {
    id: 'flagship',
    label: '🏛️ Flagship Architecture',
    time: '3–4 weeks',
    desc: 'Distributed systems, microservices, benchmarks, and production observability.',
  },
];

const PREFERENCE_PRESETS = {
  databases: ['PostgreSQL', 'Supabase', 'MongoDB', 'Redis / KV', 'ClickHouse', 'SQLite'],
  hosting: ['Render', 'Vercel', 'AWS ECS', 'Fly.io', 'Cloudflare Workers', 'Docker Compose'],
  teams: ['Solo Engineer', 'Pair (2 Devs)', 'Small Team (3–5)'],
  audiences: ['B2B Developers', 'Enterprise IT', 'Consumer Web', 'Internal Engineering'],
  monetization: ['Open Source (Stars & Community)', 'Usage-Based API', 'Freemium SaaS', 'Self-Hosted Enterprise'],
};

const LOADING_STEPS_1 = [
  'Analyzing your technical competencies & stack synergy...',
  'Evaluating recruiter hiring trends for high-demand architectures...',
  'Synthesizing original, production-grade project concepts...',
  'Calibrating complexity scores and milestone estimates...',
  'Finalizing personalized portfolio recommendations...',
];

const LOADING_STEPS_2 = [
  'Ingesting architecture preferences and target constraints...',
  'Structuring modular phases: Schema, API, Frontend, & DevOps...',
  'Generating granular engineering tasks with acceptance criteria...',
  'Adding recruiter talking points & interview pitch strategies...',
  'Compiling executive engineering roadmap...',
];

function ProgressLoadingView({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % steps.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [steps]);

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ position: 'relative', width: 68, height: 68, margin: '0 auto 20px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '3px solid var(--accent-soft-border)',
            borderTopColor: 'var(--accent)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--accent)',
          }}
        >
          <Lightbulb size={26} />
        </div>
      </div>

      <span className="badge badge-accent" style={{ marginBottom: 10 }}>
        Step {index + 1} of {steps.length}
      </span>

      <AnimatePresence mode="wait">
        <motion.h3
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px 0' }}
        >
          {steps[index]}
        </motion.h3>
      </AnimatePresence>

      <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
        Synthesizing high-impact engineering portfolio blueprints...
      </p>
    </div>
  );
}

export default function ProjectRecommender() {
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('15 hours a week');
  const [ambitionTier, setAmbitionTier] = useState('mvp');
  const [interests, setInterests] = useState('Build an AI-powered SaaS with real-time collaboration, streaming updates, and clean system design.');

  // Step 2 State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Step 3 State (Preferences)
  const [dbPref, setDbPref] = useState('PostgreSQL');
  const [hostingPref, setHostingPref] = useState('Render');
  const [teamSize, setTeamSize] = useState('Solo Engineer');
  const [targetAudience, setTargetAudience] = useState('B2B Developers');
  const [monetization, setMonetization] = useState('Open Source (Stars & Community)');
  const [extraPref, setExtraPref] = useState('Focus on clean TypeScript types, Docker deployment, and unit test coverage.');

  // Step 4 State (Roadmap & Completion Tracker)
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Toggle skills in cloud
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = customSkillInput.trim();
    if (val && !selectedSkills.includes(val)) {
      setSelectedSkills([...selectedSkills, val]);
      setCustomSkillInput('');
    }
  };

  // Apply archetype
  const handleApplyArchetype = (arch: ProjectArchetype) => {
    setSelectedSkills(arch.skills);
    setTimeCommitment(arch.time);
    setInterests(arch.interests);
    showToast('info', `Loaded "${arch.badge}" archetype!`);
  };

  // Step 1: Submit Recommendations
  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      showToast('error', 'Please select at least one skill or technology.');
      return;
    }
    if (!timeCommitment.trim() || !interests.trim()) {
      showToast('error', 'Please provide your available time and project goals.');
      return;
    }

    setLoading(true);
    try {
      const skillsPayload = selectedSkills.join(', ');
      const res = await apiFetch<Project[] | { projects?: Project[]; data?: Project[] }>('/projects/recommend', {
        method: 'POST',
        body: JSON.stringify({
          skills: skillsPayload,
          time_commitment: timeCommitment,
          interests: interests,
        }),
      });

      let list: Project[] = [];
      if (res.ok && res.data) {
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (res.data.projects && Array.isArray(res.data.projects)) {
          list = res.data.projects;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        }
      }

      if (list.length > 0) {
        setProjects(list);
        setStep(2);
      } else {
        showToast('error', apiErrorMessage(res, 'No projects generated. Adjust your criteria and try again.'));
      }
    } catch {
      showToast('error', 'Network error while fetching project recommendations.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3
  const handlePrepareRoadmap = (project: Project) => {
    setSelectedProject(project);
    setStep(3);
  };

  // Copy Master Cursor / v0 AI prompt
  const handleCopyProjectPrompt = (project: Project) => {
    const rawTechs = Array.isArray(project.key_technologies)
      ? project.key_technologies.join(', ')
      : String(project.key_technologies || '');

    const promptText = `You are a Principal Software Architect. I want to build the following project:
TITLE: ${project.title}
DESCRIPTION: ${project.description}
TECH STACK: ${rawTechs}
SKILL LEVEL: ${project.skill_level}

Please provide:
1. Complete folder and repository structure following modern enterprise conventions.
2. Step 1 setup instructions (environment variables, docker-compose.yml, package.json / pyproject.toml).
3. Core database schemas and migrations.
4. Key API endpoint signatures and handlers with robust error handling.
5. Primary UI page layout with modern component architecture.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(project.id || project.title);
    setTimeout(() => setCopiedPromptId(null), 2500);
    showToast('success', 'Copied Cursor / v0 AI kick-off prompt to clipboard!');
  };

  // Step 3 -> Step 4
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setLoading(true);
    try {
      const res = await apiFetch<{ phases: RoadmapPhase[] } | RoadmapPhase[]>('/projects/roadmap', {
        method: 'POST',
        body: JSON.stringify({
          project_details: selectedProject,
          preferences: {
            'Preferred Database': dbPref,
            'Preferred Hosting': hostingPref,
            'Team Size': teamSize,
            'Target Audience': targetAudience,
            'Monetization Strategy': monetization,
            'Additional Requirements': extraPref,
          },
        }),
      });

      let phases: RoadmapPhase[] = [];
      if (res.ok && res.data) {
        if (Array.isArray(res.data)) {
          phases = res.data;
        } else if (res.data.phases && Array.isArray(res.data.phases)) {
          phases = res.data.phases;
        }
      }

      if (phases.length > 0) {
        setRoadmap(phases);
        setCompletedTasks({});
        setStep(4);
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to generate roadmap. Please try again.'));
      }
    } catch {
      showToast('error', 'Network error while generating roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle milestone task completion
  const toggleTaskCompleted = (key: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Copy Phase AI Prompt
  const handleCopyPhasePrompt = (phase: RoadmapPhase) => {
    const taskList = (Array.isArray(phase.tasks) ? phase.tasks : []).map((t) => `- ${t}`).join('\n');
    const promptText = `You are a Senior Lead Developer. Implement Phase ${phase.phase_number}: "${phase.title}" for project "${selectedProject?.title}".
Goal: ${phase.description}

Specific Tasks to complete:
${taskList}

Write clean, modular, production-ready code with comprehensive type safety, comments, and error handling.`;

    navigator.clipboard.writeText(promptText);
    showToast('success', `Copied Phase ${phase.phase_number} prompt for Cursor/Claude!`);
  };

  // Export full roadmap as markdown
  const handleExportRoadmapMarkdown = () => {
    if (!selectedProject) return;
    let md = `# Engineering Roadmap: ${selectedProject.title}\n\n`;
    md += `> ${selectedProject.description}\n\n`;
    md += `**Skill Level**: ${selectedProject.skill_level} | **Est. Time**: ${selectedProject.estimated_time}\n\n`;
    md += `## Architecture Specifications\n`;
    md += `- Database: ${dbPref}\n- Hosting: ${hostingPref}\n- Team Size: ${teamSize}\n- Audience: ${targetAudience}\n\n`;
    md += `## Implementation Phases\n\n`;

    roadmap.forEach((phase) => {
      md += `### Phase ${phase.phase_number}: ${phase.title}\n`;
      md += `${phase.description}\n\n`;
      (Array.isArray(phase.tasks) ? phase.tasks : []).forEach((t) => {
        md += `- [ ] ${t}\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.title.replace(/\s+/g, '_')}_Roadmap.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Exported Roadmap as Markdown spec!');
  };

  // Calculate task completion progress
  const totalTasks = roadmap.reduce((acc, p) => acc + (Array.isArray(p.tasks) ? p.tasks.length : 0), 0);
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="container" style={{ maxWidth: 1180, paddingBottom: 50 }}>
      {/* Studio Banner & Stepper Header */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-accent" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Sparkles size={12} /> Engineering Portfolio Architect
              </span>
              <span className="badge" style={{ fontSize: 11 }}>Recruiter-Vetted Blueprints</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Project Finder &amp; Roadmap Studio</h1>
            <p className="text-muted" style={{ fontSize: 14, margin: '4px 0 0 0' }}>
              Design flagship, interview-winning software projects tailored to your tech stack and target career level.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            {[
              { num: 1, label: 'Skills' },
              { num: 2, label: 'Projects' },
              { num: 3, label: 'Architecture' },
              { num: 4, label: 'Roadmap' },
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: step === s.num ? 700 : 500,
                  color: step === s.num ? 'var(--accent)' : step > s.num ? 'var(--ink)' : 'var(--ink-faint)',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: step === s.num ? 'var(--accent)' : step > s.num ? 'var(--success)' : 'var(--border)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                  }}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span>{s.label}</span>
                {s.num < 4 && <span style={{ color: 'var(--border-strong)', margin: '0 2px' }}>&rsaquo;</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Discovery, Archetypes & Skill Cloud ──────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className="card"
          >
            {loading ? (
              <ProgressLoadingView steps={LOADING_STEPS_1} />
            ) : (
              <div>
                {/* Archetype Quick-Select */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span className="eyebrow" style={{ color: 'var(--accent)' }}>01 &bull; Instant Project Archetypes</span>
                    <span className="text-muted" style={{ fontSize: 12 }}>Click to auto-populate high-demand stacks</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                    {PROJECT_ARCHETYPES.map((arch) => (
                      <div
                        key={arch.id}
                        onClick={() => handleApplyArchetype(arch)}
                        className="tone-card"
                        style={{ padding: '10px 12px' }}
                      >
                        <div className="tone-card-title" style={{ fontSize: 13 }}>
                          <span>{arch.badge}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{arch.title}</div>
                        <div className="tone-card-desc" style={{ fontSize: 11 }}>{arch.skills.slice(0, 3).join(', ')}...</div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleGetRecommendations} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {/* Interactive Skill Cloud */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="eyebrow" style={{ color: 'var(--accent)' }}>02 &bull; Interactive Skill Cloud</span>
                      <span className="badge badge-accent" style={{ fontSize: 11 }}>
                        {selectedSkills.length} selected
                      </span>
                    </div>

                    <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
                      Click chips below to toggle technologies, or type custom stacks into the box.
                    </p>

                    <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12 }}>
                      {SKILL_CATEGORIES.map((cat) => (
                        <div key={cat.name} className="skill-cloud-category">
                          <div className="skill-cloud-title">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </div>
                          <div className="skill-chips-wrap">
                            {cat.skills.map((skill) => {
                              const active = selectedSkills.includes(skill);
                              return (
                                <button
                                  type="button"
                                  key={skill}
                                  onClick={() => toggleSkill(skill)}
                                  className={`interactive-chip ${active ? 'active' : ''}`}
                                >
                                  {active && <Check size={12} />}
                                  <span>{skill}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Custom Skill Input */}
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ maxWidth: 280, fontSize: 13, padding: '7px 12px' }}
                          placeholder="+ Add custom tech (e.g. Qdrant, WebRTC)"
                          value={customSkillInput}
                          onChange={(e) => setCustomSkillInput(e.target.value)}
                          onKeyDown={handleAddCustomSkill}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleAddCustomSkill}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ambition & Velocity Selector */}
                  <div>
                    <span className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 8, display: 'block' }}>
                      03 &bull; Ambition Tier &amp; Weekly Velocity
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
                      {AMBITION_TIERS.map((tier) => (
                        <div
                          key={tier.id}
                          className={`tone-card ${ambitionTier === tier.id ? 'active' : ''}`}
                          onClick={() => {
                            setAmbitionTier(tier.id);
                            setTimeCommitment(tier.time);
                          }}
                        >
                          <div className="tone-card-title">{tier.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{tier.time}</div>
                          <div className="tone-card-desc">{tier.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>
                        Target Time Commitment:
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        style={{ maxWidth: 280, fontSize: 13, padding: '7px 12px' }}
                        value={timeCommitment}
                        onChange={(e) => setTimeCommitment(e.target.value)}
                        placeholder="e.g. 15 hours a week"
                        required
                      />
                    </div>
                  </div>

                  {/* Interests & Career Goals */}
                  <div>
                    <span className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 8, display: 'block' }}>
                      04 &bull; Target Domain &amp; Architectural Focus
                    </span>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {[
                        'Distributed Systems & Concurrency',
                        'Real-Time LLM Agents & Tool Calling',
                        'Multi-Tenant B2B SaaS',
                        'High-Throughput Financial APIs',
                        'Zero-Dependency CLI Engine',
                      ].map((chip) => (
                        <button
                          type="button"
                          key={chip}
                          onClick={() => setInterests(chip)}
                          className="interactive-chip"
                          style={{ fontSize: 12 }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="e.g. I want to build a high-concurrency microservice or an AI agent workflow that showcases senior-level system design..."
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      style={{ fontSize: 13.5, lineHeight: 1.5 }}
                      required
                    />
                  </div>

                  {/* Primary Trigger */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 6 }}>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading || selectedSkills.length === 0}
                      style={{ boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.35)' }}
                    >
                      <Zap size={17} /> Find Tailored Projects <ArrowRight size={17} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 2: Bespoke Project Recommendation Cards ─────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)} disabled={loading}>
                <ChevronLeft size={15} /> Modify Stack &amp; Skills
              </button>

              <span className="badge badge-accent" style={{ fontSize: 12 }}>
                {projects.length} Tailored Architecture Blueprints
              </span>
            </div>

            {loading ? (
              <div className="card">
                <ProgressLoadingView steps={LOADING_STEPS_1} />
              </div>
            ) : projects.length === 0 ? (
              <div className="card text-center" style={{ padding: '50px 20px' }}>
                <p className="text-muted" style={{ marginBottom: 16 }}>No recommendations matched these exact constraints.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setStep(1)}>
                  Adjust Search Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
                {projects.map((proj, idx) => {
                  const techList = Array.isArray(proj.key_technologies)
                    ? proj.key_technologies
                    : typeof proj.key_technologies === 'string'
                    ? (proj.key_technologies as string).split(',').map((s) => s.trim())
                    : [];

                  const ratingNum = proj.rating ? Number(proj.rating) : 9.2;
                  const isCopied = copiedPromptId === (proj.id || proj.title);

                  return (
                    <div
                      key={proj.id || idx}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Top Accent Gradient */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: 'var(--gradient-primary)',
                        }}
                      />

                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div>
                          <span className="eyebrow" style={{ color: 'var(--ink-faint)', fontSize: 10 }}>
                            BLUEPRINT #{idx + 1} &bull; {proj.skill_level || 'ADVANCED'}
                          </span>
                          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 0 0', color: 'var(--ink)' }}>
                            {proj.title}
                          </h3>
                        </div>

                        <div
                          style={{
                            background: 'var(--accent-soft)',
                            border: '1px solid var(--accent-soft-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            flexShrink: 0,
                          }}
                          title="Recruiter Signal Score out of 10"
                        >
                          <Star size={12} style={{ fill: 'var(--accent)' }} />
                          <span>{ratingNum}/10 Signal</span>
                        </div>
                      </div>

                      {/* Recruiter Advantage Callout */}
                      <div className="recruiter-signal-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                          <Lightbulb size={13} />
                          <span>RECRUITER IMPACT</span>
                        </div>
                        <p style={{ fontSize: 12, margin: 0, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                          Demonstrates core system design trade-offs and end-to-end velocity that filter top 5% engineering candidates.
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-muted" style={{ fontSize: 13.5, lineHeight: 1.6, flex: 1, marginBottom: 14 }}>
                        {proj.description}
                      </p>

                      {/* Meta Pills */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span className="badge" style={{ fontSize: 11 }}>
                          <Code2 size={11} /> {proj.skill_level || 'Full-Stack'}
                        </span>
                        <span className="badge" style={{ fontSize: 11 }}>
                          <Clock size={11} /> {proj.estimated_time || '2 weeks'}
                        </span>
                      </div>

                      {/* Technologies Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                        {techList.map((t) => (
                          <span
                            key={t}
                            style={{
                              background: 'var(--surface-sunken)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 7px',
                              fontSize: 11,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--ink)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Action Suite */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 8, marginTop: 'auto' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyProjectPrompt(proj)}
                          title="Copy master AI prompt for Cursor, Windsurf, or v0"
                        >
                          {isCopied ? <Check size={13} /> : <Terminal size={13} />}
                          <span>{isCopied ? 'Copied Prompt' : 'Cursor / v0'}</span>
                        </button>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePrepareRoadmap(proj)}
                        >
                          <span>Build Roadmap</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 3: Architecture & Preferences Customizer ────────────────────── */}
        {step === 3 && selectedProject && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className="card"
          >
            {loading ? (
              <ProgressLoadingView steps={LOADING_STEPS_2} />
            ) : (
              <div>
                <button className="btn btn-secondary btn-sm mb-4" onClick={() => setStep(2)} disabled={loading}>
                  <ChevronLeft size={15} /> Back to Blueprints
                </button>

                <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)', borderRadius: 'var(--radius)', padding: 18, marginBottom: 24 }}>
                  <span className="eyebrow" style={{ color: 'var(--accent)' }}>SELECTED ARCHITECTURE</span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 4px 0', color: 'var(--ink)' }}>
                    {selectedProject.title}
                  </h2>
                  <p className="text-muted" style={{ fontSize: 13.5, margin: 0 }}>
                    {selectedProject.description}
                  </p>
                </div>

                <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Database Preference */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                      Preferred Database / Storage Engine
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {PREFERENCE_PRESETS.databases.map((db) => (
                        <button
                          type="button"
                          key={db}
                          onClick={() => setDbPref(db)}
                          className={`interactive-chip ${dbPref === db ? 'active' : ''}`}
                          style={{ fontSize: 12 }}
                        >
                          {db}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      style={{ fontSize: 13 }}
                      value={dbPref}
                      onChange={(e) => setDbPref(e.target.value)}
                    />
                  </div>

                  {/* Hosting Preference */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                      Deployment &amp; Cloud Infrastructure
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {PREFERENCE_PRESETS.hosting.map((h) => (
                        <button
                          type="button"
                          key={h}
                          onClick={() => setHostingPref(h)}
                          className={`interactive-chip ${hostingPref === h ? 'active' : ''}`}
                          style={{ fontSize: 12 }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input-field"
                      style={{ fontSize: 13 }}
                      value={hostingPref}
                      onChange={(e) => setHostingPref(e.target.value)}
                    />
                  </div>

                  {/* Team & Target Audience Dual Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                        Team Composition
                      </label>
                      <select
                        className="input-field"
                        style={{ fontSize: 13 }}
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                      >
                        {PREFERENCE_PRESETS.teams.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                        Target Audience
                      </label>
                      <select
                        className="input-field"
                        style={{ fontSize: 13 }}
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      >
                        {PREFERENCE_PRESETS.audiences.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Monetization / Distribution */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                      Distribution &amp; Monetization Strategy
                    </label>
                    <select
                      className="input-field"
                      style={{ fontSize: 13 }}
                      value={monetization}
                      onChange={(e) => setMonetization(e.target.value)}
                    >
                      {PREFERENCE_PRESETS.monetization.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Constraints */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                      Additional Engineering Requirements &amp; Constraints
                    </label>
                    <textarea
                      className="input-field"
                      rows={3}
                      style={{ fontSize: 13 }}
                      value={extraPref}
                      onChange={(e) => setExtraPref(e.target.value)}
                      placeholder="e.g. Include comprehensive GitHub Actions CI/CD pipeline, Swagger/OpenAPI documentation, and Prometheus metrics..."
                    />
                  </div>

                  {/* Submit Action */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ alignSelf: 'flex-start', boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.35)' }}
                    disabled={loading}
                  >
                    <Zap size={17} /> Generate Full Execution Roadmap <ArrowRight size={17} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 4: Interactive Milestone Timeline & AI Prompts ─────────────── */}
        {step === 4 && selectedProject && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            {/* Top Navigation & Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(3)}>
                <ChevronLeft size={15} /> Back to Architecture Spec
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={handleExportRoadmapMarkdown}>
                  <Download size={14} /> Export Spec (.md)
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setStep(1)}>
                  <Sparkles size={14} /> New Project Blueprint
                </button>
              </div>
            </div>

            {/* Project Overview Banner */}
            <div
              className="card"
              style={{
                marginBottom: 22,
                border: '1px solid var(--accent-soft-border)',
                background: 'linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <span className="badge badge-accent" style={{ marginBottom: 6 }}>
                    EXECUTION ROADMAP &bull; {selectedProject.skill_level || 'ADVANCED'}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 6px 0', color: 'var(--ink)' }}>
                    {selectedProject.title}
                  </h2>
                  <p className="text-muted" style={{ fontSize: 13.5, margin: 0, maxWidth: 720 }}>
                    {selectedProject.description}
                  </p>
                </div>

                {/* Progress Circle & Counter */}
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '12px 18px',
                    textAlign: 'center',
                    minWidth: 160,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Roadmap Progress
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', margin: '2px 0' }}>
                    {progressPercent}%
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    {doneCount} of {totalTasks} tasks completed
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 200ms ease' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone Timeline Track */}
            <div className="roadmap-track">
              {roadmap.map((phase, i) => {
                const tasks = Array.isArray(phase.tasks) ? phase.tasks : [];

                return (
                  <div key={i} className="roadmap-phase-card">
                    {/* Phase Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            color: 'var(--accent-ink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: 14,
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(82, 39, 255, 0.25)',
                          }}
                        >
                          {phase.phase_number || i + 1}
                        </div>
                        <div>
                          <span className="eyebrow" style={{ color: 'var(--ink-faint)', fontSize: 10 }}>
                            PHASE {phase.phase_number || i + 1} MILESTONE
                          </span>
                          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                            {phase.title}
                          </h3>
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyPhasePrompt(phase)}
                        title="Copy prompt for Cursor / Claude to scaffold this phase"
                      >
                        <Terminal size={13} />
                        <span>Copy Phase AI Prompt</span>
                      </button>
                    </div>

                    {/* Phase Description */}
                    <p className="text-muted" style={{ fontSize: 13.5, margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      {phase.description}
                    </p>

                    {/* Interactive Task Checklist */}
                    <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-faint)', marginBottom: 8, paddingLeft: 8 }}>
                        Acceptance Tasks &bull; Click to Mark Complete
                      </div>

                      {tasks.map((task, j) => {
                        const taskKey = `p${phase.phase_number || i}-t${j}`;
                        const isDone = !!completedTasks[taskKey];

                        return (
                          <div
                            key={j}
                            onClick={() => toggleTaskCompleted(taskKey)}
                            className={`milestone-task-item ${isDone ? 'completed' : ''}`}
                          >
                            <div style={{ marginTop: 2, flexShrink: 0 }}>
                              {isDone ? (
                                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                              ) : (
                                <Circle size={16} style={{ color: 'var(--border-strong)' }} />
                              )}
                            </div>
                            <span style={{ fontSize: 13.5, color: isDone ? 'var(--ink-faint)' : 'var(--ink)' }}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
