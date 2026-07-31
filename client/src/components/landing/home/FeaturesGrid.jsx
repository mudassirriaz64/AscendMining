import { m } from 'framer-motion';
import { Zap, ShieldCheck, Cpu } from 'lucide-react';
import SectionHeading from '../SectionHeading';
import SpotlightCard from '../SpotlightCard';

const features = [
  { icon: Zap, accent: 'text-gold', tint: 'bg-gold/10 border-gold/20', title: 'Instant Mining Payouts', desc: 'Get your earnings credited immediately to your balance every 24 hours with absolute automation.' },
  { icon: ShieldCheck, accent: 'text-emerald', tint: 'bg-emerald/10 border-emerald/20', title: 'Grade-A Security', desc: 'Multi-signature cold wallets and full data sanitization protect your capital and investments.' },
  { icon: Cpu, accent: 'text-electric-cyan', tint: 'bg-electric-cyan/10 border-electric-cyan/20', title: 'Premium Hash Power', desc: 'Access state-of-the-art ASIC hardware and clean energy source farms without maintenance fees.' },
];

const FeaturesGrid = () => {
  return (
    <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeading
        as="h2"
        eyebrow="Why Choose Us"
        title="A Secure Premium Infrastructure"
        subtitle="We operate thousands of ASIC miners in stable power grids, routing hash capacities directly to client balances."
        className="mb-14"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <m.div
              key={feat.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
            >
              <SpotlightCard className="p-8 h-full">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feat.tint}`}>
                  <Icon size={24} className={feat.accent} />
                </div>
                <h3 className="text-lg font-heading font-semibold text-white mb-3">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </SpotlightCard>
            </m.div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturesGrid;
