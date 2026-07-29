import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyDeposits } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import PageSkeleton from '../../components/common/PageSkeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentsLogPage = () => {
  const dispatch = useDispatch();
  const { history: { deposits } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = deposits;

  useEffect(() => {
    dispatch(fetchMyDeposits({ page: 1, limit: 100 }));
  }, [dispatch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a1931]">Payments Log</h1>
          <p className="text-slate-500 text-sm mt-1">View your deposit and package purchase history.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error.message || 'Failed to load deposits'}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Package</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  data.map((deposit) => (
                    <tr key={deposit._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(deposit.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-medium text-[#0a1931]">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {deposit.packageId?.name || 'Manual Deposit'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 capitalize">
                        {deposit.paymentMethod?.name || deposit.method || 'Unknown'}
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
      </main>
    </div>
  );
};

export default PaymentsLogPage;
