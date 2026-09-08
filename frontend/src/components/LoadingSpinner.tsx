import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

/* ─── Tiny reusable spinner icon ─── */
function SpinnerRing({ size = 32, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid var(--border)`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/** A plain centered spinner — used for full-page or section-level loading. */
export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return <SpinnerRing size={size} />;
}

/** Small spinner meant to sit inline inside a button, replacing its label. */
export function ButtonSpinner({ size = 16 }: { size?: number }) {
  return <SpinnerRing size={size} />;
}

/* ─── Animated dots for "Loading..." style text ─── */
function BouncingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 2 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}

/** Centered loader with an optional title/subtitle, for a section that's still fetching. */
export function InlineLoader({
  title,
  subtitle,
  showDots = true,
}: {
  title: string;
  subtitle?: string;
  showDots?: boolean;
}) {
  const cleanTitle = title.replace(/[.…]+$/, '');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 18,
        color: 'var(--ink-soft)',
      }}
    >
      <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2.5px solid var(--border)',
            borderTopColor: 'var(--accent)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderBottomColor: 'var(--accent)',
          }}
        />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {cleanTitle}
          {showDots && <BouncingDots />}
        </div>
        {subtitle && <div style={{ fontSize: 13, marginTop: 6, color: 'var(--ink-faint)' }}>{subtitle}</div>}
      </div>
    </motion.div>
  );
}

/** Full-viewport overlay loader for heavier async operations (extraction, compilation). */
export function PageLoader({ show, title, subtitle }: { show: boolean; title: string; subtitle?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 22, 28, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
              textAlign: 'center',
              maxWidth: 400,
              width: '100%',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Animated accent ring */}
            <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRightColor: 'var(--accent)',
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  opacity: 0.18,
                }}
              />
            </div>

            <div>
              <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {title}
                <BouncingDots />
              </h3>
              {subtitle && (
                <p style={{ fontSize: 14, color: 'var(--ink-faint)', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════
   SKELETON COMPONENTS
   ═══════════════════════════════════════ */

/** A single shimmering line placeholder. */
export function SkeletonLine({ width = '100%', height = 12, style }: { width?: string | number; height?: number; style?: CSSProperties }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: 6,
        ...style,
      }}
    />
  );
}

/** Shimmering placeholder block for cards that are still loading.
 *  Variants: "card" (default), "stat", "list-item", "profile"
 */
export function SkeletonCard({
  height,
  variant = 'card',
  style,
}: {
  height?: number;
  variant?: 'card' | 'stat' | 'list-item' | 'profile';
  style?: CSSProperties;
}) {
  const wrapStyle: CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: variant === 'list-item' ? '16px 20px' : 32,
    overflow: 'hidden',
    ...(height ? { height } : {}),
    ...style,
  };

  if (variant === 'stat') {
    return (
      <div style={wrapStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <SkeletonLine width="45%" height={10} />
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
        </div>
        <SkeletonLine width="50%" height={36} style={{ borderRadius: 10 }} />
        <SkeletonLine width="30%" height={10} style={{ marginTop: 12 }} />
      </div>
    );
  }

  if (variant === 'list-item') {
    return (
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="60%" height={12} />
          <SkeletonLine width="35%" height={9} style={{ marginTop: 8 }} />
        </div>
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 14 }} />
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <div style={wrapStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <SkeletonLine width="50%" height={16} />
            <SkeletonLine width="70%" height={10} style={{ marginTop: 10 }} />
          </div>
        </div>
        <SkeletonLine width="100%" height={38} style={{ borderRadius: 10 }} />
        <SkeletonLine width="100%" height={38} style={{ marginTop: 12, borderRadius: 10 }} />
        <SkeletonLine width="100%" height={60} style={{ marginTop: 12, borderRadius: 10 }} />
      </div>
    );
  }

  // Default "card" variant
  return (
    <div style={wrapStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="65%" height={13} />
          <SkeletonLine width="40%" height={9} style={{ marginTop: 8 }} />
        </div>
      </div>
      <SkeletonLine width="100%" height={10} />
      <SkeletonLine width="85%" height={10} style={{ marginTop: 8 }} />
      <SkeletonLine width="55%" height={10} style={{ marginTop: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <div className="skeleton" style={{ width: 72, height: 30, borderRadius: 15 }} />
        <div className="skeleton" style={{ width: 72, height: 30, borderRadius: 15 }} />
      </div>
    </div>
  );
}

/** Renders N skeleton cards in a responsive grid with staggered fade-in. */
export function SkeletonGrid({
  count = 3,
  variant = 'card',
  children,
}: {
  count?: number;
  variant?: 'card' | 'stat' | 'list-item';
  children?: ReactNode;
}) {
  return (
    <div className="grid-auto-fit">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <SkeletonCard variant={variant} />
        </motion.div>
      ))}
      {children}
    </div>
  );
}

/** Skeleton for ATS-style analysis results */
export function SkeletonAnalysis() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: 8 }}
    >
      {/* Score circle + verdict */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="80%" height={14} />
          <SkeletonLine width="50%" height={10} style={{ marginTop: 10 }} />
        </div>
      </div>
      {/* Keyword pills */}
      <SkeletonLine width="30%" height={10} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {[60, 80, 50, 70, 90, 55].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 26, borderRadius: 13 }} />
        ))}
      </div>
      {/* Suggestions */}
      <SkeletonLine width="35%" height={10} style={{ marginBottom: 12 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8, width: '100%' }} />
      ))}
    </motion.div>
  );
}
