import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/LoadingSpinner';
import ThemeToggleFloating from '../components/ThemeToggleFloating';
import { apiFetch, apiErrorMessage } from '../api/client';
import type { User } from '../api/types';
import '../styles/auth.css';

interface VerifyResponse {
  access_token: string;
  user: User;
}

export default function OtpVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, lastAuthEvent } = useAuth();
  const { showToast } = useToast();
  const email = (location.state as { email?: string } | null)?.email || '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-verify if a sibling tab / the OTP email link confirms via WebSocket
  useEffect(() => {
    if (verifiedRef.current) return;
    if (lastAuthEvent?.type === 'otp_verified' && lastAuthEvent.data.token) {
      verifiedRef.current = true;
      setSuccess(true);
      setTimeout(() => navigate(lastAuthEvent.data.has_onboarded ? '/dashboard' : '/onboarding'), 1000);
    }
    if (lastAuthEvent?.type === 'otp_failed') {
      setError((lastAuthEvent.data.reason as string) || 'Invalid OTP');
    }
  }, [lastAuthEvent, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<VerifyResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp_code: code }),
      });

      if (res.ok) {
        verifiedRef.current = true;
        login(res.data.access_token, res.data.user);
        setSuccess(true);
        showToast('success', 'Email verified!');
        setTimeout(() => navigate(res.data.user.has_onboarded ? '/dashboard' : '/onboarding'), 1000);
      } else {
        setError(apiErrorMessage(res, 'Invalid OTP.'));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await apiFetch('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setCountdown(60);
        showToast('info', 'A new code has been sent to your email.');
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to resend the code.'));
      }
    } catch {
      showToast('error', 'Network error while resending the code.');
    }
  };

  if (!email) {
    navigate('/signup');
    return null;
  }

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
          <h2>Verify your email</h2>
          <p>
            We sent a 6-digit code to <strong style={{ color: 'var(--ink)' }}>{email}</strong>
          </p>
        </div>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        {success ? (
          <motion.div
            style={{ textAlign: 'center', padding: '28px 0' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <CheckCircle2 size={52} style={{ color: 'var(--success)', margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 600, fontSize: 15.5 }}>Verified</p>
            <p className="text-muted" style={{ fontSize: 13.5, marginTop: 4 }}>
              Taking you to your dashboard…
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <ButtonSpinner /> : 'Verify code'}
            </button>

            <div className="resend-section">
              {countdown > 0 ? (
                <span>
                  Resend code in <strong>{countdown}s</strong>
                </span>
              ) : (
                <button type="button" className="resend-btn" onClick={handleResend}>
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
