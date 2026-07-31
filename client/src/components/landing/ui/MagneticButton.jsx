import { useRef } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../../utils/cn';

const springConfig = { stiffness: 200, damping: 15, mass: 0.4 };

/**
 * Magnetic hover wrapper — the child subtly follows the cursor with a spring,
 * then eases back to center on leave. Transform-only, GPU-friendly.
 */
const MagneticButton = ({ children, className, strength = 0.35 }) => {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), springConfig);
  const y = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className={cn('inline-block will-change-transform', className)}
    >
      {children}
    </m.div>
  );
};

export default MagneticButton;
