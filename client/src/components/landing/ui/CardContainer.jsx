import { useRef, useState } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../../utils/cn';

const springConfig = { stiffness: 180, damping: 20, mass: 0.5 };

/**
 * Aceternity "3D Card" pattern — mouse-following tilt with spring physics.
 * Wrap with an ancestor that has `[perspective:1000px]`.
 */
const CardContainer = ({ children, className, containerClassName }) => {
  const ref = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    rotateX.set(((mouseY - rect.height / 2) / rect.height) * -18);
    rotateY.set(((mouseX - rect.width / 2) / rect.width) * 18);
  };

  const handleMouseEnter = () => setIsHovering(true);

  const handleMouseLeave = () => {
    setIsHovering(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <m.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={cn('relative h-full w-full', containerClassName)}
    >
      <div
        style={{
          transform: isHovering ? 'translateZ(60px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
        }}
        className={cn('relative h-full w-full', className)}
      >
        {children}
      </div>
    </m.div>
  );
};

const CardItem = ({ children, className, translateZ = 50 }) => (
  <div
    style={{ transform: `translateZ(${translateZ}px)`, transformStyle: 'preserve-3d' }}
    className={cn('w-fit will-change-transform', className)}
  >
    {children}
  </div>
);

export { CardContainer, CardItem };
