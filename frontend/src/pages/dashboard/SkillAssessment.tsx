import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  RefreshCw,
  Compass,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../components/Toast';
import '../../styles/dashboard.css';

interface Career {
  slug: string;
  title: string;
  required_skills: string[];
}

interface GapItem {
  skill: string;
  current: number;
  target: number;
  priority: string;
  status: string;
  recommended_actions: string[];
}

interface AssessmentResult {
  overall_score: number;
  target_career: string;
  skills_breakdown: Record<string, number>;
  skill_gaps: GapItem[];
  recommendations: string[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  academic_explanation: string;
  textbook_ref: string;
}

interface QuizEvaluation {
  skill: string;
  score: number;
  correct_count: number;
  total_questions: number;
  academic_grade: string;
  summary: string;
  breakdown: Array<{
    id: number;
    question: string;
    user_choice: number | null;
    user_answer_text: string;
    correct_choice: number;
    correct_answer_text: string;
    is_correct: boolean;
    academic_explanation: string;
    textbook_ref: string;
  }>;
}

const FALLBACK_ACADEMIC_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'In algorithm analysis, what is the tight asymptotic upper bound (Big-O) of quicksort in the worst-case, and which choice of pivot mitigates this?',
    options: [
      'O(n log n), mitigated by choosing the first element as pivot',
      'O(n^2), mitigated by median-of-three or randomized pivot selection',
      'O(n), mitigated by duplicate key avoidance',
      'O(2^n), mitigated by memoization tables',
    ],
    correct_index: 1,
    academic_explanation:
      'Quicksort degrades to O(n^2) when subproblems are unbalanced (e.g. sorted array with first element pivot). Randomized or median-of-three pivot selection ensures expected O(n log n) runtime.',
    textbook_ref: 'Cormen, Leiserson, Rivest, Stein — Introduction to Algorithms (CLRS), Chapter 7',
  },
  {
    id: 2,
    question: "Which of the following conditions is NOT one of Coffman's four necessary conditions for a system deadlock to occur in Operating Systems?",
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemptive Resource Revocation',
      'Circular Wait',
    ],
    correct_index: 2,
    academic_explanation:
      'The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock cannot persist.',
    textbook_ref: 'Silberschatz, Galvin, Gagne — Operating System Concepts, Chapter 8',
  },
  {
    id: 3,
    question: 'In relational database theory, what distinguishes Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF)?',
    options: [
      'BCNF permits multi-valued dependencies whereas 3NF strictly eliminates them',
      'In BCNF, for every functional dependency X -> Y, X must be a superkey without exception for prime attributes',
      '3NF requires relations to be non-loss decomposable whereas BCNF does not',
      'BCNF is strictly applicable only to non-relational document stores',
    ],
    correct_index: 1,
    academic_explanation:
      'In 3NF, X -> Y is permitted if X is a superkey OR Y is a prime attribute. BCNF eliminates this second exception, requiring X to strictly be a superkey.',
    textbook_ref: 'Silberschatz, Korth, Sudarshan — Database System Concepts, Chapter 7',
  },
  {
    id: 4,
    question: 'In TCP/IP networking, during the three-way handshake, what flags and sequence numbers are exchanged to establish a reliable connection?',
    options: [
      'Client sends SYN; Server replies with SYN-ACK; Client acknowledges with ACK',
      'Client sends FIN; Server replies with RST; Client establishes session',
      'Client sends PUSH; Server responds with PULL; Client validates checksum',
      'Client sends UDP packet; Server echoes timestamp',
    ],
    correct_index: 0,
    academic_explanation:
      'Connection establishment requires SYN (seq=x), SYN-ACK (seq=y, ack=x+1), and client final ACK (ack=y+1).',
    textbook_ref: 'Kurose & Ross — Computer Networking: A Top-Down Approach, Chapter 3',
  },
  {
    id: 5,
    question: 'When implementing concurrent systems in modern engineering, which principle defines safety versus liveness properties?',
    options: [
      'Safety ensures nothing bad happens; Liveness guarantees something good eventually happens',
      'Safety measures CPU cache latency; Liveness measures memory allocation',
      'Safety requires single-threaded runtimes; Liveness allows distributed nodes',
      'Safety is static type checking; Liveness is runtime dynamic dispatch',
    ],
    correct_index: 0,
    academic_explanation:
      'In formal concurrency theory (Lamport), safety states that an undesirable state is never reached, while liveness ensures positive progress is made.',
    textbook_ref: 'Leslie Lamport — Proving the Correctness of Multiprocess Programs (1977)',
  },
];

