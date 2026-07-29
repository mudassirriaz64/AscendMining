import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const PublicHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Investment Packages', path: '/packages' },
    { name: 'FAQs', path: '/faqs' },
    { name: 'Customer Support', path: '/support' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-bg-dark border-b border-white/5 py-4 sticky top-0 z-50 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center cursor-pointer">
          <Logo size="sm" variant="dark" className="h-10" />
        </div>

        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors py-1 ${
                isActive(link.path)
                  ? 'text-primary font-semibold border-b border-primary pb-0.5'
                  : 'text-text-dark-bg/95 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-text-dark-bg/95 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-primary text-text-light-bg hover:bg-primary-hover px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-text-dark-bg/95 hover:text-white p-2 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-bg-dark border-t border-white/5 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-base font-medium ${
                isActive(link.path) ? 'text-primary font-semibold' : 'text-text-dark-bg/95'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-white/5 pt-4 flex flex-col space-y-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-text-dark-bg/95 hover:text-white font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-primary text-text-light-bg hover:bg-primary-hover py-2 rounded-full font-semibold transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
