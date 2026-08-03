import { m, useScroll, useTransform } from 'framer-motion';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
import HeroOrbitals from './HeroOrbitals';
import GlowButton from '../GlowButton';
import MagneticButton from '../ui/MagneticButton';
import ShimmerButton from '../ui/ShimmerButton';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: 'easeOut' },
  }),
};

const titleWords = [
  { text: "Earn", highlight: false, shimmer: false },
  { text: "passive", highlight: true, shimmer: false },
  { text: "income", highlight: true, shimmer: false },
  { text: "with", highlight: false, shimmer: false },
  { text: "next-gen", highlight: false, shimmer: true },
  { text: "cloud", highlight: false, shimmer: true },
  { text: "mining.", highlight: false, shimmer: true },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const HeroSection = () => {
  const { scrollY } = useScroll();

  // Multi-layer scroll parallax speed ratios
  const btcY = useTransform(scrollY, [0, 800], [0, -80]);
  const solY = useTransform(scrollY, [0, 800], [0, -40]);
  const hashY = useTransform(scrollY, [0, 800], [0, 50]);
  const trustY = useTransform(scrollY, [0, 800], [0, -30]);

  return (
    <section id="hero-section" className="relative overflow-hidden pt-4 pb-28 lg:pt-6 lg:pb-40">
      {/* Continuous Ambient Background & Mesh Aurora (Gold, Cyan, Emerald morphing clouds).
          Static radial gradients — animating filter: blur() orbs repaints huge regions every frame. */}
      <div
        className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,184,0,0.28), transparent 62%)' }}
      />
      <div
        className="absolute top-[20%] left-1/4 w-[460px] h-[460px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.25), transparent 62%)' }}
      />
      <div
        className="absolute -bottom-48 -left-48 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,230,153,0.24), transparent 62%)' }}
      />

      {/* Radial glows behind floating tokens (static, no blur filter) */}
      <div
        className="absolute top-[8%] left-[2%] w-[160px] h-[160px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 60%)' }}
      />
      <div
        className="absolute bottom-[20%] left-[20%] w-[160px] h-[160px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 60%)' }}
      />
      <div
        className="absolute top-[4%] left-[40%] w-[140px] h-[140px] rounded-full pointer-events-none hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 60%)' }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--color-page-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-page-grid)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)] pointer-events-none" />

      {/* Background Kinetic Beams (Aceternity style vertical grid columns) */}
      <div className="absolute inset-y-0 left-[10%] w-[1px] bg-page-fill hidden lg:block overflow-visible pointer-events-none z-0">
        <m.div 
          className="absolute top-0 left-[-1px] w-[3px] h-[150px] bg-gradient-to-b from-transparent via-gold/20 to-transparent"
          animate={{ y: ["-20%", "120%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="absolute inset-y-0 right-[25%] w-[1px] bg-page-fill hidden lg:block overflow-visible pointer-events-none z-0">
        <m.div 
          className="absolute top-0 left-[-1px] w-[3px] h-[180px] bg-gradient-to-b from-transparent via-electric-cyan/20 to-transparent"
          animate={{ y: ["120%", "-20%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Kinetic light particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <m.div 
          className="absolute w-1 h-1 rounded-full bg-gold/40"
          animate={{
            x: ["10vw", "90vw"],
            y: ["20vh", "35vh"],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <m.div 
          className="absolute w-1.5 h-1.5 rounded-full bg-electric-cyan/40"
          animate={{
            x: ["80vw", "10vw"],
            y: ["60vh", "45vh"],
            opacity: [0, 0.5, 0.5, 0]
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <m.div 
          className="absolute w-1 h-1 rounded-full bg-emerald/40"
          animate={{
            x: ["30vw", "70vw"],
            y: ["80vh", "65vh"],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Floating Glass tokens and badges in background with Scroll Parallax */}
      {/* BTC Active Badge */}
      <m.div 
        style={{ y: btcY }} 
        className="absolute top-[16%] left-[6%] z-0 hidden lg:block"
      >
        <m.div
          className="flex flex-col items-center justify-center p-3 rounded-2xl glass-card border-beam-container cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          animate={{
            y: [-15, 15, -15],
            x: [-8, 8, -8],
            rotate: [-4, 4, -4]
          }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{
            y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Border Beam Shimmer */}
          <div className="border-beam-wrapper"><div className="border-beam-line" /></div>

          <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-page-fill border border-page-border-soft text-page-text-muted">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.035-1.244 15.525.362 9.103 1.96 2.67 8.471-1.24 14.9-.364c6.43 1.602 10.34 8.113 8.738 14.542zm-7.496-4.958c.323-2.164-1.323-3.327-3.575-4.103l.73-2.928-1.782-.444-.712 2.855c-.468-.117-.95-.226-1.428-.335l.72-2.883-1.782-.444-.73 2.928c-.387-.088-.767-.175-1.137-.267l.002-.008-2.46-.613-.474 1.9.993.227c.542.124.8.453.78 1.054L7.15 11.23c.037.094.086.23.14.364l-.946 3.79c-.066.41-.337.74-.78.63l-.994-.247-.947 3.8 2.32.578c.433.11.857.22 1.277.324l-.738 2.957 1.783.444.73-2.928c.487.133.957.256 1.418.373l-.726 2.91 1.782.444.738-2.96c3.044.576 5.334.344 6.297-2.41.776-2.217-.038-3.497-1.644-4.332 1.17-.27 2.05-1.037 2.285-2.625zm-4.083 5.742c-.552 2.215-4.28.877-5.49.576l.98-3.926c1.21.3 5.074.894 4.51 3.35zm.55-5.772c-.503 2.02-3.61.994-4.618.743l.888-3.56c1.008.25 4.24.717 3.73 2.817z" />
            </svg>
          </span>
          <span className="text-[9px] font-mono text-page-text-faint font-bold uppercase tracking-wider mt-1.5">BTC ACTIVE</span>
        </m.div>
      </m.div>

      {/* SOL Active Badge */}
      <m.div 
        style={{ y: solY }} 
        className="absolute top-[8%] left-[45%] z-0 hidden lg:block"
      >
        <m.div
          className="flex items-center justify-center w-12 h-12 rounded-2xl glass-card border-beam-container cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            rotate: [-3, 3, -3]
          }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{
            y: { duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
            x: { duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
            rotate: { duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
          }}
        >
          {/* Border Beam Shimmer */}
          <div className="border-beam-wrapper"><div className="border-beam-line" /></div>

          <svg className="w-5.5 h-5.5 text-page-text-soft opacity-55" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.6 15.3l3-3h11.8l-3 3zm14.8-6.6l-3 3H4.6l3-3zm-3-6.6l3 3H7.6l-3-3z"/>
          </svg>
        </m.div>
      </m.div>

      {/* Live Hashrate Card */}
      <m.div 
        style={{ y: hashY }} 
        className="absolute bottom-[10%] left-[42%] z-0 hidden lg:block"
      >
        <m.div
          className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl glass-card border-beam-container cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
          animate={{
            y: [14, -14, 14],
            x: [8, -8, 8],
            rotate: [2, -2, 2]
          }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{
            y: { duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 },
            x: { duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 },
            rotate: { duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }
          }}
        >
          {/* Border Beam Shimmer */}
          <div className="border-beam-wrapper"><div className="border-beam-line" /></div>

          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium tracking-tight text-page-text-soft">Live Hashrate</span>
          <span className="text-[11px] font-bold text-page-text font-mono tracking-tight">+142 GH/s</span>
        </m.div>
      </m.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left copy */}
        <m.div initial="hidden" animate="visible" className="order-2 lg:order-1 space-y-6 text-center lg:text-left">
          <m.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-page-fill border border-page-border-soft text-xs font-medium text-page-text-soft tracking-tight backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Next-gen cloud mining
            </span>
          </m.div>

          {/* Kinetic typography with shimmer text */}
          <m.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl sm:text-6xl lg:text-7xl font-heading font-light leading-[1.15] md:leading-[1.2] tracking-tight text-page-text flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1"
          >
            {titleWords.map((word, idx) => {
              if (word.shimmer) {
                return (
                  <m.span 
                    key={idx} 
                    variants={wordVariants}
                    className="bg-gradient-to-r from-gold via-electric-cyan to-emerald dark:from-yellow-300 dark:via-cyan-400 dark:to-emerald-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer-text font-semibold pb-3 pt-1 px-1"
                  >
                    {word.text}
                  </m.span>
                );
              }
              if (word.highlight) {
                return (
                  <m.span 
                    key={idx} 
                    variants={wordVariants} 
                    className="font-semibold text-transparent bg-gradient-to-br from-gold via-gold to-gold-soft dark:from-white dark:via-white dark:to-slate-300 bg-clip-text"
                  >
                    {word.text}
                  </m.span>
                );
              }
              return (
                <m.span 
                  key={idx} 
                  variants={wordVariants} 
                  className="text-page-text-muted"
                >
                  {word.text}
                </m.span>
              );
            })}
          </m.h1>

          <m.p 
            variants={fadeUp} 
            custom={2} 
            className="text-base sm:text-lg text-page-text-soft max-w-lg mx-auto lg:mx-0 leading-relaxed tracking-tight"
          >
            AscendHash bridges the gap between hardware complexity and passive profitability. Deploy dynamic high-hash mining power instantly from your wallet balance.
          </m.p>

          <m.div variants={fadeUp} custom={3} className="relative z-20 flex flex-wrap gap-4 justify-center lg:justify-start pt-2 mb-20">
            <MagneticButton>
              <ShimmerButton to="/register">
                Start Mining Now <ArrowRight size={16} />
              </ShimmerButton>
            </MagneticButton>
            <GlowButton to="/login" variant="outline">
              Login
            </GlowButton>

            {/* ETH Active badge — anchored inside the CTA wrapper, floating below the buttons */}
            <m.div
              className="absolute -bottom-14 left-0 z-10 hidden sm:flex items-center gap-2 bg-page-card backdrop-blur-md border border-page-border px-3 py-1.5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer"
              animate={{ y: [0, -6, 0] }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-page-fill border border-page-border-soft text-page-text-soft">
                <svg className="w-3 h-4 text-page-text-soft opacity-60" viewBox="0 0 784 1277" fill="currentColor">
                  <path d="M392 0L383.5 28.5V870.5L392 879L784 647.5L392 0Z" />
                  <path d="M392 956L387 962V1271.5L392 1277L784 724.5L392 956Z" />
                  <path d="M392 879L784 647.5L392 522.5V879Z" />
                </svg>
              </span>
              <span className="text-[9px] font-mono text-page-text-faint font-bold uppercase tracking-wider">ETH ACTIVE</span>
            </m.div>
          </m.div>

          {/* Trustpilot glass badge with Scroll Parallax */}
          <m.div
            style={{ y: trustY }}
            className="relative inline-flex z-10"
          >
            <m.div
              variants={fadeUp}
              custom={4}
              className="inline-flex items-center gap-3 rounded-2xl glass-card border-beam-container px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Border Beam Shimmer */}
              <div className="border-beam-wrapper"><div className="border-beam-line" /></div>

              <div className="flex items-center gap-0.5 text-gold relative z-20">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="text-xs text-page-text-muted relative z-20">
                <span className="font-semibold text-page-text">4.9/5</span> on Trustpilot
                <span className="text-page-text-faint ml-1 hidden sm:inline">· 2,400+ reviews</span>
              </p>
            </m.div>
          </m.div>
        </m.div>

        {/* Right showcase */}
        <m.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          className="order-1 lg:order-2"
        >
          <HeroOrbitals />
        </m.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-page-text-dimmer hidden sm:flex items-center gap-2">
        <Sparkles size={12} className="text-gold/60" />
        Institutional-grade infrastructure · 99.9% uptime SLA
        <Sparkles size={12} className="text-electric-cyan/60" />
      </div>
    </section>
  );
};

export default HeroSection;
