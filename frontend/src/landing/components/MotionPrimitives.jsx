import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const BASE_EASE = [0.22, 1, 0.36, 1];

/**
 * Scroll-triggered block reveal: rises 32px (Spacing-400) and fades in once.
 * Under prefers-reduced-motion, fades opacity only without vertical motion.
 */
export function RevealBlock({ children, delay = 0, className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.7,
        delay,
        ease: BASE_EASE
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

