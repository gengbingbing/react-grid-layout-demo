import { useState, useRef, useEffect } from 'react';
import PluginContainer from './PluginContainer';
import { pluginRegistry } from '../plugins/registry';
import { useLayoutStore } from '../store/layoutStore';

interface TabContainerProps {
  plugins: string[];  // 包含的插件ID列表
  onRemovePlugin: (pluginId: string) => void;
  onSplitTab: (pluginId: string) => void;  // 将插件从标签页拆分出来
  onDragTab?: (pluginId: string) => void;  // 开始拖拽Tab
  tabId?: string;  // Tab容器的ID
}

export default function TabContainer({ 
  plugins, 
  onRemovePlugin, 
  onSplitTab, 
  onDragTab,
  tabId 
}: TabContainerProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState<{id: string, name: string}[]>([]);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDraggingTab, setIsDraggingTab] = useState(false); // 跟踪是否正在拖动标签
  const [contentHeight, setContentHeight] = useState(0); // 内容区高度
  
  // 添加本地状态跟踪已删除的插件，以便在UI上立即反映删除
  const [localPlugins, setLocalPlugins] = useState<string[]>(plugins);
  
  // 当props更新时同步本地状态
  useEffect(() => {
    setLocalPlugins(plugins);
  }, [plugins]);
  
  const addMenuRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const pluginContentRef = useRef<HTMLDivElement>(null); // 内容区域引用
  
  // 获取添加插件到Tab的方法
  const addPluginToTab = useLayoutStore(state => state.addPluginToTab);

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
  
  // 检查是否需要显示滚动按钮
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // 检查滚动状态
  const checkScrollable = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      // 只有当实际滚动宽度大于可见宽度时才显示按钮
      const hasOverflow = container.scrollWidth > container.clientWidth + 5; // 添加5px的容错
      
      console.log('检查滚动状态:', {
        scrollWidth: container.scrollWidth, 
        clientWidth: container.clientWidth,
        hasOverflow: hasOverflow,
        scrollLeft: container.scrollLeft
      });
      
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
      console.log('更新内容区高度:', newContentHeight);
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
      setScrollPosition(container.scrollLeft);
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 5);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 添加CSS样式来隐藏滚动条但保留功能
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏滚动条但保留功能 */
      .scrollbar-hide::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      /* 确保标签容器可以正常滚动 */
      .tabs-container {
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
        -webkit-overflow-scrolling: touch; /* iOS滚动平滑 */
      }
      .tabs-container::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      /* 标签页拖拽样式 */
      .plugin-tab {
        position: relative;
        cursor: grab;
      }
      .plugin-tab.tab-being-dragged {
        opacity: 0.7;
        transform: scale(0.95);
      }
      .plugin-tab:not(.non-draggable)::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: rgba(0, 0, 0, 0.05);
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 1;
      }
      .plugin-tab:not(.non-draggable):hover::before {
        opacity: 1;
      }
      .plugin-tab:not(.non-draggable):active {
        cursor: grabbing;
      }
      /* 防止在拖拽时出现选中文本 */
      .plugin-tab, .plugin-header {
        user-select: none;
      }
      /* 确保插件内容区域可滚动 */
      .plugin-content {
        overflow-y: auto !important;
        height: calc(100% - 40px); /* 减去标签栏高度 */
        position: relative;
      }
      /* 为可能的自定义滚动条添加样式 */
      .plugin-content::-webkit-scrollbar {
        width: 8px;
      }
      .plugin-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .plugin-content::-webkit-scrollbar-thumb {
        background-color: rgba(155, 155, 155, 0.5);
        border-radius: 4px;
      }
      .plugin-content::-webkit-scrollbar-thumb:hover {
        background-color: rgba(155, 155, 155, 0.8);
      }
      /* 暗色模式滚动条 */
      .dark .plugin-content::-webkit-scrollbar-thumb {
        background-color: rgba(100, 100, 100, 0.5);
      }
      .dark .plugin-content::-webkit-scrollbar-thumb:hover {
        background-color: rgba(100, 100, 100, 0.8);
      }
      /* 强制内容区域显示滚动条 */
      .force-overflow-visible {
        overflow: visible !important;
      }
      .force-overflow-auto {
        overflow: auto !important;
      }
      /* 修复标签容器嵌套时的滚动问题 */
      .plugin-container {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .plugin-container > .plugin-content {
        flex: 1;
        overflow-y: auto;
        min-height: 0; /* 重要！解决flex布局下的滚动问题 */
      }
      /* 添加按钮和下拉菜单样式增强 */
      button[data-no-drag="true"] {
        cursor: pointer !important;
        position: relative;
        z-index: 10;
        border: 1px solid transparent;
        transition: all 0.2s;
      }
      button[data-no-drag="true"]:hover {
        background-color: #e2e8f0 !important;
        border-color: #cbd5e0 !important;
        transform: translateY(-1px);
      }
      button[data-no-drag="true"]:active {
        transform: translateY(0px);
      }
      .dark button[data-no-drag="true"]:hover {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
      }
      /* 下拉菜单样式强化 */
      .tab-menu-dropdown {
        border: 1px solid #cbd5e0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        animation: fadeInDropdown 0.2s ease-out forwards;
        transform-origin: top right;
        display: block !important;
        flex-direction: column !important;
        position: absolute !important;
        min-width: 180px !important;
        max-width: 250px !important;
        overflow: visible !important;
      }
      .dark .tab-menu-dropdown {
        border-color: #4b5563 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
      @keyframes fadeInDropdown {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-5px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .tab-menu-dropdown button {
        transition: background-color 0.15s;
        position: relative;
        overflow: hidden;
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        padding: 6px 12px !important;
        margin: 2px 0 !important;
      }
      .tab-menu-dropdown button:hover::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: currentColor;
        opacity: 0.05;
      }
      /* 插件列表项强制竖排 */
      .tab-menu-dropdown .space-y-1 {
        display: flex !important;
        flex-direction: column !important;
      }
      /* 修复滚动容器 */
      .max-h-48 {
        max-height: 12rem !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      /* 为滚动容器添加好看的滚动条 */
      .max-h-48::-webkit-scrollbar {
        width: 4px;
      }
      .max-h-48::-webkit-scrollbar-track {
        background: transparent;
      }
      .max-h-48::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 2px;
      }
      .dark .max-h-48::-webkit-scrollbar-thumb {
        background-color: rgba(75, 85, 99, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    // 获取所有可用插件
    const allPlugins = pluginRegistry.getAll();
    const pluginsForMenu = allPlugins
      .filter(plugin => !plugins.includes(plugin.metadata.id)) // 排除已在Tab中的插件
      .map(plugin => ({
        id: plugin.metadata.id,
        name: plugin.metadata.name
      }));
    setAvailablePlugins(pluginsForMenu);
    
    // 点击外部关闭添加菜单
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.head.removeChild(style);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [plugins]);

  useEffect(() => {
    // 首次加载后检查滚动状态
    setTimeout(checkScrollable, 100);
    
    // 插件数量变化时再次检查
    if (plugins.length > 0) {
      setTimeout(checkScrollable, 300);
    }
    
    // 初始计算内容高度
    setTimeout(calculateContentHeight, 100);
  }, [plugins]);

  // 监听plugins数组变化，处理标签移除的情况
  useEffect(() => {
    // 如果activeTab不再有效（例如当前标签被移除），则选择前一个有效标签
    if (plugins.length > 0 && activeTab >= plugins.length) {
      // 选择新的有效索引，通常是前一个
      const newActiveIndex = Math.max(0, plugins.length - 1);
      setActiveTab(newActiveIndex);
      console.log('标签已移除，自动选择新标签:', newActiveIndex);
    }
  }, [plugins, activeTab]);
  
  // 在用户手动移除标签时调整活动标签
  const handleRemoveTab = (pluginId: string, index: number) => {
    console.log('TabContainer: 移除标签', pluginId, index);
    
    // 检查插件是否最近被删除过，防止重复操作
    if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId]) {
      console.log('此插件最近已被删除，忽略操作:', pluginId);
      return;
    }
    
    // 立即在本地标记为已删除，防止快速重复点击
    window.__recentlyRemovedPlugins = window.__recentlyRemovedPlugins || {};
    window.__recentlyRemovedPlugins[pluginId] = Date.now();
    
    // 如果移除的是当前活动标签，提前设置新的活动标签
    if (index === activeTab) {
      // 如果有前一个标签，选择前一个；否则选择后一个；如果没有其他标签则保持0
      if (index > 0) {
        setActiveTab(index - 1);
      } else if (plugins.length > 1) {
        setActiveTab(0); // 保持选择第一个
      }
    } else if (index < activeTab) {
      // 如果移除的是当前标签之前的标签，需要调整激活索引
      setActiveTab(activeTab - 1);
    }
    
    // 立即在本地状态中移除插件，提供即时视觉反馈
    setLocalPlugins(prev => prev.filter(id => id !== pluginId));
    
    // 立即从本地插件列表中移除，以提供即时视觉反馈
    setTimeout(() => {
      // 调用外部移除函数 - 这里需要确保完全移除插件，而不仅仅是从标签内移除
      onRemovePlugin(pluginId);
    }, 0);
  };

  // 添加清除全局拖拽标志的效果
  useEffect(() => {
    // 组件卸载时确保清除全局拖拽标志
    return () => {
      // 清除全局拖拽标志
      (window as any).__isDraggingTab = false;
      
      // 确保清除其他相关标记
      delete window.__draggedPluginInfo;
      delete window.__draggedPluginPosition;
      delete window.__gridParams;
      
      // 移除事件监听器
      if (window.__handleDragMouseMove) {
        document.removeEventListener('mousemove', window.__handleDragMouseMove);
        delete window.__handleDragMouseMove;
      }
      
      if (window.__handleDragMouseUp) {
        document.removeEventListener('mouseup', window.__handleDragMouseUp);
        delete window.__handleDragMouseUp;
      }
      
      // 移除拖拽样式
      document.body.classList.remove('dragging');
    };
  }, []);

  // 处理Tab拖动开始
  const handleTabDragStart = (e: React.MouseEvent, pluginId: string, index: number) => {
    // 防止事件冒泡
    e.stopPropagation();
    e.preventDefault(); // 阻止默认行为
    
    // 检查是否是从按钮点击，如果是则不启动拖拽
    const target = e.target as HTMLElement;
    
    // 检查是否点击了带有data-no-drag属性的元素
    if (target.closest('[data-no-drag="true"]') || target.hasAttribute('data-no-drag')) {
      console.log('点击了不可拖拽元素，不启动拖拽');
      return;
    }
    
    // 检查是否点击了按钮或图标元素
    if (target.closest('button') || target.tagName === 'BUTTON' || target.closest('svg')) {
      console.log('点击了按钮或图标，不启动拖拽');
      return;
    }
    
    // 如果已经有拖拽正在进行，则不启动新的拖拽
    if ((window as any).__isDraggingTab || isDraggingTab) {
      console.warn('已有标签正在拖动中，忽略此次操作');
      return;
    }
    
    console.log('开始拖动标签:', pluginId, '标签ID:', tabId);
    
    // 立即激活当前标签，确保拖拽的是可见内容
    setActiveTab(index);
    
    // 记录开始拖动的位置，用于检测是否移动了足够距离
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setDraggingTabId(pluginId);
    
    // 设置正在拖拽标签状态
    setIsDraggingTab(true);
    
    // 添加拖拽视觉反馈
    const tabElement = e.currentTarget as HTMLElement;
    tabElement.classList.add('tab-being-dragged');
    
    // 如果提供了onDragTab回调和tabId，直接调用它
    if (onDragTab && tabId) {
      console.log('调用onDragTab回调，插件ID:', pluginId);
      
      // 设置全局标志，防止其他拖拽操作干扰
      (window as any).__isDraggingTab = true;
      
      // 禁用文本选择
      document.body.classList.add('dragging');
      
      // 确保鼠标移动了足够距离才触发拖拽
      let hasDragged = false;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 阻止其他事件处理
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        
        // 计算移动距离
        const deltaX = moveEvent.clientX - (dragStartX || 0);
        const deltaY = moveEvent.clientY - (dragStartY || 0);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 只有在移动了至少5px的距离后才触发拖拽
        if (!hasDragged && distance > 5) {
          hasDragged = true;
          console.log('确认拖拽，触发拖拽回调');
          
          // 添加拖拽样式
          tabElement.style.opacity = '0.7';
          tabElement.style.transform = 'scale(0.95)';
          
          // 确保标签容器可拖拽
          const tabContainer = document.querySelector(`[data-item-id="${tabId}"]`);
          if (tabContainer && tabContainer instanceof HTMLElement) {
            tabContainer.style.pointerEvents = 'auto';
            tabContainer.style.cursor = 'move';
            tabContainer.style.zIndex = '1000';
          }
          
          // 调用父组件提供的拖拽回调
          onDragTab(pluginId);
        }
      };
      
      // 处理鼠标释放
      const handleMouseUp = (upEvent: MouseEvent) => {
        console.log('鼠标释放，清理拖拽状态');
        
        // 阻止事件传播
        upEvent.preventDefault();
        upEvent.stopPropagation();
        
        // 清除拖拽状态
        (window as any).__isDraggingTab = false;
        setIsDraggingTab(false);
        setDraggingTabId(null);
        document.body.classList.remove('dragging');
        
        // 移除事件监听
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // 移除拖拽样式
        tabElement.style.opacity = '';
        tabElement.style.transform = '';
        tabElement.classList.remove('tab-being-dragged');
        
        // 确保移除所有可能的拖拽相关元素
        const indicators = document.querySelectorAll('.drag-out-indicator, .tab-drag-indicator');
        indicators.forEach(indicator => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        });
        
        // 重置标签容器样式
        const tabContainer = document.querySelector(`[data-item-id="${tabId}"]`);
        if (tabContainer && tabContainer instanceof HTMLElement) {
          tabContainer.style.zIndex = '';
        }
      };
      
      // 注册事件处理器
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    }
  };

  // 点击添加按钮的处理函数
  const handleAddButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAddMenu(!showAddMenu);
    console.log('点击添加按钮', showAddMenu ? '关闭菜单' : '打开菜单');
  };

  // 防止点击按钮时触发拖拽
  const handleButtonMouseDown = (e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  };

  // 监听添加菜单的显示状态变化
  useEffect(() => {
    if (showAddMenu) {
      console.log('菜单已显示，添加全局点击监听');
      
      // 延迟一帧，确保DOM更新
      setTimeout(() => {
        if (addMenuRef.current) {
          // 确保菜单可见
          const menuElement = addMenuRef.current;
          menuElement.style.display = 'block';
          menuElement.style.visibility = 'visible';
          menuElement.style.opacity = '1';
          menuElement.style.zIndex = '9999';
          menuElement.style.pointerEvents = 'auto';
          
          // 强制使用垂直布局
          const pluginsList = menuElement.querySelector('.space-y-1');
          if (pluginsList) {
            (pluginsList as HTMLElement).style.display = 'flex';
            (pluginsList as HTMLElement).style.flexDirection = 'column';
          }
          
          // 强制设置菜单背景色和边框
          const isDarkMode = document.documentElement.classList.contains('dark');
          if (isDarkMode) {
            menuElement.style.backgroundColor = '#1f2937';
            menuElement.style.borderColor = '#4b5563';
            menuElement.style.color = '#e5e7eb';
          } else {
            menuElement.style.backgroundColor = 'white';
            menuElement.style.borderColor = '#e2e8f0';
            menuElement.style.color = '#1f2937';
          }
          
          // 确保所有菜单项可点击
          const menuItems = menuElement.querySelectorAll('button');
          menuItems.forEach(item => {
            item.style.pointerEvents = 'auto';
            item.style.width = '100%';
            item.style.textAlign = 'left';
            item.style.padding = '6px 12px';
            item.style.margin = '2px 0';
            item.style.display = 'block';
          });
        }
      }, 0);
    }
  }, [showAddMenu]);

  if (!plugins || plugins.length === 0) {
    return <div className="p-4 text-center">无插件</div>;
  }
  
  // 获取格式化的标签名称
  const getFormattedTabName = (pluginId: string) => {
    const plugin = pluginRegistry.get(pluginId);
    if (plugin) {
      return plugin.metadata.name;
    }
    return pluginId.replace('official-', '').split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // 添加新插件到当前Tab容器
  const handleAddPlugin = (pluginId: string) => {
    if (!tabId) return;
    
    // 调用布局存储中的方法
    addPluginToTab(tabId, pluginId);
    
    // 添加后应自动激活这个新标签
    setActiveTab(plugins.length); // 新标签会被添加到末尾
    
    // 关闭菜单
    setShowAddMenu(false);
  };
  
  return (
    <div className="plugin-container h-full flex flex-col overflow-hidden">
      {/* 标签页标题区 */}
      <div className="plugin-header flex items-center plugin-drag-handle flex-shrink-0">
        {/* 左滚动按钮 */}
        {showScrollButtons && (
          <button 
            onClick={() => scrollTabs('left')}
            disabled={!canScrollLeft}
            className={`flex-shrink-0 p-1 rounded-full non-draggable ${
              canScrollLeft 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="向左滚动"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* 标签栏 */}
        <div 
          ref={tabsContainerRef}
          className="tabs-container scrollbar-hide flex-1 overflow-x-auto flex items-center space-x-1 py-1 px-1"
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {localPlugins.map((pluginId, index) => {
            const isActive = activeTab === index;
            // 获取插件信息
            const plugin = pluginRegistry.get(pluginId);
            const tabName = plugin?.metadata.name || pluginId;
            
            return (
              <div 
                key={pluginId}
                className={`plugin-tab flex-shrink-0 inline-flex items-center rounded ${
                  isActive 
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
                  className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 non-draggable"
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发tab切换
                    handleRemoveTab(pluginId, index);
                  }}
                  title="移除标签"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
          
          {/* 添加标签按钮 */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button 
              className="plugin-tab flex-shrink-0 inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 cursor-pointer text-sm non-draggable"
              onClick={handleAddButtonClick}
              onMouseDown={handleButtonMouseDown}
              title="添加标签"
              data-no-drag="true"
              style={{ pointerEvents: 'auto' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            {/* 添加标签菜单 */}
            {showAddMenu && (
              <div 
                ref={addMenuRef}
                className="tab-menu-dropdown absolute right-0 top-full mt-1 bg-theme-card shadow-lg rounded border border-theme p-2 z-50 w-48 text-sm"
                onClick={(e) => e.stopPropagation()} // 防止点击菜单时关闭菜单
                onMouseDown={(e) => e.stopPropagation()} // 防止触发父元素的拖拽
                style={{
                  zIndex: 10000,
                  visibility: 'visible',
                  opacity: 1,
                  position: 'fixed',
                  pointerEvents: 'auto',
                  display: 'block',
                  width: '12rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-theme-card, white)',
                  borderColor: 'var(--border-theme, #e2e8f0)',
                  right: '10px',
                  top: '40px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                data-no-drag="true"
              >
                <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 border-b border-theme pb-1" data-no-drag="true">添加到标签页</div>
                <div className="max-h-48 overflow-y-auto" data-no-drag="true" style={{display: 'block'}}>
                  {availablePlugins.length > 0 ? (
                    <div className="space-y-1 flex flex-col" data-no-drag="true" style={{display: 'flex', flexDirection: 'column'}}>
                      {availablePlugins.map(plugin => (
                        <button 
                          key={plugin.id}
                          onClick={(e) => {
                            e.stopPropagation(); // 防止事件冒泡
                            handleAddPlugin(plugin.id);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 truncate"
                          data-no-drag="true"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 12px',
                            margin: '2px 0'
                          }}
                        >
                          {plugin.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-2" data-no-drag="true">
                      没有可添加的插件
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 右滚动按钮 */}
        {showScrollButtons && (
          <button 
            onClick={() => scrollTabs('right')}
            disabled={!canScrollRight}
            className={`flex-shrink-0 p-1 rounded-full non-draggable ${
              canScrollRight 
                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="向右滚动"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {localPlugins.map((pluginId, index) => (
          <div 
            key={pluginId}
            className={index === activeTab ? 'block h-full' : 'hidden'}
          >
            <PluginContainer 
              pluginId={pluginId}
              onRemove={() => handleRemoveTab(pluginId, index)}
              hideHeader={true}
            />
          </div>
        ))}
        
        {plugins.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            此标签组为空
          </div>
        )}
      </div>
    </div>
  );
} 