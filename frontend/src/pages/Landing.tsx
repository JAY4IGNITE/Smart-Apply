import { useState } from 'react';
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
  Check,
  FileCode,
  Share2,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Compass,
  Target,
  Brain,
  GitFork,
  Star,
  ExternalLink,
  HelpCircle,
  Clock,
  Gauge,
  Zap,
  GitBranch,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';
import SplashScreen from './SplashScreen';
import SplashCursor from '../components/reactbits/SplashCursor';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import SpotlightCard from '../components/reactbits/SpotlightCard';
import SplitText from '../components/reactbits/SplitText';
import TiltedCard from '../components/reactbits/TiltedCard';
import { Github } from '../components/Icons';

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

interface AcademicQuestionDemo {
  id: string;
  domain: string;
  course: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  citation: string;
  explanation: string;
}

const ACADEMIC_QUIZ_SAMPLES: AcademicQuestionDemo[] = [
  {
    id: 'dist-sys',
    domain: 'Distributed Systems',
    course: 'CS 6450: Distributed Systems & Cloud Infrastructure',
    difficulty: 'University Core',
    question:
      'In distributed consensus protocols such as Raft and Multi-Paxos, what is the minimum quorum size required to safely commit log entries in a cluster containing N = 2f + 1 nodes during network partitioning?',
    options: [
      'A quorum of exactly f nodes is sufficient if the leader heartbeat is active.',
      'A strict majority of ⌊N / 2⌋ + 1 (i.e. f + 1) nodes to guarantee quorum intersection across partition boundaries.',
      'All 2f nodes must acknowledge receipt before committing the state transition.',
      'A non-blocking Byzantine fault tolerance subset of 3f + 1 nodes.',
    ],
    correctIndex: 1,
    citation: "Lamport (1998) 'The Part-Time Parliament'; Ongaro & Ousterhout (2014) Raft Protocol, §5.2; Silberschatz OS Concepts Ch. 17.",
    explanation:
      'Any two majorities of a cluster of size 2f + 1 must intersect in at least one node: (f + 1) + (f + 1) = 2f + 2 > 2f + 1. This Pigeonhole Principle ensures that any newly elected leader contains all previously committed entries without split-brain anomalies.',
  },
  {
    id: 'db-internals',
    domain: 'Database Internals',
    course: 'CS 4420: Database Management Systems & Storage Engines',
    difficulty: 'Undergraduate Advanced',
    question:
      'Why do modern relational database engines (e.g. PostgreSQL, SQLite) utilize B+ Trees instead of standard binary search trees or standard B-Trees for disk-backed primary table indexing?',
    options: [
      'B+ Trees store records only at the leaf nodes and link them sequentially, maximizing disk page fanout and providing O(log_B N) point lookups with high-throughput range scans.',
      'Binary search trees require no rebalancing overhead on SSD NVMe drives.',
      'Standard B-Trees cannot support concurrency locking protocols such as two-phase locking.',
      'B+ Trees compress primary key integers into variable-length Huffman codes automatically on disk.',
    ],
    correctIndex: 0,
    citation: "Cormen, Leiserson, Rivest, Stein (CLRS) Ch. 18 'B-Trees'; Hellerstein et al., 'Readings in Database Systems' (Red Book).",
    explanation:
      'By keeping internal index nodes free of actual data payload, B+ trees achieve a much higher branching factor (fanout > 1000). This lowers tree height so disk I/O operations are kept to 2–3 page reads even across billions of rows, while sibling leaf pointers allow sequential range iteration.',
  },
  {
    id: 'ai-sys',
    domain: 'AI & Deep Learning',
    course: 'CS 7643: Deep Learning & Transformer Architectures',
    difficulty: 'Graduate Specialization',
    question:
      'In the standard Multi-Head Attention mechanism of the Transformer architecture, what is the computational and memory complexity with respect to the sequence length L for embedding dimension d?',
    options: [
      'O(L · d) linear complexity via token pruning',
      'O(L² · d) time complexity and O(L²) space complexity due to the full L × L pairwise Query-Key dot product matrix',
      'O(L · log L) complexity through Fast Fourier Transform attention',
      'O(d²) complexity independent of sequence length L',
    ],
    correctIndex: 1,
    citation: "Vaswani et al. (2017) 'Attention Is All You Need'; NVIDIA FlashAttention-2 (Dao, 2023) GPU kernel optimization.",
    explanation:
      'Calculating Softmax(Q·Kᵀ / √d) requires computing all pairwise dot products between L query tokens and L key tokens, yielding an L × L attention matrix. For long sequences, this quadratic bottleneck motivates optimizations like FlashAttention and grouped-query attention.',
  },
];

