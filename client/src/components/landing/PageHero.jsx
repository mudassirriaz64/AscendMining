import { m } from 'framer-motion';
import { cn } from '../../utils/cn';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const eyebrowVariants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' } },
};

const PageHero = ({ eyebrow, title, subtitle, align = 'center', className }) => {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <section className={cn('relative py-16 lg:py-24 bg-transparent', className)}>
      {/* Soft aura behind the banner — the global particle/glow layer stays visible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,184,0,0.06),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={cn('flex flex-col space-y-4', alignment)}
        >
          {eyebrow ? (
            <m.span
              variants={eyebrowVariants}
              className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] backdrop-blur-md px-4 py-1.5 text-[11px] font-bold tracking-[0.25em] uppercase text-gold shadow-[0_0_20px_rgba(255,184,0,0.12)]"
            >
              {eyebrow}
            </m.span>
          ) : null}
          <m.h1
            variants={titleVariants}
            className="text-4xl md:text-5xl font-heading font-semibold text-page-text tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
          >
            {title}
          </m.h1>
          {subtitle ? (
            <m.p
              variants={subtitleVariants}
              className="text-sm md:text-base text-page-text-soft leading-relaxed max-w-2xl"
            >
              {subtitle}
            </m.p>
          ) : null}
        </m.div>
      </div>
    </section>
  );
};

export default PageHero;
