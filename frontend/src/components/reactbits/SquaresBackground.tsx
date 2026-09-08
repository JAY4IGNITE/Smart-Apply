import React, { useRef, useEffect } from 'react';

interface SquaresBackgroundProps {
  direction?: 'diagonal' | 'up' | 'down' | 'left' | 'right';
  speed?: number;
  squareSize?: number;
  borderColor?: string;
  hoverFillColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SquaresBackground({
  direction = 'diagonal',
  speed = 0.5,
  squareSize = 40,
  borderColor = 'var(--border)',
  hoverFillColor = 'var(--accent-soft)',
  className = '',
  style,
}: SquaresBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let gridOffset = { x: 0, y: 0 };

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (direction === 'diagonal') {
        gridOffset.x = (gridOffset.x - speed) % squareSize;
        gridOffset.y = (gridOffset.y - speed) % squareSize;
      } else if (direction === 'down') {
        gridOffset.y = (gridOffset.y + speed) % squareSize;
      } else if (direction === 'up') {
        gridOffset.y = (gridOffset.y - speed) % squareSize;
      } else if (direction === 'right') {
        gridOffset.x = (gridOffset.x + speed) % squareSize;
      } else if (direction === 'left') {
        gridOffset.x = (gridOffset.x - speed) % squareSize;
      }

      const startX = Math.floor(gridOffset.x) - squareSize;
      const startY = Math.floor(gridOffset.y) - squareSize;

      // Extract colors from computed style or fallback
      const compBorder = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e4e5e9';
      const compAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3452f4';

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = compBorder;

      const numCols = Math.ceil(canvas.width / squareSize) + 2;
      const numRows = Math.ceil(canvas.height / squareSize) + 2;

      for (let i = 0; i < numCols; i++) {
        for (let j = 0; j < numRows; j++) {
          const sqX = startX + i * squareSize;
          const sqY = startY + j * squareSize;

          const dist = Math.hypot(mouseRef.current.x - (sqX + squareSize / 2), mouseRef.current.y - (sqY + squareSize / 2));

          if (dist < 140) {
            const alpha = Math.max(0, (1 - dist / 140) * 0.28);
            ctx.fillStyle = compAccent;
            ctx.globalAlpha = alpha;
            ctx.fillRect(sqX, sqY, squareSize, squareSize);
            ctx.globalAlpha = 1;
          }

          ctx.strokeRect(sqX, sqY, squareSize, squareSize);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [direction, speed, squareSize]);

  return (
    <canvas
      ref={canvasRef}
      className={`squares-background ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.7,
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 65%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 65%, transparent 100%)',
        ...style,
      }}
    />
  );
}
