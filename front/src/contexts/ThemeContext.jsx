import React, { createContext, useEffect, useMemo, useState } from 'react';

export const themes = {
  light: {
    name: 'light',
    isDark: false,
    bodyBg: '#f0fdf6',
    bodyText: '#064e3b',
    primary: '#059669',
    primarySoft: '#d1fae5',
    accent: '#34d399',
    surface: '#ffffff',
    surfaceAlt: '#f0fdf4',
    border: '#d1fae5',
    text: '#065f46',
    heading: '#064e3b',
    muted: '#059669',
    heroGlow: 'rgba(16, 185, 129, 0.16)',
  },
  dark: {
    name: 'dark',
    isDark: true,
    bodyBg: '#000000',
    bodyText: '#eff6ff',
    primary: '#60a5fa',
    primarySoft: 'rgba(96, 165, 250, 0.16)',
    accent: '#93c5fd',
    surface: 'rgba(5, 5, 12, 0.92)',
    surfaceAlt: 'rgba(8, 8, 18, 0.90)',
    border: 'rgba(96, 165, 250, 0.18)',
    text: '#bfdbfe',
    heading: '#eff6ff',
    muted: '#93c5fd',
    heroGlow: 'rgba(96, 165, 250, 0.2)',
  },
};

export const ThemeContext = createContext({
  themeMode: 'light',
  theme: themes.light,
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('@WebWallet:theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('@WebWallet:theme', themeMode);
    const activeTheme = themes[themeMode];
    document.body.style.background = activeTheme.bodyBg;
    document.body.style.color = activeTheme.bodyText;
  }, [themeMode]);

  const value = useMemo(() => ({
    themeMode,
    setThemeMode,
    theme: themes[themeMode],
    isDark: themeMode === 'dark',
    toggleTheme: () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
  }), [themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
