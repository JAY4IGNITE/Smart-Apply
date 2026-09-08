import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showParticles?: boolean;
  speed?: number;
  style?: React.CSSProperties;
}

export default function AuroraBackground({
  children,
  className = '',
  showParticles = true,
  speed = 1,
  style,
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smooth spring-damped mouse tracker for reactive glow
  const springConfig = { damping: 25, stiffness: 120, mass: 0.8 };
  const mouseX = useSpring(-500, springConfig);
  const mouseY = useSpring(-500, springConfig);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
      if (!isHovered) setIsHovered(true);
    },
    [mouseX, mouseY, isHovered]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Floating ambient light particles (canvas)
  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 28000), 55);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.35 * speed,
      vy: (Math.random() - 0.5) * 0.35 * speed,
      alpha: Math.random() * 0.5 + 0.15,
      alphaTarget: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.015 + 0.005,
      hue: Math.random() > 0.5 ? 220 : 260, // Blue & purple tints
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.alpha += (p.alphaTarget - p.alpha) * p.pulseSpeed;
        if (Math.abs(p.alpha - p.alphaTarget) < 0.02) {
          p.alphaTarget = Math.random() * 0.6 + 0.15;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${p.alpha})`;
        ctx.shadowBlur = p.size * 5;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 65%, ${p.alpha * 0.8})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [showParticles, speed]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`aurora-background-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    >
      {/* ── Layer 1: Core Ethereal Aurora Fluid Streams ── */}
      <div
        className="aurora-streams"
        style={{
          position: 'absolute',
          inset: '-20%',
          filter: 'blur(75px)',
          opacity: 0.85,
          mixBlendMode: 'normal',
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Aurora Stream 1 - Electric Indigo / Cyan Sweep */}
        <div
          className="aurora-blob aurora-blob-1"
          style={{
            position: 'absolute',
            top: '8%',
            left: '18%',
            width: '65vw',
            height: '48vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79, 110, 247, 0.42) 0%, rgba(56, 189, 248, 0.22) 45%, transparent 70%)',
            animation: 'auroraFloat1 18s ease-in-out infinite alternate',
          }}
        />

        {/* Aurora Stream 2 - Violet / Magenta Depth Bloom */}
        <div
          className="aurora-blob aurora-blob-2"
          style={{
            position: 'absolute',
            top: '15%',
            right: '12%',
            width: '58vw',
            height: '52vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.38) 0%, rgba(217, 70, 239, 0.16) 50%, transparent 72%)',
            animation: 'auroraFloat2 22s ease-in-out infinite alternate',
          }}
        />

        {/* Aurora Stream 3 - Cyan / Emerald Horizon Ribbon */}
        <div
          className="aurora-blob aurora-blob-3"
          style={{
            position: 'absolute',
            top: '40%',
            left: '28%',
            width: '60vw',
            height: '42vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.25) 50%, transparent 70%)',
            animation: 'auroraFloat3 26s ease-in-out infinite alternate',
          }}
        />

        {/* Aurora Stream 4 - Warm Amber / Rose Accent Glow */}
        <div
          className="aurora-blob aurora-blob-4"
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '75vw',
            height: '35vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.18) 45%, transparent 70%)',
            animation: 'auroraPulse 14s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* ── Layer 2: Interactive Mouse Aurora Spotlight ── */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 580,
          height: 580,
          borderRadius: '50%',
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(56, 189, 248, 0.12) 40%, transparent 70%)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Floating Ambient Celestial Stardust Particles ── */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.75,
            maskImage: 'radial-gradient(ellipse 85% 70% at 50% 35%, #000 60%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 70% at 50% 35%, #000 60%, transparent 100%)',
          }}
        />
      )}

      {/* ── Layer 4: Vignette & Soft Gradient Mesh Overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 10%, transparent 40%, var(--paper) 95%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {children}
    </div>
  );
}
