import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Package, Wallet, ArrowDownToLine, ArrowUpToLine, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdminDashboardStats } from '../../../store/slices/adminDashboardSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColorClass} ${colorClass}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.adminDashboardStats);

  useEffect(() => {
    dispatch(fetchAdminDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'Failed to load dashboard statistics.');
    }
  }, [error]);

  if (loading && !stats.totalUsers) {
    return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">Overview of platform statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers?.toLocaleString() || 0} 
          icon={Users} 
          colorClass="text-blue-600" 
          bgColorClass="bg-blue-50" 
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers?.toLocaleString() || 0} 
          icon={Users} 
          colorClass="text-green-600" 
          bgColorClass="bg-green-50" 
        />
        <StatCard 
          title="Active Packages" 
          value={stats.activePackages?.toLocaleString() || 0} 
          icon={Package} 
          colorClass="text-purple-600" 
          bgColorClass="bg-purple-50" 
        />
        <StatCard 
          title="Pending Deposits" 
          value={stats.pendingDeposits?.toLocaleString() || 0} 
          icon={Clock} 
          colorClass="text-orange-600" 
          bgColorClass="bg-orange-50" 
        />
        <StatCard 
          title="Total Deposits" 
          value={`$${stats.totalDeposits?.toLocaleString() || 0}`} 
          icon={ArrowDownToLine} 
          colorClass="text-emerald-600" 
          bgColorClass="bg-emerald-50" 
        />
        <StatCard 
          title="Total Withdrawals" 
          value={`$${stats.totalWithdrawals?.toLocaleString() || 0}`} 
          icon={ArrowUpToLine} 
          colorClass="text-red-600" 
          bgColorClass="bg-red-50" 
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
