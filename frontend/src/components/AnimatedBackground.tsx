import React from 'react';
import GradientBlinds from './reactbits/GradientBlinds';
import { useTheme } from '../context/ThemeContext';

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        background: isDark ? '#070913' : '#fdf8ff',
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <GradientBlinds
          gradientColors={['#FF9FFC', '#5227FF']}
          angle={0}
          noise={0.3}
          blindCount={16}
          blindMinWidth={60}
          mouseDampening={0.15}
          mirrorGradient={false}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          distortAmount={0}
          shineDirection="left"
          lightMode={!isDark}
        />
      </div>

      {/* Atmospheric vignette ensuring crisp typography and elevated card contrast */}
      {isDark ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(7, 9, 19, 0.45) 0%, rgba(7, 9, 19, 0.85) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255, 255, 255, 0.35) 0%, rgba(253, 248, 255, 0.82) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
