import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const IconComponent = Icons[name] || Icons.Cpu;
    return <IconComponent size={24} className="text-secondary" />;
  };

  return (
    <div className="bg-bg-light-alt py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Features & Infrastructure</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Our Services</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Explore the premium mining solutions and secure server deployments we manage for global accounts.
          </p>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white border border-border-light rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto">
            <Icons.Layers className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-2">No Services Listed</h3>
            <p className="text-xs text-text-secondary">We are currently updating our cloud hardware specifications. Please check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div 
                key={service._id} 
                className="bg-white border border-border-light rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {getIcon(service.icon)}
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-3 group-hover:text-secondary transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
