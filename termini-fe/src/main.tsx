import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useTheme } from './store/themeStore'

// 主题初始化组件
const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  const { applyTheme } = useTheme();
  
  // 在应用加载时应用主题
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);
  
  return <>{children}</>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeInitializer>
      <App />
    </ThemeInitializer>
  </StrictMode>,
)
