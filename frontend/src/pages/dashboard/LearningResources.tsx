import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  Code,
  Layers,
  Terminal,
  Database,
  Cpu,
  Cloud,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import '../../styles/dashboard.css';

interface Resource {
  title: string;
  category: string;
  type: 'Course' | 'Interactive Docs' | 'Practice' | 'Architecture Guide';
  description: string;
  url: string;
  skills: string[];
  duration: string;
}

const RESOURCES: Resource[] = [
  {
    title: 'NeetCode 150 — Data Structures & Algorithms',
    category: 'Core CS',
    type: 'Practice',
    description: 'Curated list of 150 algorithmic coding challenges categorized by patterns (Two Pointers, Sliding Window, Trees, Graphs, DP).',
    url: 'https://neetcode.io/practice',
    skills: ['DSA', 'Python', 'Java', 'C++'],
    duration: '6–8 Weeks',
  },
  {
    title: 'System Design Primer (Donne Martin)',
    category: 'Core CS',
    type: 'Architecture Guide',
    description: 'Open-source engineering blueprint covering microservices, caching, load balancing, sharding, and real-world system design.',
    url: 'https://github.com/donnemartin/system-design-primer',
    skills: ['System Design', 'Scalability', 'Microservices', 'Databases'],
    duration: '4 Weeks',
  },
  {
    title: 'Full Stack Open — University of Helsinki',
    category: 'Web & Cloud',
    type: 'Course',
    description: 'Deep-dive into modern JavaScript/TypeScript, React, Node.js, Express, MongoDB, GraphQL, and TypeScript.',
    url: 'https://fullstackopen.com/en/',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    duration: '10 Weeks',
  },
  {
    title: 'FastAPI Official Interactive Tutorial',
    category: 'Backend',
    type: 'Interactive Docs',
    description: 'High-performance async Python APIs, dependency injection, Pydantic validation, and OpenAPI documentation.',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    skills: ['FastAPI', 'Python', 'REST APIs', 'AsyncIO'],
    duration: '1–2 Weeks',
  },
  {
    title: 'PostgreSQL Tutorial & Indexing Deep Dive',
    category: 'Data & Storage',
    type: 'Interactive Docs',
    description: 'Comprehensive guide to relational data modeling, query optimization, B-Tree and GIN indexes, and ACID transactions.',
    url: 'https://www.postgresqltutorial.com/',
    skills: ['SQL', 'PostgreSQL', 'Database Indexing'],
    duration: '2 Weeks',
  },
  {
    title: 'Docker & Kubernetes Fundamentals (Kubernetes.io)',
    category: 'Cloud & DevOps',
    type: 'Interactive Docs',
    description: 'Official interactive Katacoda tutorials on containerization, Pod configurations, Deployments, and Ingress routing.',
    url: 'https://kubernetes.io/docs/tutorials/',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud'],
    duration: '3 Weeks',
  },
  {
    title: 'DeepLearning.AI — LangChain & LLM Application Development',
    category: 'Artificial Intelligence',
    type: 'Course',
    description: 'Hands-on course on building generative AI products with LLMs, prompt chains, vector embeddings, and RAG architectures.',
    url: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/',
    skills: ['LLMs & Prompt Engineering', 'Python', 'Vector Databases'],
    duration: '1 Week',
  },
];

const CATEGORIES = ['All', 'Core CS', 'Web & Cloud', 'Backend', 'Data & Storage', 'Cloud & DevOps', 'Artificial Intelligence'];

export default function LearningResources() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = RESOURCES.filter((r) =>
    selectedCategory === 'All' ? true : r.category === selectedCategory
  );

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
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
            <BookOpen size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Curated Learning Resources &amp; Practice
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Industry-grade courses, interactive documentation, and algorithmic practice curated to eliminate skill gaps.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0 4px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 999, fontSize: 12.5, whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Resources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {filtered.map((item) => (
          <motion.div
            key={item.title}
            className="card"
            whileHover={{ y: -2 }}
            style={{
              padding: 20,
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.type} &bull; {item.category}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  {item.duration}
                </span>
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                {item.title}
              </h3>

              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 14 }}>
                {item.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {item.skills.map((s) => (
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

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline"
              style={{ justifyContent: 'center', gap: 6, fontSize: 12.5 }}
            >
              Open Resource <ExternalLink size={13} />
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
