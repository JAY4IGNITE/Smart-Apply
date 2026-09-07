import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * FullPageBackground — ReactBits "Dark Veil / Royal Ambient Waves"
 *
 * A bespoke, organic animated dark background featuring:
 * - Fluid undulating royal sapphire & twilight wave ribbons
 * - Subtle deep space micro-luminaries
 * - Reactive cursor refraction spotlight
 * - Tactile micro-grain film overlay (eliminates digital banding)
 * - Zero grid lines, zero cheesy AI rainbow gradients
 */
export default function FullPageBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.targetX = e.clientX;
    mouseRef.current.targetY = e.clientY;
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle atmospheric stars / micro-luminaries
    const starCount = Math.min(Math.floor((width * height) / 32000), 45);
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.35 + 0.08,
      speed: Math.random() * 0.008 + 0.003,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.006;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      // ── 1. Base Royal Obsidian Canvas ──
      ctx.fillStyle = '#070913';
      ctx.fillRect(0, 0, width, height);

      // ── 2. Atmospheric Ambient Light Swells ──
      // Top-center royal sapphire light pool
      const topGrad = ctx.createRadialGradient(
        width * 0.5,
        -height * 0.1,
        10,
        width * 0.5,
        -height * 0.1,
        Math.max(width * 0.7, 700)
      );
      topGrad.addColorStop(0, 'rgba(37, 99, 235, 0.16)');
      topGrad.addColorStop(0.4, 'rgba(30, 58, 138, 0.08)');
      topGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.0)');
      topGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height);

      // Mid-right deep indigo swell
      const midGrad = ctx.createRadialGradient(
        width * 0.85,
        height * 0.5,
        20,
        width * 0.85,
        height * 0.5,
        Math.max(width * 0.55, 550)
      );
      midGrad.addColorStop(0, 'rgba(30, 27, 75, 0.12)');
      midGrad.addColorStop(0.5, 'rgba(37, 99, 235, 0.04)');
      midGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = midGrad;
      ctx.fillRect(0, 0, width, height);

      // Lower-left subtle cobalt swell
      const lowGrad = ctx.createRadialGradient(
        width * 0.15,
        height * 0.8,
        20,
        width * 0.15,
        height * 0.8,
        Math.max(width * 0.5, 500)
      );
      lowGrad.addColorStop(0, 'rgba(29, 78, 216, 0.09)');
      lowGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.0)');
      lowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lowGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 3. Undulating Flowing Dark Veil Wave Ribbons ──
      const drawWaveRibbon = (
        yBaseRatio: number,
        amplitude: number,
        freq: number,
        phase: number,
        strokeColor: string,
        fillColor: string | CanvasGradient,
        lineWidth: number
      ) => {
        ctx.beginPath();
        const startY = height * yBaseRatio;
        ctx.moveTo(0, height);
        ctx.lineTo(0, startY);

        const step = 20;
        for (let x = 0; x <= width + step; x += step) {
          // Complex harmonic wave: primary + secondary wave
          const wave1 = Math.sin(x * freq + phase + time) * amplitude;
          const wave2 = Math.cos(x * freq * 0.5 - time * 0.7) * (amplitude * 0.45);
          const y = startY + wave1 + wave2;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        ctx.fillStyle = fillColor;
        ctx.fill();

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // Wave 1: Deep slow background wave (Midnight Navy)
      const waveGrad1 = ctx.createLinearGradient(0, height * 0.3, 0, height);
      waveGrad1.addColorStop(0, 'rgba(23, 37, 84, 0.18)');
      waveGrad1.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
      waveGrad1.addColorStop(1, 'transparent');
      drawWaveRibbon(
        0.38,
        75,
        0.0012,
        0,
        'rgba(59, 130, 246, 0.08)',
        waveGrad1,
        1.5
      );

      // Wave 2: Mid-ground luminous veil (Royal Sapphire)
      const waveGrad2 = ctx.createLinearGradient(0, height * 0.5, 0, height);
      waveGrad2.addColorStop(0, 'rgba(30, 58, 138, 0.14)');
      waveGrad2.addColorStop(0.6, 'rgba(15, 23, 42, 0.04)');
      waveGrad2.addColorStop(1, 'transparent');
      drawWaveRibbon(
        0.58,
        90,
        0.0016,
        Math.PI * 0.65,
        'rgba(96, 165, 250, 0.10)',
        waveGrad2,
        1.2
      );

      // Wave 3: Foreground subtle accent crest (Ice Cerulean)
      const waveGrad3 = ctx.createLinearGradient(0, height * 0.72, 0, height);
      waveGrad3.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
      waveGrad3.addColorStop(0.4, 'rgba(30, 58, 138, 0.03)');
      waveGrad3.addColorStop(1, 'transparent');
      drawWaveRibbon(
        0.75,
        60,
        0.002,
        Math.PI * 1.3,
        'rgba(147, 197, 253, 0.07)',
        waveGrad3,
        1
      );

      // ── 4. Interactive Cursor Illumination Spotlight ──
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > -200 && mx < width + 200 && my > -200 && my < height + 200) {
        const mouseGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 420);
        mouseGrad.addColorStop(0, 'rgba(59, 130, 246, 0.11)');
        mouseGrad.addColorStop(0.35, 'rgba(37, 99, 235, 0.04)');
        mouseGrad.addColorStop(0.7, 'rgba(30, 58, 138, 0.01)');
        mouseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mouseGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // ── 5. Atmospheric Starlight Luminaries ──
      stars.forEach((star) => {
        star.pulse += star.speed;
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(star.pulse));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 215, 255, ${currentAlpha})`;
        ctx.shadowBlur = star.size * 3;
        ctx.shadowColor = 'rgba(147, 197, 253, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0; // reset for performance
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: '#070913',
      }}
    >
      {/* ── High-Performance Canvas for Fluid Royal Waves & Stars ── */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* ── Tactile Micro-Texture Film Grain (Eliminates Banding) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.022,
          pointerEvents: 'none',
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Master Edge Studio Vignette (Softens outer boundary) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 65%, rgba(7, 9, 19, 0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </div>
  );
}
