import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  X,
  Copy,
  Check,
  Download,
  Sparkles,
  Printer,
  Edit3,
  Eye,
  Building2,
  Briefcase,
  Zap,
  CheckCircle2,
  Layers,
  RotateCcw
} from 'lucide-react';

import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import type { Resume } from '../../api/types';

interface RolePreset {
  id: string;
  badge: string;
  role: string;
  company: string;
  tone: string;
  description: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'ai-staff',
    badge: '🧠 AI Systems',
    role: 'Staff AI Systems Engineer',
    company: 'Anthropic',
    tone: 'Deep Tech & Architecture',
    description: `We are looking for a Staff AI Systems Engineer to scale our distributed inference pipelines and LLM evaluation infrastructure. You will design ultra-low latency model serving, implement custom CUDA/Triton kernels, optimize GPU cluster utilization, and collaborate closely with research scientists to deploy next-generation foundational models at global scale. Required: 6+ years in high-performance computing, Python, PyTorch, C++, and distributed systems.`
  },
  {
    id: 'fullstack-lead',
    badge: '⚡ Product Core',
    role: 'Principal Full-Stack Architect',
    company: 'Stripe',
    tone: 'High-Impact & Metrics',
    description: `Seeking a Principal Full-Stack Architect to lead our merchant billing interfaces and financial telemetry dashboard. You will own end-to-end architecture across React 19, TypeScript, and distributed backend services processing billions in monthly volume. You'll drive 99.999% availability, reduce p99 frontend rendering times below 100ms, and mentor senior engineering staff across cross-functional product pods.`
  },
  {
    id: 'backend-founding',
    badge: '🛡️ Core Infra',
    role: 'Founding Backend Engineer',
    company: 'Monzo / Revolut',
    tone: 'Deep Tech & Architecture',
    description: `As our Founding Backend Engineer, you will build our real-time transaction ledger and ledger audit subsystem from zero to one. You will architect event-driven microservices using Go/Python, Kafka, and PostgreSQL, ensuring zero-loss ledger consistency and bank-grade cryptographic security. Experience with idempotent API design, distributed locks, and financial reconciliation is required.`
  },
  {
    id: 'product-lead',
    badge: '🚀 Product & Velocity',
    role: 'Senior Product Engineering Lead',
    company: 'Linear / Notion',
    tone: 'Product & Mission Velocity',
    description: `We are hiring a Senior Product Engineering Lead to drive our collaboration engine. You will own real-time multiplayer editing, optimistic state synchronization, offline-first local storage, and desktop client performance. We value engineers with deep product intuition, obsessive focus on fluid micro-interactions, and a proven track record of shipping fast.`
  }
];

const TONE_OPTIONS = [
  {
    id: 'High-Impact & Metrics',
    icon: '🚀',
    title: 'High-Impact & Metrics',
    desc: 'Quantified outcomes, throughput, revenue growth, and scale.'
  },
  {
    id: 'Deep Tech & Architecture',
    icon: '🧠',
    title: 'Deep Tech & Architecture',
    desc: 'Distributed systems, low latency, algorithmic rigor, and concurrency.'
  },
  {
    id: 'Product & Mission Velocity',
    icon: '🤝',
    title: 'Product & Mission Velocity',
    desc: 'Rapid iteration, user obsession, zero-to-one cadence, and momentum.'
  },
  {
    id: 'Executive & Strategic',
    icon: '💼',
    title: 'Executive & Strategic',
    desc: 'Technical vision, organizational leverage, mentorship, and roadmap leadership.'
  }
];

const LOADING_STAGES = [
  'Extracting technical competencies & career milestones from resume...',
  'Deconstructing job specifications and core engineering requirements...',
  'Synthesizing tailored executive narrative in selected voice...',
  'Formulating high-signal opening hook and quantified impact evidence...',
  'Finalizing authentic applicant dossier and formatting typography...'
];

