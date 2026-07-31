import { Link } from 'react-router-dom';
import { cn } from '../../../utils/cn';

/**
 * Magic UI "ShimmerButton" pattern — gold CTA with a continuously sweeping
 * light sheen (transform-only animation). Renders a router Link when `to` is set.
 */
const ShimmerButton = ({
  children,
  to,
  type,
  className,
  shimmerColor = '#FFB800',
  shimmerDuration = '2.4s',
  borderRadius = '100px',
  background = 'linear-gradient(135deg, #FFB800 0%, #FFD24D 100%)',
  disabled = false,
  ...props
}) => {
  const classes = cn(
    'group relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap',
    'px-7 py-3 text-sm font-semibold text-[#101828]',
    '[background:var(--shimmer-bg)] [border-radius:var(--radius)]',
    'transition duration-300 will-change-transform active:translate-y-px',
    'hover:shadow-[0_0_36px_rgba(255,184,0,0.45)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void',
    'disabled:opacity-50 disabled:pointer-events-none',
    className
  );

  const style = {
    '--shimmer-color': shimmerColor,
    '--shimmer-duration': shimmerDuration,
    '--radius': borderRadius,
    '--shimmer-bg': background,
  };

  const content = (
    <>
      {/* Ambient highlight */}
      <div aria-hidden="true" className="absolute inset-0 -z-30 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </div>
      {/* Soft top-light mask */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 [mask:linear-gradient(to_bottom,white_0%,transparent_100%)]" />
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {/* Moving shimmer sheen */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          className="absolute inset-0 animate-shimmer-button"
          style={{ background: 'linear-gradient(100deg, transparent 20%, var(--shimmer-color) 50%, transparent 80%)' }}
        />
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} style={style} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} style={style} {...props}>
      {content}
    </button>
  );
};

export default ShimmerButton;
