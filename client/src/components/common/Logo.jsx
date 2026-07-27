import { Link } from 'react-router-dom';
import logoDark from '../../assets/logo_dark.png';
import logoLight from '../../assets/logo_light.png';

const Logo = ({ size = 'md', variant = 'light', className = '' }) => {
  const sizes = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-20',
  };

  const logoSrc = variant === 'dark' ? logoDark : logoLight;

  return (
    <Link to="/" className={`inline-flex items-center no-underline ${className}`}>
      <img
        src={logoSrc}
        alt="AscendHash Crypto Mining & Power Solutions"
        className={`${sizes[size] || 'h-16'} w-auto max-w-full object-contain`}
      />
    </Link>
  );
};

export default Logo;