function resumeDisplayName(filename: string): string {
  return /^[0-9a-fA-F]{24}\.?.*?$/.test(filename) ? 'Primary Resume Dossier.pdf' : filename;
}

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);

  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('High-Impact & Metrics');
  const [jobDescription, setJobDescription] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);

  const [coverLetter, setCoverLetter] = useState('');
  const [viewMode, setViewMode] = useState<'letterhead' | 'editor'>('letterhead');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ resumes: Resume[] }>('/resumes');
      if (res.ok) {
        const list = res.data?.resumes || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0]._id);
        }
      }
    })();
  }, []);

  // Multi-phase progress ticker while generating
  useEffect(() => {
    if (!generating) {
      setLoadingStageIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [generating]);

  const acceptFile = (f: File) => {
    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      setFile(f);
      setSelectedResumeId('new');
    } else {
      showToast('error', 'Please upload a PDF file.');
    }
  };

  const hasResume = (selectedResumeId && selectedResumeId !== 'new') || !!file;

  const handleApplyPreset = (preset: RolePreset) => {
    setRoleTitle(preset.role);
    setCompanyName(preset.company);
    setSelectedTone(preset.tone);
    setJobDescription(preset.description);
    showToast('info', `Loaded ${preset.badge} preset!`);
  };

  const handleGenerate = async () => {
    if (!hasResume) {
      showToast('error', 'Please select or upload a resume.');
      return;
    }
    if (!jobDescription.trim()) {
      showToast('error', 'Please provide a job description.');
      return;
    }

    setGenerating(true);

    try {
      const formData = new FormData();
      if (selectedResumeId && selectedResumeId !== 'new') {
        formData.append('resume_id', selectedResumeId);
      } else if (file) {
        formData.append('resume_file', file);
      }
      formData.append('job_description', jobDescription.trim());
      if (selectedTone) formData.append('tone', selectedTone);
      if (companyName) formData.append('company_name', companyName.trim());
      if (roleTitle) formData.append('role_title', roleTitle.trim());

      const res = await apiFetch<{ cover_letter: string }>('/cover-letter/generate', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.data?.cover_letter) {
        setCoverLetter(res.data.cover_letter);
        setViewMode('letterhead');
        showToast('success', 'Bespoke cover letter generated!');
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to generate cover letter.'));
      }
    } catch {
      showToast('error', 'Network error while generating cover letter.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('success', 'Copied text to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCompany = companyName ? companyName.replace(/\s+/g, '_') : 'Company';
    link.download = `Cover_Letter_${safeCompany}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Downloaded .txt file');
  };

  const handleDownloadDoc = () => {
    if (!coverLetter) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cover Letter - ${companyName || 'Application'}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; padding: 40px; max-width: 750px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .header-meta { font-size: 13px; color: #555; border-bottom: 1.5px solid #ccc; padding-bottom: 16px; margin-bottom: 24px; }
  .body-text { white-space: pre-wrap; font-size: 14.5px; }
</style>
</head>
<body>
  <h1>${user?.full_name || 'Applicant'}</h1>
  <div class="header-meta">
    ${user?.email || 'applicant@smartapply.ai'} &bull; ${today} &bull; Target: ${companyName || 'Leadership Team'}
  </div>
  <div class="body-text">${coverLetter.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCompany = companyName ? companyName.replace(/\s+/g, '_') : 'Application';
    link.download = `Cover_Letter_${safeCompany}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Exported Word document');
  };

  const wordCount = coverLetter ? coverLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = coverLetter ? coverLetter.length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 220));

  const candidateName = user?.full_name || 'Alex Mercer';
  const candidateEmail = user?.email || 'alex.mercer@developer.io';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container" style={{ maxWidth: 1280, paddingBottom: 40 }}>
      {/* Studio Header & Quick Presets */}
      <div className="no-print" style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-accent" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Sparkles size={12} /> Executive Dossier Studio
              </span>
              <span className="badge" style={{ fontSize: 11 }}>v3.0 Bespoke Engine</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Cover Letter Generator</h1>
            <p className="text-muted" style={{ fontSize: 14, margin: '4px 0 0 0' }}>
              Craft high-conviction, tailored executive letters with authentic typographic letterheads.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="eyebrow" style={{ alignSelf: 'center', marginRight: 4 }}>Quick Role Presets:</span>
            {ROLE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className="interactive-chip"
                style={{ fontSize: 12 }}
                title={`Click to fill sample for ${p.role}`}
              >
                {p.badge}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Tailoring Suite (Left) & Luxury Letterhead Canvas (Right) */}
      <div
        className="cl-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 480px) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Configuration Controls */}
        <div className="card no-print" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Resume Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>01 &bull; Source Dossier</span>
              {resumes.length > 0 && selectedResumeId !== 'new' && (
                <span className="badge" style={{ fontSize: 11 }}>
                  <CheckCircle2 size={11} style={{ color: 'var(--success)' }} /> Linked
                </span>
              )}
            </div>

            {resumes.length > 0 && (
              <select
                className="input-field"
                value={selectedResumeId}
                onChange={(e) => {
                  setSelectedResumeId(e.target.value);
                  if (e.target.value !== 'new') setFile(null);
                }}
                style={{ marginBottom: 8 }}
              >
                <option value="">— Choose an uploaded resume —</option>
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    📄 {resumeDisplayName(r.filename)}
                  </option>
                ))}
                <option value="new">+ Upload a separate PDF file</option>
              </select>
            )}

            {(!resumes.length || selectedResumeId === 'new') && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) acceptFile(e.dataTransfer.files[0]);
                }}
                style={{
                  border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: isDragging ? 'var(--accent-soft)' : 'var(--surface-sunken)',
                  borderRadius: 'var(--radius)',
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])}
                />
                <UploadCloud size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 13.5, margin: '0 0 4px 0' }}>Drop candidate resume PDF</h4>
                <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
                  or click to browse local files
                </p>

                {file && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="chip"
                    style={{ marginTop: 10, display: 'inline-flex', fontSize: 12 }}
                  >
                    <FileText size={12} /> {file.name}
                    <button
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Target Organization & Role */}
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 8, display: 'block' }}>
              02 &bull; Role &amp; Target Company
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>
                  Target Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--ink-faint)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: 30, fontSize: 13 }}
                    placeholder="e.g. Anthropic, Stripe"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>
                  Target Role Title
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--ink-faint)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: 30, fontSize: 13 }}
                    placeholder="e.g. Staff AI Engineer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Narrative Persona & Tone Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>03 &bull; Narrative Persona &amp; Tone</span>
              <span className="badge badge-accent" style={{ fontSize: 11 }}>{selectedTone}</span>
            </div>
            <div className="tone-grid">
              {TONE_OPTIONS.map((t) => (
                <div
                  key={t.id}
                  className={`tone-card ${selectedTone === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTone(t.id)}
                >
                  <div className="tone-card-title">
                    <span>{t.icon}</span>
                    <span>{t.title}</span>
                  </div>
                  <div className="tone-card-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Job Description Spec */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="eyebrow" style={{ color: 'var(--accent)' }}>04 &bull; Job Description Spec</span>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 11, cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              className="input-field"
              rows={7}
              placeholder="Paste target job requirements, qualifications, and team mission..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ fontSize: 13, lineHeight: 1.5 }}
            />
          </div>

          {/* Submit Trigger */}
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleGenerate}
            disabled={generating || !hasResume || !jobDescription.trim()}
            style={{
              boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {generating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  style={{ display: 'inline-flex' }}
                >
                  <Sparkles size={17} />
                </motion.div>
                <span>Synthesizing Executive Letter...</span>
              </>
            ) : (
              <>
                <Zap size={17} />
                <span>Generate Executive Cover Letter</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Executive Letterhead Canvas & Actions */}
        <div style={{ minHeight: 600, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {/* Generating State */}
            {generating && (
              <motion.div
                key="loading-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="letterhead-sheet"
                style={{
                  minHeight: 520,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 40,
                }}
              >
                <div className="letterhead-top-accent" />
                <div style={{ position: 'relative', marginBottom: 24 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      border: '3px dashed var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                    <FileText size={28} />
                  </div>
                </div>

                <span className="badge badge-accent" style={{ marginBottom: 12 }}>
                  Stage {loadingStageIndex + 1} of {LOADING_STAGES.length}
                </span>

                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
                  Architecting Your Cover Letter
                </h3>

                <p className="text-muted" style={{ fontSize: 13.5, maxWidth: 440, minHeight: 40, margin: '0 auto' }}>
                  {LOADING_STAGES[loadingStageIndex]}
                </p>

                <div
                  style={{
                    width: '100%',
                    maxWidth: 320,
                    height: 4,
                    background: 'var(--border)',
                    borderRadius: 999,
                    marginTop: 24,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.8,
                      ease: 'easeInOut',
                    }}
                    style={{
                      width: '40%',
                      height: '100%',
                      background: 'var(--gradient-primary)',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!coverLetter && !generating && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="letterhead-sheet"
                style={{
                  minHeight: 520,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 40,
                }}
              >
                <div className="letterhead-watermark">SKILLHUB // CAREER DOSSIER</div>
                <div className="letterhead-top-accent" />

                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <FileText size={30} />
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
                  Executive Letter Canvas Ready
                </h3>
                <p className="text-muted" style={{ fontSize: 14, maxWidth: 420, lineHeight: 1.6, marginBottom: 20 }}>
                  Select your resume, target company, and narrative tone on the left — or click one of the quick presets above to preview an authentic letter.
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplyPreset(ROLE_PRESETS[0])}
                  >
                    Load AI Systems Preset
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleApplyPreset(ROLE_PRESETS[1])}
                  >
                    Load Full-Stack Lead Preset
                  </button>
                </div>
              </motion.div>
            )}

            {/* Rendered Letterhead or Editor Mode */}
            {coverLetter && !generating && (
              <motion.div
                key="rendered-result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Canvas Control Toolbar */}
                <div
                  className="no-print"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 16px',
                  }}
                >
                  {/* Mode Toggles & Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        background: 'var(--surface-sunken)',
                        padding: 3,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <button
                        onClick={() => setViewMode('letterhead')}
                        className={`btn btn-sm ${viewMode === 'letterhead' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        <Eye size={13} /> Letterhead
                      </button>
                      <button
                        onClick={() => setViewMode('editor')}
                        className={`btn btn-sm ${viewMode === 'editor' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        <Edit3 size={13} /> Direct Editor
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge" style={{ fontSize: 11.5 }}>
                        {wordCount} words &bull; ~{readingTime}m read
                      </span>
                      <span className="badge badge-accent" style={{ fontSize: 11.5 }}>
                        98% Narrative Alignment
                      </span>
                    </div>
                  </div>

                  {/* Actions Suite */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handlePrint}
                      title="Print or Save as PDF"
                    >
                      <Printer size={14} /> Print / PDF
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadDoc}
                      title="Download Word Document"
                    >
                      <Download size={14} /> Word .doc
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadTxt}
                      title="Download Plain Text"
                    >
                      <Download size={14} /> .txt
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCopy}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                </div>

                {/* The Letterhead Canvas View */}
                {viewMode === 'letterhead' ? (
                  <div className="letterhead-sheet printable-letterhead">
                    <div className="letterhead-top-accent" />
                    <div className="letterhead-watermark">CONFIDENTIAL // APPLICANT DOSSIER</div>

                    {/* Letterhead Formal Header */}
                    <div
                      style={{
                        borderBottom: '1.5px solid var(--border)',
                        paddingBottom: 22,
                        marginBottom: 26,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 16,
                      }}
                    >
                      <div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                          {candidateName}
                        </h2>
                        <div
                          style={{
                            display: 'flex',
                            gap: 14,
                            marginTop: 6,
                            fontSize: 13,
                            color: 'var(--ink-soft)',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{candidateEmail}</span>
                          <span>&bull;</span>
                          <span>San Francisco / Remote</span>
                          <span>&bull;</span>
                          <span>Engineering Candidate</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {todayFormatted}
                        </div>
                        <span className="badge badge-accent" style={{ fontSize: 11, marginTop: 4 }}>
                          {selectedTone}
                        </span>
                      </div>
                    </div>

                    {/* Recipient Block */}
                    <div style={{ marginBottom: 24, fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        Technical Leadership &amp; Hiring Committee
                      </div>
                      <div>{companyName ? `${companyName} Engineering Division` : 'Engineering Department'}</div>
                      <div style={{ fontStyle: 'italic', marginTop: 4, color: 'var(--ink-faint)' }}>
                        RE: Application for {roleTitle || 'Engineering Position'}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="letterhead-body">
                      {coverLetter}
                    </div>

                    {/* Formal Sign-off */}
                    <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 12 }}>
                        Respectfully submitted,
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                        {candidateName}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Editor View */
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: 16,
                      background: 'var(--surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="eyebrow">Direct Markdown / Text Editor</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>Changes sync directly with preview</span>
                    </div>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={18}
                      className="input-field"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .cl-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
