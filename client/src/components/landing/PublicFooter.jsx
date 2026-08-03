import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  const linkCol = (title, links) => (
    <div>
      <h3 className="text-page-text text-sm font-semibold mb-4 tracking-wider uppercase">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map(({ label, to }) => (
          <li key={to + label}>
            <Link
              to={to}
              className="text-page-text-soft hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="relative border-t border-page-border bg-transparent text-page-text-soft py-14">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <Logo size="sm" className="h-8" />
            <p className="text-sm max-w-sm leading-relaxed">
              Empowering global investors with premium high-hash cloud mining solutions. Start earning daily payouts on autopilot today.
            </p>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/25 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Mining Nodes Operational
            </span>
          </div>

          {linkCol('Platform', [
            { label: 'About Us', to: '/about' },
            { label: 'Our Services', to: '/services' },
            { label: 'Mining Packages', to: '/packages' },
          ])}

          {linkCol('Support', [
            { label: 'FAQs', to: '/faqs' },
            { label: 'Customer Support', to: '/support' },
            { label: 'Contact Us', to: '/contact' },
          ])}
        </div>

        {/* Risk warning and copyright */}
        <div className="mt-12 pt-8 border-t border-page-border space-y-4">
          <p className="text-xs text-page-text-faint max-w-4xl leading-relaxed">
            <strong className="text-page-text-muted">Disclaimer:</strong> Cryptocurrency cloud mining involves significant financial risk. Mining difficulty increases dynamically, and token prices fluctuate. AscendHash provides infrastructure access but does not guarantee fixed earnings, static hash returns, or specific profits. Please invest carefully.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-page-text-faint gap-2">
            <p>© {currentYear} AscendHash. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-gold hover:underline transition-colors">Login</Link>
              <Link to="/register" className="hover:text-gold hover:underline transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
