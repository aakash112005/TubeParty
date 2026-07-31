import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants/app';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const stored = window.localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
  if (stored === 'light' || stored === 'dark') return stored;

  // No saved preference yet - respect the OS setting, but default to
  // dark if that can't be detected (dark is the product's home look).
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
