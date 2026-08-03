import { Link } from 'react-router-dom';
import logoDark from '../../assets/logo_dark.png';
import logoLight from '../../assets/logo_light.png';
import { useTheme } from '../../theme/ThemeContext';

const Logo = ({ size = 'md', variant, className = '' }) => {
  let activeTheme = 'dark';
  try {
    const { theme } = useTheme();
    activeTheme = theme;
  } catch (e) {
    // fallback if context is not available
  }

  // If variant is not explicitly passed, adapt dynamically:
  // - theme === 'dark' (dark background): we want white-text logo (variant = 'dark')
  // - theme === 'light' (light background): we want dark-text logo (variant = 'light')
  const selectedVariant = variant || (activeTheme === 'dark' ? 'dark' : 'light');
  const logoSrc = selectedVariant === 'dark' ? logoDark : logoLight;

  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

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
