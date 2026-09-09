import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Clock,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Building,
  SlidersHorizontal,
  Globe2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, apiErrorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { PageLoader, ButtonSpinner } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import type { Resume } from '../../api/types';

interface JobPosting {
  job_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  date_posted?: string;
  salary_min?: number;
  salary_max?: number;
  salary_display?: string | null;
  is_remote: boolean;
  match_score: number;
  match_reason: string;
  source?: string;
}

function resumeDisplayName(filename: string): string {
  return /^[0-9a-fA-F]{24}\.?.*?$/.test(filename) ? 'Resume document.pdf' : filename;
}

const POPULAR_ROLES = [
  'Full Stack Engineer',
  'Frontend Developer',
  'Python AI Engineer',
  'Backend Developer',
  'DevOps & Cloud',
  'Data Scientist',
];

const POPULAR_LOCATIONS = [
  'Remote',
  'United States',
  'India',
  'United Kingdom',
  'Canada',
];

export default function JobMatching() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Remote');
  const [isSearching, setIsSearching] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters & View State
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const cacheRef = useRef<Map<string, JobPosting[]>>(new Map());

  useEffect(() => {
    (async () => {
      const res = await apiFetch<{ resumes: Resume[] }>('/resumes');
      if (res.ok) {
        setResumes(res.data.resumes || []);
        if (res.data.resumes && res.data.resumes.length > 0) {
          setSelectedResumeId(res.data.resumes[0]._id);
        }
      }
    })();
  }, []);

  const handleSearch = async (targetQuery?: string, targetLoc?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    const loc = (targetLoc !== undefined ? targetLoc : location).trim();

    if (!q) {
      showToast('error', 'Please enter a target role or keyword.');
      return;
    }

    const cacheKey = `${selectedResumeId}:${q.toLowerCase()}:${(loc || 'us').toLowerCase()}`;
    if (cacheRef.current.has(cacheKey)) {
      setJobs(cacheRef.current.get(cacheKey)!);
      setHasSearched(true);
      setExpandedJobId(null);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setExpandedJobId(null);

    try {
      const formData = new FormData();
      if (selectedResumeId) {
        formData.append('resume_id', selectedResumeId);
      }
      formData.append('query', q);
      formData.append('location', loc || 'us');

      const res = await apiFetch<{ matches: JobPosting[] }>('/jobs/matches', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.data?.matches) {
        cacheRef.current.set(cacheKey, res.data.matches);
        setJobs(res.data.matches);
        if (res.data.matches.length > 0) {
          showToast('success', `Found & scored ${res.data.matches.length} live opportunities!`);
        }
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to fetch job matches.'));
      }
    } catch {
      showToast('error', 'Network error while searching for jobs.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickRole = (role: string) => {
    setQuery(role);
    handleSearch(role, location);
  };

  const handleQuickLocation = (loc: string) => {
    setLocation(loc);
    if (query.trim()) {
      handleSearch(query, loc);
    }
  };

  const handleCopyDescription = (job: JobPosting) => {
    navigator.clipboard.writeText(job.description);
    setCopiedId(job.job_id);
    showToast('success', 'Job description copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendToAts = (job: JobPosting) => {
    localStorage.setItem('sa_ats_job_description', job.description);
    showToast('success', 'Sending job description to ATS Checker...');
    navigate('/dashboard/ats-checker');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 60) return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose
  };

  const getScoreBadgeBg = (score: number) => {
    if (score >= 80) return 'rgba(16, 185, 129, 0.12)';
    if (score >= 60) return 'rgba(245, 158, 11, 0.12)';
    return 'rgba(244, 63, 94, 0.12)';
  };

  // Filter & Sort Logic
  const filteredJobs = jobs
    .filter((j) => {
      if (minScoreFilter > 0 && j.match_score < minScoreFilter) return false;
      if (remoteOnly && !j.is_remote) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.match_score - a.match_score;
      if (sortBy === 'recent') {
        const dateA = a.date_posted ? new Date(a.date_posted).getTime() : 0;
        const dateB = b.date_posted ? new Date(b.date_posted).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

  return (
    <div className="container" style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 64 }}>
      <PageHeader
        title="Smart Job Matching"
        subtitle="AI-powered career engine that scours live job markets and ranks roles against your unique resume strengths."
      />

      <PageLoader
        show={isSearching}
        title="Scouting Real-time Job Boards..."
        subtitle="Extracting postings, verifying requirements, and running neural match scoring"
      />

      {/* Main Search Panel */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: 24,
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}
        >
          <div>
            <label className="eyebrow" style={{ marginBottom: 8, display: 'block' }}>
              Target Role or Keywords
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Senior React Developer, AI Engineer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingRight: query ? 32 : 12 }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="eyebrow" style={{ marginBottom: 8, display: 'block' }}>
              Preferred Location
            </label>
            <div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Remote, San Francisco, India, UK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="eyebrow" style={{ marginBottom: 8, display: 'block' }}>
              Benchmark Resume
            </label>
            <select
              className="input-field"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.length === 0 ? (
                <option value="">No resumes found (Headline will be used)</option>
              ) : (
                <>
                  <option value="" disabled>Select resume for AI scoring...</option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {resumeDisplayName(r.filename)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}
            disabled={isSearching}
          >
            {isSearching ? <ButtonSpinner /> : <><Sparkles size={16} /> Find Matches</>}
          </button>
        </form>

        {/* Quick Role & Location Suggestion Chips */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
              Popular Tracks:
            </span>
            {POPULAR_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleQuickRole(r)}
                style={{
                  fontSize: 12.5,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: query === r ? 'var(--primary-soft)' : 'var(--surface-sunken)',
                  color: query === r ? 'var(--primary)' : 'var(--ink-soft)',
                  border: `1px solid ${query === r ? 'var(--primary)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>
              Regions:
            </span>
            {POPULAR_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleQuickLocation(loc)}
                style={{
                  fontSize: 12,
                  padding: '3px 9px',
                  borderRadius: 16,
                  background: location === loc ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-sunken)',
                  color: location === loc ? '#0284c7' : 'var(--ink-soft)',
                  border: `1px solid ${location === loc ? '#0284c7' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                {loc === 'Remote' ? '🌐 ' : ''}{loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header / Filter Toolbar (when results are available) */}
      {hasSearched && jobs.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20,
            padding: '12px 16px',
            background: 'var(--surface-sunken)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              Showing {filteredJobs.length} of {jobs.length} jobs
            </span>
            {selectedResumeId && (
              <span style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'var(--surface)', padding: '2px 8px', borderRadius: 12, border: '1px solid var(--border)' }}>
                Scored by AI
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            {/* Minimum Match Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={14} color="var(--ink-soft)" />
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                style={{
                  fontSize: 13,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                }}
              >
                <option value={0}>All Match Scores</option>
                <option value={80}>80%+ High Fit</option>
                <option value={60}>60%+ Moderate Fit</option>
              </select>
            </div>

            {/* Remote Only Toggle */}
            <button
              type="button"
              onClick={() => setRemoteOnly(!remoteOnly)}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: 20,
                background: remoteOnly ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface)',
                color: remoteOnly ? '#10b981' : 'var(--ink-soft)',
                border: `1px solid ${remoteOnly ? '#10b981' : 'var(--border)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Globe2 size={13} />
              Remote Only
            </button>

            {/* Sort Toggle */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                fontSize: 13,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            >
              <option value="score">Sort: Best Match</option>
              <option value="recent">Sort: Most Recent</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <span style={{ fontSize: 36 }}>💼</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Discover Live Jobs Matching Your Resume</h3>
            <p className="text-muted" style={{ maxWidth: 460, margin: '0 auto 24px', fontSize: 14.5, lineHeight: 1.6 }}>
              Select a target role or click any of the popular tracks above. Our engine fetches real-time verified postings and leverages AI to calculate title and skill alignment.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => handleQuickRole('Full Stack Engineer')}
                className="btn btn-secondary btn-sm"
              >
                Try "Full Stack Engineer"
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('Frontend Developer')}
                className="btn btn-secondary btn-sm"
              >
                Try "Frontend Developer"
              </button>
            </div>
          </motion.div>
        ) : filteredJobs.length === 0 && !isSearching ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--surface-sunken)',
                color: 'var(--ink-faint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span style={{ fontSize: 30 }}>🔍</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No matching jobs found</h3>
            <p className="text-muted" style={{ maxWidth: 420, margin: '0 auto 20px', fontSize: 14 }}>
              {minScoreFilter > 0 || remoteOnly
                ? 'Try clearing your active filters (e.g. lowering the minimum match score or unchecking Remote Only).'
                : 'Try broadening your role title or setting location to "Remote" or "United States".'}
            </p>
            {(minScoreFilter > 0 || remoteOnly) && (
              <button
                type="button"
                onClick={() => {
                  setMinScoreFilter(0);
                  setRemoteOnly(false);
                }}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {filteredJobs.map((job, index) => {
              const isExpanded = expandedJobId === job.job_id;
              const isCopied = copiedId === job.job_id;
              const scoreColor = getScoreColor(job.match_score);
              const scoreBg = getScoreBadgeBg(job.match_score);

              return (
                <motion.div
                  key={job.job_id || index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                  className="card job-result-card"
                  style={{
                    padding: 24,
                    background: 'var(--surface)',
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    {/* Visual Score Radial Pill */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 76,
                        height: 76,
                        borderRadius: 14,
                        background: scoreBg,
                        border: `1.5px solid ${scoreColor}`,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: scoreColor }}>
                        {job.match_score}%
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Match
                      </span>
                    </div>

                    {/* Job Details Main Area */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--ink)' }}>
                            {job.title}
                          </h3>

                          {/* Meta Tags: Company, Location, Salary, Remote */}
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--ink)' }}>
                              <Building size={14} color="var(--ink-soft)" /> {job.company}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {job.location}
                            </span>

                            {job.is_remote && (
                              <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                                Remote
                              </span>
                            )}

                            {job.salary_display && (
                              <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <DollarSign size={12} /> {job.salary_display}
                              </span>
                            )}

                            {job.date_posted && (
                              <span style={{ fontSize: 12, color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={12} /> {new Date(job.date_posted).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Direct Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => window.open(job.url, '_blank')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                          >
                            Apply Directly <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>

                      {/* AI Matching Analysis Badge */}
                      {job.match_reason && (
                        <div
                          style={{
                            background: 'var(--surface-sunken)',
                            border: '1px solid var(--border)',
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            color: 'var(--ink-soft)',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            marginTop: 12,
                          }}
                        >
                          <CheckCircle2 size={16} style={{ color: scoreColor, marginTop: 1, flexShrink: 0 }} />
                          <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--ink)' }}>
                            <strong style={{ color: scoreColor }}>Match Analysis: </strong>
                            {job.match_reason}
                          </p>
                        </div>
                      )}

                      {/* Expandable Full Description & Action Bar */}
                      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setExpandedJobId(isExpanded ? null : job.job_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: 0,
                          }}
                        >
                          {isExpanded ? (
                            <>Hide Job Details <ChevronUp size={15} /></>
                          ) : (
                            <>Read Full Job Description <ChevronDown size={15} /></>
                          )}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyDescription(job)}
                            style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'var(--surface-sunken)',
                              border: '1px solid var(--border)',
                              color: 'var(--ink-soft)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Copy description to clipboard"
                          >
                            {isCopied ? <><Check size={13} color="#10b981" /> Copied</> : <><Copy size={13} /> Copy Specs</>}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendToAts(job)}
                            style={{
                              fontSize: 12,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 500,
                            }}
                            title="Check how your resume scores against this job description in ATS Checker"
                          >
                            <Sparkles size={13} /> Optimize in ATS Checker
                          </button>
                        </div>
                      </div>

                      {/* Expanded Job Description Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              overflow: 'hidden',
                              marginTop: 14,
                              paddingTop: 14,
                              borderTop: '1px solid var(--border)',
                            }}
                          >
                            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
                              Full Posting Description & Requirements
                            </h4>
                            <div
                              style={{
                                fontSize: 13.5,
                                lineHeight: 1.65,
                                color: 'var(--ink-soft)',
                                whiteSpace: 'pre-line',
                                maxHeight: 320,
                                overflowY: 'auto',
                                padding: '12px 14px',
                                background: 'var(--surface-sunken)',
                                borderRadius: 8,
                              }}
                            >
                              {job.description || 'No detailed description provided by the employer.'}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .job-result-card > div:first-child {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .job-result-card > div:first-child > div:first-child {
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            padding: 10px 14px !important;
            justify-content: flex-start !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
