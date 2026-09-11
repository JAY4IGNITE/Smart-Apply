import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  Menu,
  X,
  BookOpen,
  Users,
  TrendingUp,
  Layers,
  Cpu,
  Database,
  Terminal,
  Server,
  Rocket,
  Info,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  Video,
  MessageSquareText,
  Lightbulb,
  Code,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  ChevronRight,
  Copy,
  Check,
  Lock,
  Smartphone,
} from 'lucide-react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import '../styles/docs.css';

/* ── Section definition ── */
interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  group: string;
}

const SECTIONS: DocSection[] = [
  { id: 'overview', title: 'Overview', icon: BookOpen, group: 'Getting Started' },
  { id: 'features', title: 'Core Features', icon: Sparkles, group: 'Getting Started' },
  { id: 'audience', title: 'Target Audience', icon: Users, group: 'Getting Started' },
  { id: 'growth', title: 'Growth Projections', icon: TrendingUp, group: 'Getting Started' },
  { id: 'architecture', title: 'Architecture', icon: Layers, group: 'Technical Reference' },
  { id: 'system-design', title: 'System Design', icon: Cpu, group: 'Technical Reference' },
  { id: 'data-models', title: 'Data Models', icon: Database, group: 'Technical Reference' },
  { id: 'setup', title: 'Local Setup', icon: Terminal, group: 'Guides' },
  { id: 'deployment', title: 'Deployment', icon: Server, group: 'Guides' },
  { id: 'future', title: 'Future Roadmap', icon: Rocket, group: 'Guides' },
];

const GROUPS = ['Getting Started', 'Technical Reference', 'Guides'];

