import { useRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Card with a mouse-following radial spotlight that hugs the pointer.
 * The spotlight follows the cursor via CSS custom properties.
 */
const SpotlightCard = ({ children, className, spotlightColor = 'rgba(255,184,0,0.12)' }) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        'spotlight-card relative overflow-hidden rounded-2xl border border-white/10',
        'bg-slate-900/50 backdrop-blur-md transition duration-300',
        'hover:-translate-y-1 hover:border-gold/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
        className
      )}
      style={{ ['--spotlight-color' ]: spotlightColor }}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
