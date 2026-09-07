import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/LoadingSpinner';
import ThemeToggleFloating from '../components/ThemeToggleFloating';
import { apiFetch, apiErrorMessage } from '../api/client';
import '../styles/auth.css';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { label: 'Very weak', color: 'var(--danger)' },
    { label: 'Weak', color: 'var(--warning)' },
    { label: 'Fair', color: '#c99a1f' },
    { label: 'Strong', color: 'var(--accent)' },
    { label: 'Very strong', color: 'var(--success)' },
  ];

  return { score, ...levels[score] };
}

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (res.ok) {
        showToast('success', 'Account created — check your email for the code.');
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(apiErrorMessage(res, 'Signup failed. Please try again.'));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggleFloating />
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Smart Apply" style={{ height: 42, width: 42, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              Smart<span style={{ color: 'var(--accent)' }}>Apply</span>
            </span>
          </Link>
        </div>

        <div className="auth-header">
          <h2>Create your account</h2>
          <p>Start your AI-powered job search journey</p>
        </div>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="signup-name">Full name</label>
            <div className="input-icon-wrap">
              <User size={17} />
              <input
                id="signup-name"
                type="text"
                className="input-field"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="signup-email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={17} />
              <input
                id="signup-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="signup-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={17} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field has-trailing"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-icon-trailing"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <motion.div
                    className="strength-fill"
                    style={{ background: strength.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(strength.score + 1) * 20}%` }}
                  />
                </div>
                <div className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="signup-confirm">Confirm password</label>
            <div className="input-icon-wrap">
              <Lock size={17} />
              <input
                id="signup-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field has-trailing"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-icon-trailing"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <ButtonSpinner /> : 'Create account'}
          </button>
        </form>

        <div className="auth-links">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
