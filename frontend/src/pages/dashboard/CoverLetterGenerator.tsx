import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, ArrowRight, X, Copy, Check, Download, Sparkles } from 'lucide-react';

import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { PageLoader, ButtonSpinner } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import type { Resume } from '../../api/types';

function resumeDisplayName(filename: string): string {
  return /^[0-9a-fA-F]{24}\.?.*?$/.test(filename) ? 'Resume document.pdf' : filename;
}

export default function CoverLetterGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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

  const acceptFile = (f: File) => {
    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
      setFile(f);
      setSelectedResumeId('new');
    } else {
      showToast('error', 'Please upload a PDF file.');
    }
  };

  const hasResume = (selectedResumeId && selectedResumeId !== 'new') || !!file;

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

      const res = await apiFetch<{ cover_letter: string }>('/cover-letter/generate', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.data?.cover_letter) {
        setCoverLetter(res.data.cover_letter);
        showToast('success', 'Cover letter generated successfully!');
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
    showToast('success', 'Copied to clipboard');
  };

  const handleDownload = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Cover_Letter.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Downloaded as text file');
  };

  const wordCount = coverLetter ? coverLetter.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = coverLetter ? coverLetter.length : 0;

  return (
    <div className="container">
      <PageHeader
        title="Cover Letter Generator"
        subtitle="Instantly craft a tailored, high-impact cover letter matching your resume to the job."
      />

      <PageLoader
        show={generating}
        title="Drafting your cover letter"
        subtitle="Analyzing job requirements and matching your skills..."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
          gap: 22,
          alignItems: 'start',
        }}
        className="cl-grid cover-letter-grid"
      >
        {/* Input Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <span className="eyebrow">Step 1 — Base Resume</span>
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
                  padding: 28,
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
                <h3 style={{ fontSize: 14.5, marginBottom: 3 }}>Drag &amp; drop PDF</h3>
                <p className="text-muted" style={{ fontSize: 12.5 }}>
                  or click to browse your computer
                </p>

                {file && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="chip"
                    style={{ marginTop: 14, display: 'inline-flex' }}
                  >
                    <FileText size={13} /> {file.name}
                    <button
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="eyebrow">Step 2 — Job Description</span>
            <textarea
              className="input-field"
              rows={8}
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ marginTop: 10 }}
            />
          </div>

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleGenerate}
            disabled={generating || !hasResume || !jobDescription.trim()}
          >
            {generating ? (
              <>
                <ButtonSpinner /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={17} /> Generate Cover Letter <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>

        {/* Results Card */}
        <div className="card" style={{ minHeight: 460, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {!coverLetter && !generating && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px 20px',
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'var(--surface-sunken)',
                    color: 'var(--ink-faint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <FileText size={26} />
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>Ready to generate</h3>
                <p className="text-muted" style={{ fontSize: 13.5, maxWidth: 320 }}>
                  Select or upload your resume, paste a target job description, and click generate.
                </p>
              </motion.div>
            )}

            {coverLetter && !generating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Your Cover Letter</h3>
                    <span className="badge" style={{ fontSize: 11.5 }}>
                      {wordCount} words &bull; {charCount} chars
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={handleDownload} title="Download .txt">
                      <Download size={14} /> Download
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-sunken)',
                    padding: 4,
                  }}
                >
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 380,
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      lineHeight: 1.65,
                      padding: 16,
                      resize: 'vertical',
                    }}
                    placeholder="Cover letter text will appear here..."
                  />
                </div>

                <p className="text-muted" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
                  You can edit the text directly above before copying or downloading.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cl-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
