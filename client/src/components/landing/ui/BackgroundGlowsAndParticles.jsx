import Particles from './Particles';
import { useTheme } from '../../../theme/ThemeContext';

const BackgroundGlowsAndParticles = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Ambient radial glows */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,240,255,0.10),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,184,0,0.10),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(0,230,153,0.08),transparent_50%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,240,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,184,0,0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(0,230,153,0.06),transparent_50%)]" />
        </>
      )}

      {/* Subtle grid lines */}
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]'
        } bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]`}
      />

      {/* Floating particles */}
      {isLight ? (
        <Particles className="absolute inset-0" quantity={60} ease={80} color="#475569" refresh />
      ) : (
        <Particles className="absolute inset-0" quantity={80} ease={80} color="#00F0FF" refresh />
      )}
    </div>
  );
};

export default BackgroundGlowsAndParticles;
