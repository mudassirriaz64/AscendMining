import { useRef } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import PageHero from '../../components/landing/PageHero';
import GlowButton from '../../components/landing/GlowButton';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const AboutPage = () => {
  const containerRef = useRef(null);

  useScrollReveal(
    containerRef,
    (gsap) => {
      gsap.fromTo(
        containerRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 85%', once: true },
        }
      );
    },
    []
  );

  const valueCards = [
    { icon: Cpu, title: 'Clean Grid Energy', desc: 'Our facilities are powered by clean energy grids to minimize ecological footprint and optimize resource extraction.' },
    { icon: ShieldCheck, title: 'SLA Uptime Guarantee', desc: 'Routine maintenance and backup power generators guarantee 99.9% hash capacity delivery to your portfolio.' },
  ];

  return (
    <div className="relative py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gold/[0.04] to-transparent pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16" ref={containerRef}>
        <PageHero
          eyebrow="Platform Mission"
          title="Democratizing Cloud Mining"
          subtitle="At AscendHash, we believe access to high-hash computing infrastructure shouldn't be gated by technical overhead, high power costs, or maintenance fees."
        />

        {/* Story Section */}
        <div className="glass-card rounded-3xl p-8 lg:p-12 space-y-6">
          <h2 className="text-2xl font-heading font-semibold text-white">Our Journey</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Founded by a dedicated team of hardware engineers, data center architects, and cryptocurrency advocates, AscendHash was built to offer transparent hash power rentals. We own and operate physical mining facilities across multiple regions, optimizing for clean energy sources like solar and hydroelectric power.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            By aggregating massive computational hardware in high-stability grids, we offer our users fractional hash rentals starting directly from their wallet balances. No maintenance fees, no hardware deterioration, and no cooling setup. We handle the operations; you secure the hash rewards.
          </p>
        </div>

        {/* Grid Stats / Why Choose Us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {valueCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-card rounded-3xl p-8 flex gap-5 hover:border-gold/25 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-gold">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-heading font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="relative text-center rounded-3xl p-10 lg:p-14 overflow-hidden border border-border-glass bg-gradient-to-br from-gold/[0.08] via-transparent to-electric-cyan/[0.06]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="relative space-y-6">
            <h2 className="text-2xl lg:text-3xl font-heading font-bold text-white">Ready to Start Your Mining Journey?</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create your account today, verify KYC, top up your wallet balance, and purchase your first high-ROI track instantly.
            </p>
            <div className="flex justify-center gap-4">
              <GlowButton to="/register">Sign Up Now</GlowButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
