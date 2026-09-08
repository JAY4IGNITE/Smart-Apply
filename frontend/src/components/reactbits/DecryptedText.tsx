import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  animateOn?: 'view' | 'hover';
  revealDirection?: 'start' | 'end' | 'center';
  style?: React.CSSProperties;
}

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  characters = DEFAULT_CHARS,
  className = '',
  animateOn = 'view',
  revealDirection = 'start',
  style,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  const startAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    let iteration = 0;
    const textLen = text.length;

    const interval = setInterval(() => {
      setDisplayText(() => {
        return text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';

            let isRevealed = false;
            if (revealDirection === 'start') {
              isRevealed = index < (iteration / maxIterations) * textLen;
            } else if (revealDirection === 'end') {
              isRevealed = index >= textLen - (iteration / maxIterations) * textLen;
            } else {
              const center = textLen / 2;
              const distFromCenter = Math.abs(index - center);
              isRevealed = distFromCenter < (iteration / maxIterations) * (textLen / 2);
            }

            if (isRevealed) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('');
      });

      iteration += 1;
      if (iteration > maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimatedRef.current) {
              hasAnimatedRef.current = true;
              startAnimation();
            }
          });
        },
        { threshold: 0.1 }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }
  }, [text, animateOn]);

  return (
    <span
      ref={containerRef}
      className={`decrypted-text ${className}`}
      onMouseEnter={() => {
        if (animateOn === 'hover') startAnimation();
      }}
      style={{
        display: 'inline-block',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {displayText}
    </span>
  );
}
