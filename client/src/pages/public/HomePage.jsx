import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, ShieldCheck, Coins, Users, Cpu, Clock, Send, Star, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const navigate = useNavigate();
  const heroTextRef = useRef(null);
  const coinRef = useRef(null);
  const btcRef = useRef(null);
  const ethRef = useRef(null);
  const stackRef = useRef(null);
  const statsSectionRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const securityRef = useRef(null);

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const stats = [
    { target: 75000, suffix: '+', label: 'Active Miners' },
    { target: 3.5, suffix: 'M+', label: 'Total Payouts ($)', isDecimal: true },
    { target: 99.9, suffix: '%', label: 'Uptime SLA', isDecimal: true },
    { target: 60, suffix: '+', label: 'Supported Countries' },
  ];

  const features = [
    { icon: <Zap size={24} className="text-secondary" />, title: 'Instant Mining Payouts', desc: 'Get your earnings credited immediately to your balance every 24 hours with absolute automation.' },
    { icon: <ShieldCheck size={24} className="text-secondary" />, title: 'Grade-A Security', desc: 'Multi-signature cold wallets and full data sanitization protect your capital and investments.' },
    { icon: <Cpu size={24} className="text-secondary" />, title: 'Premium Hash Power', desc: 'Access state-of-the-art ASIC hardware and clean energy source farms without maintenance fees.' },
  ];

  const steps = [
    { number: '01', title: 'Create Account', desc: 'Sign up in less than a minute. Complete simple KYC verification to secure your identity.' },
    { number: '02', title: 'Top Up Balance', desc: 'Deposit funds instantly into your wallet balance using our secure multi-network cryptocurrency gates.' },
    { number: '03', title: 'Purchase Package', desc: 'Select from our dynamic high-ROI mining tracks and activate your power cycle with one click.' },
  ];

  const testimonials = [
    { name: 'Sarah K.', role: 'Crypto Investor', text: 'AscendHash completely changed my view on cloud mining. The daily payouts are instant, and the dashboard is incredibly clean.', stars: 5 },
    { name: 'David M.', role: 'Tech Entrepreneur', text: 'I started with the beginner track, and within months scaled to the premium packages. Responsive support team and fully consistent cycles.', stars: 5 },
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 1. Hero Text Reveal Animation
    if (heroTextRef.current) {
      gsap.fromTo(heroTextRef.current.children, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }

    // 2. Coin floating animations
    if (coinRef.current) {
      gsap.to(coinRef.current, {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }
    if (btcRef.current) {
      gsap.to(btcRef.current, {
        y: 10,
        x: -5,
        rotation: 6,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
      
      // ScrollTrigger Parallax
      gsap.to(btcRef.current, {
        y: -40,
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      });
    }
    if (ethRef.current) {
      gsap.to(ethRef.current, {
        y: -10,
        x: 5,
        rotation: -6,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      // ScrollTrigger Parallax
      gsap.to(ethRef.current, {
        y: -70,
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      });
    }
    if (stackRef.current) {
      gsap.to(stackRef.current, {
        y: 8,
        x: -3,
        rotation: 4,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      // ScrollTrigger Parallax
      gsap.to(stackRef.current, {
        y: -30,
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        }
      });
    }

    // 3. Stats Counting Animation
    if (statsSectionRef.current) {
      const statElements = statsSectionRef.current.querySelectorAll('.stat-number');
      statElements.forEach((el, index) => {
        const targetData = stats[index];
        const obj = { val: 0 };
        gsap.to(obj, {
          val: targetData.target,
          duration: 2,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            el.innerText = targetData.isDecimal 
              ? obj.val.toFixed(1) + targetData.suffix 
              : Math.floor(obj.val).toLocaleString() + targetData.suffix;
          }
        });
      });
    }

    // 4. Staggered Feature Cards Reveal
    if (featuresRef.current) {
      gsap.fromTo(featuresRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    // 5. How It Works steps scroll trigger
    if (stepsRef.current) {
      gsap.fromTo(stepsRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    // 6. Testimonials Stagger
    if (testimonialsRef.current) {
      gsap.fromTo(testimonialsRef.current.children,
        { scale: 0.95, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: 'top 85%',
          }
        }
      );
    }

    // 7. Security Cards slide-in
    if (securityRef.current) {
      gsap.fromTo(securityRef.current.children,
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: securityRef.current,
            start: 'top 80%',
          }
        }
      );
    }
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      return toast.error('Please fill in all fields.');
    }
    setSubmitting(true);
    try {
      await api.post('/contact', contactForm);
      toast.success('Your message has been sent successfully!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-light-alt min-h-screen">
      {/* Hero Section */}
      <section id="hero-section" className="bg-bg-dark text-white relative py-20 lg:py-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/15 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-end/10 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Hero Left Content */}
          <div ref={heroTextRef} className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-semibold text-secondary">
              <Zap size={12} /> Next-Gen Cloud Mining Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              Earn Passive Income With <span className="bg-gradient-to-r from-secondary to-secondary-end bg-clip-text text-transparent">Cloud Mining</span>
            </h1>
            <p className="text-base sm:text-lg text-text-dark-bg/85 max-w-lg leading-relaxed">
              AscendHash bridges the gap between hardware complexity and passive profitability. Deploy dynamic high-hash mining power instantly from your wallet balance.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/register"
                className="bg-gradient-to-r from-secondary to-secondary-end text-white hover:opacity-95 shadow-lg shadow-secondary/20 px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Start Mining Now <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded-full font-semibold transition-all hover:bg-white/5 active:scale-95"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Hero Right Graphics */}
          <div className="relative flex justify-center items-center h-[340px] sm:h-[450px] w-full max-w-[450px] mx-auto select-none overflow-visible">
            {/* Faint rotating orbit rings behind central coin */}
            <div className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border border-white/5 animate-[spin_60s_linear_infinite] pointer-events-none motion-reduce:animate-none" />
            <div className="absolute w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] rounded-full border border-white/5 animate-[spin_40s_linear_infinite_reverse] pointer-events-none motion-reduce:animate-none" />

            {/* Central Coin Badge (Image 1 style circular lightning coin) */}
            <div ref={coinRef} className="relative z-20 w-36 h-36 sm:w-48 sm:h-48 rounded-full shadow-[0_0_40px_rgba(245,197,24,0.15)] select-none">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5C518" />
                    <stop offset="50%" stopColor="#FFE066" />
                    <stop offset="100%" stopColor="#C49A00" />
                  </linearGradient>
                  <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0B1220" />
                    <stop offset="100%" stopColor="#05080F" />
                  </linearGradient>
                </defs>

                {/* Outer Gold Border */}
                <circle cx="100" cy="100" r="95" fill="url(#navyGrad)" stroke="url(#goldGrad)" strokeWidth="6" />

                {/* Inner Gold Ring */}
                <circle cx="100" cy="100" r="75" fill="none" stroke="url(#goldGrad)" strokeWidth="2" opacity="0.6" />

                {/* Text Paths */}
                <path id="textPathTop" d="M 35 100 A 65 65 0 0 1 165 100" fill="none" />
                <path id="textPathBottom" d="M 165 100 A 65 65 0 0 1 35 100" fill="none" />

                {/* Curved Text: ASCEND (Top) & HASH (Bottom) */}
                <text fill="#F5C518" fontSize="12" fontWeight="bold" fontFamily="monospace" letterSpacing="6">
                  <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">ASCEND</textPath>
                </text>
                <text fill="#F5C518" fontSize="12" fontWeight="bold" fontFamily="monospace" letterSpacing="6">
                  <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">HASH</textPath>
                </text>

                {/* Decorative Splitters */}
                <text x="23" y="104" fill="#F5C518" fontSize="14" fontWeight="bold">||</text>
                <text x="167" y="104" fill="#F5C518" fontSize="14" fontWeight="bold">||</text>

                {/* Central Lightning Bolt Icon */}
                <g transform="translate(75, 70) scale(1.6)">
                  <polygon points="15,0 0,18 9,18 4,32 20,12 11,12" fill="#F5C518" filter="drop-shadow(0px 0px 4px rgba(245, 197, 24, 0.6))" />
                </g>
              </svg>
            </div>

            {/* Asymmetric Floating Card 1: Bitcoin (top-left) */}
            <div 
              ref={btcRef} 
              className="absolute top-2 left-2 sm:top-10 sm:left-6 bg-[#0B1220]/90 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col items-center gap-1.5 sm:gap-2 z-30 transition-transform hover:scale-105"
            >
              {/* Bitcoin Icon Card */}
              <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12 shadow-md">
                <circle cx="32" cy="32" r="28" fill="#F7931A" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="32" y="42" fill="#FFFFFF" fontSize="30" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">₿</text>
              </svg>
              {/* Attached Status Pill */}
              <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-mono text-green-400 font-bold uppercase tracking-wider">BTC Mining</span>
              </div>
            </div>

            {/* Asymmetric Floating Card 2: Ethereum (bottom-right) */}
            <div 
              ref={ethRef} 
              className="absolute bottom-2 right-2 sm:bottom-12 sm:right-6 bg-[#0B1220]/90 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col items-center gap-1.5 sm:gap-2 z-30 transition-transform hover:scale-105"
            >
              {/* Ethereum Icon Card */}
              <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12 shadow-md">
                <polygon points="32,6 48,32 32,42 16,32" fill="#3B82F6" opacity="0.8" />
                <polygon points="32,6 32,42 48,32" fill="#60A5FA" />
                <polygon points="32,44 48,34 32,58 16,34" fill="#2563EB" opacity="0.8" />
                <polygon points="32,44 32,58 48,34" fill="#3B82F6" />
              </svg>
              {/* Attached Status Pill */}
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-mono text-blue-400 font-bold uppercase tracking-wider">ETH Active</span>
              </div>
            </div>

            {/* Asymmetric Floating Card 3: Coin Stack (bottom-left) */}
            <div 
              ref={stackRef} 
              className="absolute bottom-2 left-6 sm:bottom-10 sm:left-12 bg-[#0B1220]/90 border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl z-25 transition-transform hover:scale-105 hidden sm:flex flex-col items-center justify-center gap-2"
            >
              <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-12 sm:h-12">
                <defs>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0891B2" />
                  </linearGradient>
                </defs>
                <ellipse cx="32" cy="46" rx="20" ry="7" fill="url(#cyanGrad)" stroke="#0E7490" strokeWidth="1" />
                <path d="M 12 46 L 12 51 A 20 7 0 0 0 52 51 L 52 46 Z" fill="url(#cyanGrad)" opacity="0.8" />
                <ellipse cx="32" cy="36" rx="20" ry="7" fill="url(#cyanGrad)" stroke="#0E7490" strokeWidth="1" />
                <path d="M 12 36 L 12 41 A 20 7 0 0 0 52 41 L 52 36 Z" fill="url(#cyanGrad)" opacity="0.9" />
                <ellipse cx="32" cy="26" rx="20" ry="7" fill="url(#cyanGrad)" stroke="#06B6D4" strokeWidth="1.5" />
                <path d="M 12 26 L 12 31 A 20 7 0 0 0 52 31 L 52 26 Z" fill="url(#cyanGrad)" />
                <ellipse cx="32" cy="26" rx="14" ry="4.5" fill="none" stroke="#E0F7FA" strokeWidth="1" strokeDasharray="2,2" opacity="0.8" />
              </svg>
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">High ROI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section ref={statsSectionRef} className="bg-bg-dark border-y border-white/5 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="stat-number text-3xl sm:text-4xl font-heading font-bold text-secondary">
                0
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary font-medium tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Why Choose Us</span>
          <h2 className="text-3xl font-heading font-semibold text-text-light-bg">A Secure Premium Infrastructure</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We operate thousands of ASIC miners in stable power grids, routing hash capacities directly to client balances.
          </p>
        </div>

        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-white border border-border-light rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-3">{feat.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-bg-light-alt border-y border-border-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold tracking-widest text-secondary uppercase">Three Steps</span>
            <h2 className="text-3xl font-heading font-semibold text-text-light-bg">How Cloud Mining Works</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              No hardware configuration required. Deploy cloud mining cycles in minutes from any browser.
            </p>
          </div>

          <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white border border-border-light rounded-2xl p-8 shadow-sm flex flex-col items-start relative overflow-hidden group">
                <span className="absolute top-2 right-4 text-7xl font-bold text-slate-100 select-none group-hover:text-slate-200/60 transition-colors">
                  {step.number}
                </span>
                <span className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs mb-6 relative z-10 shadow-sm">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-3 relative z-10">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed relative z-10">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Reviews</span>
          <h2 className="text-3xl font-heading font-semibold text-text-light-bg">Trusted by Over 75,000 Miners</h2>
        </div>

        <div ref={testimonialsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((test, idx) => (
            <div key={idx} className="bg-white border border-border-light rounded-2xl p-8 shadow-sm space-y-4">
              <div className="flex gap-1 text-primary">
                {[...Array(test.stars)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-text-light-bg italic leading-relaxed">
                "{test.text}"
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-text-secondary">
                  {test.name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-light-bg">{test.name}</h4>
                  <p className="text-[10px] text-text-secondary">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Info */}
      <section className="bg-bg-dark text-white py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold tracking-widest text-secondary uppercase">Enterprise Trust</span>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold">Uncompromising Safety Standards</h2>
            <p className="text-sm text-text-dark-bg/85 leading-relaxed">
              We leverage multi-tier encryption, secure hardware security modules (HSMs), and routine third-party smart contract audits to guarantee platform longevity and capital safety.
            </p>
            <div className="flex flex-col gap-4" ref={securityRef}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck size={18} className="text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Cold Storage Wallets</h4>
                  <p className="text-xs text-text-secondary mt-1">98% of customer funds are securely retained offline in hardware-isolated cold assets.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Clock size={18} className="text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Strict Payout Auditing</h4>
                  <p className="text-xs text-text-secondary mt-1">Hourly payouts run through strict double-signature server verification bounds.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Inline Form */}
          <div className="bg-[#131b2e] border border-white/10 rounded-2xl p-8 max-w-md mx-auto w-full">
            <h3 className="text-lg font-heading font-semibold mb-6">Send Us A Message</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-text-secondary mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Inquiry about custom package"
                  className="w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-text-secondary mb-1">Message</label>
                <textarea
                  id="message"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Write your request details here..."
                  className="w-full bg-[#0d1627] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-hover text-text-light-bg py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitting ? 'Sending...' : <><Send size={14} /> Send Inquiry</>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
