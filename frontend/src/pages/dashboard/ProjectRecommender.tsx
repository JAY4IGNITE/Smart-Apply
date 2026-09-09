import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Clock, Star, ArrowRight, ChevronLeft, CheckCircle2, Lightbulb } from 'lucide-react';

import { InlineLoader } from '../../components/LoadingSpinner';
import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import type { Project, RoadmapPhase } from '../../api/types';

const loadingMessagesStep1 = [
  "Analyzing your unique skills...",
  "Brainstorming perfect project ideas...",
  "Applying AI matching algorithms...",
  "Tailoring recommendations for you...",
  "Putting on the finishing touches..."
];

const loadingMessagesStep3 = [
  "Reading your custom preferences...",
  "Drafting a step-by-step plan...",
  "Structuring phases and tasks...",
  "Adding industry best practices...",
  "Finalizing your personalized roadmap..."
];

function LoadingView({ messages }: { messages: string[] }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center text-center pt-15 pb-15">
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="rounded-full"
          style={{
            width: 60,
            height: 60,
            border: '3px solid var(--accent-soft-border)',
            borderTopColor: 'var(--accent)',
          }}
        />
        <Lightbulb
          size={24}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--accent)' }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.h3
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-lg m-0 text-ink"
        >
          {messages[msgIndex]}
        </motion.h3>
      </AnimatePresence>
      <p className="text-muted text-sm mt-4">This usually takes 10-15 seconds</p>
    </div>
  );
}

