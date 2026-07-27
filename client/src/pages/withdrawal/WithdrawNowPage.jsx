import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wallet, Cpu, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, X, Info, LogOut
} from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { requestWithdrawal, clearWithdrawalError } from '../../store/slices/withdrawalSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';

const WithdrawNowPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { 
    balances, 
    walletAddresses, 
    coins, 
    loading: dashboardLoading 
  } = useSelector((state) => state.dashboard);

  const { 
    loading: withdrawalLoading, 
    error: withdrawalError 
  } = useSelector((state) => state.withdrawal);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const openWithdrawModal = (coin) => {
    const address = walletAddresses[coin.symbol];
    if (!address || !address.trim()) {
      toast.error(`Please configure your ${coin.symbol} wallet address first!`);
      return;
    }
    setSelectedCoin(coin);
    setAmount('');
    setIsModalOpen(true);
  };

  const closeWithdrawModal = () => {
    setIsModalOpen(false);
    setSelectedCoin(null);
    setAmount('');
    dispatch(clearWithdrawalError());
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    if (!selectedCoin) return;

    const numAmount = parseFloat(amount);
    const balance = balances.miningBalances[selectedCoin.symbol] || 0;

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (numAmount < selectedCoin.minWithdrawal) {
      toast.error(`Minimum withdrawal is ${selectedCoin.minWithdrawal} ${selectedCoin.symbol}`);
      return;
    }

    if (numAmount > selectedCoin.maxWithdrawal) {
      toast.error(`Maximum withdrawal is ${selectedCoin.maxWithdrawal} ${selectedCoin.symbol}`);
      return;
    }

    if (numAmount > balance) {
      toast.error(`Insufficient balance. You only have ${balance.toFixed(8)} ${selectedCoin.symbol}`);
      return;
    }

    const res = await dispatch(requestWithdrawal({ 
      coinSymbol: selectedCoin.symbol, 
      amount: numAmount 
    }));

    if (!res.error) {
      toast.success(`Withdrawal request for ${numAmount} ${selectedCoin.symbol} submitted successfully!`);
      closeWithdrawModal();
    } else {
      toast.error(res.payload?.error?.message || 'Failed to submit withdrawal request.');
    }
  };

  if (dashboardLoading && !coins?.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-grow space-y-8">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Withdraw <span className="text-yellow-500">Funds</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Select a coin below to request your payout directly to your wallet address.</p>
        </div>

        {/* COIN WALLET CARDS LIST */}
        <section className="space-y-6">
          {!coins || coins.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-medium text-sm">
              No active mining coins available.
            </div>
          ) : (
            coins.map((coin) => {
              const balance = balances.miningBalances?.[coin.symbol] || 0;
              const address = walletAddresses?.[coin.symbol] || '';

              return (
                <div 
                  key={coin._id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-4 flex-grow">
                    <div className="flex items-center space-x-3.5">
                      <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-[#083358]">
                        {coin.logoUrl ? (
                          <img src={coin.logoUrl} alt={coin.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Cpu className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">{coin.symbol} Wallet</h2>
                        <p className="text-lg font-black text-slate-800 font-mono mt-0.5">
                          {balance.toFixed(8)}{' '}
                          <span className="text-slate-400 text-xs font-bold">{coin.symbol.toLowerCase()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[10px]">Wallet Address</span>
                        {address ? (
                          <p className="text-slate-800 font-mono break-all font-semibold select-all mt-0.5">{address}</p>
                        ) : (
                          <p className="text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={13} />
                            No wallet address configured.{' '}
                            <a href="/wallets" className="text-[#083358] underline hover:text-blue-700 font-bold">Configure Now</a>
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
                        <div>
                          <span className="text-slate-450 font-bold uppercase tracking-wider text-[10px]">Min Limit</span>
                          <p className="font-bold text-slate-700 mt-0.5">{coin.minWithdrawal} {coin.symbol.toLowerCase()}</p>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold uppercase tracking-wider text-[10px]">Max Limit</span>
                          <p className="font-bold text-slate-700 mt-0.5">{coin.maxWithdrawal} {coin.symbol.toLowerCase()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end items-end">
                    <button
                      onClick={() => openWithdrawModal(coin)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black text-xs px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                    >
                      Withdraw Now
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>

      {/* WITHDRAW MODAL */}
      {isModalOpen && selectedCoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 transform scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Cpu className="text-yellow-400 w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider">Request Payout</h3>
              </div>
              <button 
                onClick={closeWithdrawModal}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitWithdrawal} className="p-6 space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Mined Balance:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {(balances.miningBalances?.[selectedCoin.symbol] || 0).toFixed(8)} {selectedCoin.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Sending To Address:</span>
                  <span className="font-mono text-slate-800 truncate max-w-[200px] font-bold">
                    {walletAddresses[selectedCoin.symbol]}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">
                  Withdrawal Amount ({selectedCoin.symbol})
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${selectedCoin.symbol}`}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-slate-400 font-mono">
                    {selectedCoin.symbol}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mt-1 px-1">
                  <span>Min: {selectedCoin.minWithdrawal} {selectedCoin.symbol}</span>
                  <span>Max: {selectedCoin.maxWithdrawal} {selectedCoin.symbol}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-2">
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="w-1/2 border border-slate-200 text-slate-550 font-bold text-xs py-3.5 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawalLoading}
                  className="w-1/2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  {withdrawalLoading ? 'Submitting...' : 'Confirm'}
                  <CheckCircle size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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

export default WithdrawNowPage;
