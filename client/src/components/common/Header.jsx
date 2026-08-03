import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, ChevronDown } from 'lucide-react';
import { logoutUser, clearAuthState } from '../../store/slices/authSlice';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import ConfirmModal from './ConfirmModal';
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
      <span className={`pb-1 flex items-center gap-1 transition-colors cursor-pointer ${isActive
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
      className={`block px-4 py-2 text-xs font-bold hover:bg-surface-container-low transition-colors ${isActive ? 'text-primary bg-surface-container-low' : 'text-on-surface-variant hover:text-primary'
        }`}
    >
      {children}
    </a>
  );
};

const MobileMenuGroup = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-outline-variant/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary hover:bg-surface-container-low transition-colors"
      >
        {label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
};

const MobileDrawerLink = ({ to, currentPath, onClick, children }) => {
  const isActive = currentPath === to;
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        onClick(to);
      }}
      className={`block px-6 py-3 text-sm font-bold border-l-2 transition-colors ${isActive
          ? 'text-primary bg-primary/5 border-primary'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low border-transparent'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef(null);
  const drawerRef = useRef(null);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const requestLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(clearAuthState());
    dispatch(logoutUser());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isDropdownActive = (paths) => paths.some((path) => location.pathname.startsWith(path));

  return (
    <header className="bg-surface border-b border-outline-variant py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-container-max mx-auto px-margin-desktop flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors focus:outline-none group"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="relative w-5 h-4">
              <span className={`absolute left-0 top-0 w-full h-[2px] bg-primary rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${mobileMenuOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
                }`} />
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-primary rounded-full transition-all duration-200 ease-in-out ${mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                }`} />
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-primary rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${mobileMenuOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : ''
                }`} />
            </span>
          </button>
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Logo size="sm" variant="light" className="h-8" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/dashboard"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            className={`font-body-md text-body-md transition-colors pb-1 ${isActive('/dashboard')
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

          <NavDropdown label="My Account" isActive={isDropdownActive(['/wallets', '/profile', '/deposit', '/deposits', '/transactions', '/kyc'])}>
            <DropdownLink to="/profile" currentPath={location.pathname} onClick={navigate}>
              Profile Setting
            </DropdownLink>
            <DropdownLink to="/kyc" currentPath={location.pathname} onClick={navigate}>
              Identity Verification (KYC)
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
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                requestLogout();
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
            className="hidden md:block p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150 focus:outline-none"
            title="Profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </button>
          <button
            onClick={requestLogout}
            className="hidden md:block p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full active:scale-95 duration-150 focus:outline-none"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${mobileMenuOpen ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'
            }`}
          onClick={closeMobileMenu}
        />
        <div
          ref={drawerRef}
          className={`absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-surface shadow-2xl overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant">
            <Logo size="sm" variant="light" className="h-8" />
            <button
              onClick={closeMobileMenu}
              className="p-2 text-primary hover:bg-surface-container-low rounded-lg transition-colors focus:outline-none"
              aria-label="Close menu"
            >
              <span className="text-xl leading-none font-bold">×</span>
            </button>
          </div>

          <div className="py-4 space-y-1">
            <MobileDrawerLink to="/dashboard" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Home
            </MobileDrawerLink>
          </div>

          <MobileMenuGroup label="Withdraw">
            <MobileDrawerLink to="/withdraw" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Withdraw Now
            </MobileDrawerLink>
            <MobileDrawerLink to="/withdraw/history" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              My Withdrawals
            </MobileDrawerLink>
          </MobileMenuGroup>

          <MobileMenuGroup label="Mining">
            <MobileDrawerLink to="/mining/plans" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Start Mining
            </MobileDrawerLink>
            <MobileDrawerLink to="/mining/tracks" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Mining Tracks
            </MobileDrawerLink>
          </MobileMenuGroup>

          <MobileMenuGroup label="Support">
            <MobileDrawerLink to="/support/chat" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Live Chat
            </MobileDrawerLink>
            <MobileDrawerLink to="/support/tickets" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              My Tickets
            </MobileDrawerLink>
          </MobileMenuGroup>

          <MobileMenuGroup label="My Account">
            <MobileDrawerLink to="/profile" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Profile Setting
            </MobileDrawerLink>
            <MobileDrawerLink to="/kyc" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Identity Verification
            </MobileDrawerLink>
            <MobileDrawerLink to="/profile/password" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Change Password
            </MobileDrawerLink>
            <MobileDrawerLink to="/deposit" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Deposit / Top Up
            </MobileDrawerLink>
            <MobileDrawerLink to="/wallets" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Wallets
            </MobileDrawerLink>
            <MobileDrawerLink to="/deposits" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Payments Log
            </MobileDrawerLink>
            <MobileDrawerLink to="/transactions" currentPath={location.pathname} onClick={(to) => { navigate(to); closeMobileMenu(); }}>
              Transactions
            </MobileDrawerLink>
          </MobileMenuGroup>

          <div className="border-t border-outline-variant/50 pt-4 pb-2 px-6">
            <button
              onClick={() => { navigate('/profile'); closeMobileMenu(); }}
              className="flex items-center gap-3 w-full px-6 py-3 text-sm font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              Profile Settings
            </button>
            <button
              onClick={() => { requestLogout(); closeMobileMenu(); }}
              className="flex items-center gap-3 w-full px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors rounded-lg"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        variant="danger"
      />
    </header>
  );
};

export default Header;
