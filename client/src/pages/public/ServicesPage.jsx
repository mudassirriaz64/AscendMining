import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Layers, Cpu, Server, ShieldCheck, Zap, HardDrive, Cloud, Wifi, Globe, Gem, Coins, Boxes, Database, Activity, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHero from '../../components/landing/PageHero';
import SpotlightCard from '../../components/landing/SpotlightCard';

const ICON_MAP = {
  Cpu, Server, ShieldCheck, Zap, HardDrive, Cloud, Wifi, Globe, Gem, Coins, Boxes, Database,
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const specRows = [
  { label: 'SLA Uptime', value: '99.9%', icon: ShieldCheck },
  { label: 'Deployment Grid', value: 'Multi-region', icon: Server },
  { label: 'Monitoring', value: '24/7 Real-time', icon: Activity },
  { label: 'Redundancy', value: '3x Backup', icon: Database },
];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data.data || []);
      } catch {
        console.warn('Failed to load services.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const getIcon = (name) => {
    const IconComponent = ICON_MAP[name] || Cpu;
    return <IconComponent size={24} className="text-gold" />;
  };

  return (
    <div className="relative py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <PageHero
          eyebrow="Features & Infrastructure"
          title="Our Services"
          subtitle="Explore the premium mining solutions and secure server deployments we manage for global accounts."
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
            <Layers className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-white mb-2">No Services Listed</h3>
            <p className="text-xs text-slate-400">We are currently updating our cloud hardware specifications. Please check back shortly.</p>
          </div>
        ) : (
          <m.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {services.map((service) => {
              const isExpanded = expandedId === service._id;
              return (
                <m.div key={service._id} variants={cardVariants} layout className="h-full">
                  <SpotlightCard className="p-8 h-full flex flex-col">
                    <m.div
                      className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,184,0,0.15)]"
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    >
                      {getIcon(service.icon)}
                    </m.div>
                    <h3 className="text-lg font-heading font-semibold text-white mb-3">{service.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{service.description}</p>

                    {/* Extended spec toggle */}
                    <div className="mt-auto pt-6">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : service._id)}
                        aria-expanded={isExpanded}
                        className="group inline-flex items-center gap-2 text-xs font-semibold text-gold hover:text-gold-soft transition-colors"
                      >
                        {isExpanded ? 'Hide Full Specs' : 'View Full Specs'}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 group-hover:scale-110 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <m.div
                            key="specs"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 space-y-2.5">
                              {specRows.map((row) => {
                                const Icon = row.icon;
                                return (
                                  <div key={row.label} className="flex items-center justify-between gap-3 text-xs border-b border-white/5 pb-2.5 last:border-0">
                                    <span className="flex items-center gap-2 text-slate-400">
                                      <Icon size={12} className="text-cyan-400" />
                                      {row.label}
                                    </span>
                                    <span className="font-mono text-slate-200 text-right">{row.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </m.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </SpotlightCard>
                </m.div>
              );
            })}
          </m.div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
