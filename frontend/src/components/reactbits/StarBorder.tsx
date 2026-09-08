import React from 'react';

interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
}

export default function StarBorder({
  as: Component = 'button',
  className = '',
  color = 'var(--accent)',
  speed = '4s',
  children,
  style,
  ...props
}: StarBorderProps) {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: '1px',
        overflow: 'hidden',
        borderRadius: 14,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      <div
        className="star-border-glow"
        style={{
          position: 'absolute',
          width: '300%',
          height: '300%',
          opacity: 0.8,
          top: '-100%',
          left: '-100%',
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${color} 60deg, transparent 120deg)`,
          animation: `starBorderSpin ${speed} linear infinite`,
          pointerEvents: 'none',
        }}
      />
      <div
        className="star-border-inner"
        style={{
          position: 'relative',
          borderRadius: 13,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </Component>
  );
}
