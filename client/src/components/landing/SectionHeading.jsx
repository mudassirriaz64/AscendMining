import { m } from 'framer-motion';
import { cn } from '../../utils/cn';

const SectionHeading = ({ eyebrow, title, subtitle, align = 'center', as: Tag = 'h1', className }) => {
  const alignment =
    align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn('flex flex-col space-y-4', alignment, className)}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-gold">
          <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/70" />
          {eyebrow}
          {align !== 'left' ? (
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold/70" />
          ) : null}
        </span>
      ) : null}
      {title ? (
        <Tag className="text-4xl md:text-5xl font-heading font-semibold text-white tracking-tight">
          {title}
        </Tag>
      ) : null}
      {subtitle ? (
        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      ) : null}
    </m.div>
  );
};

export default SectionHeading;
