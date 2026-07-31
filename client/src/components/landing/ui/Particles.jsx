import { useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Magic UI "Particles" pattern — an animated canvas particle field with a
 * subtle mouse parallax. Runs on requestAnimationFrame, pauses when off-screen,
 * respects prefers-reduced-motion, and caps DPR for low-end devices.
 */
const Particles = ({
  className,
  quantity = 80,
  staticity = 50,
  ease = 80,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const parent = canvas.parentElement;
    if (!parent) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let rafId = 0;
    let visible = true;
    const mouse = { x: 0, y: 0 };
    const circles = [];

    const makeCircle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + size,
      alpha: 0,
      targetAlpha: Math.random() * 0.5 + 0.15,
      vx: (Math.random() - 0.5) * 0.15 + vx,
      vy: (Math.random() - 0.5) * 0.15 + vy,
    });

    const seed = () => {
      const area = width * height;
      const count = Math.min(quantity, Math.max(24, Math.floor(area / 9000)));
      circles.length = 0;
      for (let i = 0; i < count; i += 1) circles.push(makeCircle());
    };

    const resize = () => {
      const { clientWidth, clientHeight } = parent;
      width = clientWidth;
      height = clientHeight;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const circle of circles) {
        circle.alpha += (circle.targetAlpha - circle.alpha) * 0.04;
        circle.x += circle.vx;
        circle.y += circle.vy;

        const dx = mouse.x - circle.x;
        const dy = mouse.y - circle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0.001) {
          const pull = ((120 - dist) / 120) * (staticity / 100) * 0.6;
          circle.x -= (dx / dist) * pull;
          circle.y -= (dy / dist) * pull;
        }

        if (circle.x < -20) circle.x = width + 20;
        if (circle.x > width + 20) circle.x = -20;
        if (circle.y < -20) circle.y = height + 20;
        if (circle.y > height + 20) circle.y = -20;

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = circle.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (visible) rafId = requestAnimationFrame(draw);
    };

    const onVisibility = (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && rafId === 0) {
        rafId = requestAnimationFrame(draw);
      } else if (!visible && rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    const io = new IntersectionObserver(onVisibility, { rootMargin: '100px' });
    io.observe(canvas);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      io.disconnect();
    };
  }, [quantity, staticity, ease, size, refresh, color, vx, vy]);

  return <canvas ref={canvasRef} className={cn('pointer-events-none', className)} aria-hidden="true" />;
};

export default Particles;
