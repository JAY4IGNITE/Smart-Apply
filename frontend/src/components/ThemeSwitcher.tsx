import { useId } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';

const ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
};

const ORDER: Theme[] = ['light', 'dark'];

/**
 * Clean, modern 2-option (Light / Dark) segmented toggle.
 * Supports compact (icons only) and full (icons + text) variants.
 */
export default function ThemeSwitcher({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { theme, setTheme } = useTheme();
  const instanceId = useId();

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--surface-sunken)',
        padding: 3,
        borderRadius: 999,
        border: '1px solid var(--border)',
        position: 'relative',
      }}
    >
      {ORDER.map((t) => {
        const Icon = ICONS[t];
        const active = theme === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={LABELS[t]}
            className={`theme-switcher-option ${active ? 'active' : ''}`}
            onClick={() => setTheme(t)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: variant === 'compact' ? '6px 9px' : '5px 12px',
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-faint)',
              cursor: 'pointer',
              position: 'relative',
              fontSize: 12.5,
              fontWeight: 600,
              transition: 'color 0.15s ease',
              zIndex: 1,
            }}
          >
            {active && (
              <motion.span
                layoutId={`theme-switcher-pill-${instanceId}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background: 'var(--surface)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12), 0 0 0 1px var(--border)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              />
            )}
            <Icon size={variant === 'compact' ? 14 : 13} style={{ color: active ? 'var(--accent)' : 'inherit' }} />
            {variant === 'full' && <span>{LABELS[t]}</span>}
          </button>
        );
      })}
    </div>
  );
}
