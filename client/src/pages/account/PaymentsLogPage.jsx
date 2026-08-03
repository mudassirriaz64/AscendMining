import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ImageIcon } from 'lucide-react';
import { fetchMyDeposits, updateDepositInHistory, updateBalance } from '../../store/slices/dashboardSlice';
import { connectDashboardSocket, disconnectDashboardSocket } from '../../services/dashboardSocket';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentsLogPage = () => {
  const dispatch = useDispatch();
  const { history: { deposits } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = deposits;

  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    dispatch(fetchMyDeposits({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const socket = connectDashboardSocket();

    const onDepositStatusChange = (data) => {
      dispatch(updateDepositInHistory(data));
      if (data.status === 'approved') {
        toast.success(`Deposit $${data.amount?.toFixed?.(2) || ''} approved!`);
      } else if (data.status === 'rejected') {
        toast.error(`Deposit $${data.amount?.toFixed?.(2) || ''} rejected. ${data.rejectionReason || ''}`);
      }
    };

    const onBalanceUpdate = (balanceData) => {
      dispatch(updateBalance(balanceData));
    };

    socket.on('deposit:status:change', onDepositStatusChange);
    socket.on('balance:update', onBalanceUpdate);

    return () => {
      socket.off('deposit:status:change', onDepositStatusChange);
      socket.off('balance:update', onBalanceUpdate);
      disconnectDashboardSocket();
    };
  }, [dispatch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-100 dark:bg-success/15 text-green-700 dark:text-success rounded-full text-xs font-medium">Approved</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Pending</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-100 dark:bg-danger/15 text-red-700 dark:text-danger rounded-full text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 dark:bg-surface-container-low text-slate-700 dark:text-on-surface-variant rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a1931] dark:text-on-surface">Payments Log</h1>
          <p className="text-slate-500 dark:text-on-surface-variant text-sm mt-1">View your deposit and package purchase history.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-danger/10 border border-red-200 dark:border-danger/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error.message || 'Failed to load deposits'}
          </div>
        )}

        <div className="bg-white dark:bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 dark:border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-surface-container-low border-b border-slate-100 dark:border-outline-variant text-slate-600 dark:text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Package</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold text-center">Screenshot</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-container-highest">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-on-surface-variant">
                      Loading payments...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-on-surface-variant">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  data.map((deposit) => (
                    <tr key={deposit._id} className="hover:bg-slate-50/50 dark:hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-on-surface-variant">
                        {formatDate(deposit.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#0a1931] dark:text-on-surface">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-on-surface-variant font-semibold">
                        {deposit.packageId?.name || 'Wallet Top-up'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-on-surface-variant capitalize">
                        {deposit.paymentMethod?.name || deposit.method || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {deposit.screenshot ? (
                          <button 
                            onClick={() => {
                              setSelectedScreenshot(deposit.screenshot);
                              setScreenshotModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-primary bg-blue-50 dark:bg-primary/10 hover:bg-blue-100 dark:hover:bg-primary/20 transition-colors inline-flex items-center justify-center"
                            title="View Screenshot"
                          >
                            <ImageIcon size={18} />
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-on-surface-variant text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(deposit.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={screenshotModalOpen}
          onClose={() => setScreenshotModalOpen(false)}
          title="Payment Screenshot"
          size="lg"
        >
          <div className="p-2 flex justify-center">
            {selectedScreenshot ? (
              <img 
                src={selectedScreenshot} 
                alt="Payment Screenshot" 
                className="max-w-full max-h-[70vh] rounded-xl object-contain border border-slate-200 dark:border-outline-variant"
              />
            ) : (
              <div className="text-slate-500 dark:text-on-surface-variant py-12">No screenshot available</div>
            )}
          </div>
        </Modal>
    </div>
  );
};

export default PaymentsLogPage;
