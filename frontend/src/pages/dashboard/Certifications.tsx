import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Plus,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import '../../styles/dashboard.css';

interface Cert {
  _id: string;
  id?: string;
  title: string;
  issuer: string;
  issue_date?: string;
  credential_url?: string;
  skills: string[];
}

export default function Certifications() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCerts = () => {
    setLoading(true);
    apiFetch<Cert[]>('/skills/certifications')
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setCerts(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !issuer.trim()) {
      showToast('error', 'Certification title and issuing organization are required.');
      return;
    }
    setSaving(true);
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const res = await apiFetch<Cert>('/skills/certifications', {
        method: 'POST',
        body: JSON.stringify({
          title,
          issuer,
          issue_date: issueDate || null,
          credential_url: credentialUrl || null,
          skills,
        }),
      });
      if (res.ok) {
        showToast('success', 'Certification logged!');
        setTitle('');
        setIssuer('');
        setIssueDate('');
        setCredentialUrl('');
        setSkillsInput('');
        setModalOpen(false);
        fetchCerts();
      } else {
        showToast('error', 'Failed to save certification.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      const res = await apiFetch(`/skills/certifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Certification removed.');
        setCerts((prev) => prev.filter((c) => (c._id || c.id) !== id));
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
            <Award size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Verified Certifications &amp; Credentials
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Validate your technical expertise with recognized industry certifications and digital badges.
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          style={{ gap: 6, borderRadius: 999 }}
        >
          <Plus size={16} /> Log Certification
        </button>
      </div>

      {/* Grid of Certs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {certs.map((cert) => {
          const cId = cert._id || cert.id || '';
          return (
            <motion.div
              key={cId}
              className="card"
              whileHover={{ y: -2 }}
              style={{
                padding: 22,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'var(--surface-sunken)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                      }}
                    >
                      <Award size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                        {cert.title}
                      </h3>
                      <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                        {cert.issuer}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(cId)}
                    className="btn btn-sm btn-ghost danger"
                    style={{ padding: 4 }}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {cert.issue_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>
                    <Calendar size={13} /> Issued {cert.issue_date}
                  </div>
                )}

                {/* Associated Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {cert.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11.5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--surface-sunken)',
                        color: 'var(--ink)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {cert.credential_url && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline"
                    style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 12.5 }}
                  >
                    View Verified Credential <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </motion.div>
          );
        })}

        {certs.length === 0 && !loading && (
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
            <Award size={36} style={{ color: 'var(--ink-faint)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>No certifications logged yet</h3>
            <p style={{ fontSize: 13.5, maxWidth: 420, margin: '0 auto 16px' }}>
              Add professional credentials (AWS, Meta, Google, CKA, etc.) to enhance your career readiness.
            </p>
            <button className="btn btn-sm btn-primary" onClick={() => setModalOpen(true)} style={{ borderRadius: 999 }}>
              <Plus size={14} /> Log Certification
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
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
                maxWidth: 480,
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                Log New Certification
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Certification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services / Meta / Google"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                      Issue Date (MM/YYYY)
                    </label>
                    <input
                      type="text"
                      placeholder="08/2024"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                      Credential Verification URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://credly.com/..."
                      value={credentialUrl}
                      onChange={(e) => setCredentialUrl(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                    Associated Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="AWS, Cloud, Docker, Terraform"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Certification'}
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
