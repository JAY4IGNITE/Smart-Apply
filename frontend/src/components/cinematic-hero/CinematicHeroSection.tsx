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
  const splitLeftX = useTransform(smoothProgress, [0.04, 0.44], [0, -180]);
  const splitRightX = useTransform(smoothProgress, [0.04, 0.44], [0, 180]);

  // Typography vertical drift & smooth fade-out as center clears
  const headingY = useTransform(smoothProgress, [0.04, 0.42], [0, -45]);
  const headingOpacity = useTransform(smoothProgress, [0.05, 0.26, 0.46], [1, 0.9, 0]);
  const headingScale = useTransform(smoothProgress, [0.05, 0.45], [1, 0.94]);

  // Scene 4: Radial vignette that intensifies to focus gaze into center
  const vignetteOpacity = useTransform(
    smoothProgress,
    [0.08, 0.35, 0.65, 1],
    [0.1, 0.55, 0.88, 0.75]
  );

  // Subtle background atmospheric violet glow that expands during Scene 4-6
  const bgVioletGlowOpacity = useTransform(
    smoothProgress,
    [0, 0.25, 0.6, 0.95],
    [0.2, 0.45, 0.75, 0.5]
  );

  // Bottom scroll cue opacity
  const scrollCueOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

  // Bottom final action button reveal in Scene 7
  const ctaOpacity = useTransform(smoothProgress, [0.82, 0.94], [0, 1]);
  const ctaY = useTransform(smoothProgress, [0.82, 0.94], [20, 0]);

  // ── Auto-Play Cinematic Preview Feature ───────────────────────────────
  useEffect(() => {
    if (!isPlaying || !sectionRef.current) return;

    let startTime: number | null = null;
    const duration = 7500; // 7.5s cinematic cycle
    const startScroll = window.scrollY;
    const sectionTop = sectionRef.current.offsetTop;
    const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;
    const targetScroll = sectionTop + sectionHeight;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth custom cubic easing
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
        // Reset to top of section if at the end
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
      className="relative w-full h-[360vh] sm:h-[380vh] md:h-[400vh] bg-[#050308] text-[#F7F2FF] select-none"
    >
      {/* ── Sticky Viewport ─────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden bg-[#050308]">

        {/* ── Layer 0: Pure Deep Black & Soft Background Purple Light ─────── */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-[#050308]" />

        {/* Deep Violet / Electric Purple Ambient Background Radial Gradients */}
        <motion.div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ opacity: bgVioletGlowOpacity }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[1000px] h-[70vh] rounded-full"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(118, 33, 176, 0.28) 0%, rgba(48, 0, 107, 0.18) 45%, transparent 70%)',
              filter: 'blur(70px)',
            }}
          />
        </motion.div>

        {/* ── Layer 1: Atmospheric Canvas Particles (Violet/Magenta/Lavender) */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <CinematicParticleCanvas />
        </div>

        {/* ── Layer 2: Floating Ambient Parallax Orbs (Violet & Magenta) ──── */}
        <FloatingVioletOrbs scrollYProgress={smoothProgress} />

        {/* ── Layer 3: Radial Vignette Overlay (Focuses Gaze into Center) ─── */}
        <motion.div
          className="absolute inset-0 z-[6] pointer-events-none"
          style={{
            opacity: vignetteOpacity,
            background:
              'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(5, 3, 8, 0.4) 40%, rgba(5, 3, 8, 0.95) 100%)',
          }}
        />

        {/* ── Top Bar: Brand Pill & Interactive Cinematic Toggle ─────────── */}
        <header className="relative z-30 w-full px-6 sm:px-10 pt-6 sm:pt-8 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SmartApply"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
            <span
              className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#F7F2FF] uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              SmartApply
            </span>
          </div>

          {/* Cinematic Play / Pause Mode Control */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleCinematicPlay}
              type="button"
              className="flex items-center gap-2 text-[#EAD7FF] text-[11px] sm:text-xs font-medium uppercase tracking-wider px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#30006B]/30 hover:bg-[#7621B0]/30 border border-[#9B00FF]/30 hover:border-[#E000D6]/50 transition-all duration-300 shadow-[0_0_20px_rgba(155,0,255,0.15)] cursor-pointer backdrop-blur-md active:scale-95"
              title={isPlaying ? 'Pause auto-play preview' : 'Play cinematic reveal animation'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#FF35E8]" />
                  <span>Pause Reveal</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#FF35E8] fill-[#FF35E8]" />
                  <span>Cinematic Play</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── Center Stage: Split Typography & Logo Reveal ────────────────── */}
        <div className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 overflow-visible">

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
            className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-8"
          >
            <div className="w-full max-w-7xl flex justify-between items-center text-center">
              {/* SMART — glides left */}
              <motion.div
                style={{ x: splitLeftX }}
                className="flex-1 flex justify-start sm:justify-center will-change-transform"
              >
                <h1
                  className="font-black uppercase tracking-tight text-[#F7F2FF] leading-none select-none text-left"
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: 'clamp(3rem, 11vw, 10.5rem)',
                    textShadow: '0 4px 40px rgba(118, 33, 176, 0.35)',
                  }}
                >
                  Smart
                </h1>
              </motion.div>

              {/* Central Gap Space that expands */}
              <div className="w-[4vw] sm:w-[8vw] md:w-[12vw] shrink-0" />

              {/* APPLY — glides right */}
              <motion.div
                style={{ x: splitRightX }}
                className="flex-1 flex justify-end sm:justify-center will-change-transform"
              >
                <h1
                  className="font-black uppercase tracking-tight text-[#F7F2FF] leading-none select-none text-right"
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: 'clamp(3rem, 11vw, 10.5rem)',
                    textShadow: '0 4px 40px rgba(118, 33, 176, 0.35)',
                  }}
                >
                  Apply
                </h1>
              </motion.div>
            </div>
          </motion.div>

          {/* ════════════════════════════════════════════════════════════════
              SCENE 5, 6, 7: EXACT SMARTAPPLY LOGO & IDENTITY REVEAL
              Scales 68% -> 100%, tilts -3.5° -> 0°, wordmark & tagline reveal
              ════════════════════════════════════════════════════════════════ */}
          <div className="relative z-20 flex items-center justify-center w-full">
            <SmartApplyLogoReveal scrollYProgress={smoothProgress} />
          </div>

          {/* ── Scene 7 Final Call to Action Buttons (Bottom of Stage) ───── */}
          <motion.div
            style={{
              opacity: ctaOpacity,
              y: ctaY,
            }}
            className="absolute bottom-16 sm:bottom-20 z-30 flex flex-col sm:flex-row items-center gap-3.5 pointer-events-auto"
          >
            <button
              onClick={handleScrollToLandingContent}
              type="button"
              className="px-6 py-3 rounded-full font-semibold text-xs sm:text-sm tracking-wide text-white bg-gradient-to-r from-[#7621B0] via-[#9B00FF] to-[#E000D6] hover:brightness-110 shadow-[0_0_30px_rgba(155,0,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Explore Platform</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </motion.div>
        </div>

        {/* ── Bottom Section Cue: Scroll Indicator ──────────────────────── */}
        <footer className="relative z-30 w-full pb-7 sm:pb-8 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            style={{ opacity: scrollCueOpacity }}
            className="flex flex-col items-center gap-2"
          >
            <span
              className="text-[#EAD7FF]/60 text-[9px] sm:text-[10px] uppercase font-medium tracking-[0.34em]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Scroll to reveal
            </span>
            <motion.div
              className="w-[1px] h-9 sm:h-12 bg-gradient-to-b from-transparent via-[#9B00FF] to-transparent"
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
          </motion.div>
        </footer>
      </div>
    </section>
  );
}
