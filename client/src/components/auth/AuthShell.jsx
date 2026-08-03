import { m } from 'framer-motion';
import Logo from '../common/Logo';
import Web3BackgroundCanvas from '../common/Web3BackgroundCanvas';
import BorderBeam from '../landing/ui/BorderBeam';
import ThemeToggle from '../theme/ThemeToggle';

const AuthShell = ({ title, subtitle, children }) => {
  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden">
      {/* Global page background (fixed, spans full viewport) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Web3BackgroundCanvas />
      </div>

      {/* Floating theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
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
            <Logo size="lg" />

            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-page-fill border border-page-border-soft text-xs font-medium text-page-text-soft tracking-tight backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Next-gen cloud mining
              </span>
              <h1 className="text-4xl sm:text-5xl font-heading font-light leading-[1.15] tracking-tight text-page-text">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg text-page-text-soft leading-relaxed max-w-md mx-auto lg:mx-0">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Live network status widget */}
            <div className="inline-flex items-center gap-3 rounded-2xl glass-card border-beam-container px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="border-beam-wrapper"><div className="border-beam-line" /></div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-sm text-page-text-muted font-medium">
                All Mining Nodes Operational
                <span className="text-page-text-faint mx-1.5">|</span>
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
            <div className="relative w-full max-w-xl mx-auto bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
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
