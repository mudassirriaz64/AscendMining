import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { CardContainer, CardItem } from '../ui/CardContainer';
import BorderBeam from '../ui/BorderBeam';

/* Owns the live profit ticker so the interval only re-renders this tiny
   text node instead of the entire orbital SVG stack every 120ms. */
const LiveEarnings = ({ active }) => {
  const [earnings, setEarnings] = useState(1240.5);

  useEffect(() => {
    if (!active) return undefined;
    const interval = setInterval(() => {
      setEarnings((prev) => prev + Math.random() * 0.00008 + 0.00002);
    }, 120);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <span>
      {earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
    </span>
  );
};

const HeroOrbitals = () => {
  const [isMining, setIsMining] = useState(true);
  const [ripple, setRipple] = useState(false);

  // Ripple trigger on status toggles
  const triggerRipple = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 1500);
  };

  return (
    <div className="relative flex justify-center items-center h-[460px] w-full max-w-[500px] mx-auto select-none cursor-pointer [perspective:1000px]">
      <CardContainer containerClassName="relative w-[420px] h-[420px] flex items-center justify-center">
        {/* SVG Swoosh connecting lines & 3D Pedestal elements */}
        <svg 
          viewBox="0 0 400 400" 
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        >
          <defs>
            <linearGradient id="btcGrad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="40%" stopColor="#ffb800" stopOpacity={0.8} />
              <stop offset="100%" stopColor="transparent" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ethGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="40%" stopColor="#00F0FF" stopOpacity={0.8} />
              <stop offset="100%" stopColor="transparent" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="widgetGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="40%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="100%" stopColor="transparent" stopOpacity={0} />
            </linearGradient>

            {/* Premium Cylinder Gradients for 3D metallic stack */}
            <linearGradient id="goldSide" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8a6d05" />
              <stop offset="30%" stopColor="#b8860b" />
              <stop offset="70%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#8a6d05" />
            </linearGradient>
            <linearGradient id="silverSide" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="30%" stopColor="#475569" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="emeraldSide" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="30%" stopColor="#065f46" />
              <stop offset="70%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            <radialGradient id="goldFace" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffe066" />
              <stop offset="70%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#6e5002" />
            </radialGradient>
            <radialGradient id="silverFace" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
            <radialGradient id="emeraldFace" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="70%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>

          {/* Base lines connecting centralized pedestal to badges */}
          <path d="M 200 196 Q 110 160 60 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <path d="M 200 196 Q 290 180 340 110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <path d="M 200 196 L 200 320" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

          {/* Animated neon light pulses traveling outwards */}
          {isMining && (
            <>
              {/* BTC Pulsing Beam */}
              <m.path 
                d="M 200 196 Q 110 160 60 70" 
                fill="none" 
                stroke="url(#btcGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray="40, 200"
                animate={{ strokeDashoffset: [240, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              />
              {/* ETH Pulsing Beam */}
              <m.path 
                d="M 200 196 Q 290 180 340 110" 
                fill="none" 
                stroke="url(#ethGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray="40, 200"
                animate={{ strokeDashoffset: [240, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
              />
              {/* Widget Pulsing Beam */}
              <m.path 
                d="M 200 196 L 200 320" 
                fill="none" 
                stroke="url(#widgetGrad)" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeDasharray="30, 150"
                animate={{ strokeDashoffset: [180, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}

          {/* 3D CENTRAL ISOMETRIC COIN PEDESTAL */}
          {/* Base neon platform */}
          <ellipse cx="200" cy="245" rx="75" ry="34" fill="rgba(0,240,255,0.04)" stroke="#00F0FF" strokeWidth="2.5" strokeOpacity="0.8" filter="drop-shadow(0 0 16px rgba(0,240,255,0.45))" />
          <ellipse cx="200" cy="245" rx="64" ry="29" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="6,4" />

          {/* Dynamic real shadow on top stack ellipse */}
          <m.ellipse 
            cx="200" 
            cy="188" 
            rx="22" 
            ry="10" 
            fill="rgba(0,0,0,0.6)" 
            animate={{
              scale: [1.1, 0.8, 1.1],
              opacity: [0.15, 0.45, 0.15]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Pedestal Cylinder coin stack (stacked 3 metallic coins with realistic profiles) */}
          {/* Coin 1: Bottom (Gold Coin) */}
          <path d="M 150 220 A 50 22 0 0 0 250 220 L 250 228 A 50 22 0 0 1 150 228 Z" fill="url(#goldSide)" />
          <ellipse cx="200" cy="220" rx="50" ry="22" fill="url(#goldFace)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          
          {/* Coin 2: Middle (Silver Coin) */}
          <path d="M 150 204 A 50 22 0 0 0 250 204 L 250 212 A 50 22 0 0 1 150 212 Z" fill="url(#silverSide)" />
          <ellipse cx="200" cy="204" rx="50" ry="22" fill="url(#silverFace)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

          {/* Coin 3: Top (Emerald Coin) */}
          <path d="M 150 188 A 50 22 0 0 0 250 188 L 250 196 A 50 22 0 0 1 150 196 Z" fill="url(#emeraldSide)" />
          <ellipse cx="200" cy="188" rx="50" ry="22" fill="url(#emeraldFace)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        </svg>

        {/* Vertical Light Beam rising from pedestal */}
        <div 
          className="absolute w-36 h-48 bg-gradient-to-t from-[#00F0FF]/15 via-emerald-400/5 to-transparent pointer-events-none blur-md z-0 -translate-x-1/2"
          style={{
            top: '8%',
            left: '50%',
            maskImage: 'linear-gradient(to right, transparent, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)'
          }}
        />

        {/* Mining Sparks floating upwards inside light beam */}
        {isMining && (
          <div className="absolute w-28 h-44 overflow-hidden pointer-events-none z-10 -translate-x-1/2" style={{ top: '8%', left: '50%' }}>
            <m.div 
              className="absolute w-1 h-1 rounded-full bg-emerald-400"
              animate={{ y: [160, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
              style={{ left: '30%' }}
            />
            <m.div 
              className="absolute w-1.5 h-1.5 rounded-full bg-electric-cyan"
              animate={{ y: [160, 0], opacity: [0, 0.8, 0.8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay: 1.1 }}
              style={{ left: '55%' }}
            />
            <m.div 
              className="absolute w-1 h-1 rounded-full bg-gold"
              animate={{ y: [160, 0], opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: 1.8 }}
              style={{ left: '75%' }}
            />
          </div>
        )}

        {/* Concentric Ripple Waves from Central Stack */}
        {ripple && (
          <div className="absolute w-32 h-32 pointer-events-none z-0 -translate-x-1/2" style={{ top: '35%', left: '50%' }}>
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute w-24 h-24 rounded-full bg-white/5 border border-white/10 animate-[ping_1.2s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '0.3s' }} />
          </div>
        )}

        {/* Background glowing backdrops */}
        <div className="absolute top-[3%] left-[5%] w-[80px] h-[80px] bg-gold/5 rounded-full blur-[24px] pointer-events-none z-0" />
        <div className="absolute top-[12%] right-[10%] w-[80px] h-[80px] bg-indigo-500/5 rounded-full blur-[24px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] w-[120px] h-[120px] bg-emerald/5 rounded-full blur-[35px] pointer-events-none z-0" />

        {/* Levitating 2D Coin with ScaleX Flip (ZERO Z-Clipping) */}
        <CardItem translateZ={30} className="absolute top-[12%] left-1/2 z-20 -ml-7">
          <m.div
            animate={{ 
              scaleX: [1, 0.05, -1, 0.05, 1],
              y: [-12, 12, -12] 
            }}
            transition={{ 
              scaleX: { duration: 4.8, repeat: Infinity, ease: "linear" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-gold via-yellow-300 to-amber-600 border-[1.5px] border-white/35 flex items-center justify-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.6),0_0_25px_rgba(255,184,0,0.5)] select-none"
          >
            <span className="text-2xl font-black text-slate-950 font-mono">₿</span>
          </m.div>
        </CardItem>

        {/* Sleek integrated "AH NODE" front badge */}
        <CardItem translateZ={20} className="absolute top-[49%] left-1/2 z-10">
          <div className="-translate-x-1/2 -translate-y-1/2">
            <div className="relative px-3.5 py-1 rounded-full bg-slate-950/90 border border-white/12 shadow-[0_0_24px_rgba(0,240,255,0.25)] text-center">
              <BorderBeam size={140} duration={10} delay={2} colorFrom="#00F0FF" colorTo="#FFB800" borderWidth={1} />
              <span className="text-[9px] font-bold text-white tracking-widest uppercase font-mono flex items-center gap-1.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-pulse" />
                AH NODE ACTIVE
              </span>
            </div>
          </div>
        </CardItem>

        {/* Badge 1: BTC Pill */}
        <CardItem translateZ={60} className="absolute left-[20px] top-[45px] z-20">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#080c14]/80 backdrop-blur-md border border-white/12 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition duration-300 hover:scale-105">
            <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20 font-bold text-xs">
              ₿
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-300 font-mono">BTC MINING</span>
          </div>
        </CardItem>

        {/* Badge 2: ETH Pill */}
        <CardItem translateZ={60} className="absolute right-[20px] top-[85px] z-20">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#080c14]/80 backdrop-blur-md border border-white/12 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition duration-300 hover:scale-105">
            <span className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 text-xs">
              Ξ
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-300 font-mono">ETH ACTIVE</span>
          </div>
        </CardItem>

        {/* Interactive Earnings Widget */}
        <CardItem translateZ={50} className="absolute bottom-[20px] left-1/2 z-20 -ml-28">
          <div className="relative w-56 p-4 rounded-2xl bg-[#080c14]/90 backdrop-blur-lg border border-white/12 shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col gap-3 transition duration-300 hover:scale-[1.03]">
            <BorderBeam size={260} duration={12} delay={9} colorFrom="#00F0FF" colorTo="#FFB800" />
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold">Live Profit Balance</span>
              <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight flex items-baseline gap-0.5">
                <span className="text-emerald-500 text-sm">$</span>
                <LiveEarnings active={isMining} />
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Automine Status</span>
              {/* Mini toggle switch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMining(prev => !prev);
                  triggerRipple();
                }}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${
                  isMining ? 'bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.35)]' : 'bg-white/5'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ${
                    isMining ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardItem>
      </CardContainer>
    </div>
  );
};

export default HeroOrbitals;
