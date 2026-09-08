import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/LoadingSpinner';
import ThemeToggleFloating from '../components/ThemeToggleFloating';
import { apiFetch, apiErrorMessage } from '../api/client';
import type { User } from '../api/types';
import '../styles/auth.css';

interface LoginResponse {
  access_token: string;
  user: User;
  detail?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        login(res.data.access_token, res.data.user);
        showToast('success', `Welcome back, ${res.data.user.full_name.split(' ')[0]}!`);
        navigate(res.data.user.has_onboarded ? '/dashboard' : '/onboarding');
      } else if (res.status === 403) {
        showToast('info', 'Please verify your email first.');
        navigate('/verify-otp', { state: { email } });
      } else {
        setError(apiErrorMessage(res, 'Invalid email or password.'));
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
          <h2>Welcome back</h2>
          <p>Sign in to keep working on your job search</p>
        </div>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={17} />
              <input
                id="login-email"
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
            <label htmlFor="login-password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={17} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field has-trailing"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>

          <Link to="/reset-password" className="forgot-link">
            Forgot password?
          </Link>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <ButtonSpinner /> : 'Sign in'}
          </button>
        </form>

        <div className="auth-links">
          New to Smart Apply? <Link to="/signup">Create an account</Link>
        </div>
      </motion.div>
    </div>
  );
}
