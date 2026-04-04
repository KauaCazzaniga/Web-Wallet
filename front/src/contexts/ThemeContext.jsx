import React, { createContext, useEffect, useMemo, useState } from 'react';

export const themes = {
  light: {
    name: 'light',
    isDark: false,
    bodyBg: '#f5f9ff',
    bodyText: '#0f172a',
    primary: '#2563eb',
    primarySoft: '#dbeafe',
    accent: '#0ea5e9',
    surface: '#ffffff',
    surfaceAlt: '#f6f9ff',
    border: '#d8e3f3',
    text: '#334155',
    heading: '#0f172a',
    muted: '#7184a0',
    heroGlow: 'rgba(37, 99, 235, 0.16)',
  },
  dark: {
    name: 'dark',
    isDark: true,
    bodyBg: '#050c18',
    bodyText: '#eff6ff',
    primary: '#60a5fa',
    primarySoft: 'rgba(96, 165, 250, 0.16)',
    accent: '#22d3ee',
    surface: 'rgba(7, 18, 35, 0.88)',
    surfaceAlt: 'rgba(13, 29, 54, 0.88)',
    border: 'rgba(96, 165, 250, 0.18)',
    text: '#c6d4f1',
    heading: '#eff6ff',
    muted: '#89a0c7',
    heroGlow: 'rgba(34, 211, 238, 0.2)',
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
