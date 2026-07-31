import { m } from 'framer-motion';
import SectionHeading from '../SectionHeading';

const steps = [
  { number: '01', title: 'Create Account', desc: 'Sign up in less than a minute. Complete simple KYC verification to secure your identity.' },
  { number: '02', title: 'Top Up Balance', desc: 'Deposit funds instantly into your wallet balance using our secure multi-network cryptocurrency gates.' },
  { number: '03', title: 'Purchase Package', desc: 'Select from our dynamic high-ROI mining tracks and activate your power cycle with one click.' },
];

const HowItWorks = () => {
  return (
    <section className="relative py-16 lg:py-24 border-y border-border-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h2"
          eyebrow="Three Steps"
          title="How Cloud Mining Works"
          subtitle="No hardware configuration required. Deploy cloud mining cycles in minutes from any browser."
          className="mb-16"
        />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-12 z-10">
          {/* Desktop connecting line (behind step circles) */}
          <div className="hidden md:block absolute top-[80px] left-[15%] right-[15%] h-[2px] bg-slate-800 z-0" aria-hidden="true">
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-yellow-400 via-cyan-400 to-emerald-400 origin-left"
            />
          </div>

          {steps.map((step, idx) => (
            <m.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: idx * 0.18, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Circle number badge */}
              <div className="relative w-16 h-16 rounded-full bg-[#0a0f1d] border border-amber-500/50 flex items-center justify-center text-yellow-400 font-bold text-xl shadow-[0_0_20px_rgba(255,184,0,0.2)] mb-6">
                {idx + 1}
                <span className="absolute inset-0 rounded-full border border-gold/30 animate-glow-pulse pointer-events-none" />
              </div>

              <span className="absolute top-24 right-1/2 translate-x-1/2 text-6xl font-bold text-white/[0.04] select-none pointer-events-none">
                {step.number}
              </span>

              <h3 className="text-lg font-heading font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{step.desc}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
