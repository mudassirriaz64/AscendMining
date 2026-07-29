import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  fetchAdminReferralSettings,
  updateAdminReferralSettings,
  fetchAdminReferralRecords,
  clearAdminReferralError,
  clearAdminReferralSuccess
} from '../../../store/slices/adminReferralSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import { formatDate } from '../../../utils/formatters';

const AdminReferralsPage = () => {
  const dispatch = useDispatch();
  const { settings, records, stats, total, page: currentPage, limit, loading, error, actionSuccess } = useSelector((s) => s.adminReferrals);

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    isActive: true,
    bonusPercentage: 10,
  });

  useEffect(() => {
    dispatch(fetchAdminReferralSettings());
    dispatch(fetchAdminReferralRecords({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminReferralSuccess());
      setModalOpen(false);
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminReferralError());
    }
  }, [error, dispatch]);

  const handleOpenSettings = () => {
    setFormData({
      isActive: settings?.isActive ?? true,
      bonusPercentage: settings?.bonusPercentage ?? 10,
    });
    setModalOpen(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    dispatch(updateAdminReferralSettings(formData));
  };

  const columns = [
    {
      key: 'referrer',
      label: 'Referrer',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.referrerId?.fullName || 'N/A'}</p>
          <p className="text-xs text-slate-500">@{row.referrerId?.username || 'Unknown'}</p>
        </div>
      )
    },
    {
      key: 'referred',
      label: 'Referred User',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.referredId?.fullName || 'N/A'}</p>
          <p className="text-xs text-slate-500">@{row.referredId?.username || 'Unknown'}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Referred Status',
      render: (_, row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.referredId?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.referredId?.status || 'Unknown'}
        </span>
      )
    },
    {
      key: 'totalBonus',
      label: 'Bonus Earned',
      render: (val) => <p className="font-medium text-green-600">${val?.toLocaleString() || '0'}</p>
    },
    {
      key: 'createdAt',
      label: 'Referred On',
      render: (val) => <p className="text-sm text-slate-500">{formatDate(val)}</p>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Referrals</h1>
          <p className="text-slate-500 text-sm">Manage referral settings and view global referral history.</p>
        </div>
        <Button onClick={handleOpenSettings} className="flex items-center gap-2">
          <Settings size={18} />
          Configure Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Referrals</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalReferrals.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Bonuses Paid</p>
            <h3 className="text-2xl font-bold text-slate-800">${stats.totalBonusesPaid.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Referral History</h3>
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          emptyMessage="No referral records found."
        />

        {total > limit && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(total / limit)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Referral Settings"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <p className="text-sm text-blue-800">
              When a user buys a package, their referrer will earn the configured bonus percentage of the package price.
            </p>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-[#083358] rounded focus:ring-[#083358]"
              />
              <span className="text-sm font-medium text-slate-700">Enable Referral System</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bonus Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={formData.bonusPercentage}
              onChange={(e) => setFormData({ ...formData, bonusPercentage: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
              required
              disabled={!formData.isActive}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminReferralsPage;
