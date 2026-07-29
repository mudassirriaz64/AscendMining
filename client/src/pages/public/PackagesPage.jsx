import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Layers } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await api.get('/packages');
        // Only active packages returned from public list
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
    <div className="bg-bg-light-alt py-16 lg:py-24 min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase">Investment Tracks</span>
          <h1 className="text-4xl font-heading font-semibold text-text-light-bg">Cloud Mining Packages</h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Choose a high-capacity hash rate track matched to your investment scope. Purchases are funded directly from your wallet balance.
          </p>
        </div>

        {/* Package list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white border border-border-light rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto">
            <Layers className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-heading font-semibold text-text-light-bg mb-2">No Packages Available</h3>
            <p className="text-xs text-text-secondary">We are currently configuring new hardware contracts. Please contact support or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div 
                key={pkg._id} 
                className="bg-white border border-[#E4E7EC] rounded-2xl p-8 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {/* Title & Badge */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-heading font-semibold text-text-light-bg">{pkg.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {(pkg.coins || []).map((coin) => (
                        <span key={coin._id || coin} className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-[#2F8FEA] uppercase">
                          {coin.symbol || coin}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="border-y border-border-light py-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Price</span>
                      <span className="font-mono font-semibold text-text-light-bg">${pkg.price?.toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Daily ROI</span>
                      <span className="font-mono font-semibold text-success">+{pkg.dailyROI}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary font-medium">Duration</span>
                      <span className="font-mono font-semibold text-text-light-bg">{pkg.duration} Days</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {pkg.description || 'Access dedicated high-efficiency cloud computing grids.'}
                  </p>
                </div>

                {/* CTA Button */}
                <div className="mt-8">
                  <Link
                    to="/register"
                    className="w-full block text-center bg-primary hover:bg-primary-hover text-text-light-bg py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Sign Up to Invest
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
