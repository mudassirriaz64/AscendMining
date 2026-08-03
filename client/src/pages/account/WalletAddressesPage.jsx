import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Cpu, Send, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import {
  submitWalletChangeRequest,
  fetchMyWalletChangeRequests,
  clearWalletChangeError,
  clearWalletChangeSuccess,
  updateWalletChangeStatus,
} from '../../store/slices/walletChangeSlice';
import { connectDashboardSocket } from '../../services/dashboardSocket';
import PageSkeleton from '../../components/common/PageSkeleton';

/**
 * Determine the current state of a coin row based on any existing change requests.
 * Returns: 'editable' | 'pending' | 'approved' | 'rejected'
 */
const getCoinState = (coinSymbol, requests) => {
  if (!requests || requests.length === 0) return { state: 'editable', request: null };

  // Find the most recent request for this coin
  const coinRequests = requests
    .filter((r) => r.coinSymbol === coinSymbol)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (coinRequests.length === 0) return { state: 'editable', request: null };

  const latest = coinRequests[0];

  if (latest.status === 'pending') return { state: 'pending', request: latest };
  if (latest.status === 'approved') return { state: 'approved', request: latest };
  if (latest.status === 'rejected') return { state: 'rejected', request: latest };

  return { state: 'editable', request: null };
};

