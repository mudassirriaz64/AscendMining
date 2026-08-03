import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import ThemeToggle from '../theme/ThemeToggle';
import { cn } from '../../utils/cn';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Investment Packages', path: '/packages' },
  { name: 'FAQs', path: '/faqs' },
  { name: 'Customer Support', path: '/support' },
  { name: 'Contact Us', path: '/contact' },
];

const PublicHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-page-bg-40 backdrop-blur-md border-b border-page-border-soft transition-all duration-300',
        scrolled && 'bg-page-bg-60 border-page-border shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center transition duration-300">
        <div className="flex items-center cursor-pointer py-3" onClick={closeMenu}>
          <Logo size="sm" className="h-9" />
        </div>

        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              aria-current={isActive(link.path) ? 'page' : undefined}
              className={cn(
                'relative py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-md px-1',
                isActive(link.path)
                  ? 'text-gold font-semibold'
                  : 'text-page-text-muted hover:text-page-text'
              )}
            >
              {link.name}
              <span
                className={cn(
                  'absolute -bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-gold to-gold-soft transition duration-300',
                  isActive(link.path) ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                )}
              />
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-page-text-muted hover:text-page-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-gradient-to-r from-gold to-gold-soft text-[#101828] hover:shadow-[0_0_24px_rgba(255,184,0,0.4)] px-5 py-2 rounded-full text-sm font-semibold transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="text-page-text-muted hover:text-page-text p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen ? (
        <nav id="mobile-nav" className="lg:hidden bg-page-bg-90 backdrop-blur-xl border-t border-page-border px-4 py-4 space-y-1" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeMenu}
              aria-current={isActive(link.path) ? 'page' : undefined}
              className={cn(
                'block py-2 px-2 rounded-lg text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
                isActive(link.path) ? 'text-gold font-semibold' : 'text-page-text-muted hover:text-page-text hover:bg-page-fill'
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-page-border pt-4 mt-2 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={closeMenu}
              className="w-full text-center py-2.5 rounded-full text-page-text-muted hover:text-page-text border border-page-border transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMenu}
              className="w-full text-center bg-gradient-to-r from-gold to-gold-soft text-[#101828] py-2.5 rounded-full font-semibold transition"
            >
              Register
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
};

export default PublicHeader;
