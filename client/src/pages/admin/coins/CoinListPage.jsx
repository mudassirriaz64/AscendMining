import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { fetchCoins, toggleCoinStatus, deleteCoin, clearCoinError, clearCoinActionSuccess } from '../../../store/slices/adminCoinSlice';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import SearchInput from '../../../components/common/SearchInput';
import StatusBadge from '../../../components/common/StatusBadge';
import Button from '../../../components/common/Button';
import CoinFormModal from './CoinFormModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const CoinListPage = () => {
  const dispatch = useDispatch();
  const { coins, coinsTotal, coinsLimit, loading, error, actionSuccess } = useSelector(
    (state) => state.adminCoins
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const loadCoins = useCallback(() => {
    dispatch(fetchCoins({ page, limit: coinsLimit, search: search || undefined }));
  }, [dispatch, page, coinsLimit, search]);

  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      dispatch(clearCoinActionSuccess());
      loadCoins();
    }
  }, [actionSuccess, dispatch, loadCoins]);

  useEffect(() => {
    if (error) {
      toast.error(error?.error?.message || 'Something went wrong.');
      dispatch(clearCoinError());
    }
  }, [error, dispatch]);

  const handleToggle = (id) => {
    dispatch(toggleCoinStatus(id));
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ open: true, id, name });
  };

  const handleEdit = (coin) => {
    setEditingCoin(coin);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCoin(null);
    setModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      key: 'logo',
      label: '',
      render: (_, coin) => (
        <div className="w-8 h-8 rounded-full bg-bg-light-alt flex items-center justify-center text-xs font-bold text-text-secondary">
          {coin.symbol?.charAt(0)}
        </div>
      ),
    },
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol', render: (_, coin) => <span className="font-mono text-sm font-semibold">{coin.symbol}</span> },
    {
      key: 'miningAvailable',
      label: 'Mining',
      render: (_, coin) => (
        <span className={`text-xs font-medium ${coin.miningAvailable ? 'text-success' : 'text-text-secondary'}`}>
          {coin.miningAvailable ? 'Available' : 'Disabled'}
        </span>
      ),
    },
    { key: 'usdRate', label: 'USD Rate', render: (_, coin) => <span className="font-mono text-sm">${coin.usdRate}</span> },
    {
      key: 'isActive',
      label: 'Status',
      render: (_, coin) => <StatusBadge status={coin.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (_, coin) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(coin)} className="p-1.5 hover:bg-bg-light-alt rounded-lg cursor-pointer" title="Edit">
            <Pencil size={16} className="text-text-secondary" />
          </button>
          <button onClick={() => handleToggle(coin._id)} className="p-1.5 hover:bg-bg-light-alt rounded-lg cursor-pointer" title="Toggle status">
            {coin.isActive ? (
              <ToggleRight size={18} className="text-success" />
            ) : (
              <ToggleLeft size={18} className="text-text-secondary" />
            )}
          </button>
          <button onClick={() => handleDelete(coin._id, coin.name)} className="p-1.5 hover:bg-danger/10 rounded-lg cursor-pointer" title="Delete">
            <Trash2 size={16} className="text-danger" />
          </button>
        </div>
      ),
    },
  ], [loading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-semibold text-text-light-bg">Coins</h1>
          <p className="text-sm text-text-secondary">{coinsTotal} coin{coinsTotal !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus size={16} className="mr-1.5" />
          Add Coin
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-64">
          <SearchInput
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Search coins..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <DataTable columns={columns} data={coins} loading={loading} emptyTitle="No coins found" emptyDescription="Create your first coin to get started." />
      </div>

      <Pagination page={page} total={coinsTotal} limit={coinsLimit} onPageChange={setPage} />

      <CoinFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCoin(null); }}
        coin={editingCoin}
      />

      <ConfirmModal
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => { dispatch(deleteCoin(confirmDelete.id)); setConfirmDelete({ open: false, id: null }); }}
        title="Delete Coin"
        message={`Are you sure you want to delete "${confirmDelete.name || ''}"?`}
        variant="danger"
      />
    </div>
  );
};

export default CoinListPage;
