import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Map,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Code,
  Target,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import { apiFetch } from '../../api/client';
import { useToast } from '../../components/Toast';
import '../../styles/dashboard.css';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'learn' | 'practice' | 'build' | 'assess';
}

interface Milestone {
  phase: string;
  title: string;
  duration: string;
  tasks: Task[];
}

interface RoadmapData {
  target_career: string;
  title: string;
  milestones: Milestone[];
  completed_tasks: string[];
}

export default function PersonalizedRoadmap() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchRoadmap = () => {
    setLoading(true);
    apiFetch<RoadmapData>('/skills/roadmap')
      .then((res) => {
        if (res.ok && res.data) {
          setRoadmap(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;
    try {
      const res = await apiFetch('/skills/roadmap/task', {
        method: 'PUT',
        body: JSON.stringify({
          task_id: taskId,
          completed: newCompleted,
        }),
      });
      if (res.ok) {
        setRoadmap((prev) => {
          if (!prev) return prev;
          const updatedMilestones = prev.milestones.map((m) => ({
            ...m,
            tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t)),
          }));
          const updatedCompleted = newCompleted
            ? [...prev.completed_tasks, taskId]
            : prev.completed_tasks.filter((id) => id !== taskId);
          return {
            ...prev,
            milestones: updatedMilestones,
            completed_tasks: updatedCompleted,
          };
        });
      }
    } catch {
      showToast('error', 'Failed to update task.');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const target = localStorage.getItem('skillhub_career_goal') || 'Software Engineer';
    try {
      const res = await apiFetch<RoadmapData>(`/skills/roadmap/generate?target_career=${encodeURIComponent(target)}`, {
        method: 'POST',
      });
      if (res.ok && res.data) {
        setRoadmap(res.data);
        showToast('success', `Regenerated personalized roadmap for ${target}!`);
      }
    } catch {
      showToast('error', 'Failed to generate roadmap.');
    } finally {
      setRegenerating(false);
    }
  };

  const totalTasks = roadmap?.milestones.reduce((acc, m) => acc + m.tasks.length, 0) || 0;
  const completedCount = roadmap?.completed_tasks.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

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
            <Map size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>
              Personalized Learning Roadmap
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              A milestone-driven curriculum mapped to your target career and prioritized skill gaps.
            </p>
          </div>
        </div>

        {/* Overview Bar */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              Current Trajectory
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
              {roadmap?.title || 'Personalized Career Roadmap'}
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              {completedCount} of {totalTasks} milestones completed ({progressPercent}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Progress circle */}
            <div style={{ width: 120 }}>
              <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)',
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline"
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{ gap: 6, borderRadius: 999 }}
            >
              <RefreshCw size={13} className={regenerating ? 'spin' : ''} /> Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Roadmap Phased Milestones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {roadmap?.milestones.map((milestone, idx) => {
          const mCompleted = milestone.tasks.filter((t) => t.completed).length;
          const mTotal = milestone.tasks.length;
          const isPhaseDone = mCompleted === mTotal && mTotal > 0;

          return (
            <motion.div
              key={milestone.phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="card"
              style={{
                padding: 24,
                borderRadius: 'var(--radius-lg)',
                borderLeft: `4px solid ${isPhaseDone ? 'var(--success)' : 'var(--accent)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                      {milestone.phase}
                    </span>
                    <span
                      style={{
                        fontSize: 11.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--ink-faint)',
                      }}
                    >
                      <Clock size={12} /> {milestone.duration}
                    </span>
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                    {milestone.title}
                  </h2>
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: isPhaseDone ? 'var(--success-soft)' : 'var(--surface-sunken)',
                    color: isPhaseDone ? 'var(--success)' : 'var(--ink-soft)',
                    border: `1px solid ${isPhaseDone ? 'var(--success-border)' : 'var(--border)'}`,
                  }}
                >
                  {mCompleted} / {mTotal} Done
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {milestone.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-sunken)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {task.completed ? (
                        <CheckCircle2 size={18} color="var(--success)" />
                      ) : (
                        <Circle size={18} color="var(--border-strong)" />
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: task.completed ? 'var(--ink-soft)' : 'var(--ink)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--surface)',
                        color: 'var(--ink-faint)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {task.type}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
