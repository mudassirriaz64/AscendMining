import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { fetchAdminPackages, toggleAdminPackageStatus, deleteAdminPackage, clearPackageError, clearPackageActionSuccess } from '../../../store/slices/adminPackageSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import PackageFormModal from './PackageFormModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const PackageListPage = () => {
  const dispatch = useDispatch();
  const { packages, packagesTotal, packagesLimit, loading, error, actionSuccess } = useSelector(
    (state) => state.adminPackages
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const loadPackages = useCallback(() => {
    dispatch(fetchAdminPackages({ page, limit: packagesLimit, search: search || undefined }));
  }, [dispatch, page, packagesLimit, search]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearPackageActionSuccess());
      loadPackages();
    }
  }, [actionSuccess, dispatch, loadPackages]);

  useEffect(() => {
    if (error) {
      toast.error(error?.error?.message || 'Something went wrong.');
      dispatch(clearPackageError());
    }
  }, [error, dispatch]);

  const handleToggle = (id) => {
    dispatch(toggleAdminPackageStatus(id));
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const columns = useMemo(() => [
    { key: 'name', label: 'Name', render: (_, pkg) => <span className="font-semibold text-white">{pkg.name}</span> },
    { key: 'price', label: 'Price', render: (_, pkg) => <span className="font-mono text-sm text-slate-200 font-bold">${pkg.price}</span> },
    { key: 'dailyROI', label: 'Daily ROI', render: (_, pkg) => <span className="font-mono text-sm text-emerald-405 font-bold">{pkg.dailyROI}%</span> },
    { key: 'duration', label: 'Duration', render: (_, pkg) => <span className="font-mono text-sm text-slate-350">{pkg.duration}d</span> },
    {
      key: 'coins',
      label: 'Coins',
      render: (_, pkg) => (
        <div className="flex flex-wrap gap-1">
          {pkg.coins?.map((coin) => (
            <span key={coin._id || coin} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-slate-400 border border-white/10">
              {coin.symbol || coin}
            </span>
          ))}
          {(!pkg.coins || pkg.coins.length === 0) && (
            <span className="text-xs text-slate-400">No coins</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, pkg) => <StatusBadge status={pkg.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (_, pkg) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(pkg)} className="p-2 hover:bg-white/5 border border-white/10 rounded-xl cursor-pointer text-slate-400 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleToggle(pkg._id)} className="p-2 hover:bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-colors" title="Toggle status">
            {pkg.status === 'active' ? (
              <ToggleRight size={16} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={16} className="text-slate-400" />
            )}
          </button>
          <button onClick={() => handleDelete(pkg._id)} className="p-2 hover:bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer text-red-400 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [loading]);

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-white">Packages</h1>
          <p className="text-sm text-slate-400">{packagesTotal} package{packagesTotal !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus size={16} className="mr-1.5" />
          Add Package
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <SearchInput
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Search packages..."
          />
        </div>
      </div>

      <div className="bg-[#0d1420]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden text-white">
        <DataTable columns={columns} data={packages} loading={loading} emptyTitle="No packages found" emptyDescription="Create your first package to get started." />
      </div>

      <Pagination page={page} total={packagesTotal} limit={packagesLimit} onPageChange={setPage} />

      <PackageFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPackage(null); }}
        pkg={editingPackage}
      />

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => { dispatch(deleteAdminPackage(confirmDelete.id)); setConfirmDelete({ open: false, id: null }); }}
        title="Delete Package"
        message="Are you sure you want to permanently delete this package?"
        variant="danger"
      />
    </div>
  );
};

export default PackageListPage;
