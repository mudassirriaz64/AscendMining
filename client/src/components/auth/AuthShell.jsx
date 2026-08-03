import { m } from 'framer-motion';
import Logo from '../common/Logo';
import BackgroundGlowsAndParticles from '../landing/ui/BackgroundGlowsAndParticles';
import BorderBeam from '../landing/ui/BorderBeam';

const AuthShell = ({ title, subtitle, children }) => {
  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden">
      {/* Global dark mesh background (fixed, spans full viewport) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#050811]">
        <BackgroundGlowsAndParticles />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto py-12 px-4 w-full">
          {/* Left branding column */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-5 space-y-8 text-center lg:text-left"
          >
            <Logo variant="dark" size="lg" />

            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-xs font-medium text-slate-400 tracking-tight backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Next-gen cloud mining
              </span>
              <h1 className="text-4xl sm:text-5xl font-heading font-light leading-[1.15] tracking-tight text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Live network status widget */}
            <div className="inline-flex items-center gap-3 rounded-2xl glass-card border-beam-container px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="border-beam-wrapper"><div className="border-beam-line" /></div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-sm text-slate-300 font-medium">
                All Mining Nodes Operational
                <span className="text-slate-500 mx-1.5">|</span>
                <span className="text-emerald-400 font-semibold">99.9% Uptime</span>
              </span>
            </div>
          </m.div>

          {/* Right form card column */}
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
            className="lg:col-span-7"
          >
            <div className="relative w-full max-w-xl mx-auto bg-[#080c14]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <BorderBeam size={250} />
              {children}
            </div>
          </m.div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
