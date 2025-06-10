import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// 存储键名
export const THEME_STORAGE_KEY = 'termini-theme';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () => set((state) => ({ 
        mode: state.mode === 'light' ? 'dark' : 'light' 
      })),
      setTheme: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: THEME_STORAGE_KEY,
    }
  )
);

// 创建一个钩子，用于在组件中应用主题
export const useTheme = () => {
  const { mode, toggleTheme, setTheme } = useThemeStore();
  
  // 为body元素应用主题类
  const applyTheme = () => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return { 
    mode, 
    toggleTheme, 
    setTheme,
    applyTheme,
    isDark: mode === 'dark'
  };
}; 