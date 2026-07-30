import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyTransactions } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import TransactionsTable from '../../components/common/TransactionsTable';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { history: { transactions } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = transactions;

  useEffect(() => {
    dispatch(fetchMyTransactions({ page: 1, limit: 100 }));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-gutter">
        <div className="border-b border-outline-variant pb-4 mb-8">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase">Transactions</h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium font-heading">Your complete wallet transaction history.</p>
        </div>

        {error && (
          <div className="mb-4 bg-error-container border border-error/20 text-on-error-container px-4 py-3 rounded-xl text-xs font-semibold">
            {error.message || 'Failed to load transactions'}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <TransactionsTable transactions={data} loading={loading} />
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
