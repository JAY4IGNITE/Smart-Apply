import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  GitFork,
  CheckCircle2,
  Code2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { Github } from '../../components/Icons';
import { apiFetch } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import '../../styles/dashboard.css';

interface LanguageStat {
  language: string;
  repo_count: number;
  percentage: number;
}

interface InferredSkill {
  skill: string;
  confidence: number;
  evidence: string;
}

interface RepoInfo {
  name: string;
  description: string;
  html_url: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  topics: string[];
}

interface GitHubAnalysisResult {
  username: string;
  avatar_url?: string;
  public_repos: number;
  followers: number;
  total_stars: number;
  total_forks: number;
  languages: LanguageStat[];
  inferred_skills: InferredSkill[];
  top_repositories: RepoInfo[];
}

export default function GitHubAnalyzer() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [inputVal, setInputVal] = useState(() => user?.github_url || 'torvalds');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GitHubAnalysisResult | null>(null);

  const fetchGitHubDirectly = async (username: string): Promise<GitHubAnalysisResult> => {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) {
      throw new Error(userRes.status === 404 ? 'User not found on GitHub' : 'GitHub API unavailable');
    }
    const userData = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`);
    const reposData: any[] = reposRes.ok ? await reposRes.json() : [];

    const languages: Record<string, number> = {};
    let totalStars = 0;
    let totalForks = 0;
    const analyzedRepos: RepoInfo[] = [];

    for (const r of reposData) {
      if (r.fork) continue;
      const lang = r.language;
      if (lang) languages[lang] = (languages[lang] || 0) + 1;
      const stars = r.stargazers_count || 0;
      const forks = r.forks_count || 0;
      totalStars += stars;
      totalForks += forks;

      analyzedRepos.push({
        name: r.name,
        description: r.description || 'No description provided',
        html_url: r.html_url,
        language: lang || 'Mixed',
        stars,
        forks,
        updated_at: r.updated_at,
        topics: r.topics || [],
      });
    }

    const totalCounted = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
    const languageBreakdown: LanguageStat[] = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([l, count]) => ({
        language: l,
        repo_count: count,
        percentage: Math.round((count / totalCounted) * 1000) / 10,
      }));

    const inferredSkills: InferredSkill[] = languageBreakdown.slice(0, 5).map((l) => ({
      skill: l.language,
      confidence: Math.min(50 + l.repo_count * 10, 95),
      evidence: `Detected across ${l.repo_count} original GitHub repositories`,
    }));

    return {
      username: userData.login,
      avatar_url: userData.avatar_url,
      public_repos: userData.public_repos || 0,
      followers: userData.followers || 0,
      total_stars: totalStars,
      total_forks: totalForks,
      languages: languageBreakdown,
      inferred_skills: inferredSkills,
      top_repositories: analyzedRepos.slice(0, 8),
    };
  };

  const runAnalysis = async (targetUsernameOrUrl: string) => {
    let clean = targetUsernameOrUrl.trim().replace(/\/+$/, '');
    if (clean.includes('github.com/')) {
      clean = clean.split('github.com/').pop()?.split('/')[0] || clean;
    }
    if (!clean) return;

    setLoading(true);
    try {
      // 1. Try platform backend endpoint first
      const res = await apiFetch<GitHubAnalysisResult>('/github/analyze', {
        method: 'POST',
        body: JSON.stringify({ username_or_url: clean }),
      });
      if (res.ok && res.data) {
        setResult(res.data);
        showToast('success', `GitHub intelligence computed for @${res.data.username}!`);
        return;
      }

      // 2. Resilient direct GitHub API fallback (if backend microservice is redeploying)
      const directResult = await fetchGitHubDirectly(clean);
      setResult(directResult);
      showToast('success', `GitHub intelligence computed for @${directResult.username}!`);
    } catch (err: any) {
      showToast('error', err?.message || 'Could not analyze GitHub profile. Check username.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.github_url) {
      runAnalysis(user.github_url);
    }
  }, [user?.github_url]);

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
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
            <Github size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              GitHub Intelligence &amp; Skill Evidence
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Extract objective code evidence, repository activity, and language distributions from public GitHub profiles.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: 'var(--radius)', marginTop: 16 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis(inputVal);
            }}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Github size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--ink-faint)' }} />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter GitHub username or profile URL (e.g. https://github.com/username)"
                className="input-field"
                style={{ paddingLeft: 38 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ gap: 6, borderRadius: 10, padding: '0 20px' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Search size={14} /> Analyze Code Evidence
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* User Profile Card */}
          <div
            className="card"
            style={{
              padding: 24,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-glow-card)',
              border: '1px solid var(--accent-soft-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {result.avatar_url ? (
                  <img
                    src={result.avatar_url}
                    alt={result.username}
                    style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--accent)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'var(--surface-sunken)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Github size={30} />
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
                    @{result.username}
                  </h2>
                  <a
                    href={`https://github.com/${result.username}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                  >
                    View on GitHub <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Stat Counters */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{result.public_repos}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Public Repos</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{result.total_stars}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Stars Earned</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{result.total_forks}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>Forks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Languages & Inferred Evidence */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Left: Language Distribution */}
            <div className="card" style={{ padding: 22, borderRadius: 'var(--radius)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
                Language Distribution
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.languages.map((l) => (
                  <div key={l.language}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.language}</span>
                      <span style={{ color: 'var(--ink-soft)' }}>
                        {l.percentage}% ({l.repo_count} repos)
                      </span>
                    </div>
                    <div style={{ height: 6, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${l.percentage}%`,
                          background: 'var(--accent)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Inferred Technical Evidence */}
            <div className="card" style={{ padding: 22, borderRadius: 'var(--radius)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
                Inferred Skill Competencies
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.inferred_skills.map((s) => (
                  <div
                    key={s.skill}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-sunken)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{s.skill}</span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--success-soft)',
                          color: 'var(--success)',
                        }}
                      >
                        {s.confidence}% Confidence
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)' }}>{s.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Repositories */}
          <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
              Original Public Repositories
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {result.top_repositories.map((repo) => (
                <div
                  key={repo.name}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        {repo.name}
                      </a>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--ink-faint)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <Star size={12} /> {repo.stars}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <GitFork size={12} /> {repo.forks}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4, margin: '6px 0 10px' }}>
                      {repo.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{repo.language}</span>
                    <span style={{ color: 'var(--ink-faint)' }}>
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
