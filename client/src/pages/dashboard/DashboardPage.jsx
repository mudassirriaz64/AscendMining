import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wallet, Gift, Cpu, Copy, Check, LogOut, 
  ExternalLink, Clock, TrendingUp, ShieldAlert, RefreshCw
} from 'lucide-react';
import { fetchDashboardSummary, claimMiningPayout } from '../../store/slices/dashboardSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [timeLeft, setTimeLeft] = useState('');
  const [isReadyToClaim, setIsReadyToClaim] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { 
    balances, 
    referralLink, 
    miningStatus, 
    coins,
    activePackage,
    latestTransactions, 
    loading, 
    error 
  } = useSelector((state) => state.dashboard);

  const loadDashboard = useCallback(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!activePackage || !activePackage.nextMiningAt) {
      setTimeLeft('');
      setIsReadyToClaim(false);
      return;
    }

    const updateTimer = () => {
      const nextTime = new Date(activePackage.nextMiningAt).getTime();
      const now = Date.now();
      const difference = nextTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        setIsReadyToClaim(true);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimeLeft(formatted);
        setIsReadyToClaim(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activePackage]);

  const handleClaimReward = async () => {
    if (!activePackage?._id) return;
    const res = await dispatch(claimMiningPayout(activePackage._id));
    if (!res.error) {
      toast.success('Mining reward claimed successfully!');
    } else {
      toast.error(res.payload?.error?.message || 'Failed to claim reward.');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  };

  if (loading && !balances.walletBalance && latestTransactions.length === 0) {
    return <PageSkeleton />;
  }

  if (error && !balances.walletBalance && latestTransactions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
        <Header />
        <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-grow flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-12 text-center max-w-md w-full">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Dashboard</h2>
            <p className="text-sm text-slate-500 mb-6">
              {error?.message || 'An unexpected error occurred while loading your dashboard.'}
            </p>
            <button
              onClick={loadDashboard}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-grow space-y-10">
        
        {/* STATS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#0a2647] to-[#144272] text-white p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between min-h-[200px] hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-br from-[#facc15] to-[#ca8a04] w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6 text-[#0a1931]" />
            </div>
            <div className="mt-6">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Balance</p>
              <p className="text-3xl font-black">
                {balances.walletBalance.toFixed(2)}{' '}
                <span className="text-yellow-400 text-lg font-bold">USD</span>
              </p>
            </div>
          </div>

          {/* Referral Card */}
          <div className="bg-gradient-to-br from-[#0a2647] to-[#144272] text-white p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between min-h-[200px] hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-br from-[#facc15] to-[#ca8a04] w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
              <Gift className="w-6 h-6 text-[#0a1931]" />
            </div>
            <div className="mt-6">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Referral Bonus</p>
              <p className="text-3xl font-black">
                {balances.referralBalance.toFixed(2)}{' '}
                <span className="text-yellow-400 text-lg font-bold">USD</span>
              </p>
            </div>
          </div>

          {/* Active Coins Cards */}
          {coins && coins.map((coin) => {
            const coinBalance = balances.miningBalances?.[coin.symbol] || 0;
            return (
              <div key={coin._id} className="bg-gradient-to-br from-[#0a2647] to-[#144272] text-white p-6 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between min-h-[200px] hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-br from-[#facc15] to-[#ca8a04] w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
                  {coin.logoUrl ? (
                    <img src={coin.logoUrl} alt={coin.name} className="w-6 h-6 object-contain" />
                  ) : (
                    <Cpu className="w-6 h-6 text-[#0a1931]" />
                  )}
                </div>
                <div className="mt-6">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{coin.symbol} Wallet</p>
                  <p className="text-3xl font-black font-mono">
                    {coinBalance.toFixed(4)}{' '}
                    <span className="text-yellow-400 text-lg font-bold">{coin.symbol}</span>
                  </p>
                </div>
              </div>
            );
          })}
          
        </section>

        {/* REFERRAL LINK SECTION */}
        <section className="bg-[#185adb] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2.5 rounded-lg">
                <ExternalLink className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Your Referral Link</h2>
            </div>
            <p className="text-blue-100 text-sm">Share this link with your network to earn exclusive referral bonuses:</p>
            <div className="flex items-stretch shadow-md max-w-3xl">
              <input 
                type="text" 
                readOnly 
                value={referralLink || ''} 
                className="flex-grow bg-white/10 border border-white/20 rounded-l-xl text-white px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400 placeholder-white/30 text-sm font-mono"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-[#0a1931] hover:bg-slate-800 px-6 py-3 rounded-r-xl font-bold flex items-center text-xs text-white transition-all active:scale-95 cursor-pointer gap-1.5"
              >
                <Copy size={14} className="text-yellow-400" />
                Copy
              </button>
            </div>
          </div>
        </section>

        {/* LIVE MINING PROGRESS */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-6 flex items-center border-b border-slate-850">
            <div className="bg-yellow-400 p-2 rounded-lg mr-3.5">
              <Cpu className="w-5 h-5 text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Live Mining Progress</h2>
          </div>
          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-500 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                  Current Engine Status:{' '}
                  <span className={miningStatus.status === 'active' ? 'text-green-500' : 'text-slate-400'}>
                    {miningStatus.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full">
                    {miningStatus.progressPercent}% Complete
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 flex rounded-full bg-slate-100">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-yellow-500 to-orange-500 relative transition-all duration-1000 ease-in-out" 
                  style={{ width: `${miningStatus.progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f8fafc] border border-slate-100 p-6 rounded-2xl text-center hover:border-yellow-400/50 transition-colors flex flex-col justify-center space-y-4">
                {coins && coins.map(coin => (
                  <div key={coin._id}>
                    <p className="text-slate-900 text-2xl font-black font-mono">
                      {(miningStatus.estToday?.[coin.symbol] || 0).toFixed(4)}
                    </p>
                    <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Est. Today ({coin.symbol})</p>
                  </div>
                ))}
                {(!coins || coins.length === 0) && (
                  <div>
                    <p className="text-slate-900 text-2xl font-black font-mono">0.0000</p>
                    <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Est. Today (Tx)</p>
                  </div>
                )}
              </div>
              <div className="bg-[#f8fafc] border border-slate-100 p-6 rounded-2xl text-center hover:border-yellow-400/50 transition-colors flex flex-col justify-center space-y-4">
                {coins && coins.map(coin => (
                  <div key={coin._id}>
                    <p className="text-slate-900 text-2xl font-black font-mono">
                      {(balances.miningBalances?.[coin.symbol] || 0).toFixed(4)}
                    </p>
                    <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Total Mined ({coin.symbol})</p>
                  </div>
                ))}
                {(!coins || coins.length === 0) && (
                  <div>
                    <p className="text-slate-900 text-2xl font-black font-mono">0.0000</p>
                    <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Total Mined (Tx)</p>
                  </div>
                )}
              </div>
              <div className="bg-[#f8fafc] border border-slate-100 p-6 rounded-2xl text-center hover:border-yellow-400/50 transition-colors flex flex-col justify-center">
                <p className="text-slate-900 text-2xl font-black font-mono">{miningStatus.hashRate.toFixed(2)} MH/S</p>
                <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Hash Rate</p>
              </div>
            </div>

            {activePackage && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1 font-heading">Claim Daily Mining Payout</h3>
                  <p className="text-xs text-slate-500">Claim your package profit once every 24 hours. Value-based conversion applies automatically.</p>
                </div>
                <div className="flex items-center gap-3">
                  {timeLeft && !isReadyToClaim && (
                    <span className="flex items-center gap-1.5 font-mono text-sm bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold">
                      <Clock size={16} className="animate-pulse" />
                      {timeLeft}
                    </span>
                  )}
                  <button
                    onClick={handleClaimReward}
                    disabled={!isReadyToClaim || loading}
                    className={`px-6 py-3 rounded-xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5
                      ${isReadyToClaim 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-350 hover:to-orange-450 hover:shadow-lg' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                  >
                    Claim Reward
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight">
              Latest <span className="text-yellow-500">Transactions</span>
            </h2>
            <span className="text-xs font-bold text-[#185adb] hover:underline cursor-pointer">View All →</span>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              {latestTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No transactions recorded yet.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc] border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Trx ID</th>
                      <th className="px-6 py-4">Transacted At</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Post Balance</th>
                      <th className="px-6 py-4 text-right">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestTransactions.map((tx) => {
                      const isCredit = tx.type === 'mining_payout' || tx.type === 'deposit' || tx.type === 'referral_reward' || tx.type === 'cancellation_refund';
                      const isCoin = tx.type === 'mining_payout' || tx.type === 'withdrawal';
                      const unit = isCoin ? (tx.coinSymbol || 'Tx') : 'USD';
                      
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 font-bold text-slate-800 text-xs font-mono">{tx._id.slice(-12).toUpperCase()}</td>
                          <td className="px-6 py-5">
                            <p className="text-slate-900 text-xs font-semibold">{formatDateTime(tx.createdAt)}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{formatRelativeTime(tx.createdAt)}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isCredit ? '+' : '-'} {tx.amount.toFixed(isCoin ? 4 : 2)} {unit}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-slate-650 font-bold text-xs">
                            {tx.balanceAfter.toFixed(isCoin ? 4 : 2)} {unit}
                          </td>
                          <td className="px-6 py-5 text-right text-slate-400 italic text-xs max-w-xs truncate">
                            {tx.reason || `${tx.type.replace('_', ' ')}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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

export default DashboardPage;