export default function ProjectRecommender() {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  const [skills, setSkills] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [interests, setInterests] = useState('');

  const [dbPref, setDbPref] = useState('');
  const [hostingPref, setHostingPref] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [monetization, setMonetization] = useState('');
  const [extraPref, setExtraPref] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills.trim() || !timeCommitment.trim() || !interests.trim()) {
      showToast('error', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<Project[] | { projects?: Project[]; data?: Project[] }>('/projects/recommend', {
        method: 'POST',
        body: JSON.stringify({ skills, time_commitment: timeCommitment, interests }),
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
        showToast('error', apiErrorMessage(res, 'No projects could be generated. Please try adjusting your skills or interests.'));
      }
    } catch {
      showToast('error', 'Network error while fetching project recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrepareRoadmap = (project: Project) => {
    setSelectedProject(project);
    setStep(3);
  };

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

  return (
    <div className="container-narrow">
      <div className="dashboard-page-header">
        <h1>Project finder</h1>
        <p>Get AI-tailored software project recommendations and step-by-step roadmaps.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="card">
            {loading ? (
              <LoadingView messages={loadingMessagesStep1} />
            ) : (
              <>
                <span className="eyebrow">Step 1 of 2</span>
                <h2 className="mt-2 mb-6" style={{ fontSize: 19 }}>Tell us about yourself</h2>
                <form onSubmit={handleGetRecommendations} className="flex flex-col">
                  <div className="input-group">
                    <label>Current skills &amp; technologies</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. React, Python basics, Tailwind"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Available time</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 10 hours a week, or 1 month total"
                      value={timeCommitment}
                      onChange={(e) => setTimeCommitment(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Interests &amp; goals</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder="e.g. I want to build a SaaS, I like AI, I want to learn databases…"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg items-start mt-4" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                    Find projects <ArrowRight size={17} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <button className="btn btn-secondary btn-sm mb-6" onClick={() => setStep(1)} disabled={loading}>
              <ChevronLeft size={15} /> Back
            </button>

            <h2 className="mb-6" style={{ fontSize: 19 }}>Recommended for you</h2>

            {loading ? (
              <InlineLoader title="Finding your projects" subtitle="Matching ideas to your skills and interests" />
            ) : projects.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <p className="text-muted mb-4">No recommendations found for these criteria.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(1)}>
                  Adjust your search
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                {projects.map((proj) => (
                  <div key={proj.id} className="card flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h3 style={{ fontSize: 16, margin: 0 }}>{proj.title}</h3>
                      <span className="badge badge-accent shrink-0">
                        <Star size={11} /> {proj.rating}/10
                      </span>
                    </div>

                    <p className="text-muted text-sm mb-4 flex-1" style={{ lineHeight: 1.55 }}>
                      {proj.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="badge">
                        <Code2 size={12} /> {proj.skill_level}
                      </span>
                      <span className="badge">
                        <Clock size={12} /> {proj.estimated_time}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {(Array.isArray(proj.key_technologies)
                        ? proj.key_technologies
                        : typeof proj.key_technologies === 'string'
                        ? (proj.key_technologies as string).split(',').map((s) => s.trim())
                        : []
                      ).map((tech) => (
                        <span key={tech} className="badge badge-accent">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <button className="btn btn-primary btn-block mt-auto" onClick={() => handlePrepareRoadmap(proj)}>
                      Generate roadmap
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && selectedProject && (
          <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="card">
            {loading ? (
              <LoadingView messages={loadingMessagesStep3} />
            ) : (
              <>
                <button className="btn btn-secondary btn-sm mb-6" onClick={() => setStep(2)} disabled={loading}>
                  <ChevronLeft size={15} /> Back to projects
                </button>

                <span className="eyebrow">Step 2 of 2</span>
                <h2 className="mt-2 mb-3" style={{ fontSize: 19 }}>Customize your roadmap</h2>
                <p className="text-muted text-sm mb-6">
                  Before generating the plan for <strong style={{ color: 'var(--ink)' }}>{selectedProject.title}</strong>, add any
                  preferences — all optional.
                </p>

                <form onSubmit={handleGenerateRoadmap} className="flex flex-col">
                  <div className="input-group">
                    <label>Preferred database</label>
                    <input type="text" className="input-field" placeholder="e.g. PostgreSQL, MongoDB, Firebase" value={dbPref} onChange={(e) => setDbPref(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Preferred hosting / deployment</label>
                    <input type="text" className="input-field" placeholder="e.g. Vercel, AWS, Render" value={hostingPref} onChange={(e) => setHostingPref(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Team size</label>
                    <input type="text" className="input-field" placeholder="e.g. Solo, 2–3 people" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Target audience</label>
                    <input type="text" className="input-field" placeholder="e.g. Developers, students, enterprise" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Monetization strategy</label>
                    <input type="text" className="input-field" placeholder="e.g. Open source, SaaS, ads" value={monetization} onChange={(e) => setMonetization(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Additional requirements</label>
                    <textarea className="input-field" rows={3} placeholder="e.g. Focus on testing, use TypeScript" value={extraPref} onChange={(e) => setExtraPref(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg items-start mt-4" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                    Generate roadmap <ArrowRight size={17} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}

        {step === 4 && selectedProject && (
          <motion.div key="step4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <button className="btn btn-secondary btn-sm mb-6" onClick={() => setStep(3)}>
              <ChevronLeft size={15} /> Back to preferences
            </button>

            <div className="card mb-6" style={{ borderColor: 'var(--accent-soft-border)', background: 'var(--accent-soft)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} style={{ color: 'var(--accent)' }} />
                <span className="eyebrow" style={{ color: 'var(--accent)' }}>Your roadmap</span>
              </div>
              <h2 className="mb-2" style={{ fontSize: 21 }}>{selectedProject.title}</h2>
              <p className="text-sm m-0" style={{ color: 'var(--ink-soft)' }}>{selectedProject.description}</p>
            </div>

            <div className="flex flex-col gap-4">
              {roadmap.map((phase, i) => (
                <div key={i} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        background: 'var(--accent)',
                        color: 'var(--accent-ink)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {phase.phase_number}
                    </div>
                    <h3 style={{ fontSize: 16, margin: 0 }}>{phase.title}</h3>
                  </div>
                  <p className="text-muted text-sm mb-4">{phase.description}</p>

                  <ul className="flex flex-col gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(Array.isArray(phase.tasks) ? phase.tasks : []).map((task, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="shrink-0" style={{ color: 'var(--success)', marginTop: 2 }} />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
