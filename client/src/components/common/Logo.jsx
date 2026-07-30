import { Link } from 'react-router-dom';
import logoDark from '../../assets/logo_dark.png';
import logoLight from '../../assets/logo_light.png';

const Logo = ({ size = 'md', variant = 'light', className = '' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  // logo_light.png has dark navy text for light backgrounds.
  // logo_dark.png has white text for dark backgrounds.
  const logoSrc = variant === 'dark' ? logoDark : logoLight;

  return (
    <Link to="/" className={`inline-flex items-center no-underline ${className}`}>
      <img
        src={logoSrc}
        alt="AscendHash"
        className={`${sizes[size] || 'h-12'} w-auto max-w-full object-contain`}
      />
    </Link>
  );
};

export default Logo;
