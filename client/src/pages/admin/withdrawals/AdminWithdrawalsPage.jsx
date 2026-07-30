import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowUpRight } from 'lucide-react';
import WalletAddressCell from '../../../components/common/WalletAddressCell';
import toast from 'react-hot-toast';
import { fetchAdminWithdrawals, approveAdminWithdrawal, rejectAdminWithdrawal, clearAdminWithdrawalError, clearAdminWithdrawalSuccess } from '../../../store/slices/adminWithdrawalSlice';
import FilterChips from '../../../components/common/FilterChips';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { formatDate } from '../../../utils/formatters';
import usePolling from '../../../hooks/usePolling';

const statusFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const AdminWithdrawalsPage = () => {
  const dispatch = useDispatch();
  const { withdrawals, total, page: currentPage, limit, loading, error, actionSuccess } = useSelector((s) => s.adminWithdrawals);

  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  
  const [rejectModal, setRejectModal] = useState({ open: false, withdrawalId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState({ open: false, id: null });

  const loadWithdrawals = useCallback(() => {
    dispatch(fetchAdminWithdrawals({ page, limit: 20, status }));
  }, [dispatch, page, status]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  usePolling(loadWithdrawals, 30000);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminWithdrawalSuccess());
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminWithdrawalError());
    }
  }, [error, dispatch]);

  const handleStatusFilter = (val) => {
    setStatus(val);
    setPage(1);
  };

  const handleApprove = (id) => {
    setConfirmApprove({ open: true, id });
  };

  const openRejectModal = (id) => {
    setRejectModal({ open: true, withdrawalId: id });
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await dispatch(rejectAdminWithdrawal({ id: rejectModal.withdrawalId, reason: rejectionReason })).unwrap();
      loadWithdrawals();
    } catch { /* error handled by Redux error state */ }
    setRejectModal({ open: false, withdrawalId: null });
  };

  const columns = useMemo(() => [
    {
      key: 'user',
      label: 'User',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.userId?.fullName || 'N/A'}</p>
          <p className="text-xs text-slate-500">@{row.userId?.username || 'Unknown'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount & Coin',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.amount} {row.coinSymbol}</p>
        </div>
      ),
    },
    {
      key: 'walletAddress',
      label: 'Destination Wallet',
      render: (_, row) => <WalletAddressCell address={row.walletAddress} />,
    },
    {
      key: 'requestedAt',
      label: 'Date',
      render: (_, row) => <p className="text-sm text-slate-600">{formatDate(row.requestedAt || row.createdAt)}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (row.status !== 'pending') {
          return (
            <p className="text-xs text-slate-500 italic">
              {row.status === 'rejected' ? `Reason: ${row.rejectionReason}` : 'Processed'}
            </p>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(row._id)}
              disabled={loading}
              className="!py-1.5"
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openRejectModal(row._id)}
              disabled={loading}
              className="!py-1.5"
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ], [loading]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Withdrawals</h1>
          <p className="text-slate-500 text-sm">Review and process user withdrawal requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <FilterChips
            options={statusFilters}
            active={status}
            onChange={handleStatusFilter}
          />
        </div>

        <DataTable
          columns={columns}
          data={withdrawals}
          loading={loading}
          emptyMessage={`No ${status !== 'all' ? status : ''} withdrawals found.`}
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

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, withdrawalId: null })}
        title="Reject Withdrawal"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a reason for rejecting this withdrawal. The requested amount will be automatically refunded to the user's mining balance.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="e.g., Invalid wallet address, Suspected fraudulent activity..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ open: false, withdrawalId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? 'Rejecting...' : 'Reject & Refund'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, id: null })}
        onConfirm={async () => {
          try {
            await dispatch(approveAdminWithdrawal(confirmApprove.id)).unwrap();
            loadWithdrawals();
          } catch { /* error handled by Redux error state */ }
          setConfirmApprove({ open: false, id: null });
        }}
        title="Approve Withdrawal"
        message="Are you sure you want to approve this withdrawal? Make sure you have actually sent the funds."
        variant="warning"
      />
    </div>
  );
};

export default AdminWithdrawalsPage;
