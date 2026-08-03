import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Users, Package, Coins, ArrowDownToLine, ArrowUpFromLine,
  FileText, MessageCircle, ShieldCheck, Bell, Search,
  Menu, X, LogOut, ChevronDown, Volume2, VolumeX, ChevronRight, Globe, Settings, History
} from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import { connectSocket } from '../services/socketService';
import { connectDashboardSocket } from '../services/dashboardSocket';
import api from '../services/api';
import Logo from '../components/common/Logo';
import ConfirmModal from '../components/common/ConfirmModal';

const sidebarLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users', badge: 'users' },
  { to: '/admin/kyc', icon: ShieldCheck, label: 'KYC Verifications', badge: 'kyc' },
  { to: '/admin/coins', icon: Coins, label: 'Coins' },
  { to: '/admin/packages', icon: Package, label: 'Packages' },
  { to: '/admin/mining-settings', icon: Settings, label: 'Mining Settings' },
  { to: '/admin/deposits', icon: ArrowDownToLine, label: 'Deposits', badge: 'deposits' },
  { to: '/admin/withdrawals', icon: ArrowUpFromLine, label: 'Withdrawals', badge: 'withdrawals' },
  { to: '/admin/payment-methods', icon: FileText, label: 'Payment Methods' },
  { to: '/admin/audit-logs', icon: History, label: 'Audit Logs', badge: 'auditLogs' },
  { 
    label: 'Website CMS', 
    icon: Globe, 
    children: [
      { to: '/admin/services', label: 'Services' },
      { to: '/admin/faqs', label: 'FAQs' },
      { to: '/admin/contact-messages', label: 'Contact Messages' },
    ]
  },
  { to: '/admin/support', icon: MessageCircle, label: 'Support' },
];

