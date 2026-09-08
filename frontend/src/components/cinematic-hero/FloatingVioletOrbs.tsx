import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

interface Props {
  scrollYProgress: MotionValue<number>;
}

interface OrbItem {
  id: string;
  x: string;
  y: string;
  size: number;
  scrollSpeed: number;
  mouseSpeed: number;
  gradient: string;
  blur: number;
  opacity: number;
  floatDuration: number;
  floatDelay: number;
}

const orbs: OrbItem[] = [
  // 1. Deep violet background glow top-left
  {
    id: 'orb-violet-tl',
    x: '10%',
    y: '16%',
    size: 340,
    scrollSpeed: 60,
    mouseSpeed: 18,
    gradient: 'radial-gradient(circle, rgba(118, 33, 176, 0.38) 0%, rgba(48, 0, 107, 0.18) 50%, transparent 70%)',
    blur: 65,
    opacity: 0.65,
    floatDuration: 18,
    floatDelay: 0,
  },
  // 2. Electric purple mid-depth orb right
  {
    id: 'orb-purple-r',
    x: '78%',
    y: '22%',
    size: 280,
    scrollSpeed: 95,
    mouseSpeed: 25,
    gradient: 'radial-gradient(circle, rgba(155, 0, 255, 0.32) 0%, rgba(118, 33, 176, 0.12) 55%, transparent 70%)',
    blur: 55,
    opacity: 0.55,
    floatDuration: 22,
    floatDelay: 2,
  },
  // 3. Magenta/pink atmospheric accent bottom-left
  {
    id: 'orb-magenta-bl',
    x: '8%',
    y: '70%',
    size: 320,
    scrollSpeed: 70,
    mouseSpeed: 15,
    gradient: 'radial-gradient(circle, rgba(224, 0, 214, 0.25) 0%, rgba(155, 0, 255, 0.12) 50%, transparent 70%)',
    blur: 60,
    opacity: 0.5,
    floatDuration: 20,
    floatDelay: 4,
  },
  // 4. Subtle lavender center-stage ambient glow
  {
    id: 'orb-lavender-c',
    x: '52%',
    y: '60%',
    size: 380,
    scrollSpeed: 110,
    mouseSpeed: 30,
    gradient: 'radial-gradient(circle, rgba(234, 215, 255, 0.16) 0%, rgba(155, 0, 255, 0.15) 45%, transparent 70%)',
    blur: 75,
    opacity: 0.45,
    floatDuration: 26,
    floatDelay: 1,
  },
  // 5. Deep violet bottom-right anchor
  {
    id: 'orb-violet-br',
    x: '82%',
    y: '78%',
    size: 260,
    scrollSpeed: 85,
    mouseSpeed: 20,
    gradient: 'radial-gradient(circle, rgba(48, 0, 107, 0.35) 0%, rgba(118, 33, 176, 0.15) 55%, transparent 70%)',
    blur: 50,
    opacity: 0.5,
    floatDuration: 24,
    floatDelay: 3,
  },
];

export default function FloatingVioletOrbs({ scrollYProgress }: Props) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springCfg = { damping: 30, stiffness: 45, mass: 0.9 };
  const sx = useSpring(mouseX, springCfg);
  const sy = useSpring(mouseY, springCfg);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  // Gentle fade-in at the beginning
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0.8, 1, 0.9, 0.4]);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[3]"
      style={{ opacity }}
    >
      {orbs.map((orb) => (
        <SingleOrb key={orb.id} orb={orb} scrollYProgress={scrollYProgress} sx={sx} sy={sy} />
      ))}
    </motion.div>
  );
}

function SingleOrb({
  orb,
  scrollYProgress,
  sx,
  sy,
}: {
  orb: OrbItem;
  scrollYProgress: MotionValue<number>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  // Vertical scroll parallax drift
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -orb.scrollSpeed * 1.5]);

  // Mouse parallax drift
  const mx = useTransform(() => sx.get() * orb.mouseSpeed);
  const my = useTransform(() => sy.get() * orb.mouseSpeed);

  const x = useTransform(() => mx.get());
  const y = useTransform(() => scrollY.get() + my.get());

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: orb.x,
        top: orb.y,
        x,
        y,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.08, 0.95, 1],
          opacity: [orb.opacity, orb.opacity * 1.2, orb.opacity * 0.85, orb.opacity],
        }}
        transition={{
          duration: orb.floatDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: orb.floatDelay,
        }}
        style={{
          width: orb.size,
          height: orb.size,
          borderRadius: '50%',
          background: orb.gradient,
          filter: `blur(${orb.blur}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </motion.div>
  );
}
