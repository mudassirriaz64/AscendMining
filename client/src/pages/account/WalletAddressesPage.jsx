import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Cpu, Save } from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { updateWalletAddress, clearWithdrawalError } from '../../store/slices/withdrawalSlice';
import Header from '../../components/common/Header';
import Logo from '../../components/common/Logo';
import PageSkeleton from '../../components/common/PageSkeleton';

const WalletAddressesPage = () => {
  const dispatch = useDispatch();

  const { 
    walletAddresses, 
    coins, 
    loading: dashboardLoading 
  } = useSelector((state) => state.dashboard);

  const { 
    loading: actionLoading 
  } = useSelector((state) => state.withdrawal);

  const [formAddresses, setFormAddresses] = useState({});

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    if (walletAddresses) {
      setFormAddresses(walletAddresses);
    }
  }, [walletAddresses]);

  const handleInputChange = (coinSymbol, value) => {
    setFormAddresses((prev) => ({ ...prev, [coinSymbol]: value }));
  };

  const handleSaveAddress = async (coinSymbol) => {
    const address = formAddresses[coinSymbol] || '';

    if (!address.trim()) {
      toast.error(`Please provide a valid address for ${coinSymbol}.`);
      return;
    }

    const res = await dispatch(updateWalletAddress({ 
      coinSymbol, 
      address: address.trim() 
    }));

    if (!res.error) {
      toast.success(`${coinSymbol} wallet address saved successfully!`);
    } else {
      toast.error(res.payload?.error?.message || 'Failed to update wallet address.');
    }
  };

  if (dashboardLoading && !coins?.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      
      {/* Shared Header — full nav with all dropdowns */}
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-2xl w-full mx-auto px-6 py-12 flex-grow space-y-8">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Wallet <span className="text-yellow-500">Addresses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Configure your destination wallet payout addresses for your mined coins.</p>
        </div>

        {/* INPUT ADDRESS LIST CARDS */}
        <section className="space-y-6">
          {!coins || coins.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-450 font-medium text-sm">
              No active mining coins available.
            </div>
          ) : (
            coins.map((coin) => (
              <div 
                key={coin._id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center space-x-3 text-[#083358]">
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{coin.name} ({coin.symbol}) Payout Address</h2>
                </div>

                <div className="flex gap-4">
                  <div className="relative flex-grow rounded-xl shadow-sm">
                    <input
                      type="text"
                      required
                      value={formAddresses[coin.symbol] || ''}
                      onChange={(e) => handleInputChange(coin.symbol, e.target.value)}
                      placeholder={`Paste your ${coin.symbol} payout wallet address here`}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleSaveAddress(coin.symbol)}
                    disabled={actionLoading}
                    className="bg-[#0a1931] hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider whitespace-nowrap"
                  >
                    <Save size={14} className="text-yellow-400" />
                    Save
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-10 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="flex justify-center items-center opacity-70">
            <Logo size="sm" variant="dark" className="h-8" />
          </div>
          <p className="text-slate-500 text-xs">
            Copyright © 2026 <span className="text-yellow-400 font-bold">AscendX Mining</span>. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default WalletAddressesPage;
