import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, Package, Coins, ArrowDownToLine, ArrowUpFromLine,
  UsersRound, FileText, MessageCircle, ShieldCheck, Bell, Search,
  Menu, X, LogOut, ChevronDown,
} from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import { fetchAdminUnreadCount, triggerAlarm } from '../store/slices/supportChatSlice';
import { connectSocket } from '../services/socketService';
import Logo from '../components/common/Logo';

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/coins', icon: Coins, label: 'Coins' },
  { to: '/admin/packages', icon: Package, label: 'Packages' },
  { to: '/admin/deposits', icon: ArrowDownToLine, label: 'Deposits' },
  { to: '/admin/withdrawals', icon: ArrowUpFromLine, label: 'Withdrawals' },
  { to: '/admin/referrals', icon: UsersRound, label: 'Referrals' },
  { to: '/admin/cms', icon: FileText, label: 'CMS' },
  { to: '/admin/support', icon: MessageCircle, label: 'Support' },
  { to: '/admin/audit-log', icon: ShieldCheck, label: 'Audit Log' },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.supportChat);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  // Fetch unread count + listen for real-time updates
  useEffect(() => {
    dispatch(fetchAdminUnreadCount());

    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const token = getCookie('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    const onNewMessage = () => {
      dispatch(fetchAdminUnreadCount());
    };

    const onAlarmTrigger = (alarm) => {
      dispatch(triggerAlarm(alarm));
    };

    socket.on('new_message', onNewMessage);
    socket.on('alarm:trigger', onAlarmTrigger);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('alarm:trigger', onAlarmTrigger);
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-bg-light-alt flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-dark transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Logo size="sm" variant="dark" className="py-1" />
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/50 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-65px)]">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                }`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border-light flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-secondary cursor-pointer">
              <Menu size={22} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search users, deposits..."
                className="pl-9 pr-4 py-2 border border-border-light rounded-lg text-sm w-64 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/support')}
              className="relative p-2 text-text-secondary hover:bg-bg-light-alt rounded-lg cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-light-alt cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <span className="text-sm text-text-light-bg hidden sm:block">{user?.fullName || 'Admin'}</span>
                <ChevronDown size={14} className="text-text-secondary" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-border-light py-1 z-50">
                    <div className="px-4 py-2 border-b border-border-light">
                      <p className="text-sm font-medium text-text-light-bg">{user?.fullName}</p>
                      <p className="text-xs text-text-secondary">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 cursor-pointer"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
