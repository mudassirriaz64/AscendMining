import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchAdminPackages, toggleAdminPackageStatus, clearPackageError, clearPackageActionSuccess } from '../../../store/slices/adminPackageSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import PackageFormModal from './PackageFormModal';
import toast from 'react-hot-toast';

const PackageListPage = () => {
  const dispatch = useDispatch();
  const { packages, packagesTotal, packagesPage, packagesLimit, loading, error, actionSuccess } = useSelector(
    (state) => state.adminPackages
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

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

  const columns = [
    { key: 'name', label: 'Name', render: (_, pkg) => <span className="font-medium text-text-light-bg">{pkg.name}</span> },
    { key: 'price', label: 'Price', render: (_, pkg) => <span className="font-mono text-sm">${pkg.price}</span> },
    { key: 'dailyROI', label: 'Daily ROI', render: (_, pkg) => <span className="font-mono text-sm text-success">{pkg.dailyROI}%</span> },
    { key: 'duration', label: 'Duration', render: (_, pkg) => <span className="font-mono text-sm">{pkg.duration}d</span> },
    {
      key: 'coins',
      label: 'Coins',
      render: (_, pkg) => (
        <div className="flex flex-wrap gap-1">
          {pkg.coins?.map((coin) => (
            <span key={coin._id || coin} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-bg-light-alt text-text-secondary border border-border-light">
              {coin.symbol || coin}
            </span>
          ))}
          {(!pkg.coins || pkg.coins.length === 0) && (
            <span className="text-xs text-text-secondary">No coins</span>
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
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(pkg)} className="p-1.5 hover:bg-bg-light-alt rounded-lg cursor-pointer" title="Edit">
            <Pencil size={16} className="text-text-secondary" />
          </button>
          <button onClick={() => handleToggle(pkg._id)} className="p-1.5 hover:bg-bg-light-alt rounded-lg cursor-pointer" title="Toggle status">
            {pkg.status === 'active' ? (
              <ToggleRight size={18} className="text-success" />
            ) : (
              <ToggleLeft size={18} className="text-text-secondary" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-text-light-bg">Packages</h1>
          <p className="text-sm text-text-secondary">{packagesTotal} package{packagesTotal !== 1 ? 's' : ''} configured</p>
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search packages..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <DataTable columns={columns} data={packages} loading={loading} emptyTitle="No packages found" emptyDescription="Create your first package to get started." />
      </div>

      <Pagination page={page} total={packagesTotal} limit={packagesLimit} onPageChange={setPage} />

      <PackageFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPackage(null); }}
        pkg={editingPackage}
      />
    </div>
  );
};

export default PackageListPage;
