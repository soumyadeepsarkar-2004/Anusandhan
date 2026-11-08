import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { soundSynthesizer } from '../services/soundEffects';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isAnimating: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'anusandhan-theme-preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'dark'; // Default luxury obsidian
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) {
        body.classList.add('light-theme');
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
      }
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.remove('light-theme');
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
      }
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setIsAnimating(true);
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    
    // Play the tactile pull-chain switch sound effect
    soundSynthesizer.playPullChainSwitch(nextTheme === 'light');

    setThemeState(nextTheme);

    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const setTheme = (newTheme: ThemeMode) => {
    if (newTheme !== theme) {
      soundSynthesizer.playPullChainSwitch(newTheme === 'light');
      setThemeState(newTheme);
    }
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, isAnimating }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