const SidebarItem = ({ link, setSidebarOpen, badgeCount, badgeTone }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (link.children) {
    return (
      <div className="flex flex-col">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-white/60 hover:bg-white/5 hover:text-white/80 w-full"
        >
          <link.icon size={18} />
          <span className="flex-grow text-left">{link.label}</span>
          <ChevronRight size={16} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-64 mt-1' : 'max-h-0'}`}>
          <div className="flex flex-col gap-1 pl-9 pr-2">
            {link.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavLink
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
      <span className="flex-grow text-left">{link.label}</span>
      {badgeCount > 0 && (
        <span
          className={`ml-auto inline-flex min-w-[20px] h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold border ${
            badgeTone === 'cyan'
              ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.55)]'
              : 'bg-amber-400/15 text-amber-300 border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.55)]'
          }`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </NavLink>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const [waitingIds, setWaitingIds] = useState(() => new Set());
  const [muted, setMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    return localStorage.getItem('admin_sound_alerts_enabled') === 'true';
  });
  const [globalSearch, setGlobalSearch] = useState('');
  const [badges, setBadges] = useState({ users: 0, kyc: 0, deposits: 0, withdrawals: 0, auditLogs: 0 });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const prevWaitingSizeRef = useRef(0);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setGlobalSearch(searchParams.get('search') || '');
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/admin/users?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  const refreshBadges = useCallback(() => {
    const lastSeenUsers = localStorage.getItem('admin_last_seen_users');
    const lastSeenAuditLogs = localStorage.getItem('admin_last_seen_audit_logs');
    const params = {};
    if (lastSeenUsers) params.lastSeenUsers = lastSeenUsers;
    if (lastSeenAuditLogs) params.lastSeenAuditLogs = lastSeenAuditLogs;
    api.get('/admin/dashboard/pending-counts', { params }).then((response) => {
      setBadges(response.data.data);
    }).catch(() => {});
  }, []);

  // Real-time sidebar badges: live counts updated via socket events + 15s polling fallback
  useEffect(() => {
    refreshBadges();
    const socket = connectDashboardSocket();
    const refresh = () => refreshBadges();
    const events = [
      'admin:deposit:new',
      'admin:deposit:status',
      'admin:withdrawal:new',
      'admin:withdrawal:approved',
      'admin:withdrawal:rejected',
      'admin:user:status',
      'admin:contact:new',
    ];
    events.forEach((event) => socket.on(event, refresh));
    const interval = setInterval(refreshBadges, 15000);
    return () => {
      events.forEach((event) => socket.off(event, refresh));
      clearInterval(interval);
    };
  }, [refreshBadges]);

  // Clear Users & Audit Logs badges on visit: store view timestamp and zero the count immediately
  useEffect(() => {
    if (location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/')) {
      localStorage.setItem('admin_last_seen_users', String(Date.now()));
      setBadges((current) => ({ ...current, users: 0 }));
      refreshBadges();
    } else if (location.pathname === '/admin/audit-logs') {
      localStorage.setItem('admin_last_seen_audit_logs', String(Date.now()));
      setBadges((current) => ({ ...current, auditLogs: 0 }));
      refreshBadges();
    }
  }, [location.pathname, refreshBadges]);

  const requestLogout = () => {
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/admin/login');
  };

  // Alarm state lives in the shared layout so it remains active away from Support.
  useEffect(() => {
    api.get('/admin/support/conversations/waiting').then((response) => {
      setWaitingIds(new Set(response.data.data.conversations.map((item) => String(item._id))));
    }).catch(() => {});
    const socket = connectSocket();
    const onAlarmTrigger = ({ conversationId }) => setWaitingIds((current) => new Set(current).add(String(conversationId)));
    const onAlarmClear = ({ conversationId }) => setWaitingIds((current) => {
      const next = new Set(current);
      next.delete(String(conversationId));
      return next;
    });
    socket.on('alarm:trigger', onAlarmTrigger);
    socket.on('alarm:clear', onAlarmClear);

    return () => {
      socket.off('alarm:trigger', onAlarmTrigger);
      socket.off('alarm:clear', onAlarmClear);
    };
  }, []);

  // Web Audio Context Autoplay unlock listener
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        if (context.state === 'suspended') {
          context.resume().then(() => {
            setAudioUnlocked(true);
            localStorage.setItem('admin_sound_alerts_enabled', 'true');
            context.close();
          });
        } else {
          setAudioUnlocked(true);
          localStorage.setItem('admin_sound_alerts_enabled', 'true');
          context.close();
        }
      } catch (e) {
        console.warn('Silent audio context resume failed:', e);
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    if (!audioUnlocked) {
      window.addEventListener('click', unlock);
      window.addEventListener('keydown', unlock);
    }
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioUnlocked]);

  // SLA looping tone alarm loop
  useEffect(() => {
    if (muted || waitingIds.size === 0 || !audioUnlocked) return undefined;
    const playBuzzer = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        const now = context.currentTime;
        
        // Two oscillators (triangle + sawtooth) detuned slightly to synthesize a rich, premium buzzer texture
        const osc1 = context.createOscillator();
        const osc2 = context.createOscillator();
        const gain = context.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';

        osc1.frequency.value = 220; // 220Hz low electronic buzz base tone
        osc2.frequency.value = 222; // detuned slightly to create texture

        // Continuous ringing buzz for 1.4s (full volume, then fades out at the very end)
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + 1.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(context.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);

        osc1.onended = () => {
          context.close();
        };
      } catch (e) {
        console.warn('SLA buzzer sound failed:', e);
      }
    };
    playBuzzer();
    const interval = window.setInterval(playBuzzer, 2000);
    return () => window.clearInterval(interval);
  }, [muted, waitingIds.size, audioUnlocked]);

  // Visual desktop notification fallback
  useEffect(() => {
    if (waitingIds.size > prevWaitingSizeRef.current) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('AscendHash Support SLA Overdue Alert', {
          body: `${waitingIds.size} support conversation(s) waiting over 30 minutes! Please respond.`,
          tag: 'support-sla-alarm',
          renotify: true,
        });
      }
    }
    prevWaitingSizeRef.current = waitingIds.size;
  }, [waitingIds.size]);

  // Unlocks alerts programmatically (for button)
  const handleEnableAlerts = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      if (context.state === 'suspended') {
        context.resume();
      }
      // Play brief high-pitch chirp to notify success
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.05, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
      osc.connect(gain).connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.15);
      osc.onended = () => context.close();

      setAudioUnlocked(true);
      localStorage.setItem('admin_sound_alerts_enabled', 'true');
    } catch (e) {
      console.warn('Alert chirper fail:', e);
    }

    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="h-screen bg-bg-light-alt flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-dark transform transition-transform duration-200 lg:translate-x-0 lg:sticky lg:top-0 h-screen flex flex-col shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Logo size="sm" variant="dark" className="py-1" />
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/50 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-65px)]">
          {sidebarLinks.map((link) => (
            <SidebarItem
              key={link.label}
              link={link}
              setSidebarOpen={setSidebarOpen}
              badgeCount={link.badge ? badges[link.badge] : 0}
              badgeTone={link.badge === 'auditLogs' ? 'cyan' : 'amber'}
            />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-border-light flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-secondary cursor-pointer">
              <Menu size={22} />
            </button>
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9 pr-4 py-2 border border-border-light rounded-lg text-sm w-64 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </form>
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
                      onClick={requestLogout}
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

        {!audioUnlocked && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 sticky top-16 z-20 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-amber-600 animate-pulse shrink-0" />
              <span>
                <strong>Sound alerts are muted by the browser.</strong> Click Enable to hear audible alarm cues and authorize desktop notifications for overdue SLA conversations.
              </span>
            </div>
            <button
              type="button"
              onClick={handleEnableAlerts}
              className="bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-amber-700 active:scale-95 transition-all cursor-pointer shadow-sm ml-4 shrink-0"
            >
              Enable Alerts
            </button>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout Confirmation"
        message="Are you sure you want to log out of the admin panel?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default AdminLayout;
