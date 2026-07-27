import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
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

          <NavDropdown label="Support Ticket" isActive={false}>
            <span className="block px-4 py-2 text-xs font-bold text-slate-400 cursor-not-allowed">
              Coming Soon
            </span>
          </NavDropdown>

          <NavDropdown label="My Account" isActive={isDropdownActive(['/wallets'])}>
            <DropdownLink to="/wallets" currentPath={location.pathname} onClick={navigate}>
              Wallets
            </DropdownLink>
          </NavDropdown>
        </nav>

        <div className="flex items-center space-x-4">
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
