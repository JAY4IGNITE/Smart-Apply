import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  splitBy?: 'words' | 'chars';
  textAlign?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

export default function SplitText({
  text,
  className = '',
  delay = 0.04,
  splitBy = 'words',
  textAlign = 'center',
  style,
}: SplitTextProps) {
  const items = splitBy === 'words' ? text.split(' ') : text.split('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <motion.span
      className={`split-text ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        gap: splitBy === 'words' ? '0.3em' : '0.02em',
        ...style,
      }}
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
        >
          {item}
        </motion.span>
      ))}
    </motion.span>
  );
}
