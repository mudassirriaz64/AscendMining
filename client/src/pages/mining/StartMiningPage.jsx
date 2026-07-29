import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Sparkles, X, Wallet, AlertTriangle } from 'lucide-react';
import { fetchPackages, purchasePlan } from '../../store/slices/packageSlice';
import { checkAuth } from '../../store/slices/authSlice';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';

const StartMiningPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { packages, loading } = useSelector((state) => state.package);
  const { user } = useSelector((state) => state.auth);
  
  // State for Purchase modal
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    dispatch(fetchPackages());
    dispatch(checkAuth());
  }, [dispatch]);

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    if ((user?.walletBalance || 0) < selectedPlan.price) {
      toast.error('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    const payload = {
      packageId: selectedPlan._id,
    };

    const res = await dispatch(purchasePlan(payload));
    if (!res.error) {
      toast.success('Mining plan purchased successfully! Your mining has started.');
      closeModal();
      navigate('/mining/tracks');
    } else {
      toast.error(res.payload?.error?.message || 'Failed to complete purchase.');
    }
  };

  const openModal = (plan) => {
    setSelectedPlan(plan);
  };

  const closeModal = () => {
    setSelectedPlan(null);
  };

  if (loading && packages.length === 0) {
    return <PageSkeleton />;
  }

  const hasSufficientBalance = selectedPlan && (user?.walletBalance || 0) >= selectedPlan.price;

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans antialiased text-slate-800 pb-12">
      <Header />

      <main className="max-w-7xl w-full mx-auto px-6 py-12 flex-grow space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} className="animate-spin" /> Mining Hardware Nodes
          </div>
          <h1 className="text-3xl font-black text-[#001f3f] tracking-tight uppercase">
            Start Mining Crypto
          </h1>
          <p className="text-slate-500 text-sm">
            Choose a hardware lease plan below. Purchases are made instantly from your USD wallet balance.
          </p>

          {/* Current balance card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 max-w-xs mx-auto flex items-center justify-between mt-4">
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Balance</p>
              <h3 className="text-lg font-black text-slate-800">${(user?.walletBalance || 0).toFixed(2)}</h3>
            </div>
            <button
              onClick={() => navigate('/deposit')}
              className="bg-[#185adb] hover:bg-[#1242a3] text-white font-bold text-[10px] px-3.5 py-2 rounded-lg transition uppercase tracking-wider cursor-pointer"
            >
              Deposit / Top Up
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="flex flex-wrap justify-center gap-8">
          {packages.map((pkg) => (
            <div 
              key={pkg._id} 
              className="bg-[#e2b007] rounded-2xl shadow-xl border border-yellow-600/10 p-6 flex flex-col items-center justify-between text-center max-w-[280px] w-full transition-transform hover:scale-[1.03] duration-300 relative group overflow-hidden"
            >
              {/* Coin Badge */}
              <div className="flex flex-wrap justify-center gap-1 mb-6">
                {(pkg.coins || []).map((coin) => (
                  <span key={coin._id || coin} className="bg-[#001f3f] text-yellow-400 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md">
                    {coin.symbol || coin}
                  </span>
                ))}
              </div>

              {/* Smiley graphic */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-yellow-400 mb-6 shadow-inner text-yellow-500 transition-transform group-hover:rotate-12 duration-500">
                <svg className="w-12 h-12 text-[#e2b007]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              </div>

              {/* Package Details */}
              <div className="space-y-1 mb-2">
                <h3 className="text-white text-xl font-black tracking-wider uppercase drop-shadow-sm">
                  {pkg.name}
                </h3>
                <div className="text-white text-2xl font-black drop-shadow-sm">
                  ${pkg.price.toFixed(2)} <span className="text-white/80 text-xs font-semibold">/ {pkg.duration} Day</span>
                </div>
              </div>

              {/* Custom specs */}
              <div className="w-full border-t border-white/20 pt-4 pb-6 mt-2 space-y-1.5 text-white/90 text-xs font-bold">
                <p>Speed: {pkg.hashRate} Mhash/s</p>
                <p>Daily ROI: {(pkg.dailyROI || 0).toFixed(2)}%</p>
                <p className="text-amber-100 font-extrabold uppercase">Payout Target: {(pkg.coins || []).map(c => c.symbol || c).join(', ') || 'N/A'}</p>
              </div>

              {/* Buy Now Button */}
              <button 
                onClick={() => openModal(pkg)}
                className="w-full bg-[#001f3f] text-white hover:bg-[#083358] font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#001f3f] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wide">Confirm Purchase</h2>
                <p className="text-xs text-yellow-400 font-bold mt-0.5">Plan: {selectedPlan.name}</p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Balance & Price Details */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Plan Lease Price</span>
                  <span className="font-bold text-slate-800">${selectedPlan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-3">
                  <span className="font-semibold text-slate-500">Your Current Balance</span>
                  <span className="font-bold text-slate-800">${(user?.walletBalance || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Conditional warning or confirmation message */}
              {hasSufficientBalance ? (
                <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 flex gap-3 text-xs text-blue-800">
                  <Wallet className="text-[#185adb] w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Instant Activation</p>
                    <p className="text-blue-600 mt-0.5 leading-relaxed">
                      Clicking confirm will instantly deduct <strong>${selectedPlan.price.toFixed(2)}</strong> from your wallet balance and activate your mining lease. Daily payouts will start accumulating.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-xs text-red-800">
                  <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Insufficient Wallet Balance</p>
                    <p className="text-red-600 mt-0.5 leading-relaxed">
                      You do not have enough funds to purchase this plan. Please top up your wallet balance first before subscribing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={closeModal}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              {hasSufficientBalance ? (
                <button 
                  onClick={handleConfirmPurchase}
                  className="bg-[#001f3f] hover:bg-[#083358] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  Confirm Lease
                </button>
              ) : (
                <button 
                  onClick={() => {
                    closeModal();
                    navigate('/deposit');
                  }}
                  className="bg-[#185adb] hover:bg-[#1242a3] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  Deposit Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartMiningPage;
