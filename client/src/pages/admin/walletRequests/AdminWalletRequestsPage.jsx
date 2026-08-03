import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Wallet, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchAdminWalletRequests,
  approveAdminWalletRequest,
  rejectAdminWalletRequest,
  clearAdminWalletError,
  clearAdminWalletSuccess,
} from '../../../store/slices/adminWalletChangeSlice';
import { connectDashboardSocket } from '../../../services/dashboardSocket';
import FilterChips from '../../../components/common/FilterChips';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';

const statusFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const truncateAddress = (address) => {
  if (!address) return '—';
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
};

const AdminWalletRequestsPage = () => {
  const dispatch = useDispatch();
  const { requests, total, limit, loading, error, actionSuccess } = useSelector(
    (s) => s.adminWalletRequests
  );

  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [confirmApprove, setConfirmApprove] = useState({ open: false, id: null, coin: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = useCallback(() => {
    dispatch(fetchAdminWalletRequests({ page, limit: 20, status }));
  }, [dispatch, page, status]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Real-time refresh on wallet change events
  useEffect(() => {
    const socket = connectDashboardSocket();
    const refresh = () => loadRequests();
    socket.on('admin:wallet:change:new', refresh);
    socket.on('admin:wallet:change:status', refresh);
    return () => {
      socket.off('admin:wallet:change:new', refresh);
      socket.off('admin:wallet:change:status', refresh);
    };
  }, [loadRequests]);

  // 15s polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) loadRequests();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadRequests, loading]);

  // Toast on success/error
  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminWalletSuccess());
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminWalletError());
    }
  }, [error, dispatch]);

  const handleStatusFilter = (val) => {
    setStatus(val);
    setPage(1);
  };

  const handleApproveConfirm = async () => {
    if (!confirmApprove.id) return;
    await dispatch(approveAdminWalletRequest(confirmApprove.id));
    setConfirmApprove({ open: false, id: null, coin: '', address: '' });
    loadRequests();
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    await dispatch(rejectAdminWalletRequest({ id: rejectModal.requestId, rejectionReason: rejectionReason.trim() }));
    setRejectModal({ open: false, requestId: null });
    setRejectionReason('');
    loadRequests();
  };

  // Filter by search term client-side for quick UX
  const filteredRequests = searchTerm
    ? requests.filter((r) =>
        r.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.coinSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requestedWalletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : requests;

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-page-text text-sm">{r.userId?.username || '—'}</span>
          <span className="text-xs text-page-text-muted">{r.userId?.email || '—'}</span>
        </div>
      ),
    },
    {
      key: 'coin',
      label: 'Coin',
      render: (_, r) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
          {r.coinSymbol}
        </span>
      ),
    },
    {
      key: 'currentAddress',
      label: 'Current Address',
      render: (_, r) => (
        <span className="font-mono text-xs text-page-text-muted" title={r.currentWalletAddress || ''}>
          {r.currentWalletAddress ? truncateAddress(r.currentWalletAddress) : <span className="italic text-page-text-dimmer">None set</span>}
        </span>
      ),
    },
    {
      key: 'requestedAddress',
      label: 'Requested Address',
      render: (_, r) => (
        <span className="font-mono text-xs text-page-text font-semibold" title={r.requestedWalletAddress}>
          {truncateAddress(r.requestedWalletAddress)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (_, r) => (
        <span className="text-xs text-page-text-muted">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => {
        if (r.status !== 'pending') {
          return (
            <div className="flex flex-col gap-1 text-xs text-page-text-muted">
              {r.status === 'approved' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle size={12} /> Approved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle size={12} /> Rejected
                </span>
              )}
              {r.rejectionReason && (
                <span className="text-[10px] text-page-text-dimmer max-w-[140px] truncate" title={r.rejectionReason}>
                  {r.rejectionReason}
                </span>
              )}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() =>
                setConfirmApprove({ open: true, id: r._id, coin: r.coinSymbol, address: r.requestedWalletAddress })
              }
              disabled={loading}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setRejectModal({ open: true, requestId: r._id })}
              disabled={loading}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-page-text flex items-center gap-2">
            <Wallet size={20} className="text-primary" />
            Wallet Change Requests
          </h1>
          <p className="text-sm text-page-text-muted mt-0.5">
            Review and approve user requests to change their payout wallet addresses.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-page-text-soft" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user, coin, address…"
            className="w-full pl-8 pr-3 py-2 border border-page-border bg-page-fill rounded-xl text-sm text-page-text placeholder-page-text-dimmer outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Shown', value: total, icon: Wallet, color: 'text-primary' },
          { label: 'Pending Review', value: status === 'pending' ? total : '—', icon: Clock, color: 'text-amber-400' },
          { label: 'This Page', value: filteredRequests.length, icon: CheckCircle, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-page-card border border-page-border rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon size={18} className={color} />
            <div>
              <p className="text-xs text-page-text-muted">{label}</p>
              <p className="text-lg font-bold text-page-text">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <FilterChips
        options={statusFilters}
        active={status}
        onChange={handleStatusFilter}
      />

      {/* Table */}
      <div className="bg-page-card border border-page-border rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredRequests}
          loading={loading}
          emptyMessage={
            status === 'pending'
              ? 'No pending wallet change requests. All clear!'
              : 'No wallet change requests found for this filter.'
          }
        />
      </div>

      {/* Pagination */}
      {total > limit && (
        <Pagination
          page={page}
          pages={Math.ceil(total / (limit || 20))}
          onChange={setPage}
        />
      )}

      {/* Approve confirm modal */}
      <ConfirmModal
        isOpen={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, id: null, coin: '', address: '' })}
        onConfirm={handleApproveConfirm}
        title="Approve Wallet Change"
        message={
          <span>
            Approve the change of <strong>{confirmApprove.coin}</strong> payout address to:{' '}
            <code className="text-xs bg-page-fill px-2 py-0.5 rounded font-mono break-all">
              {confirmApprove.address}
            </code>
            <br /><br />
            This will immediately update the user's payout address in the system.
          </span>
        }
        confirmLabel="Approve"
        cancelLabel="Cancel"
        variant="success"
      />

      {/* Reject reason modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, requestId: null }); setRejectionReason(''); }}
        title="Reject Wallet Change Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-page-text-muted">
            Please provide a reason for rejecting this wallet address change request. The user will be notified.
          </p>
          <div>
            <label className="block text-xs font-semibold text-page-text-muted mb-1.5">
              Rejection Reason <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. The submitted address appears invalid or suspicious. Please resubmit with a verified address."
              className="w-full border border-page-border bg-page-fill rounded-xl px-4 py-3 text-sm text-page-text placeholder-page-text-dimmer outline-none focus:border-danger/50 focus:ring-1 focus:ring-danger/30 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="ghost"
              onClick={() => { setRejectModal({ open: false, requestId: null }); setRejectionReason(''); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectSubmit}
              disabled={loading || !rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminWalletRequestsPage;
