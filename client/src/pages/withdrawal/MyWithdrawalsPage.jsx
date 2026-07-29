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
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-slate-800">
      
      <Header />

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-grow space-y-8">
        
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            My <span className="text-yellow-500">Withdrawals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium font-heading">Historical logs of all your withdrawal requests and approved payouts.</p>
        </div>

        {/* LOG HISTORY LIST */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {!withdrawals || withdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                No withdrawals requested yet.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc] border-b border-slate-100 text-slate-450 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Request ID</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Method (Coin & Wallet)</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-800 text-xs font-mono">
                        {w._id.slice(-12).toUpperCase()}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-slate-900 text-xs font-bold">{formatDateTime(w.createdAt)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {w.amount.toFixed(4)} {w.coinSymbol}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{w.coinSymbol}</span>
                          <span className="text-xs font-mono text-slate-500 select-all block max-w-xs truncate">
                            {w.walletAddress}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(w.status)}`}>
                          {w.status}
                        </span>
                        {w.status === 'rejected' && w.rejectionReason && (
                          <p className="text-[10px] text-red-500 mt-1 font-semibold italic">Reason: {w.rejectionReason}</p>
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

export default MyWithdrawalsPage;
