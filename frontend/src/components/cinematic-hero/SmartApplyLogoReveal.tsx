import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
  scrollYProgress: MotionValue<number>;
}

export default function SmartApplyLogoReveal({ scrollYProgress }: Props) {
  // ── Scene 5 & 6: Logo Reveal Progress (0.22 -> 0.68) ──────────────────────
  // Scale with slight organic overshoot
  const logoScale = useTransform(
    scrollYProgress,
    [0.22, 0.55, 0.68],
    [0.55, 1.05, 1.0],
    { clamp: true }
  );

  // Fade in smoothly as typography separates
  const logoOpacity = useTransform(
    scrollYProgress,
    [0.22, 0.44],
    [0, 1],
    { clamp: true }
  );

  // Upward motion into center (+50px -> 0px)
  const logoY = useTransform(
    scrollYProgress,
    [0.22, 0.62],
    [50, 0],
    { clamp: true }
  );

  // Settling rotation (-4° -> 0°)
  const logoRotate = useTransform(
    scrollYProgress,
    [0.22, 0.62],
    [-4, 0],
    { clamp: true }
  );

  // Ambient purple/magenta backglow behind logo
  const glowOpacity = useTransform(
    scrollYProgress,
    [0.28, 0.55, 0.85, 1],
    [0, 0.9, 1, 0.85],
    { clamp: true }
  );

  const glowScale = useTransform(
    scrollYProgress,
    [0.28, 0.68],
    [0.75, 1.2],
    { clamp: true }
  );

  // ── Scene 7: Wordmark & Tagline Reveal (0.58 -> 0.88) ────────────────────
  const wordmarkOpacity = useTransform(
    scrollYProgress,
    [0.58, 0.78],
    [0, 1],
    { clamp: true }
  );

  const wordmarkY = useTransform(
    scrollYProgress,
    [0.58, 0.78],
    [22, 0],
    { clamp: true }
  );

  const taglineOpacity = useTransform(
    scrollYProgress,
    [0.68, 0.86],
    [0, 0.95],
    { clamp: true }
  );

  const taglineY = useTransform(
    scrollYProgress,
    [0.68, 0.86],
    [14, 0],
    { clamp: true }
  );

  return (
    <div className="cinematic-logo-container">
      {/* ── Background Dynamic Ambient Violet/Magenta Glow Halo ───────── */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'clamp(280px, 42vw, 480px)',
          height: 'clamp(280px, 42vw, 480px)',
          opacity: glowOpacity,
          scale: glowScale,
          background:
            'radial-gradient(circle, rgba(224, 0, 214, 0.45) 0%, rgba(155, 0, 255, 0.35) 30%, rgba(48, 0, 107, 0.18) 60%, transparent 72%)',
          filter: 'blur(54px)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* ── Animated Pulsing Energy Ripple Ring ───────────────────────── */}
      <motion.div
        animate={{
          scale: [0.9, 1.22, 0.9],
          opacity: [0.35, 0.75, 0.35],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'clamp(200px, 28vw, 320px)',
          height: 'clamp(200px, 28vw, 320px)',
          border: '1.5px solid rgba(255, 53, 232, 0.4)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 35px rgba(224, 0, 214, 0.45), inset 0 0 25px rgba(155, 0, 255, 0.3)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* ── Logo Container with Floating Levitation ──────────────────── */}
      <motion.div
        style={{
          scale: logoScale,
          opacity: logoOpacity,
          y: logoY,
          rotate: logoRotate,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="will-change-transform"
      >
        {/* Idle floating breathing effect */}
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3.2,
            ease: 'easeInOut',
          }}
          style={{ position: 'relative' }}
        >
          <img
            src="/logo.png"
            alt="SkillHub Logo"
            className="cinematic-logo-img"
            loading="eager"
            decoding="async"
            style={{
              filter:
                'drop-shadow(0 16px 45px rgba(155, 0, 255, 0.5)) drop-shadow(0 0 25px rgba(255, 53, 232, 0.4))',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── Scene 7: Wordmark ── */}
      <motion.div
        style={{
          opacity: wordmarkOpacity,
          y: wordmarkY,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2 className="cinematic-wordmark">
          SkillHub
        </h2>

        {/* ── Scene 7: Tagline ── */}
        <motion.p
          style={{
            opacity: taglineOpacity,
            y: taglineY,
          }}
          className="cinematic-tagline"
        >
          STUDENT LEARNING & CAREER INTELLIGENCE
        </motion.p>
      </motion.div>
    </div>
  );
}
