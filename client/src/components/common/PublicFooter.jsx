import { Link } from 'react-router-dom';
import Logo from './Logo';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-dark border-t border-white/5 text-text-dark-bg/80 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <Logo size="sm" variant="dark" className="h-8" />
            <p className="text-sm max-w-sm">
              Empowering global investors with premium high-hash cloud mining solutions. Start earning daily payouts on autopilot today.
            </p>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-primary transition-colors">Our Services</Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-primary transition-colors">Mining Packages</Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faqs" className="hover:text-primary transition-colors">FAQs</Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary transition-colors">Customer Support</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Risk warning and copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
          <p className="text-xs text-text-secondary max-w-4xl leading-relaxed">
            <strong>Disclaimer:</strong> Cryptocurrency cloud mining involves significant financial risk. Mining difficulty increases dynamically, and token prices fluctuate. AscendHash provides infrastructure access but does not guarantee fixed earnings, static hash returns, or specific profits. Please invest carefully.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-text-secondary gap-2">
            <p>© {currentYear} AscendHash. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
