import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, Wallet, Cpu, CheckSquare, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdminDashboardStats, updateSystemStatusThunk } from '../../../store/slices/adminDashboardSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const StatCard = ({ title, value, label, icon: Icon, to, menu, themeColor = 'gold' }) => {
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

  const borderHighlight = themeColor === 'gold' 
    ? 'border-amber-550/20 hover:border-amber-400/50 shadow-[inset_0_0_15px_rgba(245,197,24,0.03)] hover:shadow-[0_0_20px_rgba(245,197,24,0.15)]' 
    : 'border-cyan-550/20 hover:border-cyan-400/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.03)] hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]';

  const baseClass = `bg-page-card backdrop-blur-xl border ${borderHighlight} text-page-text rounded-2xl p-6 flex items-center justify-between transition-all duration-300`;
  const valueColor = themeColor === 'gold' ? 'text-amber-500' : 'text-cyan-500';
  const iconBg = themeColor === 'gold' ? 'bg-amber-400/10 border-amber-400/20 text-amber-500' : 'bg-cyan-400/10 border-cyan-400/20 text-cyan-500';
  const viewMoreText = themeColor === 'gold' ? 'text-amber-500/70 group-hover:text-amber-550' : 'text-cyan-500/70 group-hover:text-cyan-555';

  const content = (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-page-text-soft uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl font-bold font-mono ${valueColor}`}>{value}</h3>
          {label && <span className="text-xs font-semibold text-emerald-500">{label}</span>}
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${viewMoreText} transition-colors`}>
          View More <ArrowRight size={12} />
        </span>
      </div>
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${iconBg}`}>
        <Icon size={24} />
      </div>
    </>
  );

  if (menu) {
    return (
      <div
        ref={menuRef}
        className={`relative ${baseClass} group cursor-pointer ${open ? 'border-amber-400/40 shadow-2xl' : 'hover:border-amber-400/40 hover:shadow-2xl'}`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={`${title} - view more`}
        />
        <div className="pointer-events-none w-full flex items-center justify-between">{content}</div>
        {open && (
          <div className="absolute right-4 top-[calc(100%-8px)] z-20 w-56 bg-page-card-strong backdrop-blur-2xl rounded-2xl shadow-2xl border border-page-border py-1.5 animate-fade-in text-page-text">
            {menu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-page-text-muted hover:text-page-text hover:bg-page-fill transition-colors"
              >
                {item.label}
                <ArrowRight size={12} className="text-page-text-soft" />
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
      className={`${baseClass} group hover:shadow-2xl`}
    >
      {content}
    </Link>
  );
};

const SVGLineChart = ({ data, dataKey, strokeColor = '#F5C518', height = 140 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-page-text-soft text-xs">
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
          <linearGradient id={`grad-${dataKey}-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        
        {/* Helper grid lines */}
        <line x1={getX(0)} y1={getY(maxVal)} x2={getX(data.length - 1)} y2={getY(maxVal)} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3,3" />
        <line x1={getX(0)} y1={getY(maxVal / 2)} x2={getX(data.length - 1)} y2={getY(maxVal / 2)} stroke="currentColor" strokeOpacity={0.08} strokeDasharray="3,3" />

        {/* Fill Area under chart line */}
        <path d={areaD} fill={`url(#grad-${dataKey}-${strokeColor.replace('#', '')})`} />

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
              stroke="var(--color-page-card-solid)" 
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
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none ${
      checked 
        ? 'bg-primary shadow-[0_0_15px_rgba(245,197,24,0.5)] border border-primary' 
        : 'bg-page-fill border border-page-border'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-[18px] w-[18px] mt-[1px] ml-[1px] transform rounded-full shadow transition duration-200 ease-in-out ${
        checked ? 'translate-x-5 bg-page-card-solid' : 'translate-x-0 bg-page-text-muted/40'
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
        <h1 className="text-2xl font-bold text-page-text">System Dashboard</h1>
        <p className="text-page-text-soft text-sm">Real-time ledger audit and platform controls.</p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Registered Users" 
          value={stats.totalUsers?.toLocaleString() || 0} 
          icon={Users} 
          to="/admin/users"
          themeColor="cyan"
        />
        <StatCard 
          title="Platform Liquidity" 
          value={`$${stats.platformLiquidity?.toLocaleString() || 0}`} 
          label="USD"
          icon={Wallet} 
          to="/admin/deposits"
          themeColor="gold"
        />
        <StatCard 
          title="Active Mining Nodes" 
          value={stats.activePackages || 0} 
          label="Online"
          icon={Cpu} 
          to="/admin/packages"
          themeColor="cyan"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals || 0} 
          label="Requests"
          icon={CheckSquare} 
          themeColor="gold"
          menu={[
            { label: 'Pending KYC Verifications', to: '/admin/kyc' },
            { label: 'Pending Deposits', to: '/admin/deposits' },
            { label: 'Pending Withdrawals', to: '/admin/withdrawals' },
          ]}
        />
      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-6 shadow-xl text-page-text">
          <h3 className="text-base font-bold text-page-text">Total Activity (Platform)</h3>
          <p className="text-xs text-page-text-soft mt-1">Aggregate platform engagement & user growth (Last 30 days)</p>
          <SVGLineChart data={activityTrend} dataKey="count" strokeColor="#06b6d4" />
        </div>
        <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-6 shadow-xl flex flex-col justify-between text-page-text">
          <div>
            <h3 className="text-base font-bold text-page-text">Global Deposit Trends</h3>
            <p className="text-xs text-page-text-soft mt-1">Total platform deposits vs Pending (Weekly)</p>
          </div>
          <SVGLineChart data={depositTrend} dataKey="amount" strokeColor="#F5C518" />
          <div className="flex justify-between items-center text-[10px] font-mono text-page-text-soft px-4 mt-2 border-t border-page-border-soft pt-2">
            <span>W1</span>
            <span>W2</span>
            <span>W3</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: System Status & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status Controls */}
        <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-6 shadow-xl text-page-text">
          <h3 className="text-base font-bold text-page-text mb-6">System Status</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-page-text">Maintenance Mode</h4>
                <p className="text-xs text-page-text-soft">Lock all user features</p>
              </div>
              <Switch 
                checked={!!systemStatus.maintenanceMode} 
                onChange={() => handleToggle('maintenanceMode', systemStatus.maintenanceMode)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-page-text">New Registrations</h4>
                <p className="text-xs text-page-text-soft">Allow new user signups</p>
              </div>
              <Switch 
                checked={!!systemStatus.newRegistrations} 
                onChange={() => handleToggle('newRegistrations', systemStatus.newRegistrations)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-page-text">Withdrawal Processing</h4>
                <p className="text-xs text-page-text-soft">Global payout gateway</p>
              </div>
              <Switch 
                checked={!!systemStatus.withdrawalProcessing} 
                onChange={() => handleToggle('withdrawalProcessing', systemStatus.withdrawalProcessing)}
              />
            </div>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between text-page-text">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-page-text">Recent Registrations</h3>
            <Link to="/admin/users" className="text-xs font-semibold text-primary hover:underline">
              View Directory
            </Link>
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-page-border text-[10px] font-bold text-page-text-muted uppercase tracking-wider">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-border-soft text-sm">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-page-text-soft text-xs">No registrations found</td>
                  </tr>
                ) : (
                  recentRegistrations.map((user, idx) => (
                    <tr key={idx} className="hover:bg-page-fill/50 transition-colors">
                      <td className="py-3 font-medium text-page-text">{user.username}</td>
                      <td className="py-3 text-page-text-soft font-mono text-xs">{user.email}</td>
                      <td className="py-3 text-page-text-muted font-medium">{user.plan}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          user.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : user.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-page-fill text-page-text-soft border-page-border'
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
      <div className="bg-page-card backdrop-blur-xl border border-page-border rounded-2xl p-6 shadow-xl flex flex-col text-page-text">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-page-text uppercase tracking-wider">
            Platform Transactions
          </h3>
          <Link to="/admin/deposits" className="text-xs font-semibold text-primary hover:underline">
            Master Ledger →
          </Link>
        </div>
 
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-page-border text-[10px] font-bold text-page-text-muted uppercase tracking-wider">
                <th className="py-3">User ID</th>
                <th className="py-3">TRX ID</th>
                <th className="py-3">Date / Time</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-page-border-soft text-sm">
              {platformTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-page-text-soft text-xs">No transaction records found</td>
                </tr>
              ) : (
                platformTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-page-fill/50 transition-colors">
                    <td className="py-3.5 font-medium text-page-text">{tx.userId}</td>
                    <td className="py-3.5 font-mono text-xs text-page-text-soft">{tx.trxId}</td>
                    <td className="py-3.5 text-page-text-soft font-mono text-xs">
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
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                        tx.amount > 0 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} USD
                      </span>
                    </td>
                    <td className="py-3.5 text-page-text-soft italic font-light">{tx.description}</td>
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
