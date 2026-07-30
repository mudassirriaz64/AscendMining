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
      className="relative py-1 font-body-md text-body-md"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={`pb-1 flex items-center gap-1 transition-colors cursor-pointer ${
        isActive
          ? 'text-primary font-bold border-b-2 border-primary'
          : 'text-on-surface-variant hover:text-primary'
      }`}>
        {label}
        <svg className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '100%',
          marginTop: '8px',
          minWidth: '180px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: '1px solid #f1f5f9',
          paddingTop: '8px',
          paddingBottom: '8px',
          zIndex: 9999,
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
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
      className={`block px-4 py-2 text-xs font-bold hover:bg-surface-container-low transition-colors ${
        isActive ? 'text-primary bg-surface-container-low' : 'text-on-surface-variant hover:text-primary'
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
    <header className="bg-surface border-b border-outline-variant py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-container-max mx-auto px-margin-desktop flex justify-between items-center w-full">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
          <Logo size="sm" variant="light" className="h-8" />
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/dashboard"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            className={`font-body-md text-body-md transition-colors pb-1 ${
              isActive('/dashboard')
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
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

          <NavDropdown label="My Account" isActive={isDropdownActive(['/wallets', '/profile', '/deposit', '/deposits', '/transactions', '/referrals'])}>
            <DropdownLink to="/profile" currentPath={location.pathname} onClick={navigate}>
              Profile Setting
            </DropdownLink>
            <DropdownLink to="/profile/password" currentPath={location.pathname} onClick={navigate}>
              Change Password
            </DropdownLink>
            <DropdownLink to="/deposit" currentPath={location.pathname} onClick={navigate}>
              Deposit / Top Up
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

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150 relative focus:outline-none"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-error rounded-full border border-surface"></span>
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
            onClick={() => navigate('/profile')}
            className="p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150 focus:outline-none"
            title="Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150 focus:outline-none"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
