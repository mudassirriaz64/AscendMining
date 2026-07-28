import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, Package, Coins, ArrowDownToLine, ArrowUpFromLine,
  UsersRound, FileText, MessageCircle, ShieldCheck, Bell, Search,
  Menu, X, LogOut, ChevronDown, Volume2, VolumeX,
} from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import { connectSocket } from '../services/socketService';
import api from '../services/api';
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
  const [waitingIds, setWaitingIds] = useState(() => new Set());
  const [muted, setMuted] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  // Alarm state lives in the shared layout so it remains active away from Support.
  useEffect(() => {
    api.get('/admin/support/conversations/waiting').then((response) => {
      setWaitingIds(new Set(response.data.data.conversations.map((item) => item._id)));
    }).catch(() => {});
    const socket = connectSocket();
    const onAlarmTrigger = ({ conversationId }) => setWaitingIds((current) => new Set(current).add(conversationId));
    const onAlarmClear = ({ conversationId }) => setWaitingIds((current) => {
      const next = new Set(current);
      next.delete(conversationId);
      return next;
    });
    socket.on('alarm:trigger', onAlarmTrigger);
    socket.on('alarm:clear', onAlarmClear);

    return () => {
      socket.off('alarm:trigger', onAlarmTrigger);
      socket.off('alarm:clear', onAlarmClear);
    };
  }, []);

  useEffect(() => {
    if (muted || waitingIds.size === 0) return undefined;
    const beep = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 660;
        gain.gain.setValueAtTime(0.12, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.45);
        oscillator.onended = () => context.close();
      } catch { /* Audio can be blocked until the first user gesture. */ }
    };
    beep();
    const interval = window.setInterval(beep, 3000);
    return () => window.clearInterval(interval);
  }, [muted, waitingIds.size]);

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
            {waitingIds.size > 0 ? (
              <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700" role="status">
                <Volume2 size={14} aria-hidden="true" /> {waitingIds.size} waiting
                <button type="button" onClick={() => setMuted((value) => !value)} className="ml-1 rounded-full p-1 hover:bg-red-100" aria-label={muted ? 'Unmute support alarm' : 'Mute support alarm for this session'}>
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            ) : null}
            <button
              onClick={() => navigate('/admin/support')}
              className="relative p-2 text-text-secondary hover:bg-bg-light-alt rounded-lg cursor-pointer"
            >
              <Bell size={20} />
              {waitingIds.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-1">
                  {waitingIds.size > 99 ? '99+' : waitingIds.size}
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
