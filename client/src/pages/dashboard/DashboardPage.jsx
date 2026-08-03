import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wallet, Cpu, Clock, LogOut, 
  ShieldAlert, RefreshCw, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchDashboardSummary, claimMiningPayout, updateBalance, updateMiningStatus, addTransaction } from '../../store/slices/dashboardSlice';
import { logoutUser, updateUserKycStatus } from '../../store/slices/authSlice';
import { connectDashboardSocket, disconnectDashboardSocket } from '../../services/dashboardSocket';
import Logo from '../../components/common/Logo';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';
import TransactionsTable from '../../components/common/TransactionsTable';

const ActivePackageCard = ({ pkg }) => {
  const dispatch = useDispatch();
  const [timeLeft, setTimeLeft] = useState('');
  const [isReadyToClaim, setIsReadyToClaim] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);


  const { balances, miningSettings } = useSelector((state) => state.dashboard);

  useEffect(() => {
    if (!pkg || !pkg.nextMiningAt) {
      setTimeLeft('');
      setIsReadyToClaim(false);
      setProgressPercent(0);
      return;
    }

    const updateTimer = () => {
      const nextTime = new Date(pkg.nextMiningAt).getTime();
      const now = Date.now();
      const difference = nextTime - now;
      const durationMs = 24 * 60 * 60 * 1000;
      const elapsedMs = Math.max(0, durationMs - difference);
      const computedPercent = Math.min(100, Math.floor((elapsedMs / durationMs) * 100));
      setProgressPercent(computedPercent);

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
  }, [pkg]);



  const getEstTodayForCoins = () => {
    const coins = pkg.packageId?.coins || [];
    if (coins.length === 0) return '0.0000 TX';
    return coins.map((coin) => {
      const coinRate = coin.usdRate || 1.0;
      const usdProfit = pkg.purchaseAmount * (pkg.dailyROISnapshot / 100);
      const coinProfit = usdProfit / coinRate;
      return `${coinProfit.toFixed(4)} ${coin.symbol}`;
    }).join(' + ');
  };

  const getTotalMinedForCoins = () => {
    const coins = pkg.packageId?.coins || [];
    if (coins.length === 0) return '0.0000 TX';
    return coins.map((coin) => {
      const balance = balances.miningBalances?.[coin.symbol] || 0;
      return `${balance.toFixed(4)} ${coin.symbol}`;
    }).join(' + ');
  };

  const hashRate = pkg.hashRateSnapshot || pkg.packageId?.hashRate || 0;

  return (
    <div className="space-y-4">
      {/* 1. Plan Details card */}
      <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/4 bg-on-secondary-fixed p-5 flex flex-col justify-center gap-1.5 min-h-[120px] md:min-h-0">
          <p className="font-label-caps text-[10px] text-primary-fixed-dim uppercase tracking-wider">Active Track</p>
          <h3 className="font-heading text-2xl text-white font-extrabold leading-none tracking-tight truncate">
            {pkg.packageId?.name || 'Mining Plan'}
          </h3>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-teal/20 text-brand-teal rounded-full w-fit border border-brand-teal/30">
            <div className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
          </div>
        </div>
        <div className="flex-grow p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-0.5">
            <p className="font-label-caps text-[10px] text-page-text-soft uppercase">Investment</p>
            <p className="text-sm font-bold text-page-text font-mono">
              ${(pkg.purchaseAmount || 0).toFixed(2)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="font-label-caps text-[10px] text-page-text-soft uppercase">ROI Rate</p>
            <p className="text-sm font-bold text-amber-500 font-mono">
              {pkg.dailyROISnapshot || '0.00'}%
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="font-label-caps text-[10px] text-page-text-soft uppercase">Started On</p>
            <p className="text-xs text-page-text font-semibold">
              {new Date(pkg.cycleStartedAt || pkg.startDate).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="font-label-caps text-[10px] text-page-text-soft uppercase">Ends On</p>
            <p className="text-xs text-page-text font-semibold">
              {pkg.cycleEndsAt ? new Date(pkg.cycleEndsAt).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Live Mining Progress panel */}
      <div className="bg-page-card border border-page-border rounded-2xl p-6 overflow-hidden">
        <div className="bg-transparent pb-4 flex items-center gap-3 border-b border-page-border">
          <div className="bg-primary-container p-1.5 rounded shadow-[0_0_12px_rgba(62,205,190,0.5)] border border-brand-teal/40">
            <Cpu className="w-5 h-5 text-on-primary-fixed" />
          </div>
          <h2 className="text-page-text font-headline-md text-headline-md">Live Mining Progress - {pkg.packageId?.name}</h2>
        </div>
        
        <div className="pt-6 space-y-8">
          {/* Progress Header */}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps text-page-text-soft uppercase">Current Engine Status:</span>
              {miningSettings?.isPaused ? (
                <span className="text-amber-500 font-bold text-sm tracking-wide">PAUSED</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
                  <span className="text-[#1e786b] dark:text-brand-teal font-bold text-sm tracking-wide uppercase">Active</span>
                </div>
              )}
            </div>
            <span className="bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-[0_0_10px_rgba(251,191,36,0.15)] animate-pulse">
              {progressPercent}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-900/80 border border-white/10 rounded-full overflow-hidden p-0.5 relative">
            <div 
              className={`h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-700 ease-out relative ${
                progressPercent >= 90 
                  ? 'shadow-[0_0_15px_rgba(52,211,153,0.6)]' 
                  : 'shadow-[0_0_15px_rgba(251,191,36,0.6)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              {/* Sweeping Light Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer -skew-x-12" />
              
              {/* Leading Edge Orb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_12px_#fbbf24] animate-pulse z-10" />
            </div>
          </div>

          {/* Mining Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-page-fill border border-page-border-soft p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
              <p className="font-data-lg text-data-lg text-page-text font-mono">
                {getEstTodayForCoins()}
              </p>
              <p className="font-label-caps text-[10px] text-page-text-soft uppercase font-bold mt-1">Est. Today</p>
            </div>
            <div className="bg-page-fill border border-page-border-soft p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
              <p className="font-data-lg text-data-lg text-page-text font-mono">
                {getTotalMinedForCoins()}
              </p>
              <p className="font-label-caps text-[10px] text-page-text-soft uppercase font-bold mt-1">Total Mined</p>
            </div>
            <div className="bg-page-fill border border-page-border-soft p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
              <p className="font-data-lg text-data-lg text-page-text font-mono">
                {hashRate.toFixed(2)} MH/S
              </p>
              <p className="font-label-caps text-[10px] text-page-text-soft uppercase font-bold mt-1">Hash Rate</p>
            </div>
          </div>

          {/* Automated Payout Info Row */}
          <div className="bg-page-fill border border-page-border-soft p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <h4 className="font-headline-md text-headline-md text-page-text font-bold">Next Automated Payout In</h4>
              <p className="text-sm text-page-text-soft">Your rewards are automatically distributed to your balance every 24 hours.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {timeLeft ? (
                isReadyToClaim ? (
                  <div className="bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 px-4 py-3 rounded-full text-xs font-mono font-bold shadow-sm animate-pulse">
                    Processing Payout...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-page-card border border-page-border px-4 py-3 rounded-lg font-mono text-xs text-page-text-muted font-bold shadow-sm">
                    <Clock size={14} className="animate-pulse text-primary" />
                    {timeLeft}
                  </div>
                )
              ) : (
                <div className="bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 px-4 py-3 rounded-full text-xs font-mono font-bold shadow-sm animate-pulse">
                  Processing Payout...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  const { 
    balances, 
    miningStatus, 
    coins,
    activePackages,
    latestTransactions,
    miningSettings, 
    loading, 
    error 
  } = useSelector((state) => state.dashboard);

  const [activeCoinIndex, setActiveCoinIndex] = useState(0);
  const currentCoin = coins[activeCoinIndex];
  const hasActivePlan = activePackages && activePackages.length > 0;

  const groupedPackages = activePackages ? activePackages.reduce((acc, pkg) => {
    const planName = pkg.packageId?.name || 'Mining Plan';
    if (!acc[planName]) {
      acc[planName] = [];
    }
    acc[planName].push(pkg);
    return acc;
  }, {}) : {};

  const loadDashboard = useCallback(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const socket = connectDashboardSocket();
    socket.emit('subscribe:balance');
    socket.emit('subscribe:mining');

    const onBalanceUpdate = (data) => {
      dispatch(updateBalance(data));
    };
    const onMiningUpdate = (data) => {
      dispatch(updateMiningStatus(data));
    };
    const onTransactionUpdate = (data) => {
      dispatch(addTransaction(data));
    };
    const onUserStatusChange = (data) => {
      dispatch(updateUserKycStatus(data));
      loadDashboard();
    };
    const onRealtimeChange = () => {
      loadDashboard();
    };

    socket.on('balance:update', onBalanceUpdate);
    socket.on('mining:update', onMiningUpdate);
    socket.on('transaction:update', onTransactionUpdate);
    socket.on('user:status:change', onUserStatusChange);
    socket.on('deposit:status:change', onRealtimeChange);
    socket.on('withdrawal:status:change', onRealtimeChange);
    socket.on('withdrawal:update', onRealtimeChange);

    return () => {
      socket.off('balance:update', onBalanceUpdate);
      socket.off('mining:update', onMiningUpdate);
      socket.off('transaction:update', onTransactionUpdate);
      socket.off('user:status:change', onUserStatusChange);
      socket.off('deposit:status:change', onRealtimeChange);
      socket.off('withdrawal:status:change', onRealtimeChange);
      socket.off('withdrawal:update', onRealtimeChange);
      socket.emit('unsubscribe:balance');
      socket.emit('unsubscribe:mining');
      disconnectDashboardSocket();
    };
  }, [dispatch, loadDashboard]);

  const handleClaimReward = async () => {
    if (!activePackage?._id) return;
    const res = await dispatch(claimMiningPayout(activePackage._id));
    if (!res.error) {
      toast.success('Mining reward claimed successfully!');
    } else {
      toast.error(res.payload?.error?.message || 'Failed to claim reward.');
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
      <div className="max-w-7xl w-full mx-auto px-6 py-10 flex-1 flex items-center justify-center">
        <div className="bg-white/70 dark:bg-[#0d1420]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-md p-12 text-center max-w-md w-full">
          <div className="bg-error-container w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2 font-heading">Failed to Load Dashboard</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {error?.message || 'An unexpected error occurred while loading your dashboard.'}
          </p>
          <button
            onClick={loadDashboard}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-primary-container text-on-primary-fixed hover:brightness-110 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container-max w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
      {miningSettings?.isPaused && (
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center gap-3 text-on-surface text-sm font-medium shadow-sm">
            <ShieldAlert size={18} className="text-primary flex-shrink-0" />
            <div>
              <p className="font-bold font-heading">Mining Operations Paused</p>
              <p className="text-xs text-on-surface-variant mt-0.5">The administrator has temporarily paused the mining claims. Your timers will continue counting down, but reward payouts are suspended.</p>
            </div>
          </div>
        )}
        
        {/* Wallet Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Balance Card */}
          <div className="bg-on-secondary-fixed rounded-xl p-card-padding shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => navigate('/deposit')}
                className="bg-primary-container text-on-primary-fixed font-bold text-xs px-3 py-1 rounded-full hover:brightness-110 transition-all uppercase tracking-wider cursor-pointer"
              >
                Top Up
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-primary-container/20 w-12 h-12 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary-fixed-dim" />
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-secondary-fixed-dim/70 uppercase">Balance</p>
                <p className="font-headline-lg text-headline-lg text-white font-mono mt-1">
                  {(balances.walletBalance || 0).toFixed(2)}{' '}
                  <span className="text-primary-fixed-dim text-lg">USD</span>
                </p>
              </div>
            </div>
          </div>

          {/* Coin Wallet Card */}
          <div className="bg-on-secondary-fixed rounded-xl p-card-padding shadow-sm relative overflow-hidden group">
            {hasActivePlan ? (
              <>
                {coins.length > 1 && (
                  <div className="absolute top-0 right-0 p-4 flex items-center gap-1">
                    <button
                      onClick={() => setActiveCoinIndex((i) => (i - 1 + coins.length) % coins.length)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary-container/30 flex items-center justify-center transition-all cursor-pointer"
                      aria-label="Previous coin"
                    >
                      <ChevronLeft size={16} className="text-secondary-fixed-dim/70 group-hover:text-primary-fixed-dim transition-colors" />
                    </button>
                    <button
                      onClick={() => setActiveCoinIndex((i) => (i + 1) % coins.length)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary-container/30 flex items-center justify-center transition-all cursor-pointer"
                      aria-label="Next coin"
                    >
                      <ChevronRight size={16} className="text-secondary-fixed-dim/70 group-hover:text-primary-fixed-dim transition-colors" />
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div className="bg-primary-container/20 w-12 h-12 rounded-lg flex items-center justify-center">
                    {currentCoin?.logoUrl ? (
                      <img src={currentCoin.logoUrl} alt={currentCoin.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <Cpu className="w-6 h-6 text-primary-fixed-dim" />
                    )}
                  </div>
                  <div>
                    <p className="font-label-caps text-label-caps text-secondary-fixed-dim/70 uppercase">
                      {currentCoin?.name || 'Coin'} Wallet
                      {coins.length > 1 && (
                        <span className="ml-2 text-[10px] text-secondary-fixed-dim/50">
                          {activeCoinIndex + 1}/{coins.length}
                        </span>
                      )}
                    </p>
                    <p className="font-headline-lg text-headline-lg text-white font-mono mt-1">
                      {(balances.miningBalances?.[currentCoin?.symbol || 'TX'] || 0).toFixed(4)}{' '}
                      <span className="text-primary-fixed-dim text-lg">{currentCoin?.symbol || 'TX'}</span>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 items-center justify-center py-4 text-center">
                <Cpu className="w-10 h-10 text-secondary-fixed-dim/40" />
                <p className="font-body-md text-body-md text-secondary-fixed-dim/60">
                  Purchase a mining plan to start earning coins
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Active Mining Plans */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-heading text-xl font-extrabold uppercase tracking-wider text-on-surface">
              Active Plans
            </h2>
            {activePackages && activePackages.length > 0 && (
              <span className="bg-primary-container/20 text-primary-container px-3 py-1 rounded-full text-xs font-bold uppercase border border-primary-container/30">
                {activePackages.length} Plan{activePackages.length > 1 ? 's' : ''} Running
              </span>
            )}
          </div>
          {activePackages && activePackages.length > 0 ? (
            <div className="flex flex-col gap-10">
              {activePackages.map((pkg) => (
                <ActivePackageCard key={pkg._id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <Cpu className="w-12 h-12 text-primary animate-pulse" />
              <div>
                <p className="font-heading text-base font-bold text-page-text">No Active Mining Plans</p>
                <p className="text-xs text-page-text-soft mt-1">Start cloud mining packages to earn high-yield payouts.</p>
              </div>
              <button
                onClick={() => navigate('/mining/plans')}
                className="bg-primary-container text-on-primary-fixed hover:brightness-110 font-bold px-6 py-3 rounded-xl cursor-pointer text-xs transition-all active:scale-95"
              >
                Purchase Plan
              </button>
            </div>
          )}
        </section>

        {/* Latest Transactions Table */}
        <section className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl shadow-xl overflow-hidden">
          <div className="p-card-padding flex justify-between items-center border-b border-page-border">
            <h2 className="font-headline-md text-headline-md text-page-text uppercase">
              LATEST <span className="text-primary font-extrabold">TRANSACTIONS</span>
            </h2>
            <span 
              onClick={() => navigate('/transactions')} 
              className="text-primary font-bold text-sm hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All 
              <ArrowRight size={14} />
            </span>
          </div>
          
          <TransactionsTable transactions={latestTransactions} loading={loading} />
        </section>

    </div>
  );
};

export default DashboardPage;
