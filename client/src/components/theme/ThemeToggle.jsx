import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { cn } from '../../utils/cn';

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center justify-center p-2 rounded-full border border-outline-variant/60 text-on-surface hover:text-gold hover:border-gold/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