const SKILLS_GAP_DEMO = {
  track: 'Full-Stack Cloud & Distributed Systems',
  readinessScore: 84,
  percentile: 'Top 12% of University Candidates',
  verifiedSkills: [
    { name: 'FastAPI & Async Python', level: 'Advanced (94%)', badge: 'GitHub & NVIDIA NIM' },
    { name: 'React 19 & TypeScript', level: 'Advanced (89%)', badge: 'Code Sandbox Verified' },
    { name: 'PostgreSQL & Database Indexing', level: 'Proficient (86%)', badge: 'Academic Assessment' },
    { name: 'Docker & Containerization', level: 'Proficient (82%)', badge: 'Repository CI/CD' },
  ],
  detectedGaps: [
    { name: 'Distributed Consensus (Raft/Paxos)', priority: 'High Priority', impact: '+9 pts', track: 'Cloud Systems' },
    { name: 'Kafka Event Streaming & CDC', priority: 'High Priority', impact: '+7 pts', track: 'Backend Architecture' },
    { name: 'Kubernetes Pod Topology & Helm', priority: 'Medium Priority', impact: '+5 pts', track: 'DevOps & SRE' },
  ],
  activeMilestone: {
    title: 'Phase 3: High-Throughput Event Streaming with Kafka & Go',
    duration: 'Weeks 5–8',
    progress: 68,
    curatedResource: 'Confluent Official Distributed Patterns & Kafka CLI Cheat Sheet',
  },
};

const GITHUB_ANALYZER_DEMO = {
  username: 'JAY4IGNITE',
  name: 'Candidate Engineer',
  avatar: 'https://avatars.githubusercontent.com/u/121896894?v=4',
  publicRepos: 23,
  followers: 42,
  following: 38,
  velocityScore: 94,
  languages: [
    { name: 'TypeScript', pct: 45, color: '#3178c6' },
    { name: 'Python', pct: 32, color: '#3572A5' },
    { name: 'Go', pct: 14, color: '#00ADD8' },
    { name: 'C++', pct: 9, color: '#f34b7d' },
  ],
  highlightRepos: [
    {
      name: 'smart-apply-microservices',
      desc: 'Containerized asynchronous microservices platform with FastAPI, Redis streams, and Beanie ODM.',
      stars: 28,
      forks: 9,
      tags: ['FastAPI', 'Microservices', 'Docker', 'Redis'],
    },
    {
      name: 'distributed-raft-kv',
      desc: 'Fault-tolerant distributed key-value store with Raft consensus protocol and WAL durability in Go.',
      stars: 34,
      forks: 12,
      tags: ['Go', 'Raft', 'Consensus', 'Distributed Systems'],
    },
  ],
  verifiedBadge: 'Verified Technical Evidence: 4 Production-Grade Architecture Repositories',
};

const FIVE_PILLARS = [
  {
    num: '01',
    name: 'DISCOVER',
    title: 'Explore Tech Careers & Benchmark Competencies',
    desc: 'Browse 60+ market-calibrated engineering tracks with real-time salary benchmarks, industry demand levels, and comprehensive skill taxonomies.',
    icon: Compass,
    accent: '#3b82f6',
    route: '/dashboard/explore',
    highlights: ['60+ Career Tracks', '$95K–$185K Salary Benchmarks', 'Core vs Specialized Skills'],
  },
  {
    num: '02',
    name: 'ASSESS',
    title: 'NVIDIA NIM Academic Diagnostic Quizzes',
    desc: 'Benchmark conceptual depth with university-grade multiple-choice assessments generated by NVIDIA NIM Llama 3.1 70B, complete with textbook citations.',
    icon: GraduationCap,
    accent: '#10b981',
    route: '/dashboard/skills/assess',
    highlights: ['University-Aligned Curricula', 'Instant Pedagogical Grading', 'CLRS & Textbook Citations'],
  },
  {
    num: '03',
    name: 'LEARN',
    title: 'Semester-Aligned Roadmaps & AI Tutor',
    desc: 'Follow dynamic, milestone-driven learning roadmaps paired with curated official documentation, cheat sheets, and a 24/7 Academic AI Tutor.',
    icon: BookOpen,
    accent: '#8b5cf6',
    route: '/dashboard/skills/roadmap',
    highlights: ['Weekly Structured Milestones', 'Curated Official Docs', '24/7 Academic AI Tutor'],
  },
  {
    num: '04',
    name: 'BUILD',
    title: 'Bridge Gaps with Real Portfolio Projects',
    desc: 'Transform identified competency gaps into impressive portfolio projects. Generate structured Cursor, v0, and Bolt architecture prompts instantly.',
    icon: Code2,
    accent: '#f59e0b',
    route: '/dashboard/skills/projects',
    highlights: ['Targeted Gap Bridging', 'Cursor & v0 System Prompts', 'Architecture Step-by-Step'],
  },
  {
    num: '05',
    name: 'PROVE',
    title: 'GitHub Telemetry & Career Readiness Score',
    desc: 'Connect GitHub to verify actual code evidence, collect skill verifications, build ATS-tailored resumes, and track your unified 0–100 Readiness Score.',
    icon: Award,
    accent: '#ec4899',
    route: '/dashboard/skills/github',
    highlights: ['GitHub Repository Telemetry', '0–100 Career Readiness Score', 'ATS-Tailored LaTeX Resumes'],
  },
];

