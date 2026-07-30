import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, AlertCircle, XCircle, LogOut } from 'lucide-react';
import { fetchWithdrawals, updateWithdrawalStatus, addWithdrawal } from '../../store/slices/withdrawalSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { connectDashboardSocket, getDashboardSocket } from '../../services/dashboardSocket';
import Logo from '../../components/common/Logo';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageSkeleton from '../../components/common/PageSkeleton';
import WalletAddressCell from '../../components/common/WalletAddressCell';
import Header from '../../components/common/Header';

const MyWithdrawalsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { withdrawals, loading } = useSelector((state) => state.withdrawal);

  useEffect(() => {
    dispatch(fetchWithdrawals());
  }, [dispatch]);

  useEffect(() => {
    const socket = connectDashboardSocket();

    const onWithdrawalUpdate = (data) => {
      dispatch(addWithdrawal(data));
      toast.success(`Withdrawal of ${data.amount} ${data.coinSymbol} submitted.`);
    };

    const onWithdrawalStatusChange = (data) => {
      dispatch(updateWithdrawalStatus(data));
      if (data.status === 'approved' || data.status === 'completed') {
        toast.success(`Withdrawal ${data.amount} ${data.coinSymbol} approved!`);
      } else if (data.status === 'rejected') {
        toast.error(`Withdrawal ${data.amount} ${data.coinSymbol} rejected. ${data.rejectionReason || ''}`);
      }
    };

    socket.on('withdrawal:update', onWithdrawalUpdate);
    socket.on('withdrawal:status:change', onWithdrawalStatusChange);

    return () => {
      socket.off('withdrawal:update', onWithdrawalUpdate);
      socket.off('withdrawal:status:change', onWithdrawalStatusChange);
    };
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading && withdrawals.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        
        <div className="border-b border-outline-variant pb-4">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase">
            My <span className="text-primary font-extrabold">Withdrawals</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium font-heading">Historical logs of all your withdrawal requests and approved payouts.</p>
        </div>

        {/* LOG HISTORY LIST */}
        <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            {!withdrawals || withdrawals.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant text-sm font-medium">
                No withdrawals requested yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-caps text-label-caps text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-card-padding py-3">Request ID</th>
                    <th className="px-card-padding py-3">Date & Time</th>
                    <th className="px-card-padding py-3">Amount</th>
                    <th className="px-card-padding py-3">Payment Method (Coin & Wallet)</th>
                    <th className="px-card-padding py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-card-padding py-3 font-bold text-on-surface text-xs font-mono">
                        {w._id.slice(-12).toUpperCase()}
                      </td>
                      <td className="px-card-padding py-3">
                        <div className="flex flex-col">
                          <span className="text-on-surface text-xs font-bold font-heading">{formatDateTime(w.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-card-padding py-3">
                        <span className="text-xs font-black text-on-surface font-mono">
                          {w.amount.toFixed(4)} {w.coinSymbol}
                        </span>
                      </td>
                      <td className="px-card-padding py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface">{w.coinSymbol}</span>
                          <WalletAddressCell address={w.walletAddress} maxWidth="200px" />
                        </div>
                      </td>
                      <td className="px-card-padding py-3 text-right">
                        <StatusBadge status={w.status} />
                        {w.status === 'rejected' && w.rejectionReason && (
                          <p className="text-[10px] text-error mt-1 font-semibold italic">Reason: {w.rejectionReason}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>

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

export default MyWithdrawalsPage;
