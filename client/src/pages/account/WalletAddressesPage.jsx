import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, Cpu, Save, LogOut } from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { updateWalletAddress, clearWithdrawalError } from '../../store/slices/withdrawalSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';

const WalletAddressesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // Pre-fill local state addresses when walletAddresses changes
  useEffect(() => {
    if (walletAddresses) {
      setFormAddresses(walletAddresses);
    }
  }, [walletAddresses]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleInputChange = (symbol, val) => {
    setFormAddresses((prev) => ({
      ...prev,
      [symbol]: val,
    }));
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
      
      {/* HEADER SECTION */}
      <header className="bg-gradient-to-r from-[#001f3f] to-[#083358] text-white py-4 sticky top-0 z-50 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Logo size="sm" variant="dark" className="h-10" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="/dashboard" className="text-white/95 hover:text-yellow-400 transition-colors pb-1">Home</a>
            
            {/* Withdraw Dropdown */}
            <div className="relative group cursor-pointer py-1">
              <span className="text-white hover:text-yellow-400 transition-colors pb-1 flex items-center gap-1">
                Withdraw
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="absolute left-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100">
                <a href="/withdraw" className="block px-4 py-2 text-xs font-bold hover:bg-slate-50 text-slate-655">Withdraw Now</a>
                <a href="/withdraw/history" className="block px-4 py-2 text-xs font-bold hover:bg-slate-50 text-slate-655">My Withdrawals</a>
              </div>
            </div>
            
            <div className="relative group cursor-pointer">
              <span className="text-white/95 hover:text-yellow-400 transition-colors pb-1 flex items-center gap-1">
                Mining
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            <div className="relative group cursor-pointer">
              <span className="text-white/95 hover:text-yellow-400 transition-colors pb-1 flex items-center gap-1">
                Support Ticket
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            {/* My Account Dropdown */}
            <div className="relative group cursor-pointer py-1">
              <span className="text-yellow-400 font-semibold border-b-2 border-yellow-400 pb-1 flex items-center gap-1">
                My Account
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="absolute left-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100">
                <a href="/wallets" className="block px-4 py-2 text-xs font-bold hover:bg-slate-50 text-[#083358]">Wallets</a>
              </div>
            </div>
          </nav>

          <button 
            onClick={handleLogout}
            className="bg-white text-[#0a1931] hover:bg-yellow-400 hover:text-slate-900 px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

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
