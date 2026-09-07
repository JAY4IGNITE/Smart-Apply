import React, { useRef, useState, type MouseEvent } from 'react';
import { motion, useSpring } from 'framer-motion';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  perspective?: number;
  glareEffect?: boolean;
  style?: React.CSSProperties;
}

export default function TiltedCard({
  children,
  className = '',
  maxTilt = 10,
  scale = 1.015,
  perspective = 1000,
  glareEffect = true,
  style,
}: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const cardScale = useSpring(1, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    rotateX.set(tiltX);
    rotateY.set(tiltY);

    if (glareEffect) {
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    cardScale.set(scale);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    cardScale.set(1);
  };

  return (
    <div
      style={{
        perspective: `${perspective}px`,
        display: 'inline-block',
        width: '100%',
      }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`tilted-card ${className}`}
        style={{
          rotateX,
          rotateY,
          scale: cardScale,
          transformStyle: 'preserve-3d',
          position: 'relative',
          ...style,
        }}
      >
        {children}

        {glareEffect && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              zIndex: 10,
              opacity: isHovered ? 0.35 : 0,
              transition: 'opacity 0.3s ease',
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
