import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotionQuery = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Wraps a GSAP callback inside a gsap.context() scoped to the given ref,
 * so all tweens/ScrollTriggers are reverted on unmount (no leaks on route change).
 *
 * @param {object} ref        React ref of the container element
 * @param {Function} buildFn  (ctx, gsap) => void — define tweens here
 * @param {Array} deps        Effect dependencies
 */
export const useScrollReveal = (ref, buildFn, deps = []) => {
  useEffect(() => {
    if (!ref.current) return undefined;
    if (reducedMotionQuery()) return undefined;

    const ctx = gsap.context(() => {
      buildFn(gsap);
    }, ref);

    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
