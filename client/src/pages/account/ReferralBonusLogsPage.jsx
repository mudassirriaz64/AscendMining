import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyTransactions } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import { Gift } from 'lucide-react';
import TransactionsTable from '../../components/common/TransactionsTable';
import Logo from '../../components/common/Logo';

const ReferralBonusLogsPage = () => {
  const dispatch = useDispatch();
  const { history: { transactions } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = transactions;

  useEffect(() => {
    // We fetch transactions and filter for referral_reward type via query param
    dispatch(fetchMyTransactions({ page: 1, limit: 100, type: 'referral_reward' }));
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      <Header />
      
      <main className="max-w-6xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        {/* PAGE HEADER */}
        <div className="border-b border-outline-variant pb-4 mb-8">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase flex items-center gap-2">
            <Gift className="text-tertiary w-6 h-6" />
            Referral Bonus Logs
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-heading font-medium">Earnings received from users who registered with your link.</p>
        </div>

        {error && (
          <div className="mb-4 bg-error-container border border-error/20 text-on-error-container px-4 py-3 rounded-xl text-xs font-semibold">
            {error.message || 'Failed to load bonus logs'}
          </div>
        )}

        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <TransactionsTable transactions={data} loading={loading} />
        </div>
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

export default ReferralBonusLogsPage;
