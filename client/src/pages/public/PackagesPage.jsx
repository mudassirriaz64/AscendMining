import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { m } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHero from '../../components/landing/PageHero';
import GlowButton from '../../components/landing/GlowButton';
import BorderBeam from '../../components/landing/ui/BorderBeam';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/packages');
        setPackages(response.data.data || []);
      } catch {
        console.warn('Failed to load packages.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="relative py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PageHero
          eyebrow="Investment Tracks"
          title="Cloud Mining Packages"
          subtitle="Choose a high-capacity hash rate track matched to your investment scope. Purchases are funded directly from your wallet balance."
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : packages.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
            <Layers className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-white mb-2">No Packages Available</h3>
            <p className="text-xs text-slate-400">We are currently configuring new hardware contracts. Please contact support or check back soon.</p>
          </div>
        ) : (
          <m.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {packages.map((pkg) => {
              const isPopular = pkg.popular || (pkg.description || '').toLowerCase().includes('most popular');
              return (
                <m.div
                  key={pkg._id}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`relative glass-card rounded-3xl p-8 flex flex-col justify-between ${
                    isPopular
                      ? 'shadow-[0_12px_44px_rgba(255,184,0,0.12)]'
                      : 'hover:shadow-[0_16px_50px_rgba(255,184,0,0.08)]'
                  }`}
                >
                  {isPopular ? <BorderBeam size={250} duration={10} colorFrom="#FFB800" colorTo="#00F0FF" /> : null}

                  {isPopular ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-gold to-gold-soft text-[#101828] shadow-[0_4px_20px_rgba(255,184,0,0.35)]">
                      Most Popular
                    </span>
                  ) : null}

                  <div className="space-y-6">
                    {/* Title & Badge */}
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-xl font-heading font-semibold text-white">{pkg.name}</h3>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(pkg.coins || []).map((coin) => (
                          <span key={coin._id || coin} className="px-2.5 py-1 rounded-full bg-electric-cyan/10 border border-electric-cyan/25 text-[10px] font-bold text-electric-cyan uppercase">
                            {coin.symbol || coin}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Details */}
                    <div className="border-y border-border-glass py-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Price</span>
                        <span className="font-mono font-semibold text-white">${pkg.price?.toLocaleString()} USD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Daily ROI</span>
                        <span className="font-mono font-semibold text-emerald">+{pkg.dailyROI}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-medium">Duration</span>
                        <span className="font-mono font-semibold text-white">{pkg.duration} Days</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {pkg.description || 'Access dedicated high-efficiency cloud computing grids.'}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-8">
                    <GlowButton to="/register" className="w-full" shine>
                      Start Mining Plan
                    </GlowButton>
                  </div>
                </m.div>
              );
            })}
          </m.div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
