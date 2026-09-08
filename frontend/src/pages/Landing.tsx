import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanSearch,
  Wand2,
  Video,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Code2,
  ChevronDown,
  ShieldCheck,
  FileText,
  Terminal,
  Volume2,
  Cpu,
  Layers,
  Lock,
  Check,
  FileCode,
  Share2,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import SpotlightCard from '../components/reactbits/SpotlightCard';
import SplitText from '../components/reactbits/SplitText';
import TiltedCard from '../components/reactbits/TiltedCard';

interface RolePreview {
  id: string;
  title: string;
  category: string;
  atsScore: number;
  detectedSkills: string[];
  missingSkills: string[];
  formatChecks: { name: string; passed: boolean }[];
  interviewPrompt: string;
  interviewCode: string;
  bulletOriginal: string;
  bulletOptimized: string;
}

const SAMPLE_ROLES: RolePreview[] = [
  {
    id: 'backend',
    title: 'Senior Backend Engineer',
    category: 'Distributed Systems & Cloud',
    atsScore: 92,
    detectedSkills: ['Python / FastAPI', 'PostgreSQL', 'Redis Caching', 'Docker', 'REST APIs'],
    missingSkills: ['Kafka Event Streaming', 'Kubernetes Helm', 'p99 Latency Metrics'],
    formatChecks: [
      { name: 'Single-column ATS layout', passed: true },
      { name: 'Standard section headers', passed: true },
      { name: 'Contact details parseable', passed: true },
      { name: 'Quantitative metrics detected', passed: true },
    ],
    interviewPrompt:
      'How would you design a distributed rate limiter that handles 50,000 requests per second across multiple regional API gateways?',
    interviewCode: `import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()

    def allow_request(self, tokens_needed: int = 1) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= tokens_needed:
            self.tokens -= tokens_needed
            return True
        return False`,
    bulletOriginal: 'Worked on backend APIs, optimized queries, and handled server deployments.',
    bulletOptimized:
      'Redesigned API gateway caching with Redis and async connection pooling, reducing p99 response times from 420ms to 65ms across 12M daily requests.',
  },
  {
    id: 'frontend',
    title: 'Staff Frontend Engineer',
    category: 'Design Systems & Web Performance',
    atsScore: 95,
    detectedSkills: ['React 19', 'TypeScript', 'Vite', 'Design Systems', 'CSS Architecture'],
    missingSkills: ['Core Web Vitals INP', 'Web Workers', 'Micro-Frontends'],
    formatChecks: [
      { name: 'Single-column ATS layout', passed: true },
      { name: 'Standard section headers', passed: true },
      { name: 'Contact details parseable', passed: true },
      { name: 'Quantitative metrics detected', passed: true },
    ],
    interviewPrompt:
      'How do you identify and eliminate Interaction to Next Paint (INP) bottlenecks in high-frequency data grid interfaces?',
    interviewCode: `import { useTransition, useState } from 'react';

export function FilterableGrid({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setQuery(val);
    });
  };

  return <input onChange={handleSearch} placeholder="Search..." />;
}`,
    bulletOriginal: 'Created reusable UI components and improved page loading performance.',
    bulletOptimized:
      'Architected internal component library adopting WCAG 2.1 AA standards; cut overall JS bundle payload by 38% and raised Lighthouse performance scores to 98.',
  },
  {
    id: 'devops',
    title: 'Lead DevOps / SRE',
    category: 'Infrastructure & Observability',
    atsScore: 89,
    detectedSkills: ['Kubernetes', 'Terraform', 'Prometheus', 'AWS', 'CI/CD Pipelines'],
    missingSkills: ['ArgoCD Canary Rollouts', 'eBPF Profiling', 'Disaster Recovery RTO'],
    formatChecks: [
      { name: 'Single-column ATS layout', passed: true },
      { name: 'Standard section headers', passed: true },
      { name: 'Contact details parseable', passed: true },
      { name: 'Quantitative metrics detected', passed: true },
    ],
    interviewPrompt:
      'Describe your architecture for automated blue/green deployments with synthetic canary testing and automated rollback triggers.',
    interviewCode: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: platform-api
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }`,
    bulletOriginal: 'Maintained cloud infrastructure and fixed server deployment issues.',
    bulletOptimized:
      'Automated multi-region AWS infrastructure with Terraform and GitHub Actions, cutting mean-time-to-recovery (MTTR) by 72% and eliminating deployment downtime.',
  },
];

const FAQS = [
  {
    q: 'What resume file formats can I upload and export?',
    a: 'You can upload existing resumes in PDF, DOCX, or plain text format. SmartApply parses your content into structured sections. You can then export your tailored resumes as vector-crisp PDFs or download the clean, raw LaTeX source code (.tex) to store in your personal repositories.',
  },
  {
    q: 'Which programming languages are supported in the live interview sandbox?',
    a: 'The embedded Judge0 CE runner supports Python 3, JavaScript (Node.js), TypeScript, Go, C++, and Java. Test cases execute in isolated, secure containers with execution time and memory telemetry reported in real time.',
  },
  {
    q: 'How does the ATS keyword evaluation work?',
    a: 'Our analyzer evaluates your resume against the exact technical requirements, qualifications, and phrasing in your target job description. It measures exact and semantic keyword density, validates header formats, and checks that contact details and dates are parsed accurately without layout errors.',
  },
  {
    q: 'Is my personal data or resume used to train AI models?',
    a: 'No. Candidate privacy is a foundational principle of SmartApply. Your resume content, interview transcriptions, and code submissions are processed in isolated sessions. We never sell your personal information or use your proprietary documents to train public machine learning models.',
  },
  {
    q: 'Can I use SmartApply without creating an account?',
    a: 'You can explore this interactive sandbox directly on the landing page. Creating a free account lets you persistently save your resumes, generate customized cover letters, track interview performance history, and access the portfolio project roadmap.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'ats' | 'interview' | 'latex' | 'projects'>('ats');
  const [selectedRole, setSelectedRole] = useState<string>('backend');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const role = SAMPLE_ROLES.find((r) => r.id === selectedRole) || SAMPLE_ROLES[0];

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'transparent',
        color: 'var(--ink)',
      }}
    >
      <AnimatedBackground />
      <Navbar visible={true} />

      <div
        id="features-overview"
        style={{
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section style={{ padding: '130px 24px 70px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div
          style={{ maxWidth: 1040, margin: '0 auto' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Understated Clean Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: isDark ? 'rgba(82, 39, 255, 0.14)' : 'rgba(82, 39, 255, 0.08)',
              border: isDark ? '1px solid rgba(255, 159, 252, 0.32)' : '1px solid rgba(82, 39, 255, 0.22)',
              marginBottom: 24,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9FFC', boxShadow: '0 0 10px #FF9FFC' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#FF9FFC' : '#5227FF', letterSpacing: '0.02em' }}>
              SmartApply Studio · Technical Career Engineering
            </span>
          </div>

          {/* Direct, Honest Headline */}
          <h1
            style={{
              fontSize: 'clamp(38px, 5.2vw, 68px)',
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: 'var(--ink)',
              margin: '0 auto 24px',
              maxWidth: 960,
            }}
          >
            <SplitText text="Prepare, tailor, and interview for" splitBy="words" delay={0.03} />{' '}
            <span className="gradient-text">
              top engineering roles.
            </span>
          </h1>

          {/* Grounded Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 1.5vw, 19px)',
              maxWidth: 740,
              margin: '0 auto 36px',
              lineHeight: 1.65,
              color: 'var(--ink-soft)',
            }}
          >
            A unified suite for software professionals: tailor your resume to any job specification, verify ATS compliance, practice voice technical interviews with sandboxed code execution, and export clean LaTeX documents.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            <button
              className="btn btn-lg"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              style={{
                borderRadius: 12,
                padding: '14px 34px',
                fontSize: 15,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #5227ff 0%, #7c3aed 50%, #c026d3 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
              }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Launch Free Studio'} <ArrowRight size={17} />
            </button>

            <Link
              to="/docs"
              className="btn btn-lg"
              style={{
                borderRadius: 12,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid var(--border-strong)',
                color: 'var(--ink)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.06)',
              }}
            >
              Read Documentation
            </Link>

          </div>

          {/* Value Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              fontSize: 13,
              color: 'var(--ink-soft)',
              fontWeight: 500,
              marginBottom: 52,
            }}
          >
            {[
              { icon: ShieldCheck, text: 'Zero training on candidate data' },
              { icon: FileCode, text: 'Native LaTeX & PDF compilation' },
              { icon: Terminal, text: 'Isolated Judge0 code sandbox' },
              { icon: Check, text: 'No credit card required' },
            ].map((pill, i) => {
              const Icon = pill.icon;
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Icon size={14} style={{ color: 'var(--accent)' }} /> {pill.text}
                </span>
              );
            })}
          </div>

          {/* ── Interactive Live Product Showcase HUD ────────────────── */}
          <div id="demo" style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
            <TiltedCard maxTilt={4} scale={1.01} perspective={1400} glareEffect={true}>
              <div
                style={{
                  margin: 0,
                  width: '100%',
                  background: isDark ? 'rgba(11, 15, 26, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border)',
                  borderRadius: 20,
                  boxShadow: isDark
                    ? '0 28px 70px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                    : '0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                {/* HUD Header Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 22px',
                    background: isDark ? 'rgba(8, 11, 20, 0.96)' : 'rgba(248, 250, 252, 0.98)',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-faint)', marginLeft: 8 }}>
                      SmartApply Studio · Live Demonstration
                    </span>
                  </div>

                  {/* Navigation Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: isDark ? 'rgba(6, 8, 16, 0.9)' : 'rgba(241, 245, 249, 0.9)',
                      padding: 4,
                      borderRadius: 10,
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)',
                    }}
                  >
                    {[
                      { id: 'ats', icon: ScanSearch, label: 'Resume Tailor & ATS' },
                      { id: 'interview', icon: Video, label: 'Live Mock Interview' },
                      { id: 'latex', icon: FileCode, label: 'LaTeX & PDF Maker' },
                      { id: 'projects', icon: Lightbulb, label: 'Project Ideas' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as any)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 14px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isActive ? (isDark ? '#FF9FFC' : '#5227FF') : 'var(--ink-soft)',
                            background: isActive
                              ? (isDark ? 'rgba(82, 39, 255, 0.22)' : '#ffffff')
                              : 'transparent',
                            border: isActive
                              ? (isDark ? '1px solid rgba(255, 159, 252, 0.35)' : '1px solid var(--border)')
                              : '1px solid transparent',
                            boxShadow: isActive
                              ? (isDark ? '0 2px 12px rgba(82, 39, 255, 0.35)' : '0 1px 4px rgba(0, 0, 0, 0.08)')
                              : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Icon size={14} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Switcher Toolbar */}
                <div
                  style={{
                    padding: '12px 20px',
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Sample Job Specification:</span>
                    <span>{role.title} ({role.category})</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SAMPLE_ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: selectedRole === r.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: selectedRole === r.id ? 'var(--accent-soft)' : 'transparent',
                          color: selectedRole === r.id ? 'var(--accent)' : 'var(--ink-soft)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {r.title.split(' ')[0]} {r.title.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content Body */}
                <div className="demo-sandbox-body">
                  <AnimatePresence mode="wait">
                    {/* Tab 1: Resume Tailor & ATS Scanner */}
                    {activeTab === 'ats' && (
                      <motion.div
                        key={`ats-${role.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
                          {/* Left: ATS Checklist & Keyword Analysis */}
                          <div
                            style={{
                              background: 'var(--surface-sunken)',
                              padding: 22,
                              borderRadius: 16,
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 16,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                                Keyword Alignment Score
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'var(--success-soft)', color: 'var(--success)' }}>
                                {role.atsScore}% Match
                              </span>
                            </div>

                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                Identified Technical Skills:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {role.detectedSkills.map((sk, i) => (
                                  <span key={i} style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                    ✓ {sk}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                Missing Keywords in Target Job Description:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {role.missingSkills.map((sk, i) => (
                                  <span key={i} style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6, background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                                    + {sk}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                              <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                Structural ATS Format Checks:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {role.formatChecks.map((chk, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                                    <Check size={14} style={{ color: 'var(--success)' }} />
                                    <span>{chk.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right: Bullet Point Rewriter */}
                          <div
                            style={{
                              background: 'var(--surface-sunken)',
                              padding: 22,
                              borderRadius: 16,
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em', display: 'block', marginBottom: 14 }}>
                                Bullet Point Impact Optimization
                              </span>

                              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                  Original Unoptimized Draft
                                </span>
                                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
                                  "{role.bulletOriginal}"
                                </p>
                              </div>

                              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                                  Tailored to Target Job Description
                                </span>
                                <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                                  "{role.bulletOptimized}"
                                </p>
                              </div>
                            </div>

                            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.4 }}>
                              Incorporates action verbs, specific architectural context, and quantified business impact.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 2: Live Voice Mock Interview */}
                    {activeTab === 'interview' && (
                      <motion.div
                        key={`interview-${role.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
                          {/* Left: Spoken Question & Audio Telemetry */}
                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Volume2 size={16} />
                              </div>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI Technical Interviewer</span>
                                <span style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'block' }}>Speech synthesis & live transcription active</span>
                              </div>
                            </div>

                            <div style={{ background: 'var(--paper)', padding: 14, borderRadius: 10, border: '1px solid var(--border)', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 16 }}>
                              "{role.interviewPrompt}"
                            </div>

                            <div style={{ background: 'var(--paper)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div className="waveform-container">
                                {[14, 28, 16, 32, 22, 14, 26, 34, 18, 24, 12, 30, 16, 26].map((h, i) => (
                                  <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.08}s`, height: `${h}px` }} />
                                ))}
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>Live Speech Audio</span>
                            </div>

                            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-soft)' }}>
                              Speech telemetry tracks pacing, pauses, and technical keyword coverage in real time.
                            </div>
                          </div>

                          {/* Right: Judge0 Sandboxed Runner */}
                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Terminal size={14} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Embedded Judge0 Code Editor</span>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', padding: '2px 8px', borderRadius: 4, background: 'var(--success-soft)' }}>
                                All Test Cases Passed
                              </span>
                            </div>

                            <pre
                              style={{
                                margin: 0,
                                padding: 12,
                                borderRadius: 10,
                                background: 'var(--paper)',
                                border: '1px solid var(--border)',
                                fontSize: 11.5,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--ink)',
                                overflowX: 'auto',
                                lineHeight: 1.45,
                                maxHeight: 220,
                              }}
                            >
                              <code>{role.interviewCode}</code>
                            </pre>

                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                              <span>Runtime: Python 3.12 (Isolated Container)</span>
                              <span>Memory: 16.4 MB</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 3: LaTeX & PDF Maker */}
                    {activeTab === 'latex' && (
                      <motion.div
                        key="latex"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                              Structured Form Inputs
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ background: 'var(--paper)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)' }}>ROLE / TITLE</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{role.title}</div>
                              </div>
                              <div style={{ background: 'var(--paper)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)' }}>CORE EXPERTISE</div>
                                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{role.detectedSkills.join(' · ')}</div>
                              </div>
                              <div style={{ background: 'var(--paper)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)' }}>EXPERIENCE SUMMARY</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4 }}>{role.bulletOptimized}</div>
                              </div>
                            </div>
                          </div>

                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                                Compiled LaTeX Source (.tex)
                              </span>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)' }}>
                                Ready to Export
                              </span>
                            </div>

                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11.5,
                                background: 'var(--paper)',
                                padding: 14,
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                color: 'var(--ink)',
                                lineHeight: 1.6,
                                overflowX: 'auto',
                              }}
                            >
                              <div>\\documentclass[10pt,letterpaper]&#123;article&#125;</div>
                              <div>\\usepackage[margin=0.75in]&#123;geometry&#125;</div>
                              <div style={{ color: 'var(--accent)', marginTop: 4 }}>\\section&#123;Technical Experience&#125;</div>
                              <div style={{ color: 'var(--ink)' }}>\\textbf&#123;{role.title}&#125; \\hfill 2022--Present</div>
                              <div style={{ color: 'var(--ink-soft)', paddingLeft: 12 }}>\\item {role.bulletOptimized.slice(0, 75)}...</div>
                            </div>

                            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-faint)' }}>
                              Compiles to vector PDF with zero layout drift or broken column margins.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Tab 4: Project Ideas */}
                    {activeTab === 'projects' && (
                      <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                              Recommended Portfolio Project
                            </span>
                            <div style={{ background: 'var(--paper)', padding: 14, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 12 }}>
                              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>
                                Distributed Job Scheduler with Redis & Raft Consensus
                              </div>
                              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
                                Build a lightweight distributed task queue that demonstrates leader election, heartbeat failure detection, and idempotent retry semantics.
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}>Fills: Distributed Systems</span>
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}>Fills: Go / Concurrency</span>
                            </div>
                          </div>

                          <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                                Structured Cursor / v0 Build Prompt
                              </span>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)' }}>Copy Prompt</span>
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: 12,
                                borderRadius: 10,
                                background: 'var(--paper)',
                                border: '1px solid var(--border)',
                                fontSize: 11.5,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--ink-soft)',
                                lineHeight: 1.5,
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              <code>"Create a Go service implementing a token bucket rate limiter with Redis backend. Include unit tests simulating 100 concurrent goroutines and verifying burst capacity semantics..."</code>
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </TiltedCard>
          </div>
        </motion.div>
      </section>

      {/* ── The Complete Career Toolkit (Real Core Features) ─────────── */}
      <section id="features" style={{ padding: '80px 24px 90px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Functional Capabilities
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
              Everything in SmartApply, built for technical candidates.
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 640, margin: '14px auto 0', lineHeight: 1.6 }}>
              Six dedicated tools built to help you navigate every stage of modern software engineering applications.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Tool 1 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <Wand2 size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Resume Tailor
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Paste any job description and let AI match your experience against the role. Identifies overlapping competencies, suggests missing technical terminology, and reframes bullet points for clarity.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Targeted keyword alignment →
              </span>
            </SpotlightCard>

            {/* Tool 2 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <ScanSearch size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                ATS Compatibility Checker
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Evaluates formatting compliance, contact parsing, section hierarchy, and keyword density. Catches common parsing failures in complex resumes before you apply.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Format & layout validation →
              </span>
            </SpotlightCard>

            {/* Tool 3 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <Video size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Live Mock Interview Studio
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Conduct voice mock technical and behavioral rounds with an AI interviewer. Features live speech transcription, answer feedback, and a built-in Judge0 sandbox for compiling code in real time.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Spoken audio & code execution →
              </span>
            </SpotlightCard>

            {/* Tool 4 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <FileCode size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                LaTeX Resume Maker
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Generate clean, reproducible single-column LaTeX resumes. Download finished PDFs or raw .tex source code to maintain version control over your documents in Git.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Reproducible vector PDFs →
              </span>
            </SpotlightCard>

            {/* Tool 5 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <Lightbulb size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Portfolio Project Recommender
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Recommends portfolio projects designed to demonstrate specific skills you are missing for target positions. Generates structured Cursor, v0, and Bolt build prompts.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Bridge portfolio gaps →
              </span>
            </SpotlightCard>

            {/* Tool 6 */}
            <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                <Share2 size={20} />
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Cover Letters & Profile Optimizer
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Create role-tailored cover letters that highlight relevant projects without generic clichés. Optimize your LinkedIn profile headline, about section, and skills list for search discovery.
              </p>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Consistent personal branding →
              </span>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* ── How It Works (Clear 3-Step Process) ──────────────────────── */}
      <section style={{ padding: '70px 24px 90px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Workflow
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
              How SmartApply integrates with your job hunt.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, position: 'relative' }}>
            {[
              {
                step: '01',
                title: 'Import Resume & Target Job',
                desc: 'Upload your existing resume in PDF, DOCX, or text format and paste the job description you are targeting. SmartApply parses your skills and identifies matching and missing terms.',
              },
              {
                step: '02',
                title: 'Tailor Experience & Practice',
                desc: 'Use AI suggestions to reframe bullet points with measurable metrics. Rehearse spoken interview questions and execute code solutions inside the Judge0 runner to build fluency.',
              },
              {
                step: '03',
                title: 'Export Clean LaTeX & Apply',
                desc: 'Download compiled, ATS-compliant PDFs and source LaTeX files. Submit your applications with verified keyword alignment and structured formatting.',
              },
            ].map((wf, i) => (
              <div
                key={i}
                style={{
                  background: isDark ? 'rgba(11, 15, 26, 0.65)' : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '32px 26px',
                  position: 'relative',
                  boxShadow: isDark ? 'none' : '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)',
                    color: isDark ? '#FF9FFC' : '#5227FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 20,
                    border: isDark ? '1px solid rgba(255, 159, 252, 0.28)' : '1px solid rgba(82, 39, 255, 0.2)',
                  }}
                >
                  {wf.step}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
                  {wf.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
                  {wf.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technical Architecture & Privacy ────────────────────────── */}
      <section style={{ padding: '60px 24px 90px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 22,
              padding: '42px 36px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <ShieldCheck size={22} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Technical Foundation & Security
              </span>
            </div>

            <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Built with open technologies and strict candidate privacy.
            </h3>

            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 780, margin: '0 0 28px' }}>
              SmartApply is engineered on modern cloud infrastructure with isolated execution environments. We believe your career data belongs solely to you.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>FastAPI & Python Backend</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  High-throughput asynchronous API handling parsing, session state, and document generation.
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>Llama 3.1 & NVIDIA NIM</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  Low-latency local and enterprise inference for resume extraction and natural interview responses.
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>Judge0 CE Sandbox</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  Isolated container execution for real-time compilation of Python, Go, and JavaScript code.
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>Isolated Data Storage</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  MongoDB with Beanie ODM and R2 object storage. No training on candidate documents.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Practical FAQ Section ───────────────────────────────────── */}
      <section style={{ padding: '60px 24px 90px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
              Frequently Asked Questions
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
              Common questions about SmartApply.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 840, margin: '0 auto' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: isDark
                      ? (isOpen ? 'rgba(15, 22, 38, 0.85)' : 'rgba(11, 15, 26, 0.6)')
                      : (isOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'),
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isOpen
                      ? (isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(37, 99, 235, 0.4)')
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--border)'),
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: !isDark && isOpen ? '0 12px 24px -8px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 24px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <span>{faq.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: isOpen ? 'var(--accent)' : 'var(--ink-soft)', display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 24px 22px', fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-soft)' }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Conversion Banner ───────────────────────────────────────── */}
      <section style={{ padding: '40px 24px 90px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <SpotlightCard
            spotlightColor={isDark ? "rgba(59, 102, 255, 0.22)" : "rgba(37, 99, 235, 0.1)"}
            style={{
              textAlign: 'center',
              padding: '60px 32px',
              borderRadius: 22,
              border: '1px solid var(--border-strong)',
              boxShadow: isDark ? '0 24px 60px -12px rgba(0, 0, 0, 0.5)' : '0 20px 48px -12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 42px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>
              Ready to streamline your applications?
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Tailor your resume, verify ATS keyword compatibility, and run live mock interview sessions with SmartApply Studio.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-lg"
                onClick={() => navigate('/signup')}
                style={{
                  borderRadius: 12,
                  padding: '14px 36px',
                  fontSize: 15.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #5227ff 0%, #7c3aed 50%, #c026d3 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Get Started Free <ArrowRight size={17} />
              </button>

              <Link
                to="/docs"
                className="btn btn-lg btn-outline"
                style={{
                  borderRadius: 14,
                  padding: '14px 28px',
                  fontSize: 15.5,
                  fontWeight: 600,
                  border: '1px solid var(--border-strong)',
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                  color: 'var(--ink)',
                }}
              >
                Read Documentation
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ── Clean Minimal Footer ────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', position: 'relative', zIndex: 10, background: 'transparent' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="Smart Apply"
              style={{
                width: 26,
                height: 26,
                objectFit: 'contain',
                filter: isDark ? 'drop-shadow(0 2px 10px rgba(255, 159, 252, 0.45))' : 'drop-shadow(0 1px 6px rgba(82, 39, 255, 0.25))',
              }}
            />
            <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
              Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--ink-soft)' }}>
            <Link to="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</Link>
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get Started</Link>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
            © {new Date().getFullYear()} SmartApply · Open Architecture
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
