import { useRef } from 'react';
import { m } from 'framer-motion';
import { ShieldCheck, Zap, Headphones, TrendingUp, Coins, Wallet } from 'lucide-react';
import SectionHeading from '../SectionHeading';

const features = [
  { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Enterprise-grade security to protect your investments and earnings with 99.9% uptime guarantee.' },
  { icon: Zap, title: 'High Efficiency', desc: 'Cutting-edge mining hardware for maximum profitability and minimal power consumption.' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support team always ready to help you with any questions or issues.' },
  { icon: TrendingUp, title: 'Real-Time Tracking', desc: 'Track your hash-rate and performance in real-time with dynamic analytics and reports.' },
  { icon: Coins, title: 'Multiple Coins', desc: 'Mine Bitcoin, Ethereum, and many more cryptocurrencies with our flexible plans.' },
  { icon: Wallet, title: 'Instant Payouts', desc: 'Get paid quickly and securely to your wallet with automatic daily payouts.' },
];

const FeatureCard = ({ icon: Icon, title, desc }) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="spotlight-card group relative h-full overflow-hidden rounded-2xl bg-page-card backdrop-blur-md border border-page-border p-6 hover:border-cyan-400/30 hover:shadow-[0_16px_50px_rgba(0,240,255,0.12)]"
      style={{ ['--spotlight-color']: 'rgba(0,240,255,0.14)' }}
    >
      <div className="w-fit mb-4 p-4 rounded-xl bg-cyan-500/10 text-cyan-400 transition-transform duration-300 group-hover:scale-110">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-heading font-semibold text-page-text mb-3">{title}</h3>
      <p className="text-sm text-page-text-soft leading-relaxed">{desc}</p>
    </m.div>
  );
};

const WhyChooseUs = () => {
  return (
    <section className="py-16 lg:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h2"
          eyebrow="Why Choose AscendHash"
          title="Professional Features for Professional Miners"
          className="mb-14"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <m.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: (idx % 3) * 0.12, ease: 'easeOut' }}
            >
              <FeatureCard {...feat} />
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
