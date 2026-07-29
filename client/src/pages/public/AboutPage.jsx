import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Cpu, HardDrive, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const AboutPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
          }
        }
      );
    }
  }, []);

  return (
    <div className="bg-bg-light-alt py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16" ref={containerRef}>
        {/* Story Title */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Platform Mission</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Democratizing Cloud Mining</h1>
          <p className="text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
            At AscendHash, we believe access to high-hash computing infrastructure shouldn't be gated by technical overhead, high power costs, or maintenance fees.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white border border-border-light rounded-2xl p-8 lg:p-12 shadow-sm space-y-6">
          <h2 className="text-2xl font-heading font-semibold text-text-light-bg">Our Journey</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Founded by a dedicated team of hardware engineers, data center architects, and cryptocurrency advocates, AscendHash was built to offer transparent hash power rentals. We own and operate physical mining facilities across multiple regions, optimizing for clean energy sources like solar and hydroelectric power.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            By aggregating massive computational hardware in high-stability grids, we offer our users fractional hash rentals starting directly from their wallet balances. No maintenance fees, no hardware deterioration, and no cooling setup. We handle the operations; you secure the hash rewards.
          </p>
        </div>

        {/* Grid Stats / Why Choose Us */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-border-light rounded-2xl p-8 shadow-sm flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <Cpu className="text-secondary" size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-text-light-bg mb-2">Clean Grid Energy</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Our facilities are powered by clean energy grids to minimize ecological footprint and optimize resource extraction.
              </p>
            </div>
          </div>

          <div className="bg-white border border-border-light rounded-2xl p-8 shadow-sm flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-secondary" size={20} />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-text-light-bg mb-2">SLA Uptime Guarantee</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Routine maintenance and backup power generators guarantee 99.9% hash capacity delivery to your portfolio.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-bg-dark text-white rounded-2xl p-8 lg:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/15 rounded-full filter blur-[80px]" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl font-heading font-bold">Ready to Start Your Mining Journey?</h2>
            <p className="text-xs text-text-dark-bg/80 max-w-md mx-auto">
              Create your account today, verify KYC, top up your wallet balance, and purchase your first high-ROI track instantly.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="bg-primary text-text-light-bg hover:bg-primary-hover px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md active:scale-95"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
