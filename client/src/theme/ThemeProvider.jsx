import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';

const STORAGE_KEY = 'ascendhash_theme';

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        applyTheme(stored);
        return stored;
      }
    } catch {
      /* localStorage unavailable */
    }
    applyTheme('dark');
    return 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage unavailable */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
