import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchMyReferrals } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Users, Copy, Check } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Logo from '../../components/common/Logo';

const MyReferralPage = () => {
  const dispatch = useDispatch();
  const { referralLink, balances, history: { referrals } } = useSelector((state) => state.dashboard);
  const { data, loading, error } = referrals;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchMyReferrals({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-sans antialiased">
      <Header />
      
      <main className="max-w-6xl w-full mx-auto px-margin-mobile md:px-margin-desktop py-gutter flex-grow space-y-gutter">
        
        {/* PAGE HEADER */}
        <div className="border-b border-outline-variant pb-4 mb-8">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight uppercase flex items-center gap-2">
            <Users className="text-tertiary w-6 h-6" />
            My Referral
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 font-heading font-medium">Invite friends and earn a bonus on their deposits.</p>
        </div>

        {error && (
          <div className="mb-4 bg-error-container border border-error/20 text-on-error-container px-4 py-3 rounded-xl text-xs font-semibold">
            {error.message || 'Failed to load referrals'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Stats Box */}
          <div className="bg-white rounded-xl p-card-padding border border-outline-variant flex items-center gap-4">
            <div className="bg-surface-bright text-tertiary p-4 rounded-xl border border-outline-variant">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Referred</p>
              <h3 className="text-2xl font-bold text-on-surface font-mono">{data.length || 0}</h3>
            </div>
          </div>

          {/* Link Box */}
          <div className="bg-white rounded-xl p-card-padding border border-outline-variant md:col-span-2">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Your Referral Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink || ''}
                readOnly
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="bg-primary-container hover:brightness-110 text-on-primary-fixed px-6 py-3 rounded-lg font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 whitespace-nowrap uppercase tracking-wider"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-heading font-medium">
              Share this link to earn a {formatCurrency(balances.referralBalance || 0)} current referral balance.
            </p>
          </div>
        </div>

        {/* Referred Users List */}
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-card-padding border-b border-outline-variant bg-surface-bright">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Referred Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-caps text-label-caps text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-card-padding py-3">Username</th>
                  <th className="px-card-padding py-3">Full Name</th>
                  <th className="px-card-padding py-3">Join Date</th>
                  <th className="px-card-padding py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-card-padding py-12 text-center text-on-surface-variant text-sm font-medium">
                      Loading referrals...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-card-padding py-12 text-center text-on-surface-variant text-sm font-medium">
                      You haven't referred anyone yet. Share your link to get started!
                    </td>
                  </tr>
                ) : (
                  data.map((ref) => (
                    <tr key={ref._id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-card-padding py-3 font-bold text-on-surface text-sm">
                        {ref.username}
                      </td>
                      <td className="px-card-padding py-3 text-on-surface-variant font-heading text-xs font-semibold">
                        {ref.fullName}
                      </td>
                      <td className="px-card-padding py-3 text-on-surface font-mono text-xs">
                        {formatDate(ref.createdAt)}
                      </td>
                      <td className="px-card-padding py-3">
                        <StatusBadge status={ref.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

export default MyReferralPage;
