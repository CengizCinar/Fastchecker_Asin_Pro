import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  currentTheme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await chrome.storage.local.get(['theme']);
        const savedTheme = result.theme || 'light';
        setCurrentTheme(savedTheme as Theme);
        applyTheme(savedTheme as Theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
        setCurrentTheme('light');
        applyTheme('light');
      }
    };
    loadTheme();
  }, []);

  const applyTheme = (theme: Theme) => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  const setTheme = async (theme: Theme) => {
    try {
      setCurrentTheme(theme);
      applyTheme(theme);
      await chrome.storage.local.set({ theme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const value = {
    currentTheme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
