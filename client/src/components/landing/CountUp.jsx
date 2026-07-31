import { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/cn';

const format = (value, decimals) =>
  decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString();

/**
 * Animated counter. Writes the animated number straight to the DOM via
 * requestAnimationFrame, so the parent never re-renders during the count.
 */
const CountUp = ({ target, suffix = '', decimals = 0, duration = 2, className }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (reduceMotion || !inView) {
      node.textContent = `${format(target, decimals)}${suffix}`;
      return undefined;
    }

    let rafId;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = `${format(target * eased, decimals)}${suffix}`;
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, duration, decimals, suffix, reduceMotion]);

  return <span ref={ref} className={cn('tabular-nums', className)} />;
};

export default CountUp;
