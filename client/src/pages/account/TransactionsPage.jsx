import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyTransactions } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle, MinusCircle, Gift } from 'lucide-react';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { history: { transactions } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = transactions;

  useEffect(() => {
    dispatch(fetchMyTransactions({ page: 1, limit: 100 }));
  }, [dispatch]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'withdrawal': return <MinusCircle className="w-5 h-5 text-red-500" />;
      case 'mining_reward': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'referral_reward': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'package_purchase': return <ArrowUpRight className="w-5 h-5 text-amber-500" />;
      default: return <ArrowDownLeft className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTransactionLabel = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a1931]">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Your complete wallet transaction history.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error.message || 'Failed to load transactions'}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Currency</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  data.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <span className="font-medium text-[#0a1931]">{getTransactionLabel(tx.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <span className={tx.amount > 0 ? 'text-green-600' : 'text-slate-700'}>
                          {tx.amount > 0 ? '+' : ''}{tx.currency === 'USD' ? formatCurrency(tx.amount) : tx.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {tx.currency}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {tx.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(tx.createdAt)}
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

export default TransactionsPage;
