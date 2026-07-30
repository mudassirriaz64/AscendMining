import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Wallet, Cpu, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, X, Info, LogOut, ShieldAlert
} from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { requestWithdrawal, clearWithdrawalError } from '../../store/slices/withdrawalSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Logo from '../../components/common/Logo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageSkeleton from '../../components/common/PageSkeleton';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';

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

  const { user } = useSelector((state) => state.auth);

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

  const kycStatus = user?.kycStatus || 'none';

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase">
            Withdraw <span className="text-primary font-extrabold">Funds</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium font-heading">Select a coin below to request your payout directly to your wallet address.</p>
        </div>

        {kycStatus !== 'approved' ? (
          <div className="bg-white rounded-xl border border-outline-variant p-card-padding text-center max-w-lg mx-auto space-y-6 my-10">
            <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <ShieldAlert size={36} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-on-surface">KYC Verification Required</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed font-heading">
                In order to request withdrawals, you must complete your Identity Verification (KYC) first. 
                {kycStatus === 'pending' && ' Your documents are currently under review by our administration. Please wait for approval.'}
                {kycStatus === 'rejected' && ' Your previous submission was rejected. Please review feedback and re-submit.'}
                {kycStatus === 'none' && ' Please upload CNIC, passport, or driver license to verify your identity.'}
              </p>
            </div>
            <div className="pt-2">
              {kycStatus === 'pending' ? (
                <Button onClick={() => navigate('/kyc')} className="bg-surface-container-low border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer">
                  Check Verification Status
                </Button>
              ) : (
                <Button onClick={() => navigate('/kyc')} className="bg-primary-container hover:brightness-110 text-on-primary-fixed font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm cursor-pointer">
                  Verify Identity (KYC)
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* COIN WALLET CARDS LIST */
          <section className="space-y-6">
            {!coins || coins.length === 0 ? (
              <div className="bg-white border border-outline-variant rounded-xl p-10 text-center text-on-surface-variant font-medium text-sm">
                No active mining coins available.
              </div>
            ) : (
              coins.map((coin) => {
                const balance = balances.miningBalances?.[coin.symbol] || 0;
                const address = walletAddresses?.[coin.symbol] || '';

              return (
                <div 
                  key={coin._id}
                  className="bg-white border border-outline-variant rounded-xl p-card-padding hover:shadow-[0px_4px_20px_rgba(11,18,32,0.05)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-4 flex-grow">
                    <div className="flex items-center space-x-3.5">
                      <div className="bg-surface-bright p-2.5 rounded-xl border border-outline-variant text-primary">
                        {coin.logoUrl ? (
                          <img src={coin.logoUrl} alt={coin.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <Cpu className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-on-surface tracking-tight font-heading">{coin.name} ({coin.symbol}) Wallet</h2>
                        <p className="text-lg font-bold text-on-surface font-mono mt-0.5">
                          {balance.toFixed(8)}{' '}
                          <span className="text-on-surface-variant text-xs font-bold">{coin.symbol.toLowerCase()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Wallet Address</span>
                        {address ? (
                          <p className="text-on-surface font-mono break-all font-semibold select-all mt-0.5">{address}</p>
                        ) : (
                          <p className="text-error font-semibold flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={13} />
                            No wallet address configured.{' '}
                            <a href="/wallets" className="text-primary underline hover:text-primary/80 font-bold">Configure Now</a>
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-w-sm pt-2">
                        <div>
                          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Min Limit</span>
                          <p className="font-bold text-on-surface font-mono mt-0.5">{coin.minWithdrawal} {coin.symbol}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Max Limit</span>
                          <p className="font-bold text-on-surface font-mono mt-0.5">{coin.maxWithdrawal} {coin.symbol}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end items-end">
                    <button
                      onClick={() => openWithdrawModal(coin)}
                      className="bg-primary-container hover:brightness-110 text-on-primary-fixed font-extrabold text-xs px-6 py-3.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
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
        )}

      </main>

      {/* WITHDRAW MODAL */}
      {isModalOpen && selectedCoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant transform scale-100 transition-all duration-300">
            
            {/* Modal Header */}
            <div className="bg-on-secondary-fixed text-white p-6 flex justify-between items-center border-b border-outline-variant">
              <div className="flex items-center space-x-2.5">
                <Cpu className="text-primary w-5 h-5" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Request Payout</h3>
              </div>
              <button 
                onClick={closeWithdrawModal}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitWithdrawal} className="p-card-padding space-y-6">
              
              <div className="bg-surface-bright p-4 rounded-xl border border-outline-variant space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Mined Balance:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {(balances.miningBalances?.[selectedCoin.symbol] || 0).toFixed(8)} {selectedCoin.symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">Sending To Address:</span>
                  <span className="font-mono text-on-surface truncate max-w-[200px] font-bold">
                    {walletAddresses[selectedCoin.symbol]}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Withdrawal Amount ({selectedCoin.symbol})
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount in ${selectedCoin.symbol}`}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold text-on-surface"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-black text-on-surface-variant font-mono">
                    {selectedCoin.symbol}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-bold uppercase mt-1 px-1">
                  <span>Min: {selectedCoin.minWithdrawal} {selectedCoin.symbol}</span>
                  <span>Max: {selectedCoin.maxWithdrawal} {selectedCoin.symbol}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-2">
                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="w-1/2 border border-outline-variant text-on-surface-variant font-bold text-xs py-3.5 rounded-lg hover:bg-surface-bright transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawalLoading}
                  className="w-1/2 bg-primary-container hover:brightness-110 text-on-primary-fixed font-extrabold text-xs py-3.5 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  {withdrawalLoading ? 'Submitting...' : 'Confirm'}
                  <CheckCircle size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-on-secondary-fixed text-white/50 py-8 border-t border-outline-variant/20 mt-12">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-4">
          <Logo variant="dark" size="sm" className="h-8 opacity-80" />
          <p className="font-body-sm text-body-sm text-center">
            &copy; 2026 <span className="font-semibold text-white">AscendHash</span>. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default WithdrawNowPage;