const WalletAddressesPage = () => {
  const dispatch = useDispatch();

  const { walletAddresses, coins, loading: dashboardLoading } = useSelector(
    (state) => state.dashboard
  );
  const { requests, submitting, error, submitSuccess } = useSelector(
    (state) => state.walletChange
  );

  // Local form state: keyed by coinSymbol
  const [formAddresses, setFormAddresses] = useState({});
  // Track which coin's "approved" banner was just shown (clears after a few seconds)
  const [recentlyApproved, setRecentlyApproved] = useState({});

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchMyWalletChangeRequests());
  }, [dispatch]);

  useEffect(() => {
    if (walletAddresses) {
      setFormAddresses(walletAddresses);
    }
  }, [walletAddresses]);

  // Show submit success toast
  useEffect(() => {
    if (submitSuccess) {
      toast.success(submitSuccess);
      dispatch(clearWalletChangeSuccess());
      // Refetch to get the newly created request
      dispatch(fetchMyWalletChangeRequests());
    }
  }, [submitSuccess, dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred. Please try again.');
      dispatch(clearWalletChangeError());
    }
  }, [error, dispatch]);

  // Real-time socket listener for wallet change status updates
  useEffect(() => {
    const socket = connectDashboardSocket();

    const handleWalletChangeStatus = (data) => {
      dispatch(updateWalletChangeStatus(data));

      if (data.status === 'approved') {
        // Refetch dashboard so walletAddresses map updates
        dispatch(fetchDashboardSummary());
        // Show a highlighted approved banner briefly
        setRecentlyApproved((prev) => ({ ...prev, [data.coinSymbol]: true }));
        toast.success(`Your ${data.coinSymbol} wallet address has been approved and activated!`);
        setTimeout(() => {
          setRecentlyApproved((prev) => { const next = { ...prev }; delete next[data.coinSymbol]; return next; });
        }, 8000);
      } else if (data.status === 'rejected') {
        toast.error(`Your ${data.coinSymbol} wallet change was rejected: ${data.rejectionReason}`);
        // Refetch requests to get the updated state
        dispatch(fetchMyWalletChangeRequests());
      }
    };

    socket.on('wallet:change:status', handleWalletChangeStatus);
    return () => socket.off('wallet:change:status', handleWalletChangeStatus);
  }, [dispatch]);

  const handleInputChange = (coinSymbol, value) => {
    setFormAddresses((prev) => ({ ...prev, [coinSymbol]: value }));
  };

  const handleRequestChange = useCallback(
    async (coinSymbol) => {
      const address = formAddresses[coinSymbol] || '';
      if (!address.trim()) {
        toast.error(`Please provide a valid address for ${coinSymbol}.`);
        return;
      }
      dispatch(submitWalletChangeRequest({ coinSymbol, requestedWalletAddress: address.trim() }));
    },
    [formAddresses, dispatch]
  );

  if (dashboardLoading && !coins?.length) {
    return <PageSkeleton />;
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-12 flex-1 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-surface-container-highest pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-on-surface tracking-tight uppercase">
          Wallet <span className="text-yellow-500 dark:text-primary">Addresses</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-on-surface-variant mt-1 font-medium">
          Configure your destination wallet payout addresses for your mined coins.
          All address changes require admin approval to protect your account security.
        </p>
      </div>

      {/* Coin cards */}
      <section className="space-y-6">
        {!coins || coins.length === 0 ? (
          <div className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant rounded-2xl p-10 text-center text-slate-450 dark:text-on-surface-variant font-medium text-sm">
            No active mining coins available.
          </div>
        ) : (
          coins.map((coin) => {
            const { state, request } = getCoinState(coin.symbol, requests);
            const currentAddress = walletAddresses?.[coin.symbol] || '';
            const isJustApproved = recentlyApproved[coin.symbol];

            return (
              <div
                key={coin._id}
                className="bg-white dark:bg-surface-container-lowest border border-slate-200 dark:border-outline-variant rounded-2xl p-6 shadow-sm space-y-4"
              >
                {/* Coin header */}
                <div className="flex items-center space-x-3 text-[#083358] dark:text-primary">
                  <div className="bg-slate-100 dark:bg-surface-container-low p-2 rounded-lg border border-slate-200 dark:border-outline-variant">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-on-surface uppercase tracking-wider">
                    {coin.name} ({coin.symbol}) Payout Address
                  </h2>
                </div>

                {/* ── STATE: PENDING ── */}
                {state === 'pending' && (
                  <div className="rounded-xl border border-amber-400/40 bg-amber-400/8 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-semibold text-sm">
                      <Clock size={15} />
                      Pending Admin Review
                    </div>
                    <p className="text-xs text-slate-600 dark:text-on-surface-variant">
                      Your request to change your <strong>{coin.symbol}</strong> payout address to:
                    </p>
                    <code className="block bg-slate-100 dark:bg-surface-container-low text-xs font-mono px-3 py-2 rounded-lg text-slate-700 dark:text-on-surface break-all">
                      {request?.requestedWalletAddress}
                    </code>
                    <p className="text-xs text-slate-500 dark:text-on-surface-variant">
                      is pending review. You will be notified when it is processed.
                    </p>
                    {currentAddress && (
                      <p className="text-xs text-slate-400 dark:text-outline">
                        Current active address: <code className="font-mono">{currentAddress}</code>
                      </p>
                    )}
                  </div>
                )}

                {/* ── STATE: APPROVED (flash banner) ── */}
                {state === 'approved' && isJustApproved && (
                  <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/8 p-4 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        Address Updated Successfully
                      </p>
                      <p className="text-xs text-slate-500 dark:text-on-surface-variant mt-0.5">
                        Your new <strong>{coin.symbol}</strong> payout address is now active.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STATE: REJECTED ── */}
                {state === 'rejected' && (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-400/8 p-4 flex items-start gap-3">
                    <XCircle size={16} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                        Change Request Rejected
                      </p>
                      {request?.rejectionReason && (
                        <p className="text-xs text-slate-500 dark:text-on-surface-variant mt-0.5">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-outline mt-1">
                        You may submit a new request below.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── INPUT ROW (shown for editable, approved, rejected states) ── */}
                {state !== 'pending' && (
                  <div className="flex gap-4">
                    <div className="relative flex-grow rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        value={formAddresses[coin.symbol] || ''}
                        onChange={(e) => handleInputChange(coin.symbol, e.target.value)}
                        placeholder={`Paste your ${coin.symbol} payout wallet address here`}
                        className="w-full bg-[#f8fafc] dark:bg-input-bg border border-slate-200 dark:border-surface-container-highest rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-primary font-semibold font-mono"
                      />
                    </div>
                    <button
                      onClick={() => handleRequestChange(coin.symbol)}
                      disabled={submitting}
                      className="bg-[#0a1931] hover:bg-slate-800 text-white font-black text-xs px-5 py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Send size={13} className="text-yellow-400" />
                      Request Change
                    </button>
                  </div>
                )}

                {/* ── Security note for editable state ── */}
                {state === 'editable' && !currentAddress && (
                  <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-outline">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      No address set yet. Submit a request to add your {coin.symbol} payout address.
                      Changes require admin approval for your account security.
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Recent request history section */}
      {requests && requests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-on-surface-variant uppercase tracking-widest">
            Recent Change Requests
          </h2>
          <div className="space-y-2">
            {requests.slice(0, 5).map((req) => (
              <div
                key={req._id}
                className="bg-slate-50 dark:bg-surface-container-low border border-slate-200 dark:border-outline-variant rounded-xl px-4 py-3 flex items-center gap-4"
              >
                <span className="text-xs font-bold text-slate-600 dark:text-on-surface-variant uppercase w-12 shrink-0">
                  {req.coinSymbol}
                </span>
                <code className="text-xs font-mono text-slate-600 dark:text-on-surface flex-1 truncate">
                  {req.requestedWalletAddress}
                </code>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    req.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                      : req.status === 'rejected'
                      ? 'bg-rose-100 dark:bg-rose-400/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {req.status}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-outline shrink-0">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default WalletAddressesPage;
