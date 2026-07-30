import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wallet, Gift, Cpu, Copy, Clock, LogOut, 
  ShieldAlert, RefreshCw, ArrowRight, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchDashboardSummary, claimMiningPayout, updateBalance, updateMiningStatus, addTransaction } from '../../store/slices/dashboardSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { connectDashboardSocket, disconnectDashboardSocket } from '../../services/dashboardSocket';
import Logo from '../../components/common/Logo';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';
import TransactionsTable from '../../components/common/TransactionsTable';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [timeLeft, setTimeLeft] = useState('');
  const [isReadyToClaim, setIsReadyToClaim] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { 
    balances, 
    referralLink, 
    miningStatus, 
    coins,
    activePackage,
    latestTransactions,
    miningSettings, 
    loading, 
    error 
  } = useSelector((state) => state.dashboard);

  const [activeCoinIndex, setActiveCoinIndex] = useState(0);
  const currentCoin = coins[activeCoinIndex];
  const hasActivePlan = Boolean(activePackage?.packageId?.name);

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

    socket.on('balance:update', onBalanceUpdate);
    socket.on('mining:update', onMiningUpdate);
    socket.on('transaction:update', onTransactionUpdate);

    return () => {
      socket.off('balance:update', onBalanceUpdate);
      socket.off('mining:update', onMiningUpdate);
      socket.off('transaction:update', onTransactionUpdate);
      socket.emit('unsubscribe:balance');
      socket.emit('unsubscribe:mining');
      disconnectDashboardSocket();
    };
  }, [dispatch]);

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

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-on-surface">
        <Header />
        <main className="max-w-7xl w-full mx-auto px-6 py-10 flex-grow flex items-center justify-center">
          <div className="bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant p-12 text-center max-w-md w-full">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-on-surface">
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-container-max w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        
        {/* KYC ALERTS */}
        {user?.kycStatus === 'rejected' && (
          <div className="bg-error-container border border-error/20 rounded-xl p-4 flex items-center gap-3 text-on-error-container text-sm font-medium shadow-sm">
            <ShieldAlert size={18} className="text-error flex-shrink-0" />
            <div className="flex-grow">
              <p className="font-bold font-heading">Identity Verification Rejected</p>
              <p className="text-xs opacity-90 mt-0.5 font-semibold">Reason: {user.kycRejectionReason || 'Invalid document photo.'}</p>
            </div>
            <button 
              onClick={() => navigate('/kyc')}
              className="bg-white text-error hover:bg-slate-50 font-bold px-3 py-1.5 rounded-lg border border-error/10 cursor-pointer text-xs"
            >
              Re-submit KYC
            </button>
          </div>
        )}

        {user?.kycStatus === 'none' && (
          <div className="bg-surface-container border border-outline-variant rounded-xl p-4 flex items-center gap-3 text-on-surface text-sm font-medium shadow-sm">
            <ShieldAlert size={18} className="text-primary flex-shrink-0" />
            <div className="flex-grow">
              <p className="font-bold font-heading">Identity Verification Required</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Please complete your KYC identity verification to unlock cash withdrawals.</p>
            </div>
            <button 
              onClick={() => navigate('/kyc')}
              className="bg-primary-container text-on-primary-fixed hover:brightness-110 font-bold px-3 py-1.5 rounded-lg cursor-pointer text-xs"
            >
              Verify Now
            </button>
          </div>
        )}

        {user?.kycStatus === 'pending' && (
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 flex items-center gap-3 text-on-surface text-sm font-medium shadow-sm">
            <Clock size={18} className="text-secondary flex-shrink-0 animate-pulse" />
            <div className="flex-grow">
              <p className="font-bold font-heading">KYC Review In Progress</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Your identity documents have been submitted and are pending admin review.</p>
            </div>
            <button 
              onClick={() => navigate('/kyc')}
              className="bg-secondary-container text-on-secondary-container hover:bg-slate-200 font-bold px-3 py-1.5 rounded-lg cursor-pointer text-xs"
            >
              Check Status
            </button>
          </div>
        )}

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

          {/* Referral Bonus Card */}
          <div className="bg-on-secondary-fixed rounded-xl p-card-padding shadow-sm relative overflow-hidden group">
            <div className="flex flex-col gap-4">
              <div className="bg-primary-container/20 w-12 h-12 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary-fixed-dim" />
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-secondary-fixed-dim/70 uppercase">Referral Bonus</p>
                <p className="font-headline-lg text-headline-lg text-white font-mono mt-1">
                  {(balances.referralBalance || 0).toFixed(2)}{' '}
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

        {/* Referral Link Banner */}
        <section className="bg-gradient-to-r from-brand-teal to-tertiary rounded-xl p-card-padding text-white relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-container" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                <h2 className="font-headline-md text-headline-md">Your Referral Link</h2>
              </div>
              <p className="font-body-md text-body-md opacity-90 max-w-xl">Share this link with your network to earn exclusive referral bonuses on every successful deposit they make.</p>
            </div>
            <div className="flex items-center bg-white/10 rounded-lg p-1 pl-4 border border-white/20 backdrop-blur-sm w-full md:w-auto min-w-[320px]">
              <span className="font-mono text-xs truncate flex-grow select-all">{referralLink || ''}</span>
              <button 
                onClick={handleCopyLink}
                className="bg-on-secondary-fixed text-primary-container px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors ml-4 cursor-pointer"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          </div>
        </section>

        {/* Current Plan Card */}
        <section className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 bg-on-secondary-fixed p-card-padding flex flex-col justify-center gap-2 min-h-[160px]">
              <p className="font-label-caps text-label-caps text-primary-fixed-dim uppercase">Current Plan</p>
              <h3 className="font-heading text-4xl text-white font-extrabold leading-tight tracking-tight">
                {activePackage?.packageId?.name || 'No Active Plan'}
              </h3>
              {hasActivePlan ? (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-brand-teal/20 text-brand-teal rounded-full w-fit border border-brand-teal/30">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Active</span>
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-500/20 text-slate-400 rounded-full w-fit border border-slate-500/30">
                  <span className="text-xs font-bold uppercase tracking-widest">Inactive</span>
                </div>
              )}
            </div>
            {hasActivePlan && (
            <div className="flex-grow p-card-padding grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Investment Amount</p>
                <p className="font-headline-md text-headline-md text-on-surface font-mono">
                  ${(activePackage.purchaseAmount || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Daily Profit Rate</p>
                <p className="font-headline-md text-headline-md text-primary font-mono">
                  {activePackage.dailyROISnapshot || '0.00'}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Started On</p>
                <p className="font-body-lg text-body-lg text-on-surface">
                  {new Date(activePackage.cycleStartedAt || activePackage.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Ends On</p>
                <p className="font-body-lg text-body-lg text-on-surface">
                  {activePackage.cycleEndsAt ? new Date(activePackage.cycleEndsAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
            )}
          </div>
        </section>

        {/* Live Mining Progress Card */}
        {!miningSettings?.isDisabled && hasActivePlan && (
          <section className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="bg-on-secondary-fixed p-4 px-card-padding flex items-center gap-3">
              <div className="bg-primary-container p-1.5 rounded shadow-[0_0_12px_rgba(62,205,190,0.5)] border border-brand-teal/40">
                <Cpu className="w-5 h-5 text-on-primary-fixed" />
              </div>
              <h2 className="text-white font-headline-md text-headline-md">Live Mining Progress</h2>
            </div>
            
            <div className="p-card-padding space-y-8">
              {/* Progress Header */}
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Current Engine Status:</span>
                  {miningSettings?.isPaused ? (
                    <span className="text-amber-500 font-bold text-sm tracking-wide">PAUSED</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {miningStatus.status === 'active' && (
                        <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
                      )}
                      <span className={`${miningStatus.status === 'active' ? 'text-[#1e786b] font-bold' : 'text-slate-500'} font-bold text-sm tracking-wide uppercase`}>
                        {miningStatus.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-lg text-xs font-bold">
                  {miningStatus.progressPercent}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-4 bg-surface-container-low rounded-full overflow-hidden border border-outline-variant/30">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${miningStatus.progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-progress"></div>
                </div>
              </div>

              {/* Mining Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
                  <p className="font-data-lg text-data-lg text-on-surface font-mono">
                    {(miningStatus.estToday?.['TX'] || 0).toFixed(4)}
                  </p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Est. Today (TX)</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
                  <p className="font-data-lg text-data-lg text-on-surface font-mono">
                    {(balances.miningBalances?.['TX'] || 0).toFixed(4)}
                  </p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Total Mined (TX)</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-xl text-center space-y-1 hover:border-primary/50 transition-colors">
                  <p className="font-data-lg text-data-lg text-on-surface font-mono">
                    {miningStatus.hashRate.toFixed(2)} MH/S
                  </p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Hash Rate</p>
                </div>
              </div>

              {/* Claim Action Row */}
              {hasActivePlan && (
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <h4 className="font-headline-md text-headline-md text-on-surface font-bold">Claim Daily Mining Payout</h4>
                    <p className="text-sm text-on-surface-variant">Claim your package profit once every 24 hours. Value-based conversion applies automatically.</p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {timeLeft && !isReadyToClaim && (
                      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-outline-variant font-mono text-xs text-on-surface-variant font-bold">
                        <Clock size={14} className="animate-pulse text-primary" />
                        {timeLeft}
                      </div>
                    )}
                    <button 
                      onClick={handleClaimReward}
                      disabled={!isReadyToClaim || loading || miningSettings?.isPaused}
                      className={`px-8 py-3 rounded-lg font-bold border transition-all text-sm w-full md:w-auto text-center cursor-pointer
                        ${isReadyToClaim && !miningSettings?.isPaused
                          ? 'bg-primary-container text-on-primary-fixed border-outline-variant/10 hover:brightness-110 shadow-sm'
                          : 'bg-surface-dim text-on-surface-variant/40 border-outline-variant/20 cursor-not-allowed'
                        }`}
                    >
                      {miningSettings?.isPaused ? 'Mining Paused' : 'Claim Reward'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Latest Transactions Table */}
        <section className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="p-card-padding flex justify-between items-center border-b border-outline-variant">
            <h2 className="font-headline-md text-headline-md uppercase">
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

      </main>

      {/* Footer */}
      <footer className="bg-on-secondary-fixed dark:bg-on-background py-8 px-margin-desktop mt-auto flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <Logo size="sm" variant="dark" className="h-8" />
          <p className="font-label-caps text-label-caps text-secondary-fixed-dim opacity-80 mt-1">
            © 2026 AscendHash. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
