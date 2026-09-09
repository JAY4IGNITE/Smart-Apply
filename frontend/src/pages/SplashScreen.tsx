import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/smartapply-transition.css';

function makeBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  function sampleX(t: number) {
    return ((ax * t + bx) * t + cx) * t;
  }
  function sampleY(t: number) {
    return ((ay * t + by) * t + cy) * t;
  }
  function derivX(t: number) {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  return function solve(x: number) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleX(t) - x;
      if (Math.abs(currentX) < 1e-6) break;
      const dX = derivX(t);
      if (Math.abs(dX) < 1e-6) break;
      t -= currentX / dX;
    }
    return sampleY(Math.max(0, Math.min(1, t)));
  };
}

const easeOutCinematic = makeBezier(0.16, 1.0, 0.3, 1.0);
const easeInCinematic = makeBezier(0.77, 0.0, 0.18, 1.0);
const easeInOutSmooth = makeBezier(0.65, 0.0, 0.35, 1.0);

const T_S_ENTER = 260;
const T_EMERGE_STARTS = [0, 280, 410, 540, 670, 800, 930, 1060, 1190, 1320];
const T_EMERGE_SPAN = 360;
const T_COLLAPSE_STARTS = [0, 2420, 2360, 2300, 2240, 2180, 2120, 2060, 2000, 1950];
const T_COLLAPSE_SPAN = 240;

interface SplashScreenProps {
  onComplete?: () => void;
  standalone?: boolean;
}