/* ── Copyable code block ── */
function CodeBlock({ lang, filename, children }: { lang: string; filename?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="docs-code-block">
      <div className="docs-code-block-header">
        <span>{filename || lang}</span>
        <button
          onClick={copy}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
}

/* ── Callout ── */
function Callout({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) {
  const icons = { info: <Info size={16} style={{ color: 'var(--accent)' }} />, warning: <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />, success: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> };
  return (
    <div className={`docs-callout docs-callout-${type}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Docs Component
   ══════════════════════════════════════════════════════════════════ */

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Scroll spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    const headings = document.querySelectorAll('.docs-prose h2[id]');
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  /* ── Keyboard shortcut for search ── */
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileNavOpen(false);
  }, []);

  /* ── Search filter ── */
  const q = searchQuery.toLowerCase();
  const filteredSections = q
    ? SECTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.group.toLowerCase().includes(q))
    : SECTIONS;

  /* ── Sidebar renderer ── */
  const renderSidebar = () => (
    <>
      {GROUPS.map((group) => {
        const items = filteredSections.filter((s) => s.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="docs-nav-section-title">{group}</p>
            {items.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  className={`docs-nav-link ${activeSection === sec.id ? 'active' : ''}`}
                  onClick={() => scrollTo(sec.id)}
                >
                  <Icon size={15} />
                  {sec.title}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );

  /* ── Right TOC items — the h2s ── */
  const tocSections = SECTIONS;

  return (
    <div className="docs-page">
      {/* ── Header ── */}
      <header className="docs-header">
        <div className="docs-header-inner">
          <div className="docs-header-left">
            <button className="docs-mobile-menu-btn" onClick={() => setMobileNavOpen(true)}>
              <Menu size={18} />
            </button>
            <Link to="/" className="docs-header-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="/logo.png" alt="SkillHub" style={{ height: 26, width: 26, objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
                Skill<span style={{ color: 'var(--accent)' }}>Hub</span>
              </span>
            </Link>
            <div className="docs-header-divider" />
            <span className="docs-header-label">Documentation</span>
            <span className="docs-version-badge">v1.0</span>
          </div>
          <div className="docs-header-right">
            <div className="docs-search-box">
              <Search size={14} />
              <input
                ref={searchRef}
                className="docs-search-input"
                placeholder="Search docs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="docs-search-shortcut">⌘K</span>
            </div>
            <ThemeSwitcher variant="compact" />
            <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar ── */}
      {mobileNavOpen && (
        <>
          <div className="docs-mobile-overlay" onClick={() => setMobileNavOpen(false)} />
          <div className="docs-mobile-sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Navigation</span>
              <button onClick={() => setMobileNavOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}><X size={18} /></button>
            </div>
            {renderSidebar()}
          </div>
        </>
      )}

      {/* ── Shell ── */}
      <div className="docs-shell">
        {/* Left sidebar */}
        <nav className="docs-left-sidebar">
          {renderSidebar()}
        </nav>

        {/* Main content */}
        <article className="docs-content" ref={contentRef}>
          <div className="docs-prose">

            {/* ═══ OVERVIEW ═══ */}
            <h1>SkillHub Documentation</h1>
            <p className="docs-subtitle">
              Everything you need to understand, set up, and extend SkillHub — the comprehensive student learning, skill development, and career intelligence platform.
            </p>

            <h2 id="overview">Overview</h2>
            <p>
              SkillHub is an end-to-end AI-powered student learning and career preparation platform that bridges the gap between curriculum and industry expectations. It unifies <strong>career exploration</strong>, <strong>skill diagnostic assessments</strong>, <strong>gap analysis</strong>, <strong>personalized learning roadmaps</strong>, <strong>portfolio building</strong>, and <strong>application intelligence</strong> (automated resume tailoring, ATS compatibility, and live voice mock interviews) into a single, cohesive experience.
            </p>
            <Callout type="info">
              SkillHub is built for scale — empowering individual students, university career development centers, bootcamps, and modern engineering candidates.
            </Callout>

            {/* ═══ FEATURES ═══ */}
            <h2 id="features">Core Features</h2>
            <p>The platform ships with six deeply integrated AI-powered tools:</p>
            <div className="docs-card-grid">
              {[
                { icon: Sparkles, title: 'Resume Tailor', desc: 'Automatically rewrites and optimizes resumes for specific job descriptions, aligning keywords and structure for maximum ATS pass-through.' },
                { icon: FileText, title: 'ATS Checker', desc: 'Scores any resume against a job posting and returns missing keywords, format issues, and an actionable improvement checklist.' },
                { icon: Video, title: 'Live Interview Studio', desc: 'Real-time voice mock interviews powered by AI, with Judge0 sandboxed code execution and facial expression telemetry for behavioral analysis.' },
                { icon: MessageSquareText, title: 'AI Career Chat', desc: 'Context-aware career advisor that generates cover letters, answers interview questions, and provides salary negotiation guidance.' },
                { icon: Lightbulb, title: 'Project Recommender', desc: 'Suggests portfolio projects matched to your skills, experience level, and target role — complete with phased build plans.' },
                { icon: Code, title: 'Idea Prompt Studio', desc: 'Converts rough, unstructured ideas into structured, buildable project briefs and ready-to-use AI prompts.' },
              ].map((f, i) => (
                <div className="docs-card" key={i}>
                  <div className="docs-card-icon"><f.icon size={16} /></div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* ═══ AUDIENCE ═══ */}
            <h2 id="audience">Target Audience</h2>
            <p>SmartApply serves job seekers across all career stages. Each persona uses different features of the platform:</p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Primary Need</th>
                    <th>Key Features</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Software Engineers</strong></td>
                    <td>Technical ATS optimization & coding interview prep</td>
                    <td>ATS Checker, Live Interview with Judge0, Resume Tailor</td>
                  </tr>
                  <tr>
                    <td><strong>Recent Graduates</strong></td>
                    <td>Portfolio building & interview confidence</td>
                    <td>Project Recommender, Live Interview, AI Career Chat</td>
                  </tr>
                  <tr>
                    <td><strong>Career Switchers</strong></td>
                    <td>Transferable skill highlighting</td>
                    <td>Resume Tailor, AI Career Chat, LinkedIn Optimizer</td>
                  </tr>
                  <tr>
                    <td><strong>Senior Professionals</strong></td>
                    <td>Multi-role resume management</td>
                    <td>Resume Tailor, ATS Checker, Cover Letter Generator</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ═══ GROWTH ═══ */}
            <h2 id="growth">Growth Projections</h2>
            <p>SmartApply's go-to-market strategy is phased to match infrastructure scaling with demand:</p>
            <div className="docs-steps">
              <div className="docs-step">
                <div className="docs-step-number">1</div>
                <div className="docs-step-content">
                  <h4>Launch Phase — Months 1–6</h4>
                  <p><strong>5,000 – 15,000 MAUs.</strong> Campus drives, tech job communities (Reddit, Discord, LinkedIn), coding bootcamps. ~50K resume operations and ~20K mock interview sessions per month.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">2</div>
                <div className="docs-step-content">
                  <h4>Community Scale — Months 6–18</h4>
                  <p><strong>50,000 – 150,000 MAUs.</strong> University placement cell partnerships, bootcamp integrations, and career coaching agency licensing. Requires distributed MongoDB cluster and scaled LLM inference.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">3</div>
                <div className="docs-step-content">
                  <h4>Enterprise SaaS — Year 2+</h4>
                  <p><strong>500,000+ MAUs.</strong> B2B recruiter dashboards, university placement analytics, enterprise team licensing, and white-label deployment options.</p>
                </div>
              </div>
            </div>

            {/* ═══ ARCHITECTURE ═══ */}
            <h2 id="architecture">Architecture</h2>
            <p>
              SmartApply uses a <strong>decoupled full-stack architecture</strong> optimized for high-concurrency AI workloads, real-time WebSocket communication, and multi-tab session synchronization.
            </p>

            <h3>Technology Stack</h3>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
                </thead>
                <tbody>
                  <tr><td><strong>Frontend</strong></td><td><code>React 18</code> + <code>TypeScript</code> + <code>Vite</code></td><td>SPA with code-split lazy routes, Framer Motion transitions</td></tr>
                  <tr><td><strong>Styling</strong></td><td>Vanilla CSS design token system</td><td>Three themes (Light, Dark, Ice) via CSS custom properties</td></tr>
                  <tr><td><strong>Backend</strong></td><td><code>FastAPI</code> + <code>Uvicorn</code> (Python 3.10)</td><td>Async REST API server, WebSocket manager, rate limiting</td></tr>
                  <tr><td><strong>Database</strong></td><td><code>MongoDB Atlas</code> + <code>Beanie ODM</code></td><td>Document store with async Pydantic models and indexes</td></tr>
                  <tr><td><strong>Cache / PubSub</strong></td><td><code>Redis</code></td><td>Session store, auth event broadcasting across tabs</td></tr>
                  <tr><td><strong>Storage</strong></td><td><code>Cloudflare R2</code></td><td>Resume PDF/DOCX uploads and file hosting</td></tr>
                  <tr><td><strong>AI / LLM</strong></td><td><code>NVIDIA NIM</code> (Llama 3.1 70B)</td><td>Resume analysis, ATS scoring, interview questions, chat</td></tr>
                  <tr><td><strong>Code Execution</strong></td><td><code>Judge0 CE</code></td><td>Sandboxed compilation & execution during mock interviews</td></tr>
                </tbody>
              </table>
            </div>

            <h3>High-Level Diagram</h3>
            <Callout type="info">
              The frontend is deployed as a static site behind a CDN. The backend runs as a standalone Python web service. Both connect to shared MongoDB, Redis, and Cloudflare R2 instances.
            </Callout>
            <CodeBlock lang="text" filename="architecture.txt">{`┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
│  React 18 SPA  ·  WebSpeech API  ·  WebSocket Client          │
└────────┬────────────────────────┬──────────────────────────────┘
         │ HTTPS REST             │ WSS
         ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Server (Python)                     │
│  Auth Middleware  ·  SlowAPI Rate Limiter  ·  WS Auth Manager  │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│          ▼          ▼          ▼          ▼                    │
│    MongoDB     Redis       R2 Storage   NVIDIA NIM            │
│   (Beanie)   (Pub/Sub)    (Uploads)    (Llama 3.1)           │
│                                                    Judge0 CE  │
└─────────────────────────────────────────────────────────────────┘`}</CodeBlock>

            {/* ═══ SYSTEM DESIGN ═══ */}
            <h2 id="system-design">System Design</h2>

            <h3>Authentication & Multi-Tab Sync</h3>
            <p>
              Users authenticate via <strong>JWT Bearer tokens</strong> stored in <code>localStorage</code>. The <code>AuthProvider</code> context manages token state and wires every API call with the current token via a configured <code>apiFetch</code> client.
            </p>
            <p>
              For real-time multi-tab synchronization, every browser tab opens a WebSocket connection to the backend's <code>AuthSocketManager</code>. When a user logs in, verifies OTP, or logs out in <em>any</em> tab, the backend publishes the event to <strong>Redis Pub/Sub</strong>. All other connected WebSocket clients receive the event and update their local auth state instantly — no page reload needed.
            </p>
            <CodeBlock lang="python" filename="websockets/manager.py">{`# Simplified flow
async def broadcast_auth_event(event: dict):
    """Publish auth event to all connected clients via Redis."""
    await redis.publish("auth_events", json.dumps(event))

# Each WebSocket listener picks up the event:
async def on_redis_message(message):
    for ws in connected_clients[user_id]:
        await ws.send_json(message)`}</CodeBlock>

            <h3>Resume Processing Pipeline</h3>
            <div className="docs-steps">
              <div className="docs-step">
                <div className="docs-step-number">1</div>
                <div className="docs-step-content">
                  <h4>Upload & Parse</h4>
                  <p>PDF/DOCX files are uploaded to Cloudflare R2. The backend extracts raw text using <code>PyPDF2</code> / <code>python-docx</code> and stores it in the <code>Resume</code> document.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">2</div>
                <div className="docs-step-content">
                  <h4>Structure & Index</h4>
                  <p>Extracted text is parsed into structured <code>ResumeParsedData</code> (skills, education, experience) via AI prompts, then indexed for fast retrieval.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-number">3</div>
                <div className="docs-step-content">
                  <h4>ATS Analysis</h4>
                  <p>The resume text and a target job description are sent to NVIDIA NIM (Llama 3.1 70B) with structured JSON schemas. The model returns a match score, missing keywords, and actionable improvements.</p>
                </div>
              </div>
            </div>

            <h3>Live Interview Architecture</h3>
            <p>
              The interview studio initializes a stateful session on the backend. The browser uses the <strong>Web Speech API</strong> for voice synthesis and recognition. When the interview includes coding challenges, user code is proxied to <strong>Judge0 CE</strong> for sandboxed compilation. Throughout the session, facial expression telemetry (eye contact, confidence, micro-expressions) is collected and aggregated into a post-interview <code>InterviewReport</code>.
            </p>
            <Callout type="warning">
              The Web Speech API requires HTTPS in production and has varying browser support. Chrome provides the most complete implementation.
            </Callout>

            {/* ═══ DATA MODELS ═══ */}
            <h2 id="data-models">Data Models</h2>
            <p>
              SmartApply uses <strong>MongoDB</strong> as its primary database, interfaced via <strong>Beanie ODM</strong> — an async Pydantic-based Object Document Mapper for Motor (async MongoDB driver).
            </p>

            <h3>User</h3>
            <p>Collection: <code>users</code></p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>email</code></td><td><code>EmailStr</code></td><td>Unique indexed email address</td></tr>
                  <tr><td><code>hashed_password</code></td><td><code>str</code></td><td>Bcrypt-hashed password</td></tr>
                  <tr><td><code>full_name</code></td><td><code>str</code></td><td>Display name</td></tr>
                  <tr><td><code>is_verified</code></td><td><code>bool</code></td><td>OTP email verification status</td></tr>
                  <tr><td><code>is_admin</code></td><td><code>bool</code></td><td>Admin privilege flag</td></tr>
                  <tr><td><code>has_onboarded</code></td><td><code>bool</code></td><td>Completed onboarding flow</td></tr>
                  <tr><td><code>skills</code></td><td><code>List[str]</code></td><td>User's technical skills</td></tr>
                  <tr><td><code>education</code></td><td><code>List[EducationEntry]</code></td><td>Education history entries</td></tr>
                  <tr><td><code>experience</code></td><td><code>List[ExperienceEntry]</code></td><td>Work experience entries</td></tr>
                  <tr><td><code>features</code></td><td><code>Dict[str, bool]</code></td><td>Feature flags per user</td></tr>
                  <tr><td><code>created_at</code></td><td><code>datetime</code></td><td>Account creation timestamp</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Resume</h3>
            <p>Collection: <code>resumes</code> — Indexed on <code>[user_id, is_primary]</code> and full-text on <code>extracted_text</code>.</p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>user_id</code></td><td><code>PydanticObjectId</code></td><td>Owner reference</td></tr>
                  <tr><td><code>filename</code></td><td><code>str</code></td><td>Original upload filename</td></tr>
                  <tr><td><code>file_url</code></td><td><code>str</code></td><td>Cloudflare R2 public URL</td></tr>
                  <tr><td><code>extracted_text</code></td><td><code>str</code></td><td>Full extracted text content</td></tr>
                  <tr><td><code>parsed_data</code></td><td><code>ResumeParsedData?</code></td><td>Structured skills, education, experience</td></tr>
                  <tr><td><code>ats_score</code></td><td><code>int?</code></td><td>Latest ATS compatibility score (0–100)</td></tr>
                  <tr><td><code>latex_code</code></td><td><code>str</code></td><td>LaTeX source for resume builder</td></tr>
                  <tr><td><code>is_primary</code></td><td><code>bool</code></td><td>Primary resume flag</td></tr>
                  <tr><td><code>uploaded_at</code></td><td><code>datetime</code></td><td>Upload timestamp</td></tr>
                </tbody>
              </table>
            </div>

            <h3>InterviewReport</h3>
            <p>Collection: <code>interview_reports</code> — Indexed on <code>user_id</code>.</p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>user_id</code></td><td><code>str</code></td><td>Owner reference (string ID)</td></tr>
                  <tr><td><code>room_name</code></td><td><code>str</code></td><td>Unique interview room identifier</td></tr>
                  <tr><td><code>questions_asked</code></td><td><code>List[str]</code></td><td>AI-generated interview questions</td></tr>
                  <tr><td><code>user_replies</code></td><td><code>List[str]</code></td><td>Transcribed user answers</td></tr>
                  <tr><td><code>telemetry_summary</code></td><td><code>Dict</code></td><td>Facial expressions, confidence, eye contact data</td></tr>
                  <tr><td><code>final_score</code></td><td><code>int</code></td><td>Overall score 0–100</td></tr>
                  <tr><td><code>overall_feedback</code></td><td><code>str</code></td><td>AI-generated performance summary</td></tr>
                </tbody>
              </table>
            </div>

            <h3>SystemSettings</h3>
            <p>Collection: <code>system_settings</code> — Singleton document for global configuration.</p>
            <CodeBlock lang="python" filename="models/settings.py">{`class SystemSettings(Document):
    maintenance_mode: bool = False
    max_resumes_per_user: int = 10
    ai_model_default: str = "meta/llama-3.1-70b-instruct"
    rate_limits: Dict[str, str] = {
        "ai_chat": "20/minute",
        "resume_upload": "10/minute",
    }`}</CodeBlock>

            {/* ═══ SETUP ═══ */}
            <h2 id="setup">Local Setup</h2>

            <h3>Prerequisites</h3>
            <ul>
              <li><strong>Node.js</strong> v18.x or higher</li>
              <li><strong>Python</strong> v3.10 or higher</li>
              <li><strong>MongoDB</strong> — local server or MongoDB Atlas URI</li>
              <li><strong>Redis</strong> — local instance or cloud connection string</li>
            </ul>

            <h3>1. Clone & Setup Backend</h3>
            <CodeBlock lang="bash" filename="terminal">{`git clone https://github.com/NandiVardhan2007/Smart-Apply.git
cd Smart-Apply/backend

python -m venv venv
# Windows:
.\\venv\\Scripts\\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env`}</CodeBlock>
            <Callout type="info">
              Edit <code>.env</code> and fill in your <code>MONGODB_URI</code>, <code>REDIS_URL</code>, and <code>NVIDIA_NIM_API_KEY</code> before starting the server.
            </Callout>
            <CodeBlock lang="bash" filename="terminal">{`uvicorn app.main:app --reload --port 8000`}</CodeBlock>

            <h3>2. Setup Frontend</h3>
            <CodeBlock lang="bash" filename="terminal">{`cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000/api

npm run dev`}</CodeBlock>
            <p>
              Open <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer">http://localhost:5173</a> in your browser. The frontend proxies API calls to the backend running on port 8000.
            </p>

            {/* ═══ DEPLOYMENT ═══ */}
            <h2 id="deployment">Deployment</h2>
            <p>
              SmartApply ships with a <code>render.yaml</code> blueprint for one-click deployment on <strong>Render</strong>:
            </p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead><tr><th>Service</th><th>Type</th><th>Details</th></tr></thead>
                <tbody>
                  <tr><td><strong>smartapply-backend</strong></td><td>Python Web Service</td><td><code>uvicorn app.main:app</code> on port <code>$PORT</code></td></tr>
                  <tr><td><strong>smartapply-frontend</strong></td><td>Static Site</td><td>Vite build output from <code>dist/</code>, served via CDN</td></tr>
                  <tr><td><strong>smartapply-redis</strong></td><td>Redis Instance</td><td>Internal-only, used for session sync & pub/sub</td></tr>
                </tbody>
              </table>
            </div>
            <Callout type="warning">
              The Render free tier spins down services after 15 minutes of inactivity. For production use, consider the Starter plan ($7/mo) or set up an uptime monitor to keep the backend warm.
            </Callout>

            {/* ═══ FUTURE ═══ */}
            <h2 id="future">Future Roadmap</h2>
            <p>Planned features and expansion areas for SmartApply's next major releases:</p>
            <div className="docs-card-grid">
              {[
                { icon: Video, title: 'Multi-Modal AI Interviewers', desc: 'Real-time avatar video synthesis for visual, face-to-face AI interview practice.' },
                { icon: Globe, title: 'Browser Extension', desc: 'One-click Chrome extension to scrape job postings from LinkedIn/Indeed and auto-tailor resumes.' },
                { icon: Users, title: 'Recruiter & University Portal', desc: 'B2B dashboards for career advisors to track student ATS scores, interview performance, and placement readiness.' },
                { icon: Smartphone, title: 'Mobile App', desc: 'React Native iOS & Android app for on-the-go interview prep, push notifications, and resume management.' },
                { icon: Lock, title: 'Offline Local Models', desc: 'Privacy-first mode using Ollama / Llama-3.2 3B for users who want to run AI inference entirely on-device.' },
                { icon: Globe, title: 'Multi-Language Support', desc: 'Internationalized resume tailoring and interview practice for non-English job markets.' },
              ].map((item, i) => (
                <div className="docs-card" key={i}>
                  <div className="docs-card-icon"><item.icon size={16} /></div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            {/* ── Prev/Next ── */}
            <div className="docs-prev-next">
              <button className="docs-prev-next-card" onClick={() => scrollTo('overview')}>
                <div className="docs-prev-next-label">← Previous</div>
                <div className="docs-prev-next-title">Overview</div>
              </button>
              <Link to="/dashboard" className="docs-prev-next-card" style={{ textAlign: 'right', textDecoration: 'none' }}>
                <div className="docs-prev-next-label">Next →</div>
                <div className="docs-prev-next-title">Go to Dashboard</div>
              </Link>
            </div>

          </div>
        </article>

        {/* Right rail — "On this page" */}
        <aside className="docs-right-rail">
          <p className="docs-right-rail-title">On this page</p>
          {tocSections.map((sec) => (
            <button
              key={sec.id}
              className={`docs-toc-link ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => scrollTo(sec.id)}
            >
              {sec.title}
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
