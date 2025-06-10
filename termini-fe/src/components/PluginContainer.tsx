import { useState, useEffect, Suspense, useRef } from 'react';
import { pluginRegistry } from '../plugins/registry';
import type { Plugin } from '../plugins/types';
import { useLayoutStore } from '../store/layoutStore';
import PluginCard from './PluginCard';

interface Props {
  pluginId: string;
  onRemove?: () => void;
  hideHeader?: boolean;
}

export default function PluginContainer({ pluginId, onRemove, hideHeader = false }: Props) {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const convertToTab = useLayoutStore((state) => state.convertToTab);
  
  // 监听全局状态
  const lastTokenUpdate = useLayoutStore((state) => state._lastTokenUpdate);
  
  useEffect(() => {
    const loadPlugin = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 加载插件
        const pluginInstance = pluginRegistry.get(pluginId);
        if (!pluginInstance) {
          throw new Error(`插件 ${pluginId} 未找到`);
        }
        
        setPlugin(pluginInstance);
        
        // 加载插件配置
        const defaultConfig = pluginInstance.metadata.defaultConfig || {};
        setConfig(defaultConfig);
        
        setIsLoading(false);
      } catch (err) {
        console.error(`加载插件 ${pluginId} 失败:`, err);
        setError(`加载失败: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };
    
    loadPlugin();
  }, [pluginId]);
  
  // 计算内容区域高度
  const calculateContentHeight = () => {
    if (!containerRef.current) return;
    
    const containerHeight = containerRef.current.clientHeight;
    const headerElement = containerRef.current.querySelector('.plugin-header');
    const headerHeight = headerElement ? headerElement.clientHeight : 0;
    
    // 计算内容区高度 = 容器高度 - 头部高度 - 边距
    const newContentHeight = containerHeight - headerHeight - 2;
    
    if (newContentHeight > 0 && newContentHeight !== contentHeight) {
      console.log(`[${pluginId}] 更新内容区高度:`, newContentHeight);
      setContentHeight(newContentHeight);
    }
  };
  
  // 在组件挂载、更新和窗口大小变化时计算高度
  useEffect(() => {
    // 初始计算
    calculateContentHeight();
    
    // 定时重新计算以处理异步加载的内容
    const interval = setInterval(calculateContentHeight, 1000);
    
    // 监听窗口大小变化
    const handleResize = () => {
      calculateContentHeight();
    };
    
    window.addEventListener('resize', handleResize);
    
    // 添加CSS样式确保滚动正常工作
    const style = document.createElement('style');
    style.textContent = `
      .plugin-content-scrollable {
        overflow-y: auto;
        position: relative;
        height: 100%;
        scrollbar-width: thin;
        scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
        -webkit-overflow-scrolling: touch;
      }
      .plugin-content-scrollable::-webkit-scrollbar {
        width: 6px;
      }
      .plugin-content-scrollable::-webkit-scrollbar-track {
        background: transparent;
      }
      .plugin-content-scrollable::-webkit-scrollbar-thumb {
        background-color: rgba(155, 155, 155, 0.5);
        border-radius: 3px;
      }
      .dark .plugin-content-scrollable::-webkit-scrollbar-thumb {
        background-color: rgba(100, 100, 100, 0.5);
      }
      /* 确保插件容器内的拖拽句柄可用 */
      .plugin-header {
        cursor: move;
      }
      /* 确保点击事件不被吞噬 */
      .plugin-container > * {
        pointer-events: auto;
      }
      /* 确保插件容器可以被拖拽 */
      .plugin-drag-handle {
        cursor: move !important;
        touch-action: none;
      }
      /* 禁用嵌套容器的拖拽样式覆盖 */
      .plugin-container .plugin-container .plugin-header {
        cursor: default;
      }
      .plugin-container .plugin-container .plugin-header.plugin-drag-handle {
        cursor: move !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      document.head.removeChild(style);
    };
  }, [pluginId]);
  
  // 当有token更新时，触发刷新
  useEffect(() => {
    if (lastTokenUpdate && plugin) {
      console.log(`[${pluginId}] Token更新触发刷新，时间:`, new Date(lastTokenUpdate).toLocaleTimeString());
      const defaultConfig = plugin.metadata.defaultConfig || {};
      setConfig({...defaultConfig});
    }
  }, [lastTokenUpdate, pluginId, plugin]);
  
  // 点击外部关闭设置面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 处理配置变更
  const handleConfigChange = (updatedConfig: Record<string, any>) => {
    setConfig(updatedConfig);
    
    // 更新插件默认配置
    if (plugin) {
      plugin.metadata.defaultConfig = updatedConfig;
    }
  };
  
  // 处理移除插件
  const handleRemove = () => {
    if (!onRemove) return;
    
    setShowSettings(false);
    onRemove();
  };
  
  // 处理转换为标签容器
  const handleConvertToTab = () => {
    if (convertToTab) {
      convertToTab(pluginId);
      setShowMenu(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="plugin-container h-full" ref={containerRef}>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="plugin-container h-full" ref={containerRef}>
        <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }
  
  if (!plugin) {
    return (
      <div className="plugin-container h-full" ref={containerRef}>
        <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400">
          插件未找到
        </div>
      </div>
    );
  }
  
  const PluginComponent = plugin.component;
  
  // 确定是否显示头部
  // 如果传入hideHeader=true强制隐藏，如果插件是固定的(isFixed=true)也不显示头部
  const shouldHideHeader = hideHeader || plugin.metadata.isFixed === true;
  
  // 插件设置按钮
  const settingsButton = (
    <button 
      className="non-draggable p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={() => setShowSettings(!showSettings)}
      title="插件设置"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );

  // 菜单按钮
  const menuButton = (
    <button 
      className="non-draggable p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={() => setShowMenu(!showMenu)}
      title="更多选项"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>
  );
  
  return (
    <div className="plugin-container h-full flex flex-col overflow-hidden" ref={containerRef}>
      {/* 插件头部 */}
      {!shouldHideHeader && (
        <div className="flex justify-between items-center plugin-drag-handle px-2 py-1 plugin-header flex-shrink-0">
          <div className="text-sm font-medium truncate">
            {plugin.metadata.name}
          </div>
          <div className="flex space-x-1">
            {settingsButton}
            {menuButton}
            
            {/* 移除按钮 */}
            {onRemove && (
              <button 
                className="non-draggable p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500 dark:text-red-400"
                onClick={(e) => {
                  e.stopPropagation(); // 防止事件冒泡
                  handleRemove();
                }}
                title="移除插件"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 插件内容 */}
      <div 
        ref={contentRef}
        className="plugin-content flex-grow plugin-content-scrollable"
        style={{ 
          height: contentHeight > 0 ? `${contentHeight}px` : 'calc(100% - 30px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <Suspense fallback={<div className="p-4 flex justify-center items-center text-gray-500 dark:text-gray-400">加载插件内容...</div>}>
          <PluginComponent 
            config={config}
            onConfigChange={handleConfigChange}
          />
        </Suspense>
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div 
          ref={settingsRef}
          className="absolute top-8 right-0 bg-theme-card shadow-lg rounded border border-theme p-3 z-50 w-64 text-sm"
        >
          <h3 className="font-medium mb-2 border-b border-theme pb-1 text-gray-900 dark:text-gray-100">插件设置</h3>
          <div className="space-y-2">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="text-xs text-gray-600 dark:text-gray-400">{key}</label>
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value !== null && value !== undefined ? value : ''}
                  onChange={(e) => {
                    const newValue = typeof value === 'number' 
                      ? parseFloat(e.target.value) 
                      : e.target.value;
                    
                    const updatedConfig = {
                      ...config,
                      [key]: newValue
                    };
                    
                    handleConfigChange(updatedConfig);
                  }}
                  className="border border-theme rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            ))}
            
            {Object.keys(config).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">此插件没有可配置的选项</p>
            )}
          </div>
        </div>
      )}
      
      {/* 菜单面板 */}
      {showMenu && (
        <div 
          ref={settingsRef}
          className="absolute top-8 right-0 bg-theme-card shadow-lg rounded border border-theme p-2 z-50 w-48 text-sm"
        >
          <div className="space-y-1">
            <button 
              onClick={handleConvertToTab}
              className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              转换为标签页
            </button>
            
            {onRemove && (
              <button 
                onClick={handleRemove}
                className="flex items-center w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-red-600 dark:text-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                移除插件
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
