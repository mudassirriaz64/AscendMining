import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  fetchAdminPaymentMethods, 
  createAdminPaymentMethod, 
  updateAdminPaymentMethod, 
  deleteAdminPaymentMethod, 
  toggleAdminPaymentMethodStatus,
  clearAdminPaymentMethodError, 
  clearAdminPaymentMethodSuccess 
} from '../../../store/slices/adminPaymentMethodSlice';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { formatDate } from '../../../utils/formatters';

const methodTypes = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'crypto_manual', label: 'Crypto (Manual)' },
  { value: 'crypto_api', label: 'Crypto (API)' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
];

const AdminPaymentMethodsPage = () => {
  const dispatch = useDispatch();
  const { paymentMethods, loading, error, actionSuccess } = useSelector((s) => s.adminPaymentMethods);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState({ open: false, id: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    instructions: '',
    minDeposit: '',
    maxDeposit: '',
  });

  useEffect(() => {
    dispatch(fetchAdminPaymentMethods());
  }, [dispatch]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminPaymentMethodSuccess());
      setModalOpen(false);
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminPaymentMethodError());
    }
  }, [error, dispatch]);

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        instructions: method.instructions,
        minDeposit: method.minDeposit,
        maxDeposit: method.maxDeposit,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'bank',
        instructions: '',
        minDeposit: '',
        maxDeposit: '',
      });
    }
    setModalOpen(true);
  };

  const handleToggleStatus = (id) => {
    setConfirmToggle({ open: true, id });
  };

  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMethod) {
      dispatch(updateAdminPaymentMethod({ id: editingMethod._id, data: formData }));
    } else {
      dispatch(createAdminPaymentMethod(formData));
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-slate-800">{val}</p>
          <p className="text-xs text-slate-500 capitalize">{row.type.replace('_', ' ')}</p>
        </div>
      )
    },
    {
      key: 'limits',
      label: 'Limits',
      render: (_, row) => (
        <p className="text-slate-600 text-sm">
          ${row.minDeposit} - ${row.maxDeposit}
        </p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => <p className="text-sm text-slate-500">{formatDate(val)}</p>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="!p-1.5" onClick={() => handleOpenModal(row)}>
            <Edit2 size={16} />
          </Button>
          <Button 
            variant={row.status === 'active' ? 'danger' : 'success'} 
            size="sm" 
            className="!p-1.5" 
            onClick={() => handleToggleStatus(row._id)}
          >
            <Power size={16} />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Methods</h1>
          <p className="text-slate-500 text-sm">Manage bank accounts, mobile wallets, and crypto methods.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={18} />
          Add Method
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <DataTable
          columns={columns}
          data={paymentMethods}
          loading={loading}
          emptyMessage="No payment methods found."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
              required
              placeholder="Enter payment method name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
              required
            >
              {methodTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Deposit ($)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.minDeposit}
                onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Deposit ($)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.maxDeposit}
                onChange={(e) => setFormData({ ...formData, maxDeposit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (For User)</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358] resize-none"
              rows={4}
              placeholder="Enter transfer instructions for user"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Method'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmToggle.open}
        onClose={() => setConfirmToggle({ open: false, id: null })}
        onConfirm={() => { dispatch(toggleAdminPaymentMethodStatus(confirmToggle.id)); setConfirmToggle({ open: false, id: null }); }}
        title="Toggle Status"
        message="Are you sure you want to toggle the status of this payment method?"
        variant="warning"
      />

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => { dispatch(deleteAdminPaymentMethod(confirmDelete.id)); setConfirmDelete({ open: false, id: null }); }}
        title="Delete Payment Method"
        message="Are you sure you want to permanently delete this payment method?"
        variant="danger"
      />
    </div>
  );
};

export default AdminPaymentMethodsPage;
