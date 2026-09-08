import { motion, useTransform, type MotionValue } from 'framer-motion';

interface Props {
  scrollYProgress: MotionValue<number>;
}

export default function SmartApplyLogoReveal({ scrollYProgress }: Props) {
  // ── Scene 5 & 6: Logo Reveal Progress (0.38 -> 0.78) ──────────────────────
  // Scale from 68% up to 100%
  const logoScale = useTransform(
    scrollYProgress,
    [0.38, 0.72],
    [0.68, 1.0],
    { clamp: true }
  );

  // Fade in smoothly as typography separates
  const logoOpacity = useTransform(
    scrollYProgress,
    [0.38, 0.58],
    [0, 1],
    { clamp: true }
  );

  // Slight upward motion into center (+65px -> 0px)
  const logoY = useTransform(
    scrollYProgress,
    [0.38, 0.72],
    [65, 0],
    { clamp: true }
  );

  // Extremely subtle initial rotation settling cleanly to 0° (-3.5° -> 0°)
  const logoRotate = useTransform(
    scrollYProgress,
    [0.38, 0.72],
    [-3.5, 0],
    { clamp: true }
  );

  // Ambient purple/magenta backglow behind logo
  const glowOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.70, 0.92, 1],
    [0, 0.85, 0.95, 0.8],
    { clamp: true }
  );

  const glowScale = useTransform(
    scrollYProgress,
    [0.45, 0.75],
    [0.8, 1.15],
    { clamp: true }
  );

  // ── Scene 7: Wordmark & Tagline Reveal (0.68 -> 0.92) ────────────────────
  const wordmarkOpacity = useTransform(
    scrollYProgress,
    [0.68, 0.84],
    [0, 1],
    { clamp: true }
  );

  const wordmarkY = useTransform(
    scrollYProgress,
    [0.68, 0.84],
    [24, 0],
    { clamp: true }
  );

  const taglineOpacity = useTransform(
    scrollYProgress,
    [0.76, 0.90],
    [0, 0.92],
    { clamp: true }
  );

  const taglineY = useTransform(
    scrollYProgress,
    [0.76, 0.90],
    [16, 0],
    { clamp: true }
  );

  return (
    <div className="relative flex flex-col items-center justify-center text-center select-none pointer-events-none z-20">
      {/* ── Background Subtle Ambient Violet Glow (Held behind logo) ── */}
      <motion.div
        className="absolute pointer-events-none -z-10 rounded-full"
        style={{
          width: 'clamp(280px, 42vw, 480px)',
          height: 'clamp(280px, 42vw, 480px)',
          opacity: glowOpacity,
          scale: glowScale,
          background:
            'radial-gradient(circle, rgba(155, 0, 255, 0.42) 0%, rgba(224, 0, 214, 0.22) 38%, rgba(48, 0, 107, 0.12) 60%, transparent 72%)',
          filter: 'blur(52px)',
          transform: 'translate3d(0, -10px, 0)',
        }}
      />

      {/* ── Logo Container with Precise Geometry & Unaltered Colors ── */}
      <motion.div
        style={{
          scale: logoScale,
          opacity: logoOpacity,
          y: logoY,
          rotate: logoRotate,
        }}
        transition={{
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative flex items-center justify-center will-change-transform"
      >
        <img
          src="/logo.png"
          alt="SmartApply Logo"
          className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] md:w-[210px] md:h-[210px] object-contain drop-shadow-[0_12px_32px_rgba(155,0,255,0.28)]"
          style={{
            maxWidth: '100%',
            height: 'auto',
            aspectRatio: '1 / 1',
          }}
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* ── Scene 7: Wordmark ── */}
      <motion.div
        style={{
          opacity: wordmarkOpacity,
          y: wordmarkY,
        }}
        className="mt-6 sm:mt-8 flex flex-col items-center"
      >
        <h2
          className="font-bold tracking-[0.24em] text-[#F7F2FF] uppercase leading-none"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: 'clamp(1.75rem, 3.8vw, 3rem)',
            textShadow: '0 2px 20px rgba(155, 0, 255, 0.3)',
          }}
        >
          SmartApply
        </h2>

        {/* ── Scene 7: Tagline ── */}
        <motion.p
          style={{
            opacity: taglineOpacity,
            y: taglineY,
            fontFamily: "'Inter', sans-serif",
          }}
          className="mt-3 sm:mt-3.5 text-[#EAD7FF] font-medium tracking-[0.32em] sm:tracking-[0.36em] uppercase text-[10px] sm:text-xs md:text-sm"
        >
          AI-POWERED JOB APPLICATIONS
        </motion.p>
      </motion.div>
    </div>
  );
}
