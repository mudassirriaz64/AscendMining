import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchMyReferrals } from '../../store/slices/dashboardSlice';
import Header from '../../components/common/Header';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Users, Copy, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0a1931]">My Referral</h1>
          <p className="text-slate-500 text-sm mt-1">Invite friends and earn a bonus on their deposits.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error.message || 'Failed to load referrals'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-50 text-blue-500 p-4 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Referred</p>
              <h3 className="text-2xl font-bold text-[#0a1931]">{data.length || 0}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Your Referral Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink || ''}
                readOnly
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 text-sm focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#083358] hover:bg-[#0a1931] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Share this link to earn a {formatCurrency(balances.referralBalance || 0)} current referral balance.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-[#0a1931]">Referred Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Username</th>
                  <th className="px-6 py-4 font-semibold">Full Name</th>
                  <th className="px-6 py-4 font-semibold">Join Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      Loading referrals...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      You haven't referred anyone yet. Share your link to get started!
                    </td>
                  </tr>
                ) : (
                  data.map((ref) => (
                    <tr key={ref._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0a1931]">
                        {ref.username}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {ref.fullName}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(ref.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ref.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ref.status}
                        </span>
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

export default MyReferralPage;
