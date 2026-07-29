import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, X, Eye, FileText, Calendar, User as UserIcon } from 'lucide-react';
import { fetchAdminKYCRequests, approveUserKYC, rejectUserKYC, clearKYCStatus } from '../../../store/slices/kycSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import InputField from '../../../components/common/InputField';
import toast from 'react-hot-toast';

const AdminKYCPage = () => {
  const dispatch = useDispatch();
  const { pendingRequests, requestsTotal, requestsPage, requestsLimit, loading, error, success, actionSuccessMessage } = useSelector(
    (state) => state.kyc
  );

  const [page, setPage] = useState(1);
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Document preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Rejection modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = () => {
    dispatch(fetchAdminKYCRequests({ page, limit: requestsLimit }));
  };

  useEffect(() => {
    loadRequests();
  }, [dispatch, page]);

  useEffect(() => {
    if (success) {
      toast.success(actionSuccessMessage || 'Operation completed successfully.');
      dispatch(clearKYCStatus());
      setRejectOpen(false);
      setPreviewOpen(false);
      setRejectionReason('');
      setSelectedReq(null);
      loadRequests();
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

  const handleApprove = (userId) => {
    if (window.confirm('Are you sure you want to approve this user\'s identity documents?')) {
      dispatch(approveUserKYC(userId));
    }
  };

  const handleOpenReject = (req) => {
    setSelectedReq(req);
    setRejectionReason('');
    setRejectOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    dispatch(rejectUserKYC({ userId: selectedReq._id, reason: rejectionReason }));
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, req) => (
        <div>
          <p className="font-bold text-text-light-bg">{req.fullName || 'N/A'}</p>
          <p className="text-xs text-text-secondary">@{req.username || 'username'}</p>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => <span className="text-text-secondary">{val}</span>
    },
    {
      key: 'kycDocumentType',
      label: 'Doc Type',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-bg-light-alt text-text-secondary border border-border-light capitalize">
          {val === 'cnic' ? 'National ID / CNIC' : val.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'updatedAt',
      label: 'Submitted At',
      render: (val) => <span className="text-text-secondary">{new Date(val).toLocaleString()}</span>
    },
    {
      key: 'preview',
      label: 'Document',
      render: (_, req) => (
        <button
          onClick={() => handleOpenPreview(req)}
          className="flex items-center gap-1.5 text-xs text-[#185adb] hover:underline font-bold cursor-pointer"
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
            className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg cursor-pointer transition-colors border border-green-200"
            title="Approve KYC"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => handleOpenReject(req)}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer transition-colors border border-red-200"
            title="Reject KYC"
          >
            <X size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 font-sans antialiased text-slate-800">
      
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-heading font-semibold text-text-light-bg">KYC Verifications</h1>
        <p className="text-sm text-text-secondary">{requestsTotal} request{requestsTotal !== 1 ? 's' : ''} pending review</p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <DataTable
          columns={columns}
          data={pendingRequests}
          loading={loading}
          emptyTitle="All caught up!"
          emptyDescription="No pending KYC verification requests at the moment."
        />
      </div>

      <Pagination
        page={page}
        total={requestsTotal}
        limit={requestsLimit}
        onPageChange={setPage}
      />

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`KYC Document Preview - ${selectedReq?.fullName || 'User'}`}
        size="lg"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">{selectedReq.fullName}</p>
                <p className="text-slate-400">@{selectedReq.username} | {selectedReq.email}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#185adb] font-bold rounded-lg uppercase tracking-wide text-[9px] border border-blue-100">
                  {selectedReq.kycDocumentType === 'cnic' ? 'National ID / CNIC' : selectedReq.kycDocumentType?.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* PERSONAL INFO */}
            {selectedReq.kycPersonalInfo && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
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
                      <p className="font-semibold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ) : null)}
                  {selectedReq.kycPersonalInfo.address && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Address</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedReq.kycPersonalInfo.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center p-2 min-h-[300px] max-h-[500px]">
              {selectedReq.kycDocumentUrl ? (
                <img 
                  src={selectedReq.kycDocumentUrl} 
                  alt="KYC Identity Proof" 
                  className="object-contain max-h-[480px] w-full" 
                />
              ) : (
                <span className="text-slate-400">No document image uploaded.</span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                onClick={() => handleOpenReject(selectedReq)}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              >
                Reject Verification
              </Button>
              <Button
                onClick={() => handleApprove(selectedReq._id)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
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
          <p className="text-slate-550 leading-relaxed">
            Please enter a reason for rejecting the KYC request of <span className="font-bold text-slate-800">{selectedReq?.fullName}</span>. 
            This feedback will be shown on the user's dashboard.
          </p>

          <InputField
            label="Rejection Reason*"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Photo quality is too low or text is illegible."
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button
              onClick={() => setRejectOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminKYCPage;
