import React, { useState, useRef, useEffect } from 'react';
import { useLayoutStore01 } from './store/layoutStore01';
import { pluginRegistry } from 'plugins/registry';
import type { Plugin } from 'plugins/types';

interface TabContainerProps {
  plugins: string[];  // 包含的插件ID列表
  onRemovePlugin: (pluginId: string) => void;
  onSplitTab: (pluginId: string, position?: { x: number; y: number; w: number; h: number }) => void;
  onDragTab?: (pluginId: string) => void;  // 开始拖拽Tab
  tabId?: string;  // Tab容器的ID
  theme?: 'light' | 'dark';
  token?: any;
  locale?: string;
  onTokenChange?: (token: any) => void;
}

/**
 * 标签容器组件 - 支持多标签和拖拽功能
 */
const TabContainer: React.FC<TabContainerProps> = ({
  plugins,
  onRemovePlugin,
  onSplitTab,
  onDragTab,
  tabId,
  theme = 'light',
  token = null,
  locale = 'zh-CN',
  onTokenChange
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState<{ id: string, name: string }[]>([]);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [isDraggingTab, setIsDraggingTab] = useState(false); // 跟踪是否正在拖动标签
  const [contentHeight, setContentHeight] = useState(0); // 内容区高度
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{x: number, y: number} | null>(null);
  const [showDragPreview, setShowDragPreview] = useState(false);

  // 添加本地状态跟踪已删除的插件，以便在UI上立即反映删除
  const [localPlugins, setLocalPlugins] = useState<string[]>(plugins);

  // 引用
  const addMenuRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const pluginContentRef = useRef<HTMLDivElement>(null); // 内容区域引用
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // 获取添加插件到Tab的方法
  const addPluginToTab = useLayoutStore01(state => state.addPluginToTab);

  // 同步来自props的插件列表
  useEffect(() => {
    setLocalPlugins(plugins);
    
    // 如果当前激活的标签超出了实际插件数量，则重置到第一个标签
    if (activeTab >= plugins.length && plugins.length > 0) {
      setActiveTab(0);
    }
  }, [plugins, activeTab]);

  // 处理左右滚动
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsContainerRef.current) return;

    const container = tabsContainerRef.current;
    const scrollAmount = direction === 'left' ? -100 : 100;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });

    // 滚动后立即检查滚动状态
    setTimeout(checkScrollable, 300);
  };

  // 检查滚动状态
  const checkScrollable = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      // 只有当实际滚动宽度大于可见宽度时才显示按钮
      const hasOverflow = container.scrollWidth > container.clientWidth + 5; // 添加5px的容错

      setShowScrollButtons(hasOverflow);
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
    }
  };

  // 计算内容区域高度
  const calculateContentHeight = () => {
    // 获取容器总高度
    const containerElement = document.querySelector(`[data-item-id="${tabId}"]`);
    if (!containerElement) return;

    const containerHeight = containerElement.clientHeight;

    // 获取标签栏高度
    const tabsBarElement = containerElement.querySelector('.plugin-header');
    if (!tabsBarElement) return;

    const tabsBarHeight = tabsBarElement.clientHeight;

    // 计算内容区域应有的高度（容器高度减去标签栏高度再减去一些边距）
    const newContentHeight = containerHeight - tabsBarHeight - 10; // 10px为边距

    if (newContentHeight > 0 && newContentHeight !== contentHeight) {
      setContentHeight(newContentHeight);
    }
  };

  // 监听窗口大小变化和内容变化以更新滚动状态和内容高度
  useEffect(() => {
    checkScrollable();
    calculateContentHeight();

    const handleResize = () => {
      checkScrollable();
      calculateContentHeight();
    };

    window.addEventListener('resize', handleResize);

    // 定时检查滚动状态和内容高度，处理异步加载的情况
    const checkInterval = setInterval(() => {
      checkScrollable();
      calculateContentHeight();
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(checkInterval);
    };
  }, [plugins, activeTab]);

  // 监听滚动事件
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击外部关闭添加菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node) && showAddMenu) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  // 加载可添加的插件列表
  useEffect(() => {
    if (showAddMenu) {
      // 获取所有可用插件
      const allPlugins = pluginRegistry.getAll();
      
      // 过滤出未在当前标签中的插件
      const available = allPlugins
        .filter(plugin => !plugins.includes(plugin.metadata.id))
        .map(plugin => ({
          id: plugin.metadata.id,
          name: plugin.metadata.name || plugin.metadata.id.replace('official-', '').split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }));
      
      setAvailablePlugins(available);
    }
  }, [showAddMenu, plugins]);
  
  // 处理标签拖拽开始
  const handleTabDragStart = (e: React.MouseEvent, pluginId: string, index: number) => {
    if (!tabId) return;
    
    // 防止文本选择
    e.preventDefault();
    
    // 记录初始位置
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setDraggingTabId(pluginId);
    setIsDraggingTab(true);
    
    // 更新当前活动标签
    setActiveTab(index);
    
    // 记录当前元素，用于样式修改
    const tabElement = e.currentTarget as HTMLElement;
    tabElement.classList.add('tab-being-dragged');
    
    // 提升标签容器的z-index，确保在拖拽时显示在最前
    const tabContainer = document.querySelector(`[data-item-id="${tabId}"]`);
    if (tabContainer && tabContainer instanceof HTMLElement) {
      tabContainer.style.zIndex = '1000';
    }
    
    console.log('开始拖拽标签:', pluginId, '从容器', tabId);
    
    // 鼠标移动处理
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (dragStartX === null || dragStartY === null) return;
      
      // 计算拖拽距离
      const deltaX = moveEvent.clientX - dragStartX;
      const deltaY = moveEvent.clientY - dragStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      setDragDistance(distance);
      
      // 更低的拖拽阈值，提高响应性（从8降低到5）
      if (distance > 5) {
        // 更新预览位置
        setDragPreviewPosition({
          x: moveEvent.clientX,
          y: moveEvent.clientY
        });
        
        setShowDragPreview(true);
        
        // 如果拖拽距离超过阈值，通知父组件开始拖拽（从30降低到20）
        if (distance > 20 && onDragTab && !window.__draggedPluginInfo?.confirmedDragTime) {
          // 标记已确认拖拽
          window.__draggedPluginInfo = {
            pluginId,
            tabId: tabId || '',
            startTime: Date.now(),
            confirmedDragTime: Date.now(),
            isDraggingContainer: false
          };
          
          // 通知父组件开始拖拽
          onDragTab(pluginId);
          console.log('拖拽距离超过阈值，触发onDragTab');
          
          // 高亮所有可能的放置目标（其他标签容器）
          document.querySelectorAll('[data-item-id^="tab-container-"]').forEach(el => {
            if (el.getAttribute('data-item-id') !== tabId) {
              el.classList.add('potential-drop-target');
            }
          });
        }
      }
      
      // 更新拖拽tab的样式 - 使用更平滑的过渡
      if (tabElement) {
        tabElement.style.opacity = '0.7';
        tabElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        tabElement.style.transition = 'box-shadow 0.1s ease';
        tabElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        tabElement.style.cursor = 'grabbing';
        tabElement.style.zIndex = '100';
      }
    };
    
    // 鼠标释放处理
    const handleMouseUp = (upEvent: MouseEvent) => {
      // 移除事件监听器
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 隐藏预览
      setShowDragPreview(false);
      setDragPreviewPosition(null);
      
      // 如果拖拽距离小，视为点击，不触发拖拽
      const deltaX = upEvent.clientX - (dragStartX || 0);
      const deltaY = upEvent.clientY - (dragStartY || 0);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      console.log('拖拽结束,距离:', distance);
      
      setDragStartX(null);
      setDragStartY(null);
      setDraggingTabId(null);
      setIsDraggingTab(false);
      setDragDistance(0);
      
      // 移除拖拽样式
      if (tabElement) {
        tabElement.style.opacity = '';
        tabElement.style.transform = '';
        tabElement.style.boxShadow = '';
        tabElement.style.cursor = '';
        tabElement.style.zIndex = '';
        tabElement.style.transition = '';
        tabElement.classList.remove('tab-being-dragged');
      }
      
      // 移除所有高亮样式
      document.querySelectorAll('.potential-drop-target, .tab-container-hover').forEach(el => {
        el.classList.remove('potential-drop-target', 'tab-container-hover');
      });
      
      // 重置标签容器样式
      const tabContainer = document.querySelector(`[data-item-id="${tabId}"]`);
      if (tabContainer && tabContainer instanceof HTMLElement) {
        tabContainer.style.zIndex = '';
      }
      
      // 降低拆分阈值（从50降低到30），便于用户进行拆分操作
      if (distance > 30 && onSplitTab) {
        // 计算拆分位置 - 使用更精确的位置计算
        const position = {
          x: Math.max(0, Math.floor((upEvent.clientX - 50) / 30) * 1),
          y: Math.max(0, Math.floor((upEvent.clientY - 50) / 30) * 1),
          w: 5,
          h: 6
        };
        
        console.log('触发标签拆分:', pluginId, '位置:', position);
        onSplitTab(pluginId, position);
      }
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 处理移除标签
  const handleRemoveTab = (pluginId: string, index: number) => {
    // 立即从本地状态中移除，提高UI响应性
    const updatedPlugins = localPlugins.filter(id => id !== pluginId);
    setLocalPlugins(updatedPlugins);
    
    // 如果移除的是当前活动标签，则切换到前一个标签或者第一个标签
    if (index === activeTab) {
      if (index > 0) {
        setActiveTab(index - 1);
      } else if (updatedPlugins.length > 0) {
        setActiveTab(0);
      }
    } else if (index < activeTab) {
      // 如果移除的标签在当前标签之前，需要调整活动标签的索引
      setActiveTab(activeTab - 1);
    }
    
    // 调用父组件的移除方法
    onRemovePlugin(pluginId);
  };
  
  // 处理添加新标签
  const handleAddPlugin = (pluginId: string) => {
    if (!tabId) return;
    
    // 更新本地状态
    setLocalPlugins([...localPlugins, pluginId]);
    
    // 将新添加的标签设为活动标签
    setActiveTab(localPlugins.length);
    
    // 调用添加插件到标签容器的方法
    addPluginToTab(tabId, pluginId);
    
    // 关闭添加菜单
    setShowAddMenu(false);
  };

  // 获取格式化的标签名称
  const getFormattedTabName = (pluginId: string) => {
    const plugin = pluginRegistry.get(pluginId);
    if (plugin) {
      return plugin.metadata.name;
    }
    return pluginId.replace('official-', '').split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // 添加一个简单的错误边界组件
  class PluginErrorBoundary extends React.Component<
    { children: React.ReactNode, pluginId: string },
    { hasError: boolean, error: Error | null }
  > {
    constructor(props: { children: React.ReactNode, pluginId: string }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error(`插件错误 ${this.props.pluginId}:`, error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-4 text-red-500 dark:text-red-400">
            <div className="text-lg font-medium mb-2">插件加载失败</div>
            <div className="text-sm mb-4">ID: {this.props.pluginId}</div>
            <div className="text-xs text-center bg-red-50 dark:bg-red-900/30 p-3 rounded max-w-full overflow-auto">
              {this.state.error?.message || '未知错误'}
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  }

  // 内联实现插件渲染功能，避免导入问题
  const renderPlugin = (
    pluginId: string, 
    hideHeader: boolean = true,
    theme: 'light' | 'dark' = 'light',
    token: any = null,
    locale: string = 'zh-CN',
    onTokenChange?: (token: any) => void
  ) => {
    const plugin = pluginRegistry.get(pluginId);
    
    if (!plugin) {
      return (
        <div className="h-full flex items-center justify-center text-red-500 dark:text-red-400">
          插件未找到: {pluginId}
        </div>
      );
    }
    
    // 获取插件的默认配置
    const defaultConfig = plugin.metadata.defaultConfig || {};
    
    // 合并默认配置和传入的配置
    const mergedConfig = {
      ...defaultConfig,
      theme,
      locale,
      token,
      // 常见插件默认配置
      keywords: defaultConfig.keywords || ['ETH', 'BTC', 'Crypto', 'NFT'],
      refreshInterval: defaultConfig.refreshInterval || 30,
      sentimentThreshold: defaultConfig.sentimentThreshold || 0.5,
      chartType: defaultConfig.chartType || 'candles',
      timeframe: defaultConfig.timeframe || '1d',
      pairId: defaultConfig.pairId || 'BTCUSDT'
    };
    
    const PluginComponent = plugin.component;
    
    return (
      <div className="h-full">
        <PluginErrorBoundary pluginId={pluginId}>
          <PluginComponent 
            config={mergedConfig}
            onConfigChange={(newConfig) => {
              if (newConfig.token && onTokenChange && newConfig.token !== token) {
                onTokenChange(newConfig.token);
              }
            }}
          />
        </PluginErrorBoundary>
      </div>
    );
  };

  return (
    <div className="plugin-container h-full flex flex-col overflow-hidden">
      {/* 标签页标题区 */}
      <div className="plugin-header flex items-center plugin-drag-handle flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* 左滚动按钮 */}
        {showScrollButtons && (
          <button
            onClick={() => scrollTabs('left')}
            disabled={!canScrollLeft}
            className={`flex-shrink-0 p-1 rounded-full non-draggable ${canScrollLeft
              ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="向左滚动"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 标签栏 */}
        <div
          ref={tabsContainerRef}
          className="tabs-container scrollbar-hide flex-1 overflow-x-auto flex items-center space-x-1 py-1 px-1"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {localPlugins.map((pluginId, index) => {
            const isActive = activeTab === index;
            // 获取插件信息
            const plugin = pluginRegistry.get(pluginId);
            const tabName = plugin?.metadata.name || getFormattedTabName(pluginId);

            return (
              <div
                key={pluginId}
                className={`plugin-tab flex-shrink-0 inline-flex items-center rounded ${isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                } px-2 py-1 cursor-pointer text-sm tab-draggable ${draggingTabId === pluginId ? 'tab-being-dragged' : ''}`}
                onClick={(e) => {
                  // 只有在点击标签本身而不是按钮时才切换标签
                  const target = e.target as HTMLElement;
                  if (!target.closest('button')) {
                    setActiveTab(index);
                  }
                }}
                onMouseDown={(e) => handleTabDragStart(e, pluginId, index)}
                draggable="false"
              >
                <span className="truncate max-w-[120px]">{tabName}</span>

                {/* 移除按钮 */}
                <button
                  onClick={() => handleRemoveTab(pluginId, index)}
                  className="ml-1.5 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none non-draggable"
                  aria-label={`移除${tabName}标签`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* 添加新标签按钮 */}
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 non-draggable"
            aria-label="添加标签"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* 添加标签下拉菜单 */}
          {showAddMenu && (
            <div
              ref={addMenuRef}
              className="absolute z-20 left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
              style={{
                top: '2rem',
                maxWidth: '250px',
                width: '100%'
              }}
            >
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">添加插件到标签组</h3>
              </div>

              <div
                className="overflow-y-auto"
                data-no-drag="true"
                style={{
                  display: 'block',
                  overflowY: 'auto',
                  maxHeight: '300px'
                }}
              >
                {availablePlugins.length > 0 ? (
                  <div
                    className="space-y-1"
                    data-no-drag="true"
                    style={{
                      display: 'block'
                    }}
                  >
                    {availablePlugins.map(plugin => (
                      <div
                        key={plugin.id}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer"
                        data-no-drag="true"
                        onClick={() => handleAddPlugin(plugin.id)}
                      >
                        {plugin.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    没有可添加的插件
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右滚动按钮 */}
        {showScrollButtons && (
          <button
            onClick={() => scrollTabs('right')}
            disabled={!canScrollRight}
            className={`flex-shrink-0 p-1 rounded-full non-draggable ${canScrollRight
              ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="向右滚动"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* 标签内容区域 */}
      <div
        ref={pluginContentRef}
        className="plugin-content flex-grow overflow-y-auto"
        style={{
          height: contentHeight > 0 ? `${contentHeight}px` : 'calc(100% - 40px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {localPlugins.length > 0 ? (
          localPlugins.map((pluginId, index) => (
            <div
              key={pluginId}
              className={index === activeTab ? 'block h-full' : 'hidden'}
            >
              {renderPlugin(pluginId, true, theme, token, locale, onTokenChange)}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">此标签组为空</div>
            <div className="text-sm mb-4">点击上方"+"按钮添加插件</div>
            <button
              onClick={() => setShowAddMenu(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors"
            >
              添加插件
            </button>
          </div>
        )}
      </div>

      {/* 拖拽预览 */}
      {showDragPreview && dragPreviewPosition && (
        <div 
          ref={dragPreviewRef}
          className="fixed pointer-events-none z-[1000] bg-blue-100 dark:bg-blue-900 bg-opacity-70 dark:bg-opacity-70 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-md shadow-lg animate-pulse"
          style={{
            width: '200px',
            height: '150px',
            left: dragPreviewPosition.x - 100,
            top: dragPreviewPosition.y - 75,
            transition: 'transform 0.05s ease'
          }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {draggingTabId && (
              <>
                <span className="text-blue-700 dark:text-blue-300 font-medium mb-2">
                  {getFormattedTabName(draggingTabId)}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  拖动至其他标签容器合并<br />或空白区域拆分
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabContainer; 