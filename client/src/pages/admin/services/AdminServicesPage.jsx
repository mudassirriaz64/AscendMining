import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit2, Trash2, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  fetchAdminServices, 
  createAdminService, 
  updateAdminService, 
  deleteAdminService, 
  clearAdminServiceError, 
  clearAdminServiceSuccess 
} from '../../../store/slices/adminServiceSlice';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';

const AdminServicesPage = () => {
  const dispatch = useDispatch();
  const { services, loading, error, actionSuccess } = useSelector((s) => s.adminServices);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Cpu',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    dispatch(fetchAdminServices());
  }, [dispatch]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearAdminServiceSuccess());
      setModalOpen(false);
    }
  }, [actionSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'An error occurred.');
      dispatch(clearAdminServiceError());
    }
  }, [error, dispatch]);

  const handleOpenModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        description: service.description,
        icon: service.icon,
        isActive: service.isActive,
        order: service.order,
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        description: '',
        icon: 'Cpu',
        isActive: true,
        order: services.length > 0 ? services[services.length - 1].order + 1 : 0,
      });
    }
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingService) {
      dispatch(updateAdminService({ id: editingService._id, data: formData }));
    } else {
      dispatch(createAdminService(formData));
    }
  };

  const columns = [
    {
      key: 'order',
      label: 'Order',
      render: (val) => <p className="font-medium text-slate-800">{val}</p>
    },
    {
      key: 'icon',
      label: 'Icon',
      render: (val) => (
        <div className="bg-blue-50 text-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
          <Cpu size={20} />
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title',
      render: (val) => <p className="font-medium text-slate-800">{val}</p>
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <p className="text-sm text-slate-500 max-w-sm truncate" title={val}>{val}</p>
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="!p-1.5" onClick={() => handleOpenModal(row)}>
            <Edit2 size={16} />
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
          <h1 className="text-2xl font-bold text-slate-800">Services</h1>
          <p className="text-slate-500 text-sm">Manage the services displayed on the platform.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={18} />
          Add Service
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <DataTable
          columns={columns}
          data={services}
          loading={loading}
          emptyMessage="No services found."
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Edit Service' : 'Add Service'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358] resize-none"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#083358]"
                required
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#083358] rounded focus:ring-[#083358]"
                />
                <span className="text-sm font-medium text-slate-700">Is Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Service'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => { dispatch(deleteAdminService(confirmDelete.id)); setConfirmDelete({ open: false, id: null }); }}
        title="Delete Service"
        message="Are you sure you want to permanently delete this service?"
        variant="danger"
      />
    </div>
  );
};

export default AdminServicesPage;
