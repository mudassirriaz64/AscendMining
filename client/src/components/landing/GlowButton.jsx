import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const variants = {
  gold: cn(
    'bg-gradient-to-r from-gold to-gold-soft text-[#101828]',
    'shadow-[0_0_24px_rgba(255,184,0,0.25)] hover:shadow-[0_0_36px_rgba(255,184,0,0.45)]'
  ),
  outline: cn(
    'border border-page-border bg-page-fill text-page-text-muted backdrop-blur-md',
    'hover:border-page-text-faint hover:text-page-text hover:bg-page-fill'
  ),
  white: cn(
    'bg-page-text text-page-bg hover:bg-page-text font-bold',
    'shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_28px_rgba(0,0,0,0.2)]'
  ),
  cyan: cn(
    'bg-gradient-to-r from-electric-cyan to-emerald text-[#080c14]',
    'shadow-[0_0_24px_rgba(0,240,255,0.2)] hover:shadow-[0_0_36px_rgba(0,240,255,0.35)]'
  ),
};

const GlowButton = ({ children, to, variant = 'gold', shine = false, className, ...props }) => {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3',
    'text-sm font-semibold transition duration-300 relative overflow-hidden group',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg',
    'active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
    variants[variant],
    className
  );

  const innerContent = (
    <>
      {variant === 'white' && (
        <>
          <style>{`
            @keyframes buttonShimmer {
              0% { transform: translateX(-100%) skewX(-15deg); }
              100% { transform: translateX(200%) skewX(-15deg); }
            }
            .group:hover .animate-shimmer {
              animation: buttonShimmer 1.5s infinite ease-in-out;
            }
          `}</style>
          {/* Glowing Aura Hover Effect */}
          <span className="absolute -inset-4 rounded-full bg-gradient-to-r from-gold/25 via-white/35 to-electric-cyan/25 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 pointer-events-none" />
          {/* Moving liquid light reflection shimmer */}
          <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
        </>
      )}
      {shine && (
        <>
          {/* Glowing aura on hover */}
          <span className="absolute -inset-3 rounded-full bg-gradient-to-r from-gold/30 via-electric-cyan/20 to-gold/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500 pointer-events-none" />
          {/* Moving liquid gradient sheen */}
          <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-liquid-shine pointer-events-none" />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </>
  );

  if (to) {
    return (
      <m.span
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex"
      >
        <Link to={to} className={classes} {...props}>
          {innerContent}
        </Link>
      </m.span>
    );
  }

  return (
    <m.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={classes} {...props}>
      {innerContent}
    </m.button>
  );
};

export default GlowButton;
