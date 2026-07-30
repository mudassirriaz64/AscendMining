import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  fetchAdminContactMessages, 
  markMessageAsRead, 
  deleteAdminContactMessage, 
  clearAdminContactMessageError, 
  clearAdminContactMessageSuccess 
} from '../../../store/slices/adminContactMessageSlice';
import DataTable from '../../../components/common/DataTable';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { formatDate } from '../../../utils/formatters';
import { connectDashboardSocket } from '../../../services/dashboardSocket';

const AdminContactMessagesPage = () => {
  const dispatch = useDispatch();
  const { messages, total, page: currentPage, limit, loading, error, actionSuccess } = useSelector((s) => s.adminContactMessages);

  const [page, setPage] = useState(1);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const loadMessages = useCallback(() => {
    dispatch(fetchAdminContactMessages({ page, limit: 20 }));
  }, [dispatch, page]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const socket = connectDashboardSocket();
    
    const handleNewMessage = () => {
      loadMessages();
    };

    socket.on('admin:contact:new', handleNewMessage);

    return () => {
      socket.off('admin:contact:new', handleNewMessage);
    };
  }, [loadMessages]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminContactMessageSuccess());
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminContactMessageError());
    }
  }, [error, dispatch]);

  const handleViewMessage = (msg) => {
    setViewingMessage(msg);
    if (!msg.isRead) {
      dispatch(markMessageAsRead(msg._id));
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.isRead && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
          <Mail className={`w-5 h-5 ${row.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
        </div>
      )
    },
    {
      key: 'name',
      label: 'Sender',
      render: (_, row) => (
        <div>
          <p className={`font-medium ${!row.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (val, row) => (
        <p className={`max-w-[200px] truncate ${!row.isRead ? 'font-medium text-slate-800' : 'text-slate-600'}`} title={val}>
          {val}
        </p>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => <p className="text-sm text-slate-500">{formatDate(val)}</p>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="!p-1.5" onClick={() => handleViewMessage(row)}>
            <Eye size={16} />
          </Button>
          <Button variant="danger" size="sm" className="!p-1.5" onClick={() => handleDelete(row._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contact Messages</h1>
          <p className="text-slate-500 text-sm">Review messages submitted through the contact form.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <DataTable
          columns={columns}
          data={messages}
          loading={loading}
          emptyMessage="No contact messages found."
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
        isOpen={!!viewingMessage}
        onClose={() => setViewingMessage(null)}
        title="Message Details"
      >
        {viewingMessage && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{viewingMessage.name}</p>
                  <p className="text-sm text-slate-500">{viewingMessage.email}</p>
                </div>
                <p className="text-xs text-slate-500">{formatDate(viewingMessage.createdAt)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Subject: {viewingMessage.subject}</h3>
              <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[150px] whitespace-pre-wrap text-sm text-slate-700">
                {viewingMessage.message}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button variant="danger" onClick={() => handleDelete(viewingMessage._id)}>
                Delete Message
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setViewingMessage(null)}>
                  Close
                </Button>
                <a href={`mailto:${viewingMessage.email}?subject=RE: ${viewingMessage.subject}`} className="inline-flex">
                  <Button variant="primary">Reply via Email</Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={async () => {
          try {
            await dispatch(deleteAdminContactMessage(confirmDelete.id)).unwrap();
            loadMessages();
          } catch { /* error handled by Redux error state */ }
          if (viewingMessage && viewingMessage._id === confirmDelete.id) setViewingMessage(null);
          setConfirmDelete({ open: false, id: null });
        }}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        variant="danger"
      />
    </div>
  );
};

export default AdminContactMessagesPage;
