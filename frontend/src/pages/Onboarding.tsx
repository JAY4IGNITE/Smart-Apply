import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Plus, X, Sparkles } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/LoadingSpinner';
import ThemeToggleFloating from '../components/ThemeToggleFloating';
import { apiFetch } from '../api/client';
import type { ResumeParseResult, User } from '../api/types';
import '../styles/auth.css';

interface ProfileUpdateResponse {
  message: string;
  user: User;
}

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [education, setEducation] = useState<string[]>([]);
  const [experience, setExperience] = useState<string[]>([]);
  const [aiFilled, setAiFilled] = useState(false);

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const executeSmartFill = async (formData: FormData) => {
    setParsing(true);
    showToast('info', 'Reading your resume with AI…', 4000);

    try {
      const res = await apiFetch<ResumeParseResult>('/ai/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = res.data;
        if (data.bio) setBio(data.bio);
        if (data.skills?.length) setSkills(data.skills);
        if (data.education?.length) setEducation(data.education);
        if (data.experience?.length) setExperience(data.experience);
        setAiFilled(true);
        showToast('success', 'Profile auto-filled!');
        setStep(2);
      } else {
        showToast('error', 'Failed to parse resume.');
      }
    } catch {
      showToast('error', 'Network error while parsing resume.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    if (file.type !== 'application/pdf') {
      showToast('error', 'Please upload a PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('resume_file', file);
    executeSmartFill(formData);
  };

  const handleSaveAndComplete = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ProfileUpdateResponse>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: user?.full_name,
          bio,
          skills,
          education,
          experience,
        }),
      });
      if (res.ok) {
        updateUser(res.data.user);
        showToast('success', 'Profile complete — welcome to Smart Apply!');
        navigate('/dashboard');
      } else {
        showToast('error', 'Failed to save your profile.');
      }
    } catch {
      showToast('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggleFloating />
      <motion.div
        className="auth-card"
        style={{ maxWidth: 560, width: '100%' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-header">
          <h2 style={{ fontSize: 24 }}>Welcome, {(user?.full_name || '').split(' ')[0] || 'there'}</h2>
          <p>Let's set up your profile to personalize your experience</p>
        </div>

        <div className="step-indicator" style={{ marginBottom: 28 }}>
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h3 style={{ marginBottom: 10, fontSize: 17 }}>The fast way</h3>
              <p className="text-muted" style={{ marginBottom: 22, fontSize: 14 }}>
                Upload your latest resume and AI will build your profile for you instantly.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf"
                onChange={handleFileUpload}
              />
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                style={{ marginBottom: 16 }}
              >
                {parsing ? (
                  <>
                    <ButtonSpinner /> Analyzing resume…
                  </>
                ) : (
                  <>
                    <Upload size={18} /> Upload PDF resume
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--ink-faint)' }}>
                <span className="hr" style={{ flex: 1, margin: 0 }} />
                <span style={{ padding: '0 12px', fontSize: 12.5 }}>OR</span>
                <span className="hr" style={{ flex: 1, margin: 0 }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
                  Fill manually <ArrowRight size={16} />
                </button>
                <button className="btn btn-ghost" onClick={handleSaveAndComplete} style={{ flex: 1, fontSize: 13 }}>
                  Skip to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)', fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              {aiFilled && <Sparkles size={15} style={{ color: 'var(--accent)' }} />}
              {aiFilled ? 'Review your AI-generated profile' : 'Fill out your details'}
            </h3>

            <div className="auth-form" style={{ textAlign: 'left' }}>
              <div className="input-group">
                <label>Bio (summary)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I'm a software engineer who…"
                />
              </div>

              <div className="input-group">
                <label>Skills</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    className="input-field"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="e.g. React, Python"
                  />
                  <button type="button" className="btn btn-secondary btn-icon" onClick={handleAddSkill} aria-label="Add skill">
                    <Plus size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map((skill) => (
                    <span key={skill} className="chip">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} aria-label={`Remove ${skill}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && <span className="text-faint" style={{ fontSize: 13 }}>No skills added yet</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleSaveAndComplete} disabled={loading} style={{ flex: 2 }}>
                  {loading ? <ButtonSpinner /> : 'Complete setup'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