export default function SkillAssessment() {
  const [activeTab, setActiveTab] = useState<'rating' | 'quiz'>('rating');
  const [careers, setCareers] = useState<Career[]>([]);
  const [targetCareer, setTargetCareer] = useState<string>(() => localStorage.getItem('skillhub_career_goal') || 'Software Engineer');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // NVIDIA Academic Quiz State
  const [quizSkill, setQuizSkill] = useState<string>('Data Structures & Algorithms');
  const [quizDifficulty, setQuizDifficulty] = useState<string>('Intermediate');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizEvaluating, setQuizEvaluating] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizEvaluation | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    apiFetch<Career[]>('/skills/careers')
      .then((res) => {
        if (mounted && res.ok && Array.isArray(res.data)) {
          setCareers(res.data);
          const chosen = res.data.find((c) => c.title === targetCareer) || res.data[0];
          if (chosen) {
            setCurrentSkills(chosen.required_skills);
            // Default initial ratings
            const init: Record<string, number> = {};
            chosen.required_skills.forEach((s, idx) => {
              init[s] = 50 + ((idx % 3) * 10);
            });
            setRatings(init);
          }
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [targetCareer]);

  const handleCareerChange = (newTitle: string) => {
    setTargetCareer(newTitle);
    localStorage.setItem('skillhub_career_goal', newTitle);
    const chosen = careers.find((c) => c.title === newTitle);
    if (chosen) {
      setCurrentSkills(chosen.required_skills);
      const init: Record<string, number> = {};
      chosen.required_skills.forEach((s) => {
        init[s] = ratings[s] ?? 50;
      });
      setRatings(init);
    }
    setResult(null);
  };

  const handleRatingChange = (skill: string, val: number) => {
    setRatings((prev) => ({ ...prev, [skill]: val }));
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    try {
      const res = await apiFetch<{ skill: string; difficulty: string; questions: QuizQuestion[] }>(
        `/skills/assess/quiz?skill=${encodeURIComponent(quizSkill)}&difficulty=${encodeURIComponent(quizDifficulty)}`
      );
      if (res.ok && res.data?.questions && res.data.questions.length > 0) {
        setQuizQuestions(res.data.questions);
        showToast('success', `Generated ${res.data.questions.length} academic questions with NVIDIA NIM!`);
      } else {
        // Graceful fallback to university standard questions if backend microservice is redeploying
        setQuizQuestions(FALLBACK_ACADEMIC_QUESTIONS);
        showToast('info', 'Loaded university standard academic diagnostic questions.');
      }
    } catch {
      setQuizQuestions(FALLBACK_ACADEMIC_QUESTIONS);
      showToast('info', 'Loaded university standard academic diagnostic questions.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizOption = (questionId: number, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [String(questionId)]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      showToast('error', 'Please answer all questions before submitting.');
      return;
    }
    setQuizEvaluating(true);
    try {
      const res = await apiFetch<QuizEvaluation>('/skills/assess/submit-quiz', {
        method: 'POST',
        body: JSON.stringify({
          skill: quizSkill,
          questions: quizQuestions,
          answers: quizAnswers,
        }),
      });
      if (res.ok && res.data) {
        setQuizResult(res.data);
        showToast('success', `Assessment graded! Academic score: ${res.data.score}%`);
      } else {
        showToast('error', 'Failed to evaluate quiz.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setQuizEvaluating(false);
    }
  };

  const handleRunAssessment = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch<AssessmentResult>('/skills/assess', {
        method: 'POST',
        body: JSON.stringify({
          target_career: targetCareer,
          answers: ratings,
        }),
      });
      if (res.ok && res.data) {
        setResult(res.data);
        showToast('success', 'Diagnostic assessment computed successfully!');
      } else {
        showToast('error', 'Failed to calculate assessment.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

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
            <Target size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Skill Assessment & Academic Benchmarking
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Benchmark your technical competencies and take university-grade academic quizzes powered by NVIDIA NIM.
            </p>
          </div>
        </div>

        {/* Assessment Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className={`btn btn-sm ${activeTab === 'rating' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('rating')}
            style={{ borderRadius: 999, padding: '7px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Compass size={14} /> Diagnostic Self-Rating & Gap Matrix
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'quiz' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('quiz')}
            style={{ borderRadius: 999, padding: '7px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Brain size={14} /> NVIDIA AI Academic Quiz
            <span style={{ fontSize: 10, background: 'rgba(255, 53, 232, 0.2)', color: '#FF35E8', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              NIM
            </span>
          </button>
        </div>

        {/* Target Career Selector Card */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: 'var(--radius)', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                Benchmark Track
              </span>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                Target Role: <strong>{targetCareer}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Change Role:</span>
              <select
                value={targetCareer}
                onChange={(e) => handleCareerChange(e.target.value)}
                className="input-field"
                style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, width: 'auto' }}
              >
                {careers.map((c) => (
                  <option key={c.slug} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'quiz' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quiz Configuration Card */}
          <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    NVIDIA NIM Academic Diagnostic Quiz
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  Generates rigorous university-standard multiple-choice questions testing conceptual depth and complexity.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginRight: 6 }}>Subject:</span>
                  <select
                    value={quizSkill}
                    onChange={(e) => setQuizSkill(e.target.value)}
                    className="input-field"
                    style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, width: 'auto' }}
                  >
                    {(currentSkills.length ? currentSkills : [
                      'Data Structures & Algorithms',
                      'Operating Systems',
                      'Database Management Systems',
                      'Computer Networks',
                      'System Design',
                      'Python',
                      'React',
                    ]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginRight: 6 }}>Rigor:</span>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="input-field"
                    style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, width: 'auto' }}
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced / Viva</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  style={{ gap: 6, fontWeight: 600, padding: '7px 16px', borderRadius: 8 }}
                >
                  {quizLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Academic Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* If Quiz Result is ready */}
          {quizResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                className="card"
                style={{
                  padding: 24,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--gradient-glow-card)',
                  border: '1.5px solid var(--accent-soft-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 20,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    {quizResult.skill} Academic Evaluation
                  </span>
                  <h3 style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
                    {quizResult.academic_grade}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', maxWidth: 620 }}>
                    {quizResult.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: 'var(--surface)',
                      border: '4px solid var(--accent)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{quizResult.score}%</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>SCORE</span>
                  </div>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setQuizResult(null);
                      handleGenerateQuiz();
                    }}
                    style={{ borderRadius: 999 }}
                  >
                    Try Another Set
                  </button>
                </div>
              </div>

              {/* Question Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {quizResult.breakdown.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="card"
                    style={{
                      padding: 20,
                      borderRadius: 'var(--radius)',
                      border: `1.5px solid ${item.is_correct ? 'var(--success-border, #10B981)' : 'var(--danger-border, #EF4444)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {item.is_correct ? (
                        <span className="badge badge-success" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Correct
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={12} /> Incorrect
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
                        Question {idx + 1}
                      </span>
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                      {item.question}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: item.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                        <strong>Your Answer:</strong> {item.user_answer_text}
                      </div>
                      {!item.is_correct && (
                        <div style={{ fontSize: 13, color: 'var(--success)' }}>
                          <strong>Correct Answer:</strong> {item.correct_answer_text}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'var(--surface-sunken)',
                        borderRadius: 8,
                        borderLeft: '3px solid var(--accent)',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Brain size={14} color="var(--accent)" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Academic Explanation:</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                        {item.academic_explanation}
                      </p>
                    </div>

                    {item.textbook_ref && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-faint)' }}>
                        <BookOpen size={13} />
                        <span>Curriculum Reference: <strong>{item.textbook_ref}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Quiz Questions (when generated and not yet submitted) */}
          {quizQuestions.length > 0 && !quizResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {quizQuestions.map((q, qIndex) => {
                const selected = quizAnswers[String(q.id)];
                return (
                  <div
                    key={q.id}
                    className="card"
                    style={{ padding: 22, borderRadius: 'var(--radius)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                        Question {qIndex + 1} of {quizQuestions.length}
                      </span>
                      {selected !== undefined && (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={13} /> Answered
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16, lineHeight: 1.4 }}>
                      {q.question}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {q.options.map((opt, optIndex) => {
                        const isChosen = selected === optIndex;
                        const letter = String.fromCharCode(65 + optIndex);
                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleSelectQuizOption(q.id, optIndex)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 8,
                              border: isChosen ? '2px solid var(--accent)' : '1px solid var(--border)',
                              background: isChosen ? 'var(--accent-soft)' : 'var(--surface-sunken)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: isChosen ? 'var(--accent)' : 'var(--surface)',
                                color: isChosen ? '#FFF' : 'var(--ink)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {letter}
                            </span>
                            <span style={{ fontSize: 14, color: isChosen ? 'var(--accent)' : 'var(--ink)', fontWeight: isChosen ? 600 : 400 }}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Submit Quiz Action */}
              <button
                className="btn btn-lg btn-primary"
                onClick={handleSubmitQuiz}
                disabled={quizEvaluating}
                style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 600, padding: 14 }}
              >
                {quizEvaluating ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Evaluating Academic Answers...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Submit Quiz for Academic Grading ({Object.keys(quizAnswers).length}/{quizQuestions.length} Answered)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Empty State before quiz generation */}
          {quizQuestions.length === 0 && !quizLoading && !quizResult && (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: 'center',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px dashed var(--border)',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Brain size={28} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                Ready to Test Your Academic Mastery?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', maxWidth: 480, margin: '0 auto 20px' }}>
                Select your subject above and click <strong>Generate Academic Quiz</strong>. NVIDIA NIM will dynamically synthesize 5 conceptual university-grade questions with citations and explanations.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleGenerateQuiz}
                style={{ gap: 8, fontWeight: 600, margin: '0 auto' }}
              >
                <Sparkles size={16} /> Generate Quiz Now
              </button>
            </div>
          )}
        </div>
      ) : !result ? (
        <div className="card" style={{ padding: 26, borderRadius: 'var(--radius-lg)' }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Diagnostic Competency Quiz & Self-Rating
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Adjust each competency to reflect your current proficiency (or recent test score). SkillHub will calculate your objective gap distribution.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 30 }}>
            {currentSkills.map((skill) => {
              const val = ratings[skill] ?? 50;
              return (
                <div
                  key={skill}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{skill}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: val >= 75 ? 'var(--success)' : val >= 50 ? 'var(--accent)' : 'var(--warning)',
                      }}
                    >
                      {val}% Proficiency
                    </span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={val}
                    onChange={(e) => handleRatingChange(skill, Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                    <span>Novice / Learning</span>
                    <span>Intermediate (Builds Apps)</span>
                    <span>Advanced / Production Ready</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-lg btn-primary"
            onClick={handleRunAssessment}
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 600, padding: 14 }}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" /> Computing Gaps & Readiness...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Compute Skill Gaps & Roadmap Alignment
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Score Banner */}
          <div
            className="card"
            style={{
              padding: 26,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-glow-card)',
              border: '1.5px solid var(--accent-soft-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Diagnostic Result for {result.target_career}
              </span>
              <h2 style={{ margin: '6px 0 8px', fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
                Target Competency Match
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                Based on your evaluated technical profile across {result.skill_gaps.length} core competencies.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  border: '4px solid var(--accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px -4px rgba(82, 39, 255, 0.25)',
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{result.overall_score}%</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)' }}>SCORE</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/assess/gaps')}
                  style={{ borderRadius: 999 }}
                >
                  View Skill Gaps <ArrowRight size={13} />
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setResult(null)}
                  style={{ borderRadius: 999 }}
                >
                  Retake Assessment
                </button>
              </div>
            </div>
          </div>

          {/* Gaps List */}
          <div className="card" style={{ padding: 24, borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
              Prioritized Skill Gaps
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.skill_gaps.map((gap) => (
                <div
                  key={gap.skill}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-sunken)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{gap.skill}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background:
                            gap.priority === 'High Priority'
                              ? 'var(--danger-soft)'
                              : gap.priority === 'Medium Priority'
                              ? 'var(--warning-soft)'
                              : 'var(--success-soft)',
                          color:
                            gap.priority === 'High Priority'
                              ? 'var(--danger)'
                              : gap.priority === 'Medium Priority'
                              ? 'var(--warning)'
                              : 'var(--success)',
                          border: `1px solid ${
                            gap.priority === 'High Priority'
                              ? 'var(--danger-border)'
                              : gap.priority === 'Medium Priority'
                              ? 'var(--warning-border)'
                              : 'var(--success-border)'
                          }`,
                        }}
                      >
                        {gap.priority}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                      Current: <strong>{gap.current}%</strong> &bull; Target: <strong>{gap.target}%</strong> &bull; Gap: <strong>{gap.target - gap.current}%</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => navigate('/learn/resources')}
                      style={{ fontSize: 12 }}
                    >
                      <BookOpen size={13} /> Learn
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate('/dashboard/project-recommender')}
                      style={{ fontSize: 12 }}
                    >
                      Build Project
                    </button>
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
