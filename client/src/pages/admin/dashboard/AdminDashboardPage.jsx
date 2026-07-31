import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, Wallet, Cpu, CheckSquare, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdminDashboardStats, updateSystemStatusThunk } from '../../../store/slices/adminDashboardSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const StatCard = ({ title, value, label, icon: Icon, to, menu }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseClass = 'bg-[#131b2e] border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-between transition-all';

  const content = (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-white font-mono">{value}</h3>
          {label && <span className="text-xs font-semibold text-emerald-400">{label}</span>}
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/70 uppercase tracking-wider group-hover:text-primary transition-colors">
          View More <ArrowRight size={12} />
        </span>
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
        <Icon size={24} />
      </div>
    </>
  );

  if (menu) {
    return (
      <div
        ref={menuRef}
        className={`relative ${baseClass} group cursor-pointer ${open ? 'border-primary/40 shadow-2xl' : 'hover:border-primary/40 hover:shadow-2xl'}`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={`${title} - view more`}
        />
        <div className="pointer-events-none">{content}</div>
        {open && (
          <div className="absolute right-4 top-[calc(100%-8px)] z-20 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5">
            {menu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {item.label}
                <ArrowRight size={12} className="text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`${baseClass} group hover:border-primary/40 hover:shadow-2xl`}
    >
      {content}
    </Link>
  );
};

const SVGLineChart = ({ data, dataKey, strokeColor = '#F5C518', height = 140 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-slate-400 text-xs">
        No trend data available
      </div>
    );
  }

  const values = data.map(d => d[dataKey] || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal;

  const width = 500;
  const padding = 10;
  
  const getX = (index) => {
    return padding + (index / (data.length - 1)) * (width - padding * 2);
  };

  const getY = (value) => {
    return height - padding - ((value - minVal) / (range || 1)) * (height - padding * 2);
  };

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[dataKey] || 0)}`).join(' ');
  const areaD = `${pathD} L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div className="relative w-full h-[140px] mt-4">
      <style>{`
        @keyframes drawLine {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        
        {/* Helper grid lines */}
        <line x1={getX(0)} y1={getY(maxVal)} x2={getX(data.length - 1)} y2={getY(maxVal)} stroke="rgba(0,0,0,0.02)" strokeDasharray="3,3" />
        <line x1={getX(0)} y1={getY(maxVal / 2)} x2={getX(data.length - 1)} y2={getY(maxVal / 2)} stroke="rgba(0,0,0,0.02)" strokeDasharray="3,3" />

        {/* Fill Area under chart line */}
        <path d={areaD} fill={`url(#grad-${dataKey})`} />

        {/* Glowing Background Blur Line Path */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={4} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="animate-draw opacity-50"
          style={{ filter: `blur(4px)` }} 
        />

        {/* Main sharp Chart Line Path */}
        <path 
          d={pathD} 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={2} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="animate-draw"
        />

        {/* Terminal node bubble with outer glowing pulse animation */}
        {data.length > 0 && (
          <>
            {/* Pulsing ring */}
            <circle 
              cx={getX(data.length - 1)} 
              cy={getY(values[data.length - 1])} 
              r={9} 
              fill={strokeColor} 
              className="animate-ping opacity-60"
              style={{
                transformOrigin: `${getX(data.length - 1)}px ${getY(values[data.length - 1])}px`
              }}
            />
            {/* Core dot */}
            <circle 
              cx={getX(data.length - 1)} 
              cy={getY(values[data.length - 1])} 
              r={4} 
              fill={strokeColor} 
              stroke="#ffffff" 
              strokeWidth={1.5}
              style={{ filter: `drop-shadow(0 0 3px ${strokeColor})` }}
            />
          </>
        )}
      </svg>
    </div>
  );
};

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-primary' : 'bg-slate-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { statsData, loading, error } = useSelector((s) => s.adminDashboardStats);

  useEffect(() => {
    dispatch(fetchAdminDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error.error?.message || 'Failed to load dashboard statistics.');
    }
  }, [error]);

  const handleToggle = (key, currentValue) => {
    dispatch(updateSystemStatusThunk({ [key]: !currentValue }))
      .unwrap()
      .then(() => toast.success('System configuration updated successfully'))
      .catch((err) => toast.error(err.error?.message || 'Failed to update system configuration'));
  };

  if (loading && !statsData.stats.totalUsers) {
    return <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;
  }

  const {
    stats = {},
    activityTrend = [],
    depositTrend = [],
    systemStatus = {},
    recentRegistrations = [],
    platformTransactions = []
  } = statsData || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time ledger audit and platform controls.</p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registered Users" 
          value={stats.totalUsers?.toLocaleString() || 0} 
          icon={Users} 
          to="/admin/users"
        />
        <StatCard 
          title="Platform Liquidity" 
          value={`$${stats.platformLiquidity?.toLocaleString() || 0}`} 
          label="USD"
          icon={Wallet} 
          to="/admin/deposits"
        />
        <StatCard 
          title="Active Mining Nodes" 
          value={stats.activePackages || 0} 
          label="Online"
          icon={Cpu} 
          to="/admin/packages"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals || 0} 
          label="Requests"
          icon={CheckSquare} 
          menu={[
            { label: 'Pending KYC Verifications', to: '/admin/kyc' },
            { label: 'Pending Deposits', to: '/admin/deposits' },
            { label: 'Pending Withdrawals', to: '/admin/withdrawals' },
          ]}
        />
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Total Activity (Platform)</h3>
          <p className="text-xs text-slate-400 mt-1">Aggregate platform engagement & user growth (Last 30 days)</p>
          <SVGLineChart data={activityTrend} dataKey="count" strokeColor="#F5C518" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Global Deposit Trends</h3>
            <p className="text-xs text-slate-400 mt-1">Total platform deposits vs Pending (Weekly)</p>
          </div>
          <SVGLineChart data={depositTrend} dataKey="amount" strokeColor="#F5C518" />
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-4 mt-2 border-t border-slate-50 pt-2">
            <span>W1</span>
            <span>W2</span>
            <span>W3</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: System Status & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status Controls */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">System Status</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Maintenance Mode</h4>
                <p className="text-xs text-slate-400">Lock all user features</p>
              </div>
              <Switch 
                checked={!!systemStatus.maintenanceMode} 
                onChange={() => handleToggle('maintenanceMode', systemStatus.maintenanceMode)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">New Registrations</h4>
                <p className="text-xs text-slate-400">Allow new user signups</p>
              </div>
              <Switch 
                checked={!!systemStatus.newRegistrations} 
                onChange={() => handleToggle('newRegistrations', systemStatus.newRegistrations)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Withdrawal Processing</h4>
                <p className="text-xs text-slate-400">Global payout gateway</p>
              </div>
              <Switch 
                checked={!!systemStatus.withdrawalProcessing} 
                onChange={() => handleToggle('withdrawalProcessing', systemStatus.withdrawalProcessing)}
              />
            </div>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Registrations</h3>
            <Link to="/admin/users" className="text-xs font-semibold text-primary hover:underline">
              View Directory
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400 text-xs">No registrations found</td>
                  </tr>
                ) : (
                  recentRegistrations.map((user, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-medium text-slate-800">{user.username}</td>
                      <td className="py-3 text-slate-500 font-mono text-xs">{user.email}</td>
                      <td className="py-3 text-slate-600 font-medium">{user.plan}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          user.status === 'approved' 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : user.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {user.status === 'approved' ? 'Verified' : user.status === 'pending' ? 'Pending' : 'None'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Platform Transactions Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Platform Transactions
          </h3>
          <Link to="/admin/deposits" className="text-xs font-semibold text-primary hover:underline">
            Master Ledger →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3">User ID</th>
                <th className="py-3">TRX ID</th>
                <th className="py-3">Date / Time</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {platformTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400 text-xs">No transaction records found</td>
                </tr>
              ) : (
                platformTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-medium text-slate-800">{tx.userId}</td>
                    <td className="py-3.5 font-mono text-xs text-slate-400">{tx.trxId}</td>
                    <td className="py-3.5 text-slate-500 font-mono text-xs">
                      {new Date(tx.dateTime).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                        tx.amount > 0 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} USD
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 italic font-light">{tx.description}</td>
                    <td className="py-3.5 text-right">
                      <Link 
                        to={tx.type === 'deposit' ? '/admin/deposits' : '/admin/withdrawals'} 
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        REVIEW
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
