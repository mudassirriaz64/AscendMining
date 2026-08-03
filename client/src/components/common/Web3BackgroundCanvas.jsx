import Particles from '../landing/ui/Particles';
import { useTheme } from '../../theme/ThemeContext';

const Web3BackgroundCanvas = ({ variant = 'auto' }) => {
  const { theme } = useTheme();
  const isLight = variant === 'light' || (variant === 'auto' && theme === 'light');

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${
        isLight ? 'bg-[#f4f6f9]' : 'bg-[#050811]'
      }`}
      aria-hidden="true"
    >
      {/* Layer 1: Tech Perspective Grid Mesh */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: isLight
            ? 'linear-gradient(to right, rgba(15, 23, 42, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.6) 1px, transparent 1px)'
            : 'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Layer 2: Radial Aurora Orbs (Glowing Amber Right + Cyan/Teal Left) */}
      {isLight ? (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] animate-pulse duration-[6000ms]" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[130px] animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[150px]" />
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[140px] animate-pulse duration-[6000ms]" />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[130px] animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[150px]" />
        </>
      )}

      {/* Layer 3: Floating Particle Canvas */}
      <Particles
        className="absolute inset-0"
        quantity={isLight ? 60 : 80}
        ease={80}
        color={isLight ? '#475569' : '#00F0FF'}
        refresh
      />
    </div>
  );
};

export default Web3BackgroundCanvas;
