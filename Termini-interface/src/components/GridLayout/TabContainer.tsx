import { useState, useRef, useEffect } from 'react';
import PluginContainer from './PluginContainer';
import { pluginRegistry } from 'plugins/registry';
import { useLayoutStore } from 'store/layoutStore';

interface TabContainerProps {
  plugins: string[];  // 包含的插件ID列表
  onRemovePlugin: (pluginId: string) => void;
  onSplitTab: (pluginId: string, position?: { x: number; y: number; w: number; h: number }) => void;
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
  const [availablePlugins, setAvailablePlugins] = useState<{ id: string, name: string }[]>([]);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDraggingTab, setIsDraggingTab] = useState(false); // 跟踪是否正在拖动标签
  const [contentHeight, setContentHeight] = useState(0); // 内容区高度

  // 添加本地状态跟踪已删除的插件，以便在UI上立即反映删除
  const [localPlugins, setLocalPlugins] = useState<string[]>(plugins);

  const addMenuRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const pluginContentRef = useRef<HTMLDivElement>(null); // 内容区域引用

  // 获取添加插件到Tab的方法
  const addPluginToTab = useLayoutStore(state => state.addPluginToTab);

  // 同步外部 plugins 属性变化到本地状态
  useEffect(() => {
    console.log('TabContainer: plugins属性变化，同步到本地状态', {
      tabId,
      oldLocalPlugins: localPlugins,
      newPlugins: plugins
    });
    
    // 只有当外部plugins和本地localPlugins不同步时才更新
    const isDifferent = plugins.length !== localPlugins.length || 
      plugins.some(plugin => !localPlugins.includes(plugin)) ||
      localPlugins.some(plugin => !plugins.includes(plugin));
    
    if (isDifferent) {
      console.log('TabContainer: 检测到插件列表变化，更新本地状态');
      setLocalPlugins([...plugins]);
      
      // 确保activeTab在有效范围内
      if (activeTab >= plugins.length && plugins.length > 0) {
        setActiveTab(plugins.length - 1);
      } else if (plugins.length === 0) {
        setActiveTab(0);
      }
    }
  }, [plugins, localPlugins, activeTab, tabId]);

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
        overflow: unset;
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
      /* 添加标签菜单样式增强 */
      .add-plugin-menu {
        max-height: 300px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        position: absolute !important;
        z-index: 9999 !important;
      }
      /* 位置修复：上方显示 */
      .menu-position-top {
        bottom: 100% !important;
        top: auto !important;
        margin-bottom: 5px !important;
      }
      /* 位置修复：下方显示 */
      .menu-position-bottom {
        top: 100% !important;
        bottom: auto !important;
        margin-top: 5px !important;
      }
      /* 为滚动容器添加好看的滚动条 */
      .add-plugin-menu::-webkit-scrollbar {
        width: 4px;
      }
      .add-plugin-menu::-webkit-scrollbar-track {
        background: transparent;
      }
      .add-plugin-menu::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 2px;
      }
      .dark .add-plugin-menu::-webkit-scrollbar-thumb {
        background-color: rgba(75, 85, 99, 0.5);
      }
      /* 拖拽到空白区域的指示器样式 */
      .drop-out-indicator {
        position: fixed;
        width: 150px;
        height: 150px;
        border-radius: 8px;
        border: 2px dashed #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 10000;
        transition: opacity 0.2s, transform 0.2s;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        animation: pulseIndicator 1.5s infinite alternate;
      }
      .drop-out-indicator::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border-radius: 12px;
        border: 1px dashed rgba(59, 130, 246, 0.3);
        animation: rotateIndicator 10s linear infinite;
      }
      .dark .drop-out-indicator {
        border-color: #60a5fa;
        background-color: rgba(37, 99, 235, 0.15);
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
      }
      @keyframes pulseIndicator {
        0% { transform: scale(0.95); }
        100% { transform: scale(1.05); }
      }
      @keyframes rotateIndicator {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      /* 额外增加一些拖拽状态样式 */
      body.dragging {
        cursor: grabbing !important;
        user-select: none !important;
      }
      body.dragging * {
        cursor: grabbing !important;
        pointer-events: auto;
      }
      .grid-item-hover {
        outline: 2px solid #3b82f6 !important;
        transition: outline 0.2s;
      }
      .dark .grid-item-hover {
        outline: 2px solid #60a5fa !important;
      }
    `;
    document.head.appendChild(style);

    // 更新可用插件列表，确保已在标签中的插件不再显示
    updateAvailablePlugins();

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
  }, [plugins, localPlugins]);

  // 监听localPlugins变化，更新可用插件列表
  useEffect(() => {
    // 更新可用插件列表
    console.log('localPlugins变化，自动更新可用插件列表');
    updateAvailablePlugins();
  }, [localPlugins]);

  // 单独的函数用于更新可用插件列表
  const updateAvailablePlugins = () => {
    const allPlugins = pluginRegistry.getAll();
    setAvailablePlugins(
      allPlugins
        .filter(plugin => !localPlugins.includes(plugin.metadata.id))
        .map(plugin => ({ id: plugin.metadata.id, name: plugin.metadata.name }))
    );
  };

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

    // 1. 立即从本地状态中移除插件
    setLocalPlugins(prev => prev.filter(id => id !== pluginId));

    // 2. 调用外部回调更新全局状态
    onRemovePlugin(pluginId);

    // 3. 手动更新可用插件列表（不再依赖 useEffect）
    const allPlugins = pluginRegistry.getAll();
    setAvailablePlugins(
      allPlugins
        .filter(plugin => !localPlugins.includes(plugin.metadata.id) && plugin.metadata.id !== pluginId)
        .map(plugin => ({ id: plugin.metadata.id, name: plugin.metadata.name }))
    );

    // 4. 调整活动标签索引
    if (index === activeTab) {
      setActiveTab(Math.max(0, localPlugins.length - 2)); // 因为本地状态已更新
    }
  };

  // 添加清除全局拖拽标志的效果
  useEffect(() => {
    // 定期清理拖拽状态，防止状态泄漏
    const cleanupInterval = setInterval(() => {
      // 检查是否有超时的拖拽状态（超过10秒没有更新）
      const now = Date.now();
      if ((window as any).__isDraggingTab && window.__draggedPluginInfo) {
        const dragTime = now - window.__draggedPluginInfo.startTime;
        if (dragTime > 10000) { // 10秒超时
          console.warn('检测到超时拖拽状态，强制清理');
          (window as any).__isDraggingTab = false;
          (window as any).__isPotentialDrag = false;
          setIsDraggingTab(false);
          setDraggingTabId(null);
          document.body.classList.remove('dragging');
          
          // 清理全局状态
          delete window.__draggedPluginInfo;
          delete window.__draggedPluginPosition;
          delete window.__gridParams;
          
          // 清理DOM元素
          document.querySelectorAll('.drop-out-indicator, .tab-drag-indicator').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
          });
        }
      }
      
      // 检查是否有孤立的拖拽元素
      if (!(window as any).__isDraggingTab) {
        const orphanElements = document.querySelectorAll('.drop-out-indicator, .tab-drag-indicator');
        if (orphanElements.length > 0) {
          console.warn('检测到孤立的拖拽元素，清理中');
          orphanElements.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
          });
        }
      }
    }, 3000); // 每3秒检查一次

    // 组件卸载时确保清除全局拖拽标志
    return () => {
      clearInterval(cleanupInterval);
      
      // 清除全局拖拽标志
      (window as any).__isDraggingTab = false;

      // 确保清除其他相关标记
      delete window.__draggedPluginInfo;
      delete window.__draggedPluginPosition;
      delete window.__gridParams;

      // 清除所有拖拽状态
      document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .grid-item-hover').forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('plugin-drag-over');
          el.classList.remove('tab-container-hover');
          el.classList.remove('grid-item-hover');
        }
      });

      // 移除所有拖拽指示器
      document.querySelectorAll('.drag-out-indicator, .tab-drag-indicator, .drop-indicator').forEach(indicator => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      });

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

    // **强制清理任何残留的拖拽状态**
    console.log('开始拖拽前，强制清理残留状态');
    (window as any).__isDraggingTab = false;
    (window as any).__isPotentialDrag = false;
    setIsDraggingTab(false);
    setDraggingTabId(null);
    document.body.classList.remove('dragging');
    
    // 清理残留的拖拽元素
    document.querySelectorAll('.drop-out-indicator, .tab-drag-indicator, .drop-indicator').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

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
      // 存储拖拽起始位置（用于计算偏移量）
      const tabRect = tabElement.getBoundingClientRect();
      (window as any).__draggedPluginPosition = {
        x: e.clientX,
        y: e.clientY,
        w: tabRect.width,
        h: tabRect.height,
        offsetX: e.clientX - tabRect.left,
        offsetY: e.clientY - tabRect.top
      };
      console.log('调用onDragTab回调，插件ID:', pluginId);

      // 设置全局标志，防止其他拖拽操作干扰
      (window as any).__isDraggingTab = true;

      // 存储拖拽的插件信息，以便后续处理
      (window as any).__draggedPluginInfo = {
        pluginId,
        sourceTabId: tabId,
        sourceIndex: index
      };

      // 禁用文本选择
      document.body.classList.add('dragging');

      // 确保鼠标移动了足够距离才触发拖拽
      let hasDragged = false;
      let isOverEmptyArea = false;
      let dropIndicator: HTMLElement | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 阻止其他事件处理
        moveEvent.preventDefault();
        moveEvent.stopPropagation();

        // 计算移动距离
        const deltaX = moveEvent.clientX - (dragStartX || 0);
        const deltaY = moveEvent.clientY - (dragStartY || 0);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 更新拖拽距离状态
        setDragDistance(distance);

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

          // 创建外部拖放提示元素，用于指示可以拖拽到外部区域
          createDropOutIndicator();
        }

        // 检测是否在空白区域
        if (hasDragged) {
          const elementsAtPoint = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
          const isOverContainer = elementsAtPoint.some(el =>
            el.classList.contains('grid-item') ||
            el.classList.contains('plugin-container')
          );

          // 如果不在任何容器上方，显示拖拽到空白区域提示
          if (!isOverContainer && !isOverEmptyArea) {
            isOverEmptyArea = true;

            // 更新或创建拖拽到空白区域的指示器
            updateDropOutIndicator(moveEvent.clientX, moveEvent.clientY);
          } else if (isOverContainer && isOverEmptyArea) {
            isOverEmptyArea = false;

            // 移除拖拽到空白区域的指示器
            removeDropOutIndicator();
          }

          // 如果在空白区域，更新指示器位置
          if (isOverEmptyArea) {
            updateDropOutIndicator(moveEvent.clientX, moveEvent.clientY);
          }

          // 更新全局拖拽位置，确保其他组件可以获取最新位置
          (window as any).__draggedPluginPosition = {
            ...(window as any).__draggedPluginPosition,
            x: moveEvent.clientX,
            y: moveEvent.clientY
          };
        }
      };

      // 处理鼠标释放
      const handleMouseUp = (upEvent: MouseEvent) => {
        console.log('鼠标释放，清理拖拽状态');

        // 阻止事件传播
        upEvent.preventDefault();
        upEvent.stopPropagation();

        // 获取拖拽结束位置的元素
        const elementsAtPoint = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
        const isOverContainer = elementsAtPoint.some(el =>
          el.classList.contains('grid-item') ||
          el.classList.contains('plugin-container')
        );

        // 如果在空白区域释放，创建新容器
        if (!isOverContainer && hasDragged && draggingTabId) {
          console.log('在空白区域释放，准备创建新容器');

          // 获取拖拽位置信息
          const dragInfo = (window as any).__draggedPluginPosition;
          if (dragInfo) {
            try {
              // 调用拆分函数，传递插件ID和位置信息
              onSplitTab(draggingTabId, {
                x: Math.max(0, Math.floor((upEvent.clientX - 50) / 100)),
                y: Math.max(0, Math.floor((upEvent.clientY - 50) / 100)),
                w: 6, // 默认宽度
                h: 6  // 默认高度
              });
              console.log('已调用onSplitTab，创建新容器');
            } catch (err) {
              console.error('创建新容器失败:', err);
            }
          }
        }

        // 清理所有拖拽相关状态和提示
        cleanupDragState();

        // 清除拖拽状态
        (window as any).__isDraggingTab = false;
        setIsDraggingTab(false);
        setDraggingTabId(null);
        document.body.classList.remove('dragging');

        // 移除事件监听
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // 移除拖拽样式 - 确保tabElement仍然存在
        if (tabElement) {
          tabElement.style.opacity = '';
          tabElement.style.transform = '';
          tabElement.classList.remove('tab-being-dragged');
        }

        // 重置标签容器样式
        const tabContainer = document.querySelector(`[data-item-id="${tabId}"]`);
        if (tabContainer && tabContainer instanceof HTMLElement) {
          tabContainer.style.zIndex = '';
        }
      };

      // 创建外部拖放提示元素
      const createDropOutIndicator = () => {
        // 移除可能存在的旧指示器
        removeDropOutIndicator();

        // 创建新的指示器
        dropIndicator = document.createElement('div');
        dropIndicator.className = 'drop-out-indicator';
        dropIndicator.style.position = 'fixed';
        dropIndicator.style.width = '150px';
        dropIndicator.style.height = '150px';
        dropIndicator.style.borderRadius = '8px';
        dropIndicator.style.border = '2px dashed #3b82f6';
        dropIndicator.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        dropIndicator.style.display = 'flex';
        dropIndicator.style.alignItems = 'center';
        dropIndicator.style.justifyContent = 'center';
        dropIndicator.style.pointerEvents = 'none';
        dropIndicator.style.zIndex = '10000';
        dropIndicator.style.transition = 'transform 0.1s';
        dropIndicator.style.opacity = '0';

        // 添加文字提示
        const textElement = document.createElement('div');
        textElement.textContent = '拖放到此处创建新容器';
        textElement.style.color = '#3b82f6';
        textElement.style.fontWeight = 'bold';
        textElement.style.fontSize = '12px';
        textElement.style.textAlign = 'center';

        dropIndicator.appendChild(textElement);
        document.body.appendChild(dropIndicator);
      };

      // 更新拖放指示器位置
      const updateDropOutIndicator = (x: number, y: number) => {
        if (!dropIndicator) return;

        dropIndicator.style.opacity = '1';
        dropIndicator.style.left = `${x - 75}px`;
        dropIndicator.style.top = `${y - 75}px`;
        dropIndicator.style.transform = 'scale(1)';
      };

      // 移除拖放指示器
      const removeDropOutIndicator = () => {
        const indicators = document.querySelectorAll('.drop-out-indicator');
        indicators.forEach(indicator => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        });

        dropIndicator = null;
      };

      // 清理所有拖拽相关状态和提示
      const cleanupDragState = () => {
        // 移除所有拖拽指示器
        removeDropOutIndicator();

        // 移除所有拖拽相关的指示器
        const allIndicators = document.querySelectorAll('.drag-out-indicator, .tab-drag-indicator, .drop-indicator');
        allIndicators.forEach(indicator => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        });

        // 移除所有hover状态
        document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .grid-item-hover').forEach(el => {
          if (el instanceof HTMLElement) {
            el.classList.remove('plugin-drag-over');
            el.classList.remove('tab-container-hover');
            el.classList.remove('grid-item-hover');
          }
        });

        // 清空所有全局拖拽状态 - 这是关键修复
        (window as any).__isDraggingTab = false;
        (window as any).__isPotentialDrag = false;
        
        // 清除全局拖拽相关状态
        delete window.__draggedPluginInfo;
        delete window.__draggedPluginPosition;
        delete window.__gridParams;
        delete window.__currentDragTargetTabId;
        
        // 清除本地拖拽状态
        setIsDraggingTab(false);
        setDraggingTabId(null);
        setDragDistance(0);
        setDragStartX(null);
        setDragStartY(null);
        
        // 移除拖拽样式
        document.body.classList.remove('dragging');
        
        console.log('拖拽状态已完全清理');
      };

      // 注册事件处理器
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });

      // 保存清理函数，以便组件卸载时使用
      window.__handleDragMouseMove = handleMouseMove;
      window.__handleDragMouseUp = handleMouseUp;
    }
  };

  // 修改添加按钮点击处理函数，修复点击事件不触发问题
  const handleAddButtonClick = (e: React.MouseEvent) => {
    console.log('添加按钮被点击，即将打开菜单');

    // 立即阻止事件冒泡和默认行为，防止触发拖拽
    e.stopPropagation();
    e.preventDefault();

    // 记录当前的菜单状态
    console.log('当前菜单状态:', showAddMenu ? '显示' : '隐藏');

    // 清除任何可能存在的拖拽状态
    document.body.classList.remove('dragging');

    // 直接切换菜单状态，不使用setTimeout
    setShowAddMenu(!showAddMenu);
    console.log('已切换菜单状态:', !showAddMenu ? '显示' : '隐藏');

    // 如果要打开菜单，确保页面上没有残留的拖拽状态
    if (!showAddMenu) {
      // 清除所有可能的拖拽提示和样式
      document.querySelectorAll('.tab-drag-indicator, .drop-indicator').forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });

      document.querySelectorAll('.plugin-drag-over, .tab-container-hover').forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('plugin-drag-over');
          el.classList.remove('tab-container-hover');
        }
      });
    }
  };

  // 防止点击按钮时触发拖拽
  const handleButtonMouseDown = (e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  };

  // 修改添加菜单的显示状态变化监听
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

          // 获取按钮和菜单的位置
          const addButton = document.querySelector('.add-button');
          if (!addButton) return;

          const buttonRect = addButton.getBoundingClientRect();
          const menuRect = menuElement.getBoundingClientRect();

          // 获取视口高度和可用空间
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;

          console.log('菜单定位信息:', {
            buttonTop: buttonRect.top,
            buttonBottom: buttonRect.bottom,
            menuHeight: menuRect.height,
            viewportHeight,
            spaceBelow,
            spaceAbove
          });

          // 重置之前可能应用的样式
          menuElement.style.top = '';
          menuElement.style.bottom = '';
          menuElement.style.left = '';
          menuElement.style.right = '';
          menuElement.style.maxHeight = '';
          menuElement.style.marginTop = '';
          menuElement.style.marginBottom = '';

          // 移除可能的位置类名
          menuElement.classList.remove('menu-position-top', 'menu-position-bottom');

          // 检查下方空间是否足够显示菜单
          if (spaceBelow < Math.min(menuRect.height, 300) && spaceAbove > spaceBelow) {
            // 下方空间不足且上方空间更大，显示在上方
            console.log('菜单将显示在按钮上方');
            menuElement.classList.add('menu-position-top');

            // 限制最大高度以适应上方可用空间
            const maxHeightAbove = spaceAbove - 10; // 保留10px边距
            menuElement.style.maxHeight = `${maxHeightAbove}px`;
          } else {
            // 显示在下方
            console.log('菜单将显示在按钮下方');
            menuElement.classList.add('menu-position-bottom');

            // 限制最大高度以适应下方可用空间
            const maxHeightBelow = spaceBelow - 10; // 保留10px边距
            menuElement.style.maxHeight = `${maxHeightBelow}px`;
          }

          // 检查水平位置是否会超出视口
          const menuWidth = menuRect.width;
          const viewportWidth = window.innerWidth;

          if (buttonRect.left + menuWidth > viewportWidth) {
            // 右侧空间不足，向右对齐
            menuElement.style.right = '0';
            menuElement.style.left = 'auto';
          } else {
            // 右侧空间足够，向左对齐
            menuElement.style.left = '0';
            menuElement.style.right = 'auto';
          }

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
          console.log(`找到 ${menuItems.length} 个菜单项`);

          menuItems.forEach(item => {
            item.style.pointerEvents = 'auto';
            item.style.width = '100%';
            item.style.textAlign = 'left';
            item.style.padding = '6px 12px';
            item.style.margin = '2px 0';
            item.style.display = 'block';

            // 确保点击事件可以正常触发
            const oldClickHandler = item.onclick;
            item.onclick = (e) => {
              console.log('菜单项被点击:', item.textContent);
              e.stopPropagation();

              // 延迟调用原始点击处理函数，确保事件不被干扰
              setTimeout(() => {
                if (oldClickHandler) {
                  oldClickHandler.call(item, e);
                }
              }, 0);
            };
          });
        }
      }, 0);

      // 修复：点击外部关闭添加菜单
      const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
          console.log('点击外部区域，关闭菜单');
          setShowAddMenu(false);
        }
      };

      // 使用捕获阶段确保最先处理
      document.addEventListener('mousedown', handleClickOutside, true);

      // 添加窗口大小变化监听，重新调整菜单位置
      const handleResize = () => {
        if (addMenuRef.current) {
          // 获取按钮位置
          const addButton = document.querySelector('.add-button');
          if (!addButton) return;

          const buttonRect = addButton.getBoundingClientRect();
          const menuElement = addMenuRef.current;
          const menuRect = menuElement.getBoundingClientRect();

          // 获取视口高度和可用空间
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - buttonRect.bottom;
          const spaceAbove = buttonRect.top;

          // 重新判断菜单位置
          menuElement.classList.remove('menu-position-top', 'menu-position-bottom');

          if (spaceBelow < Math.min(menuRect.height, 300) && spaceAbove > spaceBelow) {
            menuElement.classList.add('menu-position-top');
            const maxHeightAbove = spaceAbove - 10;
            menuElement.style.maxHeight = `${maxHeightAbove}px`;
          } else {
            menuElement.classList.add('menu-position-bottom');
            const maxHeightBelow = spaceBelow - 10;
            menuElement.style.maxHeight = `${maxHeightBelow}px`;
          }
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showAddMenu]);

  // 彻底重写添加插件函数，使用最直接的方式
  const handleAddPlugin = (pluginId: string) => {
    if (!tabId) return;

    // 使用最新的 localPlugins 检查是否已存在
    if (localPlugins.includes(pluginId)) {
      console.log('插件已存在，不重复添加');
      return;
    }

    // 更新本地状态
    setLocalPlugins([...localPlugins, pluginId]);

    // 调用全局状态更新
    const store = useLayoutStore.getState();
    store.addPluginToTab(tabId, pluginId);

    // 更新可用插件列表
    setAvailablePlugins(prev =>
      prev.filter(plugin => plugin.id !== pluginId)
    );

    // 激活新标签
    setActiveTab(localPlugins.length); // 注意：localPlugins 还未更新，所以用 length 而不是 length+1
  };

  // 添加一个辅助函数，用于获取store中的实际插件状态
  const getStorePlugins = (tabContainerId: string) => {
    if (!tabContainerId) return [];

    const store = useLayoutStore.getState();
    const tabContainer = store.tabContainers.find(t => t.id === tabContainerId);
    return tabContainer?.plugins || [];
  };

  if (!plugins || plugins.length === 0) {
    return (
      <div className="plugin-container h-full flex flex-col overflow-hidden">
        {/* 标签页标题区 */}
        <div className="plugin-header flex items-center plugin-drag-handle flex-shrink-0">
          {/* 标签栏 */}
          <div
            ref={tabsContainerRef}
            className="tabs-container scrollbar-hide flex-1 overflow-x-auto flex items-center space-x-1 py-1 px-1"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* 添加标签按钮 */}
            <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
              <button
                className="plugin-tab flex-shrink-0 inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 cursor-pointer text-sm non-draggable add-button"
                onClick={handleAddButtonClick}
                onMouseDown={handleButtonMouseDown}
                title="添加标签"
                data-no-drag="true"
                aria-label="添加"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 9999,
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* 添加标签菜单 */}
              {showAddMenu && (
                <div
                  ref={addMenuRef}
                  className="absolute left-0 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-50 non-draggable add-plugin-menu"
                  data-role="add-plugin-menu"
                  data-no-drag="true"
                  style={{
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    zIndex: 9999,
                    pointerEvents: 'auto',
                    overflowY: 'auto',
                    width: '200px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">添加插件</h3>
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
                              onClick={(e) => {
                                // 直接实现添加插件的逻辑，不调用handleAddPlugin
                                e.preventDefault();
                                e.stopPropagation();

                                console.log('添加插件菜单项点击:', plugin.id);

                                if (!tabId) {
                                  console.error('没有tabId，无法添加插件');
                                  return;
                                }

                                // 关闭菜单
                                setShowAddMenu(false);

                                try {
                                  // 获取store中当前的插件列表
                                  const currentStorePlugins = getStorePlugins(tabId);

                                  // 检查插件是否已存在于store或本地状态中，不重复添加
                                  if (currentStorePlugins.includes(plugin.id) || localPlugins.includes(plugin.id)) {
                                    console.log('插件已存在，不重复添加:', plugin.id);
                                    return;
                                  }

                                  // 向本地状态添加
                                  const newPlugins = [...localPlugins, plugin.id];
                                  setLocalPlugins(newPlugins);

                                  // 选中新标签
                                  setActiveTab(newPlugins.length - 1);

                                  // 调用store方法
                                  const layoutStore = useLayoutStore.getState();
                                  layoutStore.addPluginToTab(tabId, plugin.id);

                                  console.log('插件添加成功:', plugin.id);

                                  // 立即更新可用插件列表，确保新添加的插件不再显示
                                  setTimeout(() => updateAvailablePlugins(), 0);
                                } catch (err) {
                                  console.error('添加插件失败:', err);
                                }
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                margin: '2px 0',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                borderRadius: '4px'
                              }}
                            >
                              {plugin.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-2" data-no-drag="true">
                          没有可添加的插件
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 空状态提示 */}
        <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>点击上方 "+" 按钮添加插件</p>
          </div>
        </div>
      </div>
    );
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

  return (
    <div className="plugin-container h-full flex flex-col overflow-hidden">
      {/* 标签页标题区 */}
      <div className="plugin-header flex items-center plugin-drag-handle flex-shrink-0">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 标签栏 */}
        <div
          ref={tabsContainerRef}
          className="tabs-container scrollbar-hide flex-1 overflow-x-auto flex items-center space-x-1 py-1 px-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {localPlugins.map((pluginId, index) => {
            const isActive = activeTab === index;
            // 获取插件信息
            const plugin = pluginRegistry.get(pluginId);
            const tabName = plugin?.metadata.name || pluginId;

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
                  className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 non-draggable"
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发tab切换
                    handleRemoveTab(pluginId, index);
                  }}
                  title="移除标签"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* 添加标签按钮 */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              className="plugin-tab flex-shrink-0 inline-flex items-center rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 cursor-pointer text-sm non-draggable add-button"
              onClick={handleAddButtonClick}
              onMouseDown={handleButtonMouseDown}
              title="添加标签"
              data-no-drag="true"
              aria-label="添加"
              style={{
                pointerEvents: 'auto',
                zIndex: 9999,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* 添加标签菜单 */}
            {showAddMenu && (
              <div
                ref={addMenuRef}
                className="absolute left-0 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-50 non-draggable add-plugin-menu"
                data-role="add-plugin-menu"
                data-no-drag="true"
                style={{
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1,
                  zIndex: 9999,
                  pointerEvents: 'auto',
                  overflowY: 'auto',
                  width: '200px'
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">添加插件</h3>
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
                            onClick={(e) => {
                              // 直接实现添加插件的逻辑，不调用handleAddPlugin
                              e.preventDefault();
                              e.stopPropagation();

                              console.log('添加插件菜单项点击:', plugin.id);

                              if (!tabId) {
                                console.error('没有tabId，无法添加插件');
                                return;
                              }

                              // 关闭菜单
                              setShowAddMenu(false);

                              try {
                                // 获取store中当前的插件列表
                                const currentStorePlugins = getStorePlugins(tabId);

                                // 检查插件是否已存在于store或本地状态中，不重复添加
                                if (currentStorePlugins.includes(plugin.id) || localPlugins.includes(plugin.id)) {
                                  console.log('插件已存在，不重复添加:', plugin.id);
                                  return;
                                }

                                // 向本地状态添加
                                const newPlugins = [...localPlugins, plugin.id];
                                setLocalPlugins(newPlugins);

                                // 选中新标签
                                setActiveTab(newPlugins.length - 1);

                                // 调用store方法
                                const layoutStore = useLayoutStore.getState();
                                layoutStore.addPluginToTab(tabId, plugin.id);

                                console.log('插件添加成功:', plugin.id);

                                // 立即更新可用插件列表，确保新添加的插件不再显示
                                setTimeout(() => updateAvailablePlugins(), 0);
                              } catch (err) {
                                console.error('添加插件失败:', err);
                              }
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 12px',
                              margin: '2px 0',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              borderRadius: '4px'
                            }}
                          >
                            {plugin.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-2" data-no-drag="true">
                        没有可添加的插件
                      </div>
                    )}
                  </div>
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
            className={`flex-shrink-0 p-1 rounded-full non-draggable ${canScrollRight
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