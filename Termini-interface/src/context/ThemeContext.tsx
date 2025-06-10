import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: (mode?: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'app-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 从本地存储获取主题模式，默认为暗色
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedThemeMode = localStorage.getItem(THEME_MODE_KEY);
    return (savedThemeMode as ThemeMode) || 'dark';
  });

  // 切换主题模式
  const toggleTheme = (mode?: ThemeMode) => {
    if (mode) {
      setThemeMode(mode);
    } else {
      setThemeMode(prevMode => (prevMode === 'dark' ? 'light' : 'dark'));
    }
  };

  // 当主题模式变化时，更新本地存储
  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问主题上下文
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};