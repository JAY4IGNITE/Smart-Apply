import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Lock, AlertTriangle, Shield, Eye, EyeOff, Palette } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { apiFetch, apiErrorMessage } from '../../api/client';
import { ButtonSpinner } from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import ThemeSwitcher from '../../components/ThemeSwitcher';

export default function Settings() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [updatingPw, setUpdatingPw] = useState(false);

  const [notifications, setNotifications] = useState(() => localStorage.getItem('sa_notifications') !== 'false');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      showToast('error', 'New password must be at least 8 characters.');
      return;
    }
    setUpdatingPw(true);
    try {
      const res = await apiFetch('/user/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (res.ok) {
        showToast('success', 'Password updated successfully.');
        setCurrentPw('');
        setNewPw('');
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to update password.'));
      }
    } catch {
      showToast('error', 'Network error while updating password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem('sa_notifications', String(checked));
    try {
      await apiFetch('/user/profile', { method: 'PUT', body: JSON.stringify({ notifications_enabled: checked }) });
    } catch {
      // Best-effort — local preference already applied.
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch('/user/account', { method: 'DELETE' });
      if (res.ok) {
        showToast('info', 'Your account has been scheduled for deletion.');
        logout();
      } else {
        showToast('error', apiErrorMessage(res, 'Failed to delete account.'));
      }
    } catch {
      showToast('error', 'Network error while deleting account.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="container-narrow">
      <PageHeader title="Settings" subtitle="Manage your account preferences and security." />

      <div className="card" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 19,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <h3 style={{ fontSize: 16 }}>{user?.full_name}</h3>
          <p className="text-muted" style={{ fontSize: 13.5 }}>{user?.email}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: 'var(--accent)' }} /> Security
        </h3>
        <form onSubmit={handleUpdatePassword}>
          <div className="input-group">
            <label>Current password</label>
            <div className="input-icon-wrap">
              <Lock size={16} />
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field has-trailing"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
              />
              <button type="button" className="input-icon-trailing" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>New password</label>
            <div className="input-icon-wrap">
              <Lock size={16} />
              <input type={showPw ? 'text' : 'password'} className="input-field" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!currentPw || !newPw || updatingPw}>
            {updatingPw ? <ButtonSpinner /> : 'Update password'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={16} style={{ color: 'var(--accent)' }} /> Appearance
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Theme</div>
            <div className="text-muted" style={{ fontSize: 13 }}>Choose how Smart Apply looks on this device</div>
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} style={{ color: 'var(--accent)' }} /> Preferences
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Email notifications</div>
            <div className="text-muted" style={{ fontSize: 13 }}>Receive updates on product features and career tips</div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={notifications} onChange={(e) => handleToggleNotifications(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-soft)' }}>
        <h3 style={{ fontSize: 15.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
          <AlertTriangle size={16} /> Danger zone
        </h3>
        <p style={{ fontSize: 13.5, marginBottom: 16, color: 'var(--ink-soft)' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete account
        </button>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
            <motion.div
              className="modal"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              tabIndex={-1}
            >
              <h3 id="delete-account-title" style={{ fontSize: 18, marginBottom: 10 }}>Delete account?</h3>
              <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 22, lineHeight: 1.55 }}>
                Are you sure you want to delete your account? All your data, resumes, and interview history will be permanently
                erased.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-block" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                  Cancel
                </button>
                <button className="btn btn-danger btn-block" onClick={handleDeleteAccount} disabled={deleting} autoFocus>
                  {deleting ? <ButtonSpinner /> : 'Yes, delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
