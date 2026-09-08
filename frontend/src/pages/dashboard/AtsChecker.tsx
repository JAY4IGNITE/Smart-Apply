import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, ArrowRight, X, Sparkles } from 'lucide-react';

import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { SkeletonAnalysis, ButtonSpinner } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import type { AtsCheckResult, Resume } from '../../api/types';

function scoreTone(score: number): { color: string; bg: string; verdict: string } {
  if (score >= 80) return { color: 'var(--success)', bg: 'var(--success-soft)', verdict: 'Excellent — highly optimized for ATS.' };
  if (score >= 60) return { color: 'var(--warning)', bg: 'var(--warning-soft)', verdict: 'Good start, but needs a few tweaks.' };
  return { color: 'var(--danger)', bg: 'var(--danger-soft)', verdict: 'Needs significant improvement.' };
}

function resumeDisplayName(filename: string): string {
  return /^[0-9a-fA-F]{24}\.?.*?$/.test(filename) ? 'Resume document.pdf' : filename;
}

export default function AtsChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AtsCheckResult | null>(null);

  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [tailoring, setTailoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ resumes: Resume[] }>('/resumes');
      if (res.ok) setResumes(res.data.resumes || []);
      const prefillJob = localStorage.getItem('sa_ats_job_description');
      if (prefillJob) {
        setJobDescription(prefillJob);
        localStorage.removeItem('sa_ats_job_description');
      }
    })();
  }, []);

  const acceptFile = (f: File) => {
    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      setFile(f);
      setSelectedResumeId('new');
    } else {
      showToast('error', 'Please upload a PDF file.');
    }
  };

  const handleAnalyze = async () => {
    if (!file && !selectedResumeId) {
      showToast('error', 'Please select or upload a resume.');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (selectedResumeId && selectedResumeId !== 'new') {
        formData.append('resume_id', selectedResumeId);
      } else if (file) {
        formData.append('resume_file', file);
      }
      formData.append('job_description', jobDescription);

      const res = await apiFetch<AtsCheckResult>('/ai/ats-check', { method: 'POST', body: formData });

      if (res.ok) {
        setResult(res.data);
        showToast('success', 'Analysis complete!');
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to analyze resume.'));
      }
    } catch {
      showToast('error', 'Network error while analyzing.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTailor = async () => {
    if (!selectedResumeId || selectedResumeId === 'new') {
      showToast('error', 'Please analyze a resume from your library first.');
      return;
    }

    setTailoring(true);
    try {
      const res = await apiFetch<{ message: string; latex_code: string; email_sent: boolean }>('/tailor/auto-apply', {
        method: 'POST',
        body: JSON.stringify({
          resume_id: selectedResumeId,
          recommendations: selectedRecommendations,
          custom_instructions: customInstructions,
        }),
      });

      if (res.ok) {
        if (res.data.email_sent) {
          showToast('success', 'Tailored resume sent to your email!');
        } else {
          showToast('error', 'Resume tailored but email delivery failed — download it manually.');
        }
        setSelectedRecommendations([]);
        setCustomInstructions('');
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to tailor resume.'));
      }
    } catch {
      showToast('error', 'Network error while tailoring.');
    } finally {
      setTailoring(false);
    }
  };

  const tone = result ? scoreTone(result.score) : null;

  return (
    <div className="container">
      <PageHeader title="ATS checker" subtitle="Optimize your resume for Applicant Tracking Systems." />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: 22, alignItems: 'start' }} className="ats-grid">
        {/* Input */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <span className="eyebrow">Step 1 — Select resume</span>
            {resumes.length > 0 && (
              <select
                className="input-field"
                value={selectedResumeId}
                onChange={(e) => {
                  setSelectedResumeId(e.target.value);
                  if (e.target.value !== 'new') setFile(null);
                }}
                style={{ marginTop: 10, marginBottom: 12 }}
              >
                <option value="">— Choose an uploaded resume —</option>
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {resumeDisplayName(r.filename)}
                  </option>
                ))}
                <option value="new">+ Upload a new PDF</option>
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
                  marginTop: 10,
                  border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: isDragging ? 'var(--accent-soft)' : 'transparent',
                  borderRadius: 'var(--radius)',
                  padding: 32,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="application/pdf"
                  onChange={(e) => e.target.files?.[0] && acceptFile(e.target.files[0])}
                />
                <UploadCloud size={28} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: 14.5, marginBottom: 3 }}>Drag &amp; drop</h3>
                <p className="text-muted" style={{ fontSize: 12.5 }}>or click to browse (PDF only)</p>

                {file && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="chip"
                    style={{ marginTop: 14, display: 'inline-flex' }}
                  >
                    <FileText size={13} /> {file.name}
                    <button onClick={() => setFile(null)} aria-label="Remove file">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="eyebrow">Step 2 — Job description (optional)</span>
            <textarea
              className="input-field"
              rows={6}
              placeholder="Paste the job description here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </div>

          <button className="btn btn-primary btn-lg btn-block" onClick={handleAnalyze} disabled={analyzing || (!file && !selectedResumeId)}>
            {analyzing ? (
              <>
                <ButtonSpinner /> Analyzing…
              </>
            ) : (
              <>
                Analyze resume <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'var(--surface-sunken)',
                    color: 'var(--ink-faint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <FileText size={24} />
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 5 }}>Awaiting resume</h3>
                <p className="text-muted" style={{ fontSize: 13.5 }}>Upload a resume to see your score.</p>
              </motion.div>
            )}

            {analyzing && (
              <SkeletonAnalysis key="analyzing" />
            )}

            {result && tone && !analyzing && (
              <motion.div key="result" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 16, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  Analysis results
                </h3>

                <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: tone.bg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div className="stat-number" style={{ fontSize: 30, lineHeight: 1, color: tone.color }}>
                      {result.score}
                    </div>
                    <div className="eyebrow" style={{ color: tone.color, marginTop: 2 }}>Score</div>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{tone.verdict}</p>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div className="badge badge-success" style={{ marginBottom: 10 }}>Matched keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.matched_keywords?.length ? (
                      result.matched_keywords.map((kw) => (
                        <span key={kw} className="badge">{kw}</span>
                      ))
                    ) : (
                      <span className="text-muted" style={{ fontSize: 13.5 }}>No clear matches found.</span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div className="badge badge-danger" style={{ marginBottom: 10 }}>Missing / suggested keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.missing_keywords?.length ? (
                      result.missing_keywords.map((kw) => (
                        <span key={kw} className="badge">{kw}</span>
                      ))
                    ) : (
                      <span className="text-muted" style={{ fontSize: 13.5 }}>Looks good — no major gaps.</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="badge badge-accent" style={{ marginBottom: 10 }}>Actionable suggestions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.suggestions?.map((sug, i) => (
                      <label
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          padding: 12,
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: 13.5,
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecommendations((prev) => [...prev, sug]);
                            } else {
                              setSelectedRecommendations((prev) => prev.filter((r) => r !== sug));
                            }
                          }}
                        />
                        <span>{sug}</span>
                      </label>
                    ))}
                  </div>

                  {selectedRecommendations.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 18 }}>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder="Any custom instructions? (e.g. keep it under one page, emphasize frontend skills)"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        style={{ marginBottom: 14 }}
                      />
                      <button className="btn btn-primary btn-block" onClick={handleTailor} disabled={tailoring}>
                        {tailoring ? (
                          <>
                            <ButtonSpinner /> Tailoring…
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} /> Send to AI &amp; tailor resume
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