export default function SplashScreen({ onComplete, standalone = true }: SplashScreenProps) {
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const wordTrackRef = useRef<HTMLDivElement>(null);
  const symbolPortalRef = useRef<HTMLDivElement>(null);
  const transitionFlashRef = useRef<HTMLDivElement>(null);

  const timeoutsRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const handleFinished = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (onComplete) {
      onComplete();
    } else {
      navigate('/landing', { replace: true });
    }
  }, [navigate, onComplete]);

  useEffect(() => {
    const stageContainer = stageRef.current;
    const wordTrack = wordTrackRef.current;
    const symbolPortal = symbolPortalRef.current;
    const transitionFlash = transitionFlashRef.current;

    if (!stageContainer || !wordTrack || !symbolPortal || !transitionFlash) return;

    const letterSlots: HTMLElement[] = [];
    const letterChars: HTMLElement[] = [];
    for (let i = 0; i < 10; i++) {
      const slot = document.getElementById('slot-' + i);
      const char = document.getElementById('char-' + i);
      if (slot && char) {
        letterSlots.push(slot);
        letterChars.push(char);
      }
    }

    if (letterSlots.length !== 10 || letterChars.length !== 10) return;

    const slotWidths = new Array(10).fill(0);
    let totalWordWidth = 0;
    let sWidth = 0;
    let sAnchorOffset = 0;

    function measureGeometry() {
      if (!wordTrack) return;
      wordTrack.style.transform = 'none';
      for (let i = 0; i < 10; i++) {
        letterSlots[i].style.transform = 'none';
        letterChars[i].style.transform = 'none';
        letterSlots[i].style.opacity = i === 0 ? '1' : '0';
      }

      // Responsive clamping
      const maxAllowed = window.innerWidth * 0.90;
      const currentTrackWidth = wordTrack.scrollWidth;
      if (currentTrackWidth > maxAllowed && currentTrackWidth > 0) {
        const curSize = parseFloat(window.getComputedStyle(wordTrack).fontSize);
        const scaled = Math.floor(curSize * (maxAllowed / currentTrackWidth));
        wordTrack.style.fontSize = Math.max(scaled, 28) + 'px';
      }

      totalWordWidth = 0;
      for (let i = 0; i < 10; i++) {
        const rect = letterSlots[i].getBoundingClientRect();
        slotWidths[i] = rect.width;
        totalWordWidth += rect.width;
      }
      sWidth = slotWidths[0];
      sAnchorOffset = (totalWordWidth - sWidth) / 2;
    }

    let animStartTime: number | null = null;

    function triggerForwardLogoTransition() {
      // Fade out S cleanly
      letterChars[0].style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      letterChars[0].style.transform = 'scale(0.5)';
      letterChars[0].style.opacity = '0';

      // Reveal real logo with forward zoom entrance
      symbolPortal?.classList.remove('forward-surge');
      symbolPortal?.classList.add('forward-entrance');

      const t1 = window.setTimeout(() => {
        symbolPortal?.classList.remove('forward-entrance');
        symbolPortal?.classList.add('forward-surge');

        // Flash
        transitionFlash?.classList.add('trigger');
        const t2 = window.setTimeout(() => {
          transitionFlash?.classList.remove('trigger');
        }, 250);
        timeoutsRef.current.push(t2);

        // Completion hook and callback
        const t3 = window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('smartapply:transition-complete'));
          handleFinished();
        }, 550);
        timeoutsRef.current.push(t3);
      }, 800);
      timeoutsRef.current.push(t1);
    }

    function renderFrame(now: number) {
      if (!animStartTime) animStartTime = now;
      const elapsed = now - animStartTime;

      // 1. Anchor S Entrance
      const sProgress = Math.min(Math.max(elapsed / T_S_ENTER, 0), 1);
      const sEase = easeOutCinematic(sProgress);
      letterChars[0].style.opacity = Math.min(sEase * 1.3, 1).toFixed(4);
      letterChars[0].style.transform = `scale(${(0.92 + 0.08 * sEase).toFixed(4)})`;

      // 2. Emergence & Collapse for M through Y
      for (let i = 1; i < 10; i++) {
        let vis = 0;
        if (elapsed < T_EMERGE_STARTS[i]) {
          vis = 0;
        } else if (elapsed < 1950) {
          const p = Math.min((elapsed - T_EMERGE_STARTS[i]) / T_EMERGE_SPAN, 1);
          vis = easeOutCinematic(p);
        } else if (elapsed < T_COLLAPSE_STARTS[i]) {
          vis = 1;
        } else {
          const p = Math.min((elapsed - T_COLLAPSE_STARTS[i]) / T_COLLAPSE_SPAN, 1);
          vis = 1 - easeInCinematic(p);
        }

        const displacement = -100 * (1 - vis);
        // Only fade in as it emerges from behind the preceding letter (eliminates ghosting through S)
        const opacity = vis <= 0.28 ? 0 : Math.min(Math.max((vis - 0.28) / 0.72, 0), 1);

        letterSlots[i].style.opacity = opacity.toFixed(4);
        letterSlots[i].style.transform = `translate3d(${displacement.toFixed(2)}%, 0, 0)`;
      }

      // 3. Dynamic Centering: track glides continuously
      let containerShift = sAnchorOffset;
      if (elapsed < 280) {
        containerShift = sAnchorOffset;
      } else if (elapsed < 1550) {
        const p = (elapsed - 280) / 1270;
        containerShift = sAnchorOffset * (1 - easeInOutSmooth(p));
      } else if (elapsed < 1950) {
        containerShift = 0;
      } else if (elapsed < 2580) {
        const p = (elapsed - 1950) / 630;
        containerShift = sAnchorOffset * easeInOutSmooth(p);
      } else {
        containerShift = sAnchorOffset;
      }

      if (wordTrack) {
        wordTrack.style.transform = `translate3d(${containerShift.toFixed(2)}px, 0, 0)`;
      }

      // 4. Trigger Forward Logo Transition
      if (elapsed < 2600) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        triggerForwardLogoTransition();
      }
    }

    function play() {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      transitionFlash?.classList.remove('trigger');
      symbolPortal?.classList.remove('forward-entrance', 'forward-surge');

      measureGeometry();

      letterChars[0].style.transition = 'none';
      letterChars[0].style.opacity = '0';
      letterChars[0].style.transform = 'scale(0.92)';

      for (let i = 1; i < 10; i++) {
        letterSlots[i].style.opacity = '0';
        letterSlots[i].style.transform = 'translate3d(-100%, 0, 0)';
      }

      if (wordTrack) {
        wordTrack.style.transform = `translate3d(${sAnchorOffset.toFixed(2)}px, 0, 0)`;
      }

      animStartTime = null;
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }

    // Run on fonts ready or fallback
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(play);
    } else {
      const fallbackTimer = window.setTimeout(play, 60);
      timeoutsRef.current.push(fallbackTimer);
    }

    // Keyboard shortcut (Escape to skip)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinished();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Responsive resize handler
    let resizeTimer: number;
    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measureGeometry();
        if (wordTrack) {
          wordTrack.style.transform = `translate3d(${sAnchorOffset.toFixed(2)}px, 0, 0)`;
        }
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      timeoutsRef.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleFinished]);

  const content = (
    <div className="stage-container" id="stageContainer" ref={stageRef}>
      {/* SMARTAPPLY Word Track Stage */}
      <div className="word-stage" id="wordStage">
        <div className="word-track" id="wordTrack" ref={wordTrackRef}>
          <div className="letter-slot slot-s" id="slot-0"><span className="letter-char" id="char-0">S</span></div>
          <div className="letter-slot slot-m" id="slot-1"><span className="letter-char" id="char-1">M</span></div>
          <div className="letter-slot slot-a1" id="slot-2"><span className="letter-char" id="char-2">A</span></div>
          <div className="letter-slot slot-r" id="slot-3"><span className="letter-char" id="char-3">R</span></div>
          <div className="letter-slot slot-t" id="slot-4"><span className="letter-char" id="char-4">T</span></div>
          <div className="letter-slot slot-a2" id="slot-5"><span className="letter-char" id="char-5">A</span></div>
          <div className="letter-slot slot-p1" id="slot-6"><span className="letter-char" id="char-6">P</span></div>
          <div className="letter-slot slot-p2" id="slot-7"><span className="letter-char" id="char-7">P</span></div>
          <div className="letter-slot slot-l" id="slot-8"><span className="letter-char" id="char-8">L</span></div>
          <div className="letter-slot slot-y" id="slot-9"><span className="letter-char" id="char-9">Y</span></div>
        </div>
      </div>

      {/* Real Uploaded Website Logo Symbol (Forward Transition) */}
      <div className="symbol-portal" id="symbolPortal" ref={symbolPortalRef}>
        <div className="logo-emblem-wrap">
          <img
            className="logo-emblem-img"
            id="logoEmblemImg"
            src="/user_uploaded_logo.png"
            alt="SmartApply Real Logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>
      </div>

      {/* Flash Wave */}
      <div className="transition-flash" id="transitionFlash" ref={transitionFlashRef}></div>

      {/* Skip Intro Button */}
      <button
        type="button"
        onClick={handleFinished}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 100000,
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          padding: '7px 16px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.24)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }}
        aria-label="Skip intro animation"
      >
        Skip Intro ›
      </button>
    </div>
  );

  if (!standalone) {
    return content;
  }

  return <div className="smartapply-splash-body">{content}</div>;
}
