import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
}: CountUpProps) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;

          setTimeout(() => {
            const startTime = performance.now();
            const startVal = from;
            const endVal = to;

            const update = (currentTime: number) => {
              const elapsed = (currentTime - startTime) / 1000;
              const progress = Math.min(elapsed / duration, 1);

              // Ease out quad/cubic
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const currentVal = startVal + (endVal - startVal) * easeOut;

              setValue(currentVal);

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                setValue(endVal);
              }
            };

            requestAnimationFrame(update);
          }, delay * 1000);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [to, from, duration, delay]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={`count-up ${className}`} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