const FAQS = [
  {
    q: 'How does SkillHub calculate my 0–100 Career Readiness Score?',
    a: 'SkillHub evaluates four pillars: Academic & Conceptual Mastery (35%, verified via NVIDIA NIM diagnostic assessments), GitHub Technical Evidence (30%, analyzing repository complexity, commits, and language mastery), Resume ATS Compatibility (20%, format and keyword alignment against target jobs), and Mock Interview Performance (15%, technical accuracy and spoken delivery).',
  },
  {
    q: 'How do the NVIDIA NIM academic quizzes work?',
    a: 'Our AI engine queries NVIDIA NIM hosted Llama 3.1 70B models primed with computer science and engineering university curricula. Quizzes test deep conceptual principles (concurrency, distributed consensus, algorithmic time complexity) rather than superficial syntax, providing accredited textbook references (CLRS, Silberschatz) and full step-by-step explanations.',
  },
  {
    q: 'Can I connect my GitHub profile to verify my skills?',
    a: 'Yes! Simply enter your GitHub username (or connect your account). SkillHub analyzes your public repositories, detects production-grade patterns (FastAPI, React, Docker, distributed algorithms), and awards verified evidence points toward your Career Readiness Score.',
  },
  {
    q: 'What resume file formats can I upload and export?',
    a: 'You can upload existing resumes in PDF, DOCX, or plain text format. SkillHub parses your content into structured sections. You can then export your tailored resumes as vector-crisp PDFs or download the clean, raw LaTeX source code (.tex) to store in your personal repositories.',
  },
  {
    q: 'Which programming languages are supported in the live interview sandbox?',
    a: 'The embedded Judge0 CE runner supports Python 3, JavaScript (Node.js), TypeScript, Go, C++, and Java. Test cases execute in isolated, secure containers with execution time and memory telemetry reported in real time.',
  },
  {
    q: 'Is my personal data or resume used to train AI models?',
    a: 'No. Candidate privacy is a foundational principle of SkillHub. Your resume content, interview transcriptions, and code submissions are processed in isolated sessions. We never sell your personal information or use your proprietary documents to train public machine learning models.',
  },
  {
    q: 'Is SkillHub free for students and early-career developers?',
    a: 'Yes! Students and job seekers can explore career paths, take academic quizzes, generate learning roadmaps, connect GitHub profiles, tailor resumes, and practice live mock interviews completely free with zero credit card required.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [introActive, setIntroActive] = useState(() => {
    try {
      return sessionStorage.getItem('sa_intro_seen') !== '1';
    } catch {
      return false;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('sa_intro_seen', '1');
    } catch {}
    setIntroActive(false);
  };

  const [activeTab, setActiveTab] = useState<'quiz' | 'gap' | 'github' | 'ats' | 'interview' | 'latex'>('quiz');
  const [selectedRole, setSelectedRole] = useState<string>('backend');
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const role = SAMPLE_ROLES.find((r) => r.id === selectedRole) || SAMPLE_ROLES[0];
  const activeQuiz = ACADEMIC_QUIZ_SAMPLES[quizIndex];

  const handleSelectQuizOption = (idx: number) => {
    setQuizSelectedOption(idx);
    setQuizSubmitted(true);
  };

  const handleNextQuiz = () => {
    setQuizIndex((prev) => (prev + 1) % ACADEMIC_QUIZ_SAMPLES.length);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'transparent',
        color: 'var(--ink)',
      }}
    >
      <AnimatePresence>
        {introActive && (
          <motion.div
            key="landing-intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              background: '#000000',
              overflow: 'hidden',
            }}
          >
            <SplashScreen onComplete={handleIntroComplete} standalone={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedBackground />
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE={false}
        COLOR="#A855F7"
      />
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
            style={{ maxWidth: 1080, margin: '0 auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 18px',
                borderRadius: 999,
                background: isDark ? 'rgba(82, 39, 255, 0.14)' : 'rgba(82, 39, 255, 0.08)',
                border: isDark ? '1px solid rgba(255, 159, 252, 0.35)' : '1px solid rgba(82, 39, 255, 0.22)',
                marginBottom: 24,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9FFC', boxShadow: '0 0 12px #FF9FFC' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#FF9FFC' : '#5227FF', letterSpacing: '0.03em' }}>
                SkillHub · The Complete Career Readiness Operating System
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(38px, 5.4vw, 68px)',
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: 'var(--ink)',
                margin: '0 auto 24px',
                maxWidth: 980,
              }}
            >
              <SplitText text="Discover, Assess, Learn, Build, and Prove" splitBy="words" delay={0.025} />{' '}
              <span className="gradient-text">
                Your Career Readiness.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(16px, 1.5vw, 19px)',
                maxWidth: 780,
                margin: '0 auto 36px',
                lineHeight: 1.65,
                color: 'var(--ink-soft)',
              }}
            >
              From classroom fundamentals to senior engineering offers: explore 60+ career paths, take NVIDIA NIM academic quizzes, follow personalized semester roadmaps, verify GitHub repositories, tailor ATS resumes, and ace live voice mock interviews.
            </p>

            {/* Action CTAs */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              <button
                className="btn btn-lg"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                style={{
                  borderRadius: 12,
                  padding: '14px 34px',
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
                  transition: 'all 0.2s ease',
                }}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Launch Free Studio'} <ArrowRight size={17} />
              </button>

              <a
                href="#demo"
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
                <Sparkles size={16} style={{ color: 'var(--accent)' }} /> Explore Live Sandbox
              </a>
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
                { icon: Brain, text: 'NVIDIA NIM Academic AI' },
                { icon: Github, text: 'GitHub Repository Telemetry' },
                { icon: Gauge, text: '0–100 Career Readiness Score' },
                { icon: Terminal, text: 'Isolated Judge0 Code Execution' },
                { icon: FileCode, text: 'Native LaTeX & PDF Engine' },
                { icon: Check, text: '100% Free For Students' },
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
            <div id="demo" style={{ width: '100%', maxWidth: 1140, margin: '0 auto' }}>
              <TiltedCard maxTilt={3} scale={1.01} perspective={1500} glareEffect={true}>
                <div
                  style={{
                    margin: 0,
                    width: '100%',
                    background: isDark ? 'rgba(11, 15, 26, 0.88)' : 'rgba(255, 255, 255, 0.95)',
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
                        SkillHub Interactive Studio · Live Platform Sandbox
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
                        flexWrap: 'wrap',
                      }}
                    >
                      {[
                        { id: 'quiz', icon: Brain, label: 'NVIDIA AI Academic Quiz' },
                        { id: 'gap', icon: Target, label: 'Skill Gap & Readiness' },
                        { id: 'github', icon: Github, label: 'GitHub Telemetry' },
                        { id: 'ats', icon: ScanSearch, label: 'Resume Tailor & ATS' },
                        { id: 'interview', icon: Video, label: 'Live Mock Interview' },
                        { id: 'latex', icon: FileCode, label: 'LaTeX & PDF Maker' },
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
                              gap: 7,
                              padding: '7px 12px',
                              borderRadius: 8,
                              fontSize: 12,
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

                  {/* Context Bar */}
                  <div
                    style={{
                      padding: '10px 20px',
                      background: 'var(--surface)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Active Career Focus:</span>
                      <span>Full-Stack Cloud & Systems Engineering</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {SAMPLE_ROLES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRole(r.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: selectedRole === r.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                            background: selectedRole === r.id ? 'var(--accent-soft)' : 'transparent',
                            color: selectedRole === r.id ? 'var(--accent)' : 'var(--ink-soft)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {r.title.split(' ')[1] || r.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content Body */}
                  <div style={{ padding: '24px' }}>
                    <AnimatePresence mode="wait">
                      {/* ─────────────────────────────────────────────────────────────
                          TAB 1: NVIDIA AI Academic Quiz
                          ───────────────────────────────────────────────────────────── */}
                      {activeTab === 'quiz' && (
                        <motion.div
                          key="tab-quiz"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                            {/* Left: Question Card & Interactive Options */}
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                                    {activeQuiz.difficulty}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
                                    {activeQuiz.domain}
                                  </span>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: isDark ? 'rgba(82, 39, 255, 0.2)' : 'rgba(82, 39, 255, 0.08)', color: 'var(--accent)' }}>
                                  Powered by NVIDIA NIM (Llama 3.1 70B)
                                </span>
                              </div>

                              <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                                Curriculum Alignment: {activeQuiz.course}
                              </div>

                              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>
                                "{activeQuiz.question}"
                              </p>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {activeQuiz.options.map((opt, idx) => {
                                  const isSelected = quizSelectedOption === idx;
                                  const isCorrect = idx === activeQuiz.correctIndex;
                                  let bg = 'var(--paper)';
                                  let borderColor = 'var(--border)';
                                  let textColor = 'var(--ink)';

                                  if (quizSubmitted) {
                                    if (isCorrect) {
                                      bg = 'rgba(16, 185, 129, 0.12)';
                                      borderColor = 'rgba(16, 185, 129, 0.4)';
                                      textColor = 'var(--success)';
                                    } else if (isSelected && !isCorrect) {
                                      bg = 'rgba(239, 68, 68, 0.12)';
                                      borderColor = 'rgba(239, 68, 68, 0.4)';
                                      textColor = 'var(--danger)';
                                    }
                                  } else if (isSelected) {
                                    bg = 'var(--accent-soft)';
                                    borderColor = 'var(--accent)';
                                  }

                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSelectQuizOption(idx)}
                                      style={{
                                        textAlign: 'left',
                                        padding: '12px 14px',
                                        borderRadius: 10,
                                        background: bg,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                        fontSize: 12.5,
                                        lineHeight: 1.45,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: 20,
                                          height: 20,
                                          borderRadius: '50%',
                                          background: isSelected ? 'var(--accent)' : 'var(--border)',
                                          color: '#fff',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          marginTop: 1,
                                        }}
                                      >
                                        {String.fromCharCode(65 + idx)}
                                      </span>
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                                  Question {quizIndex + 1} of {ACADEMIC_QUIZ_SAMPLES.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleNextQuiz}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  Try Next Question <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Right: Academic Citation & Step-by-Step Pedagogical Explanation */}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                  <GraduationCap size={18} style={{ color: 'var(--accent)' }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                                    Automated Academic Grading & Evaluation
                                  </span>
                                </div>

                                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--border)', marginBottom: 14 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                                    Academic Literature Citation:
                                  </div>
                                  <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
                                    {activeQuiz.citation}
                                  </div>
                                </div>

                                <div style={{ padding: '14px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 6 }}>
                                    Comprehensive Pedagogical Explanation:
                                  </div>
                                  <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                                    {activeQuiz.explanation}
                                  </p>
                                </div>
                              </div>

                              <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                                <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                                  Correct submission automatically boosts Career Readiness Score (+4.5 pts)
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─────────────────────────────────────────────────────────────
                          TAB 2: Skill Gap & Readiness
                          ───────────────────────────────────────────────────────────── */}
                      {activeTab === 'gap' && (
                        <motion.div
                          key="tab-gap"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                            {/* Left: Score & Verified Competencies */}
                            <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                                    Track Readiness Gauge
                                  </span>
                                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                                    {SKILLS_GAP_DEMO.readinessScore} <span style={{ fontSize: 14, color: 'var(--ink-soft)', fontWeight: 500 }}>/ 100</span>
                                  </div>
                                </div>
                                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                                  {SKILLS_GAP_DEMO.percentile}
                                </span>
                              </div>

                              <div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                  Verified Candidate Competencies:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {SKILLS_GAP_DEMO.verifiedSkills.map((sk, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{sk.name}</span>
                                      </div>
                                      <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{sk.badge}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Right: Priority Gap Action Matrix & Milestone */}
                            <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                                  Identified Skill Gaps to Bridge:
                                </span>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                  {SKILLS_GAP_DEMO.detectedGaps.map((gap, i) => (
                                    <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{gap.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{gap.track}</div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                          {gap.priority}
                                        </span>
                                        <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>{gap.impact}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ padding: '12px', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid rgba(82, 39, 255, 0.25)' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>
                                    Active Suggested Roadmap Milestone:
                                  </div>
                                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                                    {SKILLS_GAP_DEMO.activeMilestone.title} ({SKILLS_GAP_DEMO.activeMilestone.duration})
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                style={{
                                  marginTop: 14,
                                  width: '100%',
                                  padding: '10px',
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #5227ff 0%, #7c3aed 100%)',
                                  color: '#fff',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                }}
                              >
                                View Personalized Learning Roadmap <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─────────────────────────────────────────────────────────────
                          TAB 3: GitHub Telemetry
                          ───────────────────────────────────────────────────────────── */}
                      {activeTab === 'github' && (
                        <motion.div
                          key="tab-github"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                            {/* Left: Profile & Stack Breakdown */}
                            <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img
                                  src={GITHUB_ANALYZER_DEMO.avatar}
                                  alt="GitHub Avatar"
                                  style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--accent)' }}
                                />
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>@{GITHUB_ANALYZER_DEMO.username}</div>
                                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{GITHUB_ANALYZER_DEMO.publicRepos} Public Repositories Analyzed</div>
                                </div>
                              </div>

                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                  Detected Code Language Distribution:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                  {GITHUB_ANALYZER_DEMO.languages.map((lang, idx) => (
                                    <div key={idx}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{lang.name}</span>
                                        <span style={{ color: 'var(--ink-soft)' }}>{lang.pct}%</span>
                                      </div>
                                      <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                                        <div style={{ width: `${lang.pct}%`, height: '100%', background: lang.color, borderRadius: 999 }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Right: Highlight Repositories */}
                            <div style={{ background: 'var(--surface-sunken)', padding: 22, borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-faint)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
                                  Production Evidence Artifacts:
                                </span>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {GITHUB_ANALYZER_DEMO.highlightRepos.map((repo, i) => (
                                    <div key={i} style={{ padding: '12px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--border)' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{repo.name}</div>
                                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-soft)' }}>
                                          <span>★ {repo.stars}</span>
                                          <span>⑂ {repo.forks}</span>
                                        </div>
                                      </div>
                                      <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4, margin: '0 0 8px' }}>{repo.desc}</p>
                                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {repo.tags.map((t, ti) => (
                                          <span key={ti} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 600 }}>
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: 11.5, color: 'var(--accent)', fontWeight: 600 }}>
                                ✓ {GITHUB_ANALYZER_DEMO.verifiedBadge}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─────────────────────────────────────────────────────────────
                          TAB 4: Resume Tailor & ATS Scanner (Preserved Feature)
                          ───────────────────────────────────────────────────────────── */}
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
                                  Missing Keywords in Target Job:
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

                      {/* ─────────────────────────────────────────────────────────────
                          TAB 5: Live Voice Mock Interview (Preserved Feature)
                          ───────────────────────────────────────────────────────────── */}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {[14, 28, 16, 32, 22, 14, 26, 34, 18, 24, 12, 30, 16, 26].map((h, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        display: 'inline-block',
                                        width: 3,
                                        height: h,
                                        borderRadius: 2,
                                        background: 'var(--accent)',
                                        opacity: 0.8,
                                      }}
                                    />
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

                      {/* ─────────────────────────────────────────────────────────────
                          TAB 6: LaTeX & PDF Maker (Preserved Feature)
                          ───────────────────────────────────────────────────────────── */}
                      {activeTab === 'latex' && (
                        <motion.div
                          key="tab-latex"
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
                    </AnimatePresence>
                  </div>
                </div>
              </TiltedCard>
            </div>
          </motion.div>
        </section>

        {/* ── The 5-Pillar Architecture Section (New Core System) ──────── */}
        <section style={{ padding: '80px 24px 90px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 54 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                The SkillHub Methodology
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                5 Pillars Built For Student Career Transformation
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 660, margin: '14px auto 0', lineHeight: 1.6 }}>
                A continuous loop that takes you from exploring career trajectories to providing verifiable proof to top engineering recruiters.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {FIVE_PILLARS.map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <SpotlightCard
                    key={i}
                    spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}
                    style={{
                      borderRadius: 18,
                      padding: '28px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: isDark ? 'rgba(82, 39, 255, 0.18)' : 'rgba(82, 39, 255, 0.08)',
                            border: isDark ? '1px solid rgba(255, 159, 252, 0.3)' : '1px solid rgba(82, 39, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#FF9FFC' : '#5227FF',
                          }}
                        >
                          <Icon size={22} />
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink-faint)', letterSpacing: '0.05em' }}>
                          {pillar.num}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 6 }}>
                        {pillar.name}
                      </div>

                      <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, lineHeight: 1.3 }}>
                        {pillar.title}
                      </h3>

                      <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 18px' }}>
                        {pillar.desc}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        {pillar.highlights.map((h, hi) => (
                          <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink)' }}>
                            <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(pillar.route)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--surface-sunken)',
                          border: '1px solid var(--border)',
                          color: 'var(--ink)',
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>Explore {pillar.name}</span>
                        <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
                      </button>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Career Readiness Metric Section ─────────────────────────── */}
        <section style={{ padding: '40px 24px 80px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 22,
                padding: '40px 36px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: isDark ? '0 20px 50px -15px rgba(0, 0, 0, 0.7)' : '0 15px 40px -10px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Gauge size={22} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  The Unified Candidate Metric
                </span>
              </div>

              <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.025em', marginBottom: 14 }}>
                Career Readiness Score: How Recruiters Measure Your Real Potential
              </h2>

              <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 820, margin: '0 0 32px' }}>
                Instead of vanity metrics, SkillHub aggregates four objective signals into a transparent 0–100 score that gives students a clear target before applying.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                {[
                  {
                    pct: '35%',
                    title: 'Academic & Concept Mastery',
                    desc: 'Evaluated through NVIDIA NIM academic diagnostic quizzes testing curriculum principles and system tradeoffs.',
                    color: '#10b981',
                  },
                  {
                    pct: '30%',
                    title: 'GitHub & Project Evidence',
                    desc: 'Telemetry verified directly from your repositories: commit velocity, architecture patterns, and language depth.',
                    color: '#3b82f6',
                  },
                  {
                    pct: '20%',
                    title: 'ATS Resume Keyword Match',
                    desc: 'Targeted keyword density, single-column parsing compliance, and quantified achievement metrics.',
                    color: '#8b5cf6',
                  },
                  {
                    pct: '15%',
                    title: 'Live Technical Interviews',
                    desc: 'Spoken technical articulation, pacing, and sandboxed Judge0 real-time test case completion.',
                    color: '#ec4899',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--surface-sunken)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '20px',
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 800, color: item.color, marginBottom: 4 }}>
                      {item.pct}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Preserved SmartApply Application Tools ──────────────────── */}
        <section id="features" style={{ padding: '60px 24px 90px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 54 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                Application & Interview Suite
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                From Resume to Offer: Full SmartApply Power
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 660, margin: '14px auto 0', lineHeight: 1.6 }}>
                Once you build and prove your capabilities, SmartApply's end-to-end studio tools get your foot in the door and close the offer.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Tool 1: Resume Tailor */}
              <SpotlightCard spotlightColor={isDark ? "rgba(255, 159, 252, 0.2)" : "rgba(82, 39, 255, 0.1)"}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: isDark ? 'rgba(82, 39, 255, 0.16)' : 'rgba(82, 39, 255, 0.08)', border: isDark ? '1px solid rgba(255, 159, 252, 0.25)' : '1px solid rgba(82, 39, 255, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#FF9FFC' : '#5227FF', marginBottom: 18 }}>
                  <Wand2 size={20} />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                  Resume Tailor
                </h3>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 16px' }}>
                  Paste any job description and let AI align your experience. Identifies overlapping competencies, suggests missing technical terminology, and reframes bullet points for clarity.
                </p>
                <Link to="/dashboard/tailor" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Targeted keyword alignment →
                </Link>
              </SpotlightCard>

              {/* Tool 2: ATS Checker */}
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
                <Link to="/dashboard/ats" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Format & layout validation →
                </Link>
              </SpotlightCard>

              {/* Tool 3: Live Interview Studio */}
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
                <Link to="/dashboard/interview" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Spoken audio & code execution →
                </Link>
              </SpotlightCard>

              {/* Tool 4: LaTeX Resume Maker */}
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
                <Link to="/dashboard/resume-maker" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Reproducible vector PDFs →
                </Link>
              </SpotlightCard>

              {/* Tool 5: Project Recommender */}
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
                <Link to="/dashboard/skills/projects" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Bridge portfolio gaps →
                </Link>
              </SpotlightCard>

              {/* Tool 6: Profile & Cover Letters */}
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
                <Link to="/dashboard/cover-letter" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Consistent personal branding →
                </Link>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* ── Practical 4-Step Workflow ────────────────────────────────── */}
        <section style={{ padding: '70px 24px 90px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                End-to-End Workflow
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 42px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                From Student Fundamentals to Placed Engineer
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, position: 'relative' }}>
              {[
                {
                  step: '01',
                  title: 'Discover & Benchmark',
                  desc: 'Select your target engineering track, explore salary and demand trends, and take NVIDIA NIM academic quizzes to identify your baseline knowledge gaps.',
                },
                {
                  step: '02',
                  title: 'Follow Milestones',
                  desc: 'Work through customized weekly semester roadmaps with curated official documentation, cheat sheets, and on-demand AI academic tutoring.',
                },
                {
                  step: '03',
                  title: 'Build & Prove on GitHub',
                  desc: 'Build recommended portfolio projects using structured AI prompts. Connect your GitHub repository to verify real-world architectural code evidence.',
                },
                {
                  step: '04',
                  title: 'Tailor, Rehearse & Apply',
                  desc: 'Export vector-crisp single-column LaTeX resumes, verify ATS keyword scores, and rehearse spoken interview rounds with sandboxed Judge0 compilation.',
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
                    padding: '28px 22px',
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
                      marginBottom: 18,
                      border: isDark ? '1px solid rgba(255, 159, 252, 0.28)' : '1px solid rgba(82, 39, 255, 0.2)',
                    }}
                  >
                    {wf.step}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    {wf.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                    {wf.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technical Architecture & Privacy ────────────────────────── */}
        <section style={{ padding: '40px 24px 80px', position: 'relative', zIndex: 10 }}>
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
                  Technical Architecture & Candidate Privacy
                </span>
              </div>

              <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                High-Performance Infrastructure with Zero Training on Student Data
              </h3>

              <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 820, margin: '0 0 28px' }}>
                SkillHub is engineered on modular FastAPI microservices with hardware-accelerated AI inference and sandboxed runtime isolation.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>FastAPI Microservices</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Asynchronous core, AI, and tools microservices running with Beanie ODM and high-speed in-memory caching.
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>NVIDIA NIM AI Inference</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Enterprise Llama 3.1 70B & 8B Instruct endpoints calibrated specifically on academic computer science curricula.
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>Judge0 CE Container Sandbox</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Isolated container execution for real-time compilation of Python, Go, TypeScript, C++, and Java code.
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>Zero Data Training Guarantee</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    Student resumes, code submissions, and interview audio are completely isolated and never used for public model training.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────── */}
        <section style={{ padding: '40px 24px 80px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                Frequently Asked Questions
              </span>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 800, marginTop: 10, color: 'var(--ink)', letterSpacing: '-0.025em' }}>
                Everything You Need to Know About SkillHub
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
                        ? (isDark ? '1px solid rgba(255, 159, 252, 0.35)' : '1px solid rgba(82, 39, 255, 0.4)')
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
              spotlightColor={isDark ? "rgba(255, 159, 252, 0.25)" : "rgba(82, 39, 255, 0.12)"}
              style={{
                textAlign: 'center',
                padding: '60px 32px',
                borderRadius: 22,
                border: '1px solid var(--border-strong)',
                boxShadow: isDark ? '0 24px 60px -12px rgba(0, 0, 0, 0.5)' : '0 20px 48px -12px rgba(0, 0, 0, 0.08)',
              }}
            >
              <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 42px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>
                Ready to Level Up Your Engineering Career?
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.6 }}>
                Benchmark your skills, take NVIDIA NIM academic quizzes, build real GitHub projects, and tailor ATS resumes with SkillHub today.
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
                    borderRadius: 12,
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

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', position: 'relative', zIndex: 10, background: 'transparent' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/logo.png"
                alt="SkillHub"
                style={{
                  width: 28,
                  height: 28,
                  objectFit: 'contain',
                  filter: isDark ? 'drop-shadow(0 2px 10px rgba(255, 159, 252, 0.45))' : 'drop-shadow(0 1px 6px rgba(82, 39, 255, 0.25))',
                }}
              />
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 16 }}>
                Skill<span style={{ color: 'var(--accent)' }}>Hub</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--ink-soft)' }}>
              <Link to="/docs" style={{ color: 'inherit', textDecoration: 'none' }}>Docs</Link>
              <Link to="/dashboard/explore" style={{ color: 'inherit', textDecoration: 'none' }}>Career Tracks</Link>
              <Link to="/dashboard/skills/assess" style={{ color: 'inherit', textDecoration: 'none' }}>Skills & Quizzes</Link>
              <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
              <Link to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get Started</Link>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              © {new Date().getFullYear()} SkillHub · Student Learning & Career Platform
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
