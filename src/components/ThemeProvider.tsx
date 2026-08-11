'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read theme from localStorage or default
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
    } else {
      // Default to dark mode for premium look
      setThemeState('dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply class to body element
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      body.classList.remove('dark');
      body.classList.add('light');
    }

    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Render a placeholder or children directly. To avoid hydration mismatch,
  // we just make sure we run on the client, but direct children rendering is fine.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) || { theme: 'dark', toggleTheme: () => {}, setTheme: () => {} };
}
