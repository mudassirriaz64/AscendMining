import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, X, Eye } from 'lucide-react';
import { fetchAdminKYCRequests, approveUserKYC, rejectUserKYC, clearKYCStatus } from '../../../store/slices/kycSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import InputField from '../../../components/common/InputField';
import ConfirmModal from '../../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { connectDashboardSocket } from '../../../services/dashboardSocket';

const ImageWithLoader = ({ src }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
            <span className="text-[10px] uppercase tracking-wider text-slate-450 font-bold">Retrieving Encrypted Document...</span>
          </div>
        </div>
      )}
      {src && !error ? (
        <img
          src={src}
          alt="KYC Identity Proof"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          className={`object-contain max-h-[480px] w-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        <span className="text-slate-500 font-mono text-xs">No secure document uploaded or failed to load.</span>
      )}
    </div>
  );
};

const AdminKYCPage = () => {
  const dispatch = useDispatch();
  const { pendingRequests, requestsTotal, requestsLimit, loading, error, success, actionSuccessMessage } = useSelector(
    (state) => state.kyc
  );

  const [page, setPage] = useState(1);
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Document preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Rejection modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = useCallback(() => {
    dispatch(fetchAdminKYCRequests({ page, limit: requestsLimit }));
  }, [dispatch, page, requestsLimit]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const socket = connectDashboardSocket();
    
    const handleStatusChange = () => {
      loadRequests();
    };

    socket.on('admin:user:status', handleStatusChange);

    return () => {
      socket.off('admin:user:status', handleStatusChange);
    };
  }, [loadRequests]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) loadRequests();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadRequests, loading]);

  useEffect(() => {
    if (success) {
      toast.success(actionSuccessMessage || 'Operation completed successfully.');
      dispatch(clearKYCStatus());
      setRejectOpen(false);
      setPreviewOpen(false);
      setRejectionReason('');
      setSelectedReq(null);
    }
    if (error) {
      toast.error(error);
      dispatch(clearKYCStatus());
    }
  }, [success, error, actionSuccessMessage, dispatch]);

  const handleOpenPreview = (req) => {
    setSelectedReq(req);
    setPreviewOpen(true);
  };

  const [confirmApprove, setConfirmApprove] = useState({ open: false, id: null });

  const handleApprove = (userId) => {
    setConfirmApprove({ open: true, id: userId });
  };

  const handleOpenReject = (req) => {
    setSelectedReq(req);
    setRejectionReason('');
    setRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await dispatch(rejectUserKYC({ userId: selectedReq._id, reason: rejectionReason })).unwrap();
      loadRequests();
    } catch { /* error handled by Redux error state */ }
  };

  const columns = useMemo(() => [
    {
      key: 'user',
      label: 'User',
      render: (_, req) => (
        <div>
          <p className="font-bold text-white">{req.fullName || 'N/A'}</p>
          <p className="text-xs text-slate-400">@{req.username || 'username'}</p>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="text-slate-350">{val}</span>
    },
    {
      key: 'kycDocumentType',
      label: 'Doc Type',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10 capitalize">
          {val === 'cnic' ? 'National ID / CNIC' : val.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'kycPersonalInfo',
      label: 'Submitted Details',
      render: (val) => (
        <div className="text-xs text-slate-400 space-y-1">
          {val?.fullName && <p><span className="font-semibold text-slate-300">Name:</span> {val.fullName}</p>}
          {val?.documentNumber && <p><span className="font-semibold text-slate-300">Doc #:</span> {val.documentNumber}</p>}
          {val?.dateOfBirth && <p><span className="font-semibold text-slate-300">DOB:</span> {val.dateOfBirth}</p>}
          {(val?.city || val?.address) && (
            <p className="truncate max-w-[200px]" title={`${val.address || ''}${val.city ? ', ' + val.city : ''}`}>
              <span className="font-semibold text-slate-300">Loc:</span> {val.address || ''}{val.city ? ` (${val.city})` : ''}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'updatedAt',
      label: 'Submitted At',
      render: (val) => <span className="text-slate-400">{new Date(val).toLocaleString()}</span>
    },
    {
      key: 'preview',
      label: 'Document',
      render: (_, req) => (
        <button
          onClick={() => handleOpenPreview(req)}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-bold cursor-pointer"
        >
          <Eye size={14} />
          View Image
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Review Actions',
      render: (_, req) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApprove(req._id)}
            className="p-2 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl cursor-pointer transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            title="Approve KYC"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => handleOpenReject(req)}
            className="p-2 bg-red-500/5 hover:bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl cursor-pointer transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.15)] hover:shadow-[0_0_15px_rgba(239,68,68,0.35)]"
            title="Reject KYC"
          >
            <X size={14} />
          </button>
        </div>
      )
    }
  ], [loading]);

  return (
    <div className="space-y-4 font-sans antialiased text-white">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-heading font-semibold text-white">KYC Verifications</h1>
        <p className="text-sm text-slate-400">{requestsTotal} request{requestsTotal !== 1 ? 's' : ''} pending review</p>
      </div>

      {/* TABLE */}
      <div className="bg-[#0d1420]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden text-white">
        <DataTable
          columns={columns}
          data={pendingRequests}
          loading={loading}
          emptyTitle="All caught up!"
          emptyDescription="No pending KYC verification requests at the moment."
        />
      </div>

      <div className="pt-2">
        <Pagination
          page={page}
          total={requestsTotal}
          limit={requestsLimit}
          onPageChange={setPage}
        />
      </div>

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`KYC Document Preview - ${selectedReq?.fullName || 'User'}`}
        size="lg"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
              <div>
                <p className="font-bold text-white">{selectedReq.fullName}</p>
                <p className="text-slate-400">@{selectedReq.username} | {selectedReq.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-white/10 text-amber-400 font-bold rounded-lg uppercase tracking-wide text-[9px] border border-white/10">
                  {selectedReq.kycDocumentType === 'cnic' ? 'National ID / CNIC' : selectedReq.kycDocumentType?.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* PERSONAL INFO */}
            {selectedReq.kycPersonalInfo && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted Personal Information</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    { label: 'Full Name', value: selectedReq.kycPersonalInfo.fullName },
                    { label: 'Date of Birth', value: selectedReq.kycPersonalInfo.dateOfBirth },
                    { label: 'Document Number', value: selectedReq.kycPersonalInfo.documentNumber },
                    { label: 'City', value: selectedReq.kycPersonalInfo.city },
                  ].map(({ label, value }) => value ? (
                    <div key={label}>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{value}</p>
                    </div>
                  ) : null)}
                  {selectedReq.kycPersonalInfo.address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Address</p>
                      <p className="font-semibold text-slate-200 mt-0.5">{selectedReq.kycPersonalInfo.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-white/10 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center p-2 min-h-[300px] max-h-[500px]">
              <ImageWithLoader src={selectedReq.kycDocumentUrl} />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
              <Button
                variant="danger"
                onClick={() => handleOpenReject(selectedReq)}
              >
                Reject Verification
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedReq._id)}
              >
                Approve Verification
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* REJECTION MODAL */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject KYC Submission"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            Please enter a reason for rejecting the KYC request of <span className="font-bold text-white">{selectedReq?.fullName}</span>. 
            This feedback will be shown on the user's dashboard.
          </p>

          <InputField
            label="Rejection Reason*"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason"
          />

          <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectSubmit}
              loading={loading}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, id: null })}
        onConfirm={async () => {
          try {
            await dispatch(approveUserKYC(confirmApprove.id)).unwrap();
            loadRequests();
          } catch { /* error handled by Redux error state */ }
          setConfirmApprove({ open: false, id: null });
        }}
        title="Approve KYC"
        message="Are you sure you want to approve this user's identity documents?"
        variant="warning"
      />
    </div>
  );
};

export default AdminKYCPage;
