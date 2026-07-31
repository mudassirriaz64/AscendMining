import { cn } from '../../../utils/cn';

/**
 * Magic UI "BorderBeam" pattern — a continuous conic-gradient sweep that hugs
 * the element's border. The rotating layer is GPU-friendly (transform-only).
 */
const BorderBeam = ({
  className,
  size = 250,
  duration = 12,
  delay = 0,
  colorFrom = '#00F0FF',
  colorTo = '#FFB800',
  borderWidth = 1.5,
}) => {
  const beamWidth = Math.max(18, Math.min(90, Math.round(size / 4)));
  const gradient = `conic-gradient(from 0deg at 50% 50%, transparent 50%, var(--beam-from) ${
    50 + beamWidth * 0.4
  }%, var(--beam-to) ${50 + beamWidth * 0.7}%, transparent ${50 + beamWidth}%)`;

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-10 border-beam-mask', className)}
      style={{
        '--beam-from': colorFrom,
        '--beam-to': colorTo,
        '--beam-duration': `${duration}s`,
        '--beam-delay': `${delay}s`,
        '--beam-bw': `${borderWidth}px`,
      }}
    >
      <div className="border-beam-line animate-border-beam" style={{ background: gradient }} />
    </div>
  );
};

export default BorderBeam;
