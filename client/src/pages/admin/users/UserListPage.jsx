import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, ShieldCheck } from 'lucide-react';
import { fetchUsers } from '../../../store/slices/adminUserSlice';
import SearchInput from '../../../components/common/SearchInput';
import FilterChips from '../../../components/common/FilterChips';
import DataTable from '../../../components/common/DataTable';
import Pagination from '../../../components/common/Pagination';
import StatusBadge from '../../../components/common/StatusBadge';
import usePolling from '../../../hooks/usePolling';

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'unverified', label: 'Unverified' },
];

const UserListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { users, usersTotal, usersPage, usersLimit, loading } = useSelector((s) => s.adminUsers);

  const [search, setSearch] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('search') || '';
  });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(() => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (status) params.status = status;
    dispatch(fetchUsers(params));
  }, [dispatch, page, search, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  usePolling(loadUsers, 30000);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('search') || '';
    setSearch(q);
    setPage(1);
  }, [location.search]);

  const handleSearch = (val) => {
    navigate(`/admin/users?search=${encodeURIComponent(val)}`, { replace: true });
  };

  const handleStatusFilter = (val) => {
    setStatus(val);
    setPage(1);
  };

  const columns = useMemo(() => [
    {
      key: 'fullName',
      label: 'Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-text-light-bg">{val}</p>
          <p className="text-xs text-text-secondary">@{row.username}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className="flex items-center gap-1 text-xs">
          {val === 'admin' && <ShieldCheck size={14} className="text-secondary" />}
          {val === 'support_agent' ? 'Support Agent' : val?.charAt(0).toUpperCase() + val?.slice(1)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'walletBalance',
      label: 'Balance',
      render: (val) => (
        <span className="font-mono text-sm">${(val || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => new Date(val).toLocaleDateString(),
    },
  ], [loading]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold text-text-light-bg">Users</h1>
            <p className="text-sm text-text-secondary">{usersTotal} total users</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border-light">
        <div className="px-4 py-3 border-b border-border-light flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, email, username..."
            className="sm:w-72"
          />
          <FilterChips options={statusFilters} active={status} onChange={handleStatusFilter} />
        </div>

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyTitle="No users found"
          emptyDescription="No users match your search criteria."
          onRowClick={(row) => navigate(`/admin/users/${row._id}`)}
        />

        <div className="px-4">
          <Pagination page={usersPage} total={usersTotal} limit={usersLimit} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
};

export default UserListPage;
