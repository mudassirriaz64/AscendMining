import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, Check } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import Logo from './Logo';

const NavDropdown = ({ label, isActive, children }) => {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative py-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={`pb-1 flex items-center gap-1 transition-colors cursor-pointer ${
        isActive
          ? 'text-yellow-400 font-semibold border-b-2 border-yellow-400'
          : 'text-white/95 hover:text-yellow-400'
      }`}>
        {label}
        <svg className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className={`absolute left-0 mt-1 w-48 bg-white text-slate-800 rounded-lg shadow-xl py-2 border border-slate-100 transition-all duration-150 origin-top ${
        open ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-0 invisible'
      }`}>
        {children}
      </div>
    </div>
  );
};

const DropdownLink = ({ to, currentPath, onClick, children }) => {
  const isActive = currentPath === to;
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onClick(to);
      }}
      className={`block px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors ${
        isActive ? 'text-[#083358] bg-slate-50' : 'text-slate-600'
      }`}
    >
      {children}
    </a>
  );
};

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { items: notifications, unreadCount } = useSelector((state) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isDropdownActive = (paths) => paths.some((path) => location.pathname.startsWith(path));

  return (
    <header className="bg-gradient-to-r from-[#001f3f] to-[#083358] text-white py-4 sticky top-0 z-50 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
          <Logo size="sm" variant="dark" className="h-10" />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a
            href="/dashboard"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            className={`transition-colors pb-1 ${
              isActive('/dashboard')
                ? 'text-yellow-400 font-semibold border-b-2 border-yellow-400'
                : 'text-white/95 hover:text-yellow-400'
            }`}
          >
            Home
          </a>
          
          <NavDropdown label="Withdraw" isActive={isDropdownActive(['/withdraw'])}>
            <DropdownLink to="/withdraw" currentPath={location.pathname} onClick={navigate}>
              Withdraw Now
            </DropdownLink>
            <DropdownLink to="/withdraw/history" currentPath={location.pathname} onClick={navigate}>
              My Withdrawals
            </DropdownLink>
          </NavDropdown>
          
          <NavDropdown label="Mining" isActive={isDropdownActive(['/mining'])}>
            <DropdownLink to="/mining/plans" currentPath={location.pathname} onClick={navigate}>
              Start Mining
            </DropdownLink>
            <DropdownLink to="/mining/tracks" currentPath={location.pathname} onClick={navigate}>
              Mining Tracks
            </DropdownLink>
          </NavDropdown>

          <NavDropdown label="Support" isActive={isDropdownActive(['/support'])}>
            <DropdownLink to="/support/chat" currentPath={location.pathname} onClick={navigate}>
              Live Chat
            </DropdownLink>
            <DropdownLink to="/support/tickets" currentPath={location.pathname} onClick={navigate}>
              My Tickets
            </DropdownLink>
          </NavDropdown>

          <NavDropdown label="My Account" isActive={isDropdownActive(['/wallets', '/profile', '/deposits', '/transactions', '/referrals'])}>
            <DropdownLink to="/profile" currentPath={location.pathname} onClick={navigate}>
              Profile Setting
            </DropdownLink>
            <DropdownLink to="/profile/password" currentPath={location.pathname} onClick={navigate}>
              Change Password
            </DropdownLink>
            <DropdownLink to="/wallets" currentPath={location.pathname} onClick={navigate}>
              Wallets
            </DropdownLink>
            <DropdownLink to="/deposits" currentPath={location.pathname} onClick={navigate}>
              Payments Log
            </DropdownLink>
            <DropdownLink to="/transactions" currentPath={location.pathname} onClick={navigate}>
              Transactions
            </DropdownLink>
            <DropdownLink to="/referrals" currentPath={location.pathname} onClick={navigate}>
              My Referral
            </DropdownLink>
            <DropdownLink to="/referrals/bonus" currentPath={location.pathname} onClick={navigate}>
              Referral Bonus Logs
            </DropdownLink>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="block px-4 py-2 text-xs font-bold text-red-600 hover:bg-slate-50 hover:text-red-700 transition-colors border-t border-slate-100"
            >
              Logout
            </a>
          </NavDropdown>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-white/90 hover:text-yellow-400 transition-colors relative focus:outline-none"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#083358]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 origin-top-right">
                <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between">
                  <h3 className="text-slate-800 font-bold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => dispatch(markAllAsRead())}
                      className="text-xs text-[#185adb] font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((notif) => (
                        <div 
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-[#185adb]' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-slate-800 text-xs font-bold mb-0.5">{notif.title}</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{notif.message}</p>
                            <p className="text-slate-400 text-[9px] mt-1 uppercase font-semibold">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all duration-300 border border-white/20"
          >
            Dashboard
          </button>
          <button 
            onClick={handleLogout}
            className="bg-white text-[#0a1931] hover:bg-yellow-400 hover:text-slate-900 px-4 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
