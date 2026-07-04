import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** stagger position — 60ms per step keeps cascades tight */
  index?: number;
  className?: string;
  /** distance of the upward settle, px */
  y?: number;
};

/**
 * Scroll-in reveal. Reduced motion keeps the fade (comprehension) but
 * drops the movement, per app motion rules (09_ANIMATIONS).
 */
export function Reveal({ children, index = 0, className, y = 22 }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.65, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
