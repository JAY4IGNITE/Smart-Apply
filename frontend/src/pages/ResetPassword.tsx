import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';

import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/LoadingSpinner';
import ThemeToggleFloating from '../components/ThemeToggleFloating';
import { apiFetch, apiErrorMessage } from '../api/client';
import '../styles/auth.css';

const fadeSlide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        showToast('info', 'If this email is registered, a code has been sent.');
        setStep(2);
      } else {
        setError(apiErrorMessage(res, 'Something went wrong.'));
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
      });
      if (res.ok) {
        setStep(3);
        showToast('success', 'Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(apiErrorMessage(res, 'Invalid code, please try again.'));
      }
    } catch {
      setError('Network error.');
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
            <img src="/logo.png" alt="SkillHub" style={{ height: 42, width: 42, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              Skill<span style={{ color: 'var(--accent)' }}>Hub</span>
            </span>
          </Link>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} />
          <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`} />
          <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
        </div>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...fadeSlide}>
              <div className="auth-header">
                <h2>Reset password</h2>
                <p>Enter your email to receive a verification code</p>
              </div>
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="input-group">
                  <label htmlFor="reset-email">Email</label>
                  <div className="input-icon-wrap">
                    <Mail size={17} />
                    <input
                      id="reset-email"
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? <ButtonSpinner /> : 'Send code'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...fadeSlide}>
              <div className="auth-header">
                <h2>Enter code &amp; new password</h2>
                <p>Check your email for the verification code</p>
              </div>
              <form className="auth-form" onSubmit={handleReset}>
                <div className="input-group">
                  <label htmlFor="reset-otp">Verification code</label>
                  <input
                    id="reset-otp"
                    type="text"
                    className="input-field"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reset-new-pw">New password</label>
                  <div className="input-icon-wrap">
                    <Lock size={17} />
                    <input
                      id="reset-new-pw"
                      type="password"
                      className="input-field"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? <ButtonSpinner /> : 'Reset password'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...fadeSlide} style={{ textAlign: 'center', padding: '28px 0' }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              >
                <CheckCircle2 size={52} style={{ color: 'var(--success)', margin: '0 auto 14px' }} />
              </motion.div>
              <h2 style={{ marginBottom: 6, fontSize: 20 }}>Password reset</h2>
              <p className="text-muted" style={{ fontSize: 13.5 }}>Redirecting you to sign in…</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="auth-links">
          Remember your password? <Link to="/login">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
