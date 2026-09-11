import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  Plus,
  Globe,
  Star,
  Trash2,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Github } from '../../components/Icons';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import '../../styles/dashboard.css';

interface Project {
  _id: string;
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  featured: boolean;
  created_at: string;
}

export default function StudentPortfolio() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    apiFetch<Project[]>('/skills/portfolio')
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setProjects(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'Project title is required.');
      return;
    }
    setSaving(true);
    const techArray = techInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await apiFetch<Project>('/skills/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          technologies: techArray,
          github_url: githubUrl || null,
          live_url: liveUrl || null,
          featured,
        }),
      });
      if (res.ok) {
        showToast('success', 'Project added to portfolio!');
        setTitle('');
        setDescription('');
        setTechInput('');
        setGithubUrl('');
        setLiveUrl('');
        setFeatured(false);
        setModalOpen(false);
        fetchProjects();
      } else {
        showToast('error', 'Failed to save project.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project from your portfolio?')) return;
    try {
      const res = await apiFetch(`/skills/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Project deleted.');
        setProjects((prev) => prev.filter((p) => (p._id || p.id) !== id));
      }
    } catch {
      showToast('error', 'Network error.');
    }
  };

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <FolderGit2 size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Student Project Portfolio
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Curate verified software engineering projects, connect live demos, and showcase evidence to recruiters.
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          style={{ gap: 6, borderRadius: 999 }}
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Candidate Dossier Overview Banner */}
      <div
        className="card"
        style={{
          padding: 22,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
          background: 'var(--gradient-glow-card)',
          border: '1px solid var(--accent-soft-border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Portfolio Candidate
            </span>
            <h2 style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
              {user?.full_name || 'Student Candidate'}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {projects.length} Total Projects &bull; {projects.filter((p) => p.featured).length} Featured Highlights
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {user?.github_url && (
              <a
                href={user.github_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline"
                style={{ gap: 6, borderRadius: 999 }}
              >
                <Github size={14} /> GitHub Profile
              </a>
            )}
            {user?.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline"
                style={{ gap: 6, borderRadius: 999 }}
              >
                LinkedIn Dossier
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {projects.map((project) => {
          const pId = project._id || project.id || '';
          return (
            <motion.div
              key={pId}
              className="card"
              whileHover={{ y: -2 }}
              style={{
                padding: 20,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: project.featured ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                      {project.title}
                    </h3>
                    {project.featured && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Star size={12} fill="var(--accent)" /> Featured
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(pId)}
                    className="btn btn-sm btn-ghost danger"
                    style={{ padding: 4 }}
                    title="Delete Project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 14 }}>
                  {project.description}
                </p>

                {/* Technologies */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--surface-sunken)',
                        color: 'var(--ink)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline"
                    style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 12 }}
                  >
                    <Github size={13} /> Source Code
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1, justifyContent: 'center', gap: 6, fontSize: 12 }}
                  >
                    <Globe size={13} /> Live App
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && !loading && (
          <div
            className="card"
            style={{
              gridColumn: '1 / -1',
              padding: 40,
              textAlign: 'center',
              color: 'var(--ink-soft)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <FolderGit2 size={36} style={{ color: 'var(--ink-faint)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>No projects logged yet</h3>
            <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto 16px' }}>
              Add your portfolio projects to showcase skills and increase your Career Readiness score.
            </p>
            <button className="btn btn-sm btn-primary" onClick={() => setModalOpen(true)} style={{ borderRadius: 999 }}>
              <Plus size={14} /> Add First Project
            </button>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{
                width: '100%',
                maxWidth: 520,
                padding: 26,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                Add Portfolio Project
              </h2>

              <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Real-Time Collaborative Whiteboard"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key architectural highlights, challenges solved, and user impact..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Key Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="React, TypeScript, WebSocket, Node.js, Redis"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                      Live Demo URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <label htmlFor="featured-check" style={{ fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
                    Feature this project on executive profile highlights
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Add Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
