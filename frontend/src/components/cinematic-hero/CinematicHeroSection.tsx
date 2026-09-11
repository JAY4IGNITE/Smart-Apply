import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { Play, Pause, ChevronDown } from 'lucide-react';
import CinematicParticleCanvas from './CinematicParticleCanvas';
import FloatingVioletOrbs from './FloatingVioletOrbs';
import SmartApplyLogoReveal from './SmartApplyLogoReveal';

interface Props {
  onExploreClick?: () => void;
}

export default function CinematicHeroSection({ onExploreClick }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // ── Scroll progress over the 380vh runway ─────────────────────────────
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Smooth out progress slightly for jitter-free animation interpolation
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  // Track if user started scrolling
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest > 0.015 && !hasScrolled) {
      setHasScrolled(true);
    } else if (latest <= 0.015 && hasScrolled) {
      setHasScrolled(false);
    }
  });

  // ── Multi-layer Parallax & Split Transforms ───────────────────────────

  // Scene 2 & 4: Split typography: "SMART" moves left, "APPLY" moves right
  const splitLeftX = useTransform(smoothProgress, [0.03, 0.42], [0, -180]);
  const splitRightX = useTransform(smoothProgress, [0.03, 0.42], [0, 180]);

  // Typography vertical drift & smooth fade-out as center clears
  const headingY = useTransform(smoothProgress, [0.03, 0.40], [0, -40]);
  const headingOpacity = useTransform(smoothProgress, [0.04, 0.24, 0.44], [1, 0.95, 0]);
  const headingScale = useTransform(smoothProgress, [0.04, 0.44], [1, 0.94]);

  // Scene 4: Radial vignette that intensifies to focus gaze into center
  const vignetteOpacity = useTransform(
    smoothProgress,
    [0.06, 0.32, 0.65, 1],
    [0.1, 0.55, 0.88, 0.75]
  );

  // Subtle background atmospheric violet glow that expands during Scene 4-6
  const bgVioletGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.25, 0.6, 0.95],
    [0.2, 0.45, 0.75, 0.5]
  );

  // Top bar fade-out as logo settles and site transitions
  const topBarOpacity = useTransform(smoothProgress, [0.65, 0.82], [1, 0]);

  // Bottom scroll cue opacity
  const scrollCueOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  // Bottom final action button reveal in Scene 7
  const ctaOpacity = useTransform(smoothProgress, [0.80, 0.94], [0, 1]);
  const ctaY = useTransform(smoothProgress, [0.80, 0.94], [20, 0]);

  // ── Auto-Play Cinematic Preview Feature ───────────────────────────────
  useEffect(() => {
    if (!isPlaying || !sectionRef.current) return;

    let startTime: number | null = null;
    const duration = 7000; // 7s cinematic cycle
    const startScroll = window.scrollY;
    const sectionTop = sectionRef.current.offsetTop;
    const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;
    const targetScroll = sectionTop + sectionHeight;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth cubic easing
      const easeProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startScroll + (targetScroll - startScroll) * easeProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isPlaying]);

  const toggleCinematicPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (sectionRef.current) {
        const sectionTop = sectionRef.current.offsetTop;
        const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;
        if (window.scrollY >= sectionTop + sectionHeight - 50) {
          window.scrollTo({ top: sectionTop, behavior: 'instant' as ScrollBehavior });
        }
      }
      setIsPlaying(true);
    }
  };

  const handleScrollToLandingContent = () => {
    if (onExploreClick) {
      onExploreClick();
    } else if (sectionRef.current) {
      const target = sectionRef.current.offsetTop + sectionRef.current.offsetHeight;
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="cinematic-hero"
      className="cinematic-hero-section"
    >
      {/* ── Sticky Viewport ─────────────────────────────────────────────── */}
      <div className="cinematic-hero-sticky">

        {/* ── Layer 0: Pure Deep Black & Soft Background Purple Light ─────── */}
        <div
          className="cinematic-layer"
          style={{ backgroundColor: '#050308', zIndex: 0 }}
        />

        {/* Deep Violet / Electric Purple Ambient Background Radial Gradients */}
        <motion.div
          className="cinematic-layer"
          style={{ opacity: bgVioletGlowOpacity, zIndex: 1 }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '85vw',
              maxWidth: 1100,
              height: '70vh',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(118, 33, 176, 0.3) 0%, rgba(48, 0, 107, 0.18) 45%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
        </motion.div>

        {/* ── Layer 1: Atmospheric Canvas Particles (Violet/Magenta/Lavender) */}
        <div className="cinematic-layer" style={{ zIndex: 2 }}>
          <CinematicParticleCanvas />
        </div>

        {/* ── Layer 2: Floating Ambient Parallax Orbs (Violet & Magenta) ──── */}
        <FloatingVioletOrbs scrollYProgress={smoothProgress} />

        {/* ── Layer 3: Radial Vignette Overlay (Focuses Gaze into Center) ─── */}
        <motion.div
          className="cinematic-layer"
          style={{
            zIndex: 6,
            opacity: vignetteOpacity,
            background:
              'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(5, 3, 8, 0.4) 40%, rgba(5, 3, 8, 0.96) 100%)',
          }}
        />

        {/* ── Top Bar: Brand Pill & Interactive Cinematic Toggle ─────────── */}
        <motion.header className="cinematic-top-bar" style={{ opacity: topBarOpacity, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="SkillHub"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#F7F2FF',
                textTransform: 'uppercase',
              }}
            >
              SkillHub
            </span>
          </div>

          {/* Cinematic Play / Pause Mode Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleCinematicPlay}
              type="button"
              className="cinematic-play-btn"
              title={isPlaying ? 'Pause auto-play preview' : 'Play cinematic reveal animation'}
            >
              {isPlaying ? (
                <>
                  <Pause size={13} color="#FF35E8" />
                  <span>Pause Reveal</span>
                </>
              ) : (
                <>
                  <Play size={13} color="#FF35E8" fill="#FF35E8" />
                  <span>Cinematic Play</span>
                </>
              )}
            </button>
          </div>
        </motion.header>

        {/* ── Center Stage: Split Typography & Logo Reveal ────────────────── */}
        <div className="cinematic-center-stage">

          {/* ════════════════════════════════════════════════════════════════
              SCENE 2 & 4: TYPOGRAPHY ENTRANCE & PARALLAX SEPARATION
              "SMART" glides left, "APPLY" glides right, center clears
              ════════════════════════════════════════════════════════════════ */}
          <motion.div
            style={{
              opacity: headingOpacity,
              y: headingY,
              scale: headingScale,
            }}
            className="cinematic-typography-container"
          >
            <div className="cinematic-typography-row">
              {/* SKILL — glides left */}
              <motion.div
                style={{ x: splitLeftX, flex: 1, display: 'flex', justifyContent: 'flex-start' }}
                className="will-change-transform"
              >
                <h1 className="cinematic-heading-word">
                  Skill
                </h1>
              </motion.div>

              {/* Central Gap Space that expands */}
              <div style={{ width: '6vw', flexShrink: 0 }} />

              {/* HUB — glides right */}
              <motion.div
                style={{ x: splitRightX, flex: 1, display: 'flex', justifyContent: 'flex-end' }}
                className="will-change-transform"
              >
                <h1 className="cinematic-heading-word">
                  Hub
                </h1>
              </motion.div>
            </div>
          </motion.div>

          {/* ════════════════════════════════════════════════════════════════
              SCENE 5, 6, 7: EXACT SMARTAPPLY LOGO & IDENTITY REVEAL
              Scales 68% -> 100%, tilts -3.5° -> 0°, wordmark & tagline reveal
              ════════════════════════════════════════════════════════════════ */}
          <div style={{ position: 'relative', zIndex: 25, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SmartApplyLogoReveal scrollYProgress={smoothProgress} />
          </div>

          {/* ── Scene 7 Final Call to Action Button (Bottom of Stage) ───── */}
          <motion.div
            style={{
              opacity: ctaOpacity,
              y: ctaY,
              position: 'absolute',
              bottom: 40,
              zIndex: 35,
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={handleScrollToLandingContent}
              type="button"
              className="cinematic-explore-btn"
            >
              <span>Explore Platform</span>
              <ChevronDown size={16} />
            </button>
          </motion.div>
        </div>

        {/* ── Bottom Section Cue: Scroll Indicator ──────────────────────── */}
        <footer className="cinematic-bottom-bar">
          <motion.div
            style={{
              opacity: scrollCueOpacity,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                color: 'rgba(234, 215, 255, 0.65)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.34em',
                textTransform: 'uppercase',
              }}
            >
              Scroll to reveal
            </span>
            <motion.div
              style={{
                width: 1,
                height: 40,
                background: 'linear-gradient(180deg, transparent 0%, #9B00FF 50%, transparent 100%)',
              }}
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
          </motion.div>
        </footer>
      </div>
    </section>
  );
}
