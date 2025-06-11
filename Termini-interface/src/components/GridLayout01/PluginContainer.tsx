import React, { useState, useEffect, Suspense, useRef } from 'react';
import { pluginRegistry } from 'plugins/registry';
import type { Plugin } from 'plugins/types';
import { useLayoutStore01 } from './store/layoutStore01';

// 插件容器属性接口
interface PluginContainerProps {
  pluginId: string;
  onRemove?: () => void;
  hideHeader?: boolean;
  theme?: 'light' | 'dark';
  token?: any;
  locale?: string;
  onTokenChange?: (token: any) => void;
}

/**
 * 插件容器组件 - 负责渲染插件并提供插件操作
 */
const PluginContainer: React.FC<PluginContainerProps> = ({
  pluginId,
  onRemove,
  hideHeader = false,
  theme = 'light',
  token = null,
  locale = 'zh-CN',
  onTokenChange
}) => {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // 引用
  const settingsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 获取convertToTab方法，用于将插件转换为标签容器
  const convertToTab = useLayoutStore01(state => state.convertToTab);

  // 监听全局状态，用于处理Token更新
  const lastTokenUpdate = useLayoutStore01(state => state._lastTokenUpdate);

  // 加载插件
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [pluginId]);

  // 当有token更新时，触发刷新
  useEffect(() => {
    if (lastTokenUpdate && plugin) {
      console.log(`[${pluginId}] Token更新触发刷新，时间:`, new Date(lastTokenUpdate).toLocaleTimeString());
      const defaultConfig = plugin.metadata.defaultConfig || {};
      setConfig({ ...defaultConfig, token });
    }
  }, [lastTokenUpdate, pluginId, plugin, token]);

  // 点击外部关闭设置面板和菜单
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

    // 检查是否有token更新，如果有则通知父组件
    if (updatedConfig.token && onTokenChange && updatedConfig.token !== token) {
      onTokenChange(updatedConfig.token);
    }
  };

  // 处理移除插件
  const handleRemove = () => {
    if (!onRemove) return;

    setShowSettings(false);
    setShowMenu(false);
    onRemove();
  };

  // 处理转换为标签容器
  const handleConvertToTab = () => {
    if (convertToTab) {
      convertToTab(pluginId);
      setShowMenu(false);
    }
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="plugin-container h-full flex flex-col" ref={containerRef}>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="plugin-container h-full flex flex-col" ref={containerRef}>
        <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  // 插件未找到
  if (!plugin) {
    return (
      <div className="plugin-container h-full flex flex-col" ref={containerRef}>
        <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400">
          插件未找到
        </div>
      </div>
    );
  }

  // 获取插件组件
  const PluginComponent = plugin.component;

  // 确定是否显示头部
  // 如果传入hideHeader=true强制隐藏，如果插件是固定的(isFixed=true)也不显示头部
  const shouldHideHeader = hideHeader || plugin.metadata.isFixed === true;

  return (
    <div className="plugin-container h-full flex flex-col overflow-hidden" ref={containerRef}>
      {/* 插件头部 */}
      {!shouldHideHeader && (
        <div className="flex justify-between items-center plugin-drag-handle px-2 py-1 plugin-header flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">
            {plugin.metadata.name || pluginId.replace('official-', '').split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </div>
          <div className="flex space-x-1">
            {/* 设置按钮 */}
            {plugin.metadata.settings && plugin.metadata.settings.length > 0 && (
              <button
                className="non-draggable p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                onClick={() => setShowSettings(!showSettings)}
                title="插件设置"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            {/* 菜单按钮 */}
            <button
              className="non-draggable p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              onClick={() => setShowMenu(!showMenu)}
              title="更多选项"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* 移除按钮 */}
            {onRemove && (
              <button
                className="non-draggable p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation(); // 防止事件冒泡
                  handleRemove();
                }}
                title="移除插件"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        className="plugin-content flex-grow overflow-auto"
        style={{
          height: shouldHideHeader ? '100%' : contentHeight > 0 ? `${contentHeight}px` : 'calc(100% - 28px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <Suspense fallback={<div className="p-4 flex justify-center items-center text-gray-500 dark:text-gray-400">加载插件内容...</div>}>
          <PluginComponent
            config={{ ...config, theme, locale, token }}
            onConfigChange={handleConfigChange}
          />
        </Suspense>
      </div>

      {/* 设置面板 */}
      {showSettings && plugin.metadata.settings && (
        <div
          ref={settingsRef}
          className="absolute right-2 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-20 w-64"
        >
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">插件设置</h4>
          <div className="space-y-3">
            {plugin.metadata.settings.map((setting) => (
              <div key={setting.name} className="w-full">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {setting.label}
                </label>

                {setting.type === 'boolean' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!!config[setting.name]}
                      onChange={(e) => handleConfigChange({ ...config, [setting.name]: e.target.checked })}
                      className="h-12 w-12 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {config[setting.name] ? '开启' : '关闭'}
                    </span>
                  </div>
                )}

                {setting.type === 'text' && (
                  <input
                    type="text"
                    value={config[setting.name] || ''}
                    placeholder={setting.placeholder || ''}
                    onChange={(e) => handleConfigChange({ ...config, [setting.name]: e.target.value })}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                )}

                {setting.type === 'number' && (
                  <input
                    type="number"
                    value={config[setting.name] || 0}
                    onChange={(e) => handleConfigChange({ ...config, [setting.name]: Number(e.target.value) })}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                )}

                {setting.type === 'select' && setting.options && (
                  <select
                    value={config[setting.name] || ''}
                    onChange={(e) => handleConfigChange({ ...config, [setting.name]: e.target.value })}
                    className="w-full p-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {setting.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 更多选项菜单 */}
      {showMenu && (
        <div
          ref={settingsRef}
          className="absolute right-2 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-20"
        >
          <div className="py-1">
            <button
              onClick={handleConvertToTab}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              转换为标签容器
            </button>
            {onRemove && (
              <button
                onClick={handleRemove}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                移除插件
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginContainer; 