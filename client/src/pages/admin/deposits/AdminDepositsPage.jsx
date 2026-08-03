import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowDownToLine, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdminDeposits, approveAdminDeposit, rejectAdminDeposit, clearAdminDepositError, clearAdminDepositSuccess } from '../../../store/slices/adminDepositSlice';
import FilterChips from '../../../components/common/FilterChips';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { connectDashboardSocket } from '../../../services/dashboardSocket';

const statusFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const AdminDepositsPage = () => {
  const dispatch = useDispatch();
  const { deposits, total, limit, loading, error, actionSuccess } = useSelector((s) => s.adminDeposits);

  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  
  const [rejectModal, setRejectModal] = useState({ open: false, depositId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState({ open: false, id: null });

  const loadDeposits = useCallback(() => {
    dispatch(fetchAdminDeposits({ page, limit: 20, status }));
  }, [dispatch, page, status]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  useEffect(() => {
    const socket = connectDashboardSocket();
    
    const handleNewDeposit = () => {
      loadDeposits();
    };

    socket.on('admin:deposit:status', handleNewDeposit);
    socket.on('admin:deposit:new', handleNewDeposit);

    return () => {
      socket.off('admin:deposit:status', handleNewDeposit);
      socket.off('admin:deposit:new', handleNewDeposit);
    };
  }, [loadDeposits]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) loadDeposits();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadDeposits, loading]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminDepositSuccess());
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminDepositError());
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
    setRejectModal({ open: true, depositId: id });
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await dispatch(rejectAdminDeposit({ id: rejectModal.depositId, rejectionReason })).unwrap();
      loadDeposits();
    } catch { /* error handled by Redux error state */ }
    setRejectModal({ open: false, depositId: null });
  };

  const columns = useMemo(() => [
    {
      key: 'user',
      label: 'User',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-white">{row.userId?.fullName || 'N/A'}</p>
          <p className="text-xs text-slate-400">@{row.userId?.username || 'Unknown'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount / Type',
      render: (val, row) => (
        <div>
          <p className="font-mono text-amber-400 font-semibold">${row.amount.toLocaleString()}</p>
          {row.packageId ? (
            <p className="text-xs text-slate-400">Plan: {row.packageId.packageId?.name || row.packageId.name || 'N/A'}</p>
          ) : (
            <span className="text-[9px] font-black text-amber-450 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 inline-block uppercase tracking-wider mt-0.5 shadow-[0_0_10px_rgba(255,184,0,0.1)]">
              Wallet Top-up
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'method',
      label: 'Method details',
      render: (_, row) => (
        <div className="text-xs text-slate-400">
          <p className="font-medium text-slate-200">{row.paymentMethod?.name || 'Manual'}</p>
          {row.senderBankName && <p>{row.senderBankName}</p>}
          {row.senderHolderName && <p>{row.senderHolderName}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-slate-400 text-sm">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.screenshot && (
            <button
              onClick={() => setSelectedScreenshot(row.screenshot)}
              className="p-2 text-amber-400 hover:bg-white/5 rounded-xl border border-white/10 cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(255,184,0,0.15)]"
              title="View Screenshot"
            >
              <ImageIcon size={14} />
            </button>
          )}
          {row.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => handleApprove(row._id)} disabled={loading}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => openRejectModal(row._id)} disabled={loading}>
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [loading]);

  return (
    <div className="animate-fade-in text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-semibold text-white mb-1">Payments Verification</h1>
          <p className="text-sm text-slate-400">Review and approve user deposits and plan purchases</p>
        </div>
        <div className="w-10 h-10 bg-primary-container/10 border border-primary-container/20 text-primary-fixed-dim rounded-xl flex items-center justify-center shrink-0 shadow-inner">
          <ArrowDownToLine size={20} />
        </div>
      </div>

      <div className="bg-[#0d1420]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl mb-6 text-white overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <FilterChips options={statusFilters} active={status} onChange={handleStatusFilter} />
        </div>

        <DataTable
          columns={columns}
          data={deposits}
          loading={loading}
          emptyMessage={`No ${status === 'all' ? '' : status} deposits found.`}
        />
      </div>

      {total > limit && (
        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={!!selectedScreenshot} onClose={() => setSelectedScreenshot(null)} title="Payment Screenshot">
        <div className="p-4 flex justify-center">
          {selectedScreenshot && (
            <img src={selectedScreenshot} alt="Payment Proof" className="max-w-full max-h-[70vh] rounded-2xl border border-white/10 shadow-2xl" />
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <Button variant="ghost" onClick={() => setSelectedScreenshot(null)}>Close</Button>
        </div>
      </Modal>

      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, depositId: null })} title="Reject Payment">
        <div className="p-6">
          <p className="text-sm text-slate-400 mb-4">
            Please provide a reason for rejecting this payment. The user will see this reason in their dashboard.
          </p>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reason</label>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 focus:bg-white/10 transition"
              placeholder="Enter rejection reason"
              autoFocus
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, depositId: null })}>Cancel</Button>
          <Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim() || loading}>Reject Payment</Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, id: null })}
        onConfirm={async () => {
          try {
            await dispatch(approveAdminDeposit(confirmApprove.id)).unwrap();
            loadDeposits();
          } catch { /* error handled by Redux error state */ }
          setConfirmApprove({ open: false, id: null });
        }}
        title="Approve Payment"
        message="Are you sure you want to approve this payment?"
        variant="warning"
      />
    </div>
  );
};

export default AdminDepositsPage;
