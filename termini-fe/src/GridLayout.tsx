import { useState, useEffect, useRef } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useLayoutStore } from '../store/layoutStore';
import { ensurePluginsLoaded, pluginRegistry } from '../plugins/registry';
import PluginContainer from './PluginContainer';
import TabContainer from './TabContainer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// 添加TypeScript类型声明扩展，支持全局Window属性
declare global {
  interface Window {
    __draggedPluginInfo?: {
      pluginId: string;
      tabId: string;
      startTime: number;
      confirmedDragTime?: number;
    };
    __draggedPluginPosition?: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    __gridParams?: {
      rect: DOMRect;
      rowHeight: number;
      margin: number;
      cols: number;
      colWidth: number;
    };
    __handleDragMouseMove?: (e: MouseEvent) => void;
    __handleDragMouseUp?: (e: MouseEvent) => void;
    __isPotentialDrag?: boolean;
    __lastDragCheck?: number;
    // 添加强制清理函数类型声明
    forceCleanupDragIndicators?: () => void;
    __recentlyRemovedPlugins?: {
      [pluginId: string]: number;
    };
  }
}

const ReactGridLayout = WidthProvider(RGL);

// 在组件的顶部添加一些类型定义
type TabContainer = {
  id: string;
  plugins: string[];
};

export default function GridLayout() {
  const { 
    layout, 
    updateLayout, 
    activePlugins,
    tabContainers,
    removePlugin,
    createTabContainer,
    initDefaultLayout,
    resetStore
  } = useLayoutStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [cols, setCols] = useState(12);
  const [rowHeight, setRowHeight] = useState(30);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 100); // 减去头部高度
  const gridRef = useRef<HTMLDivElement>(null);
  
  // 添加forceUpdate状态，用于在标签容器合并后强制刷新UI
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // 添加全局真实拖拽状态标记
  const [isRealDragging, setIsRealDragging] = useState(false);
  const dragStateRef = useRef(false);
  
  // 将拖拽状态同步到ref，以便在事件处理器中访问最新值
  useEffect(() => {
    dragStateRef.current = isRealDragging;
  }, [isRealDragging]);
  
  // 设置拖拽状态的函数
  const setDragState = (isDragging: boolean) => {
    console.log(`设置全局拖拽状态: ${isDragging ? 'dragging' : 'not dragging'}`);
    setIsRealDragging(isDragging);
    
    if (isDragging) {
      document.body.classList.add('dragging');
      // 保存拖拽开始时间
      (window as any).__dragStartTime = Date.now();
    } else {
      document.body.classList.remove('dragging');
      delete (window as any).__dragStartTime;
      
      // 清理所有提示元素
      setTimeout(() => {
        removeAllDragIndicators();
      }, 50);
    }
  };
  
  // 添加DOM监听器，确保所有情况下都能移除拖拽提示
  useEffect(() => {
    // 创建MutationObserver监听DOM变化，自动移除拖拽提示元素
    const observer = new MutationObserver((mutations) => {
      // 当拖拽结束后，检查并移除所有提示元素
      if (!document.body.classList.contains('dragging')) {
        const dragIndicators = document.querySelectorAll('.tab-drag-indicator');
        if (dragIndicators.length > 0) {
          console.log('自动清理发现残留的拖拽提示元素:', dragIndicators.length);
          dragIndicators.forEach(indicator => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          });
        }
      }
      
      // 检测是否有提示元素被添加，但当前不是真正的拖拽状态
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查是否添加了拖拽提示元素
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement && 
                (node.classList.contains('tab-drag-indicator') || 
                 node.classList.contains('drop-indicator'))) {
              // 如果不是真正的拖拽状态，立即移除该元素
              if (!dragStateRef.current) {
                console.log('检测到提示元素添加，但不处于真正拖拽状态，移除:', node);
                if (node.parentNode) {
                  node.parentNode.removeChild(node);
                }
              }
            }
          });
        }
      }
    });
    
    // 监听整个document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    // 添加一个定时器定期检查和清理
    const cleanupInterval = setInterval(() => {
      if (!dragStateRef.current) {
        const dragIndicators = document.querySelectorAll('.tab-drag-indicator, .drop-indicator');
        if (dragIndicators.length > 0) {
          console.log('定时清理发现残留的拖拽提示元素:', dragIndicators.length);
          dragIndicators.forEach(indicator => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          });
        }
      }
    }, 1000);
    
    // 添加防锁定机制，如果拖拽状态持续超过10秒，强制重置
    const dragTimeoutCheck = setInterval(() => {
      const dragStartTime = (window as any).__dragStartTime;
      if (dragStartTime && Date.now() - dragStartTime > 10000) {
        console.log('警告: 拖拽状态持续超过10秒，强制重置');
        setDragState(false);
        forceCleanupDragIndicators();
      }
    }, 2000);
    
    return () => {
      observer.disconnect();
      clearInterval(cleanupInterval);
      clearInterval(dragTimeoutCheck);
    };
  }, []);
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      // 更新容器高度
      setContainerHeight(window.innerHeight - 100);
      
      // 根据窗口宽度调整列数
      const width = window.innerWidth;
      if (width < 768) {
        setCols(4); // 移动设备
        setRowHeight(25);
      } else if (width < 1280) {
        setCols(8); // 平板
        setRowHeight(28);
      } else {
        setCols(12); // 桌面
        setRowHeight(30);
      }
    };
    
    // 初始调用一次
    handleResize();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
    
    // 清理监听
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const handleLayoutChange = (newLayout: Layout[]) => {
    // 检查是否是因为插件被移除导致的布局变化
    if (newLayout.length < layout.length) {
      // 如果是插件被移除，不主动更新store中的布局
      // 这是因为removePlugin操作已经更新了布局
      return;
    }
    
    // 否则正常更新布局
    updateLayout(newLayout);
    
    // 确保布局变更后自动保存到当前布局
    const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
    if (currentLayoutId) {
      // 如果有当前布局，则自动更新
      console.log('布局变更，自动更新当前布局:', currentLayoutId);
      setTimeout(() => saveCurrentLayout(), 100);
    }
  };
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [draggedPluginId, setDraggedPluginId] = useState<string | null>(null);
  const [draggedTabPluginId, setDraggedTabPluginId] = useState<string | null>(null); // 从Tab拖出的插件ID
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null); // 所属的Tab容器ID
  const [dragOverPluginId, setDragOverPluginId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverTimeout, setDragOverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // 添加状态来跟踪插件拖拽预览
  const [previewPosition, setPreviewPosition] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  
  // 首次加载时强制重置并初始化默认插件
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        if (!isInitialized) {
          console.log('正在初始化布局...');
          
          // 确保插件已加载
          await ensurePluginsLoaded();
          console.log('插件已加载完成');
          
          // 先重置存储，清除可能的旧缓存状态
          resetStore();
          console.log('存储已重置');
          
          // 然后初始化默认布局
          initDefaultLayout();
          console.log('默认布局已初始化');
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, [initDefaultLayout, resetStore, isInitialized]);
  
  useEffect(() => {
    // 添加CSS规则处理非拖拽区域和拖拽视觉提示
    const style = document.createElement('style');
    style.innerHTML = `
      .non-draggable {
        pointer-events: auto !important;
        z-index: 10;
      }
      .react-grid-item > .react-resizable-handle {
        z-index: 3;
      }
      
      /* 确保所有拖拽样式和提示只在body.dragging时显示 */
      .plugin-drag-over {
        display: none;
      }
      body.dragging .plugin-drag-over {
        display: block;
        border: 3px dashed #3498db !important;
        background-color: rgba(52, 152, 219, 0.1);
        transition: all 0.2s ease-in-out;
        transform: scale(1.01);
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
      }
      
      .plugin-draggable::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: transparent;
        cursor: move;
      }
      .tab-drag-handle {
        cursor: move;
      }
      .plugin-drag-handle {
        cursor: move !important; /* 确保拖拽句柄鼠标样式 */
      }
      
      /* 所有提示元素强制隐藏，除非符合下面的指定条件 */
      .tab-drag-indicator,
      .drop-indicator {
        display: none !important;
      }
      
      /* 只在拖拽过程中显示提示，且仅限父元素有正确的悬停类时 */
      body.dragging .plugin-drag-over .tab-drag-indicator,
      body.dragging .tab-container-hover .tab-drag-indicator,
      body.dragging .tab-container-droppable .drop-indicator {
        display: flex !important;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.7);
        justify-content: center;
        align-items: center;
        font-size: 18px;
        color: #3498db;
        z-index: 100;
        pointer-events: none;
      }
      
      /* 确保所有提示元素在拖拽结束时立即隐藏 */
      body:not(.dragging) .tab-drag-indicator,
      body:not(.dragging) .drop-indicator {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      /* 标签容器悬停样式 - 修改为只在拖拽过程中生效 */
      [data-item-id^="tab-container-"] {
        transition: all 0.2s ease;
      }
      body.dragging [data-item-id^="tab-container-"].plugin-drag-over {
        background-color: rgba(39, 174, 96, 0.3) !important;
        border: 3px dashed #27ae60 !important;
        transform: scale(1.03);
        box-shadow: 0 0 20px rgba(39, 174, 96, 0.5);
      }
      /* 添加标签容器悬停高亮样式 - 只在拖拽过程中生效 */
      body.dragging [data-item-id^="tab-container-"].tab-container-hover {
        background-color: rgba(39, 174, 96, 0.2);
        border: 3px dashed #27ae60 !important;
        transform: scale(1.02);
        box-shadow: 0 0 15px rgba(39, 174, 96, 0.4);
        transition: all 0.2s ease;
      }
      /* 标签容器成功放置后的高亮样式 */
      [data-item-id^="tab-container-"].tab-drop-highlight {
        background-color: rgba(39, 174, 96, 0.5) !important;
        border: 3px solid #27ae60 !important;
        transition: all 0.5s ease;
        box-shadow: 0 0 25px rgba(39, 174, 96, 0.6);
      }
      /* 标签容器中的拖放指示器样式 */
      body.dragging [data-item-id^="tab-container-"] .tab-drag-indicator {
        display: block;
        background-color: rgba(39, 174, 96, 0.85);
        color: white;
        font-weight: bold;
        text-align: center !important;
        pointer-events: none;
      }
      /* 禁止拖拽时文本选择 */
      body.dragging {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        cursor: grabbing !important;
      }
      /* 拖拽预览元素样式 */
      .plugin-drag-preview {
        position: fixed;
        z-index: 1000;
        pointer-events: none;
        opacity: 0.8;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        transform-origin: center center;
        background-color: rgba(52, 152, 219, 0.5);
        border: 2px dashed #3498db;
        color: white;
        font-weight: bold;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        width: 150px;
        height: 60px;
        font-size: 14px;
      }
      /* 确保暗色模式下拖拽指示器具有足够的对比度 */
      .dark .plugin-drag-over {
        border: 3px dashed #60a5fa !important;
        background-color: rgba(37, 99, 235, 0.2);
      }
      .dark .tab-container-hover {
        border: 3px dashed #4ade80 !important;
        background-color: rgba(16, 185, 129, 0.2);
      }
      .dark .tab-drop-highlight {
        border: 3px solid #4ade80 !important;
        background-color: rgba(16, 185, 129, 0.3);
      }
      /* 确保网格项在暗色模式下有正确的指针事件 */
      .react-grid-item {
        pointer-events: auto;
        z-index: 1;
      }
      /* 确保拖拽句柄工作正常 */
      .plugin-header {
        cursor: move;
        user-select: none;
      }
      /* 确保可拖拽区域正确显示 */
      .react-draggable-dragging {
        z-index: 100;
        cursor: move !important;
      }
      /* 防止点击事件穿透 */
      .plugin-content {
        pointer-events: auto;
      }
      /* 确保tabs-container内部的标签可以正确拖拽 */
      .tabs-container .plugin-tab {
        pointer-events: auto;
      }
      /* 当拖拽到标签容器上时的提示文本样式 */
      body.dragging .tab-drag-indicator {
        display: block;
        font-size: 16px !important;
        font-weight: bold !important;
        text-align: center !important;
        background-color: rgba(39, 174, 96, 0.85) !important;
        color: white !important;
        padding: 10px 15px !important;
        border-radius: 5px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        z-index: 9999 !important;
      }
      /* 成功指示器样式 */
      .drop-success-indicator {
        font-size: 16px !important;
        font-weight: bold !important;
        text-align: center !important;
        background-color: rgba(39, 174, 96, 0.9) !important;
        color: white !important;
        padding: 10px 15px !important;
        border-radius: 5px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
        z-index: 9999 !important;
        pointer-events: none;
      }
      /* 拖拽标签容器样式 */
      .react-grid-item.react-draggable-dragging[data-item-id^="tab-container-"] {
        z-index: 1000 !important;
        box-shadow: 0 0 25px rgba(59, 130, 246, 0.6) !important;
        opacity: 0.9;
        transform: scale(1.02);
        transition: all 0.2s ease;
      }
      
      /* 拖拽标签容器到另一个标签容器时的目标容器样式 - 修改为只在拖拽时生效 */
      body.dragging .tab-container-droppable.plugin-drag-over {
        box-shadow: 0 0 30px rgba(39, 174, 96, 0.7) !important;
        transform: scale(1.03);
        transition: all 0.2s ease;
        border: 2px dashed rgba(39, 174, 96, 0.8) !important;
        animation: container-pulse 1.5s infinite alternate;
      }
      
      /* 拖拽提示指示器样式 */
      body.dragging .tab-drag-indicator {
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(39, 174, 96, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        pointer-events: none;
        animation: pulse 1.5s infinite alternate;
      }
      
      /* 增加明显的下拉箭头指示器 - 只在拖拽时显示 */
      body.dragging .tab-container-droppable.plugin-drag-over::after {
        content: '⬇';
        position: absolute;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 24px;
        color: rgba(39, 174, 96, 1);
        animation: bounce 0.8s infinite alternate;
        text-shadow: 0 0 10px white;
      }
      
      @keyframes bounce {
        0% {
          transform: translateX(-50%) translateY(0);
        }
        100% {
          transform: translateX(-50%) translateY(-10px);
        }
      }
      
      @keyframes container-pulse {
        0% {
          box-shadow: 0 0 20px rgba(39, 174, 96, 0.5);
        }
        100% {
          box-shadow: 0 0 40px rgba(39, 174, 96, 0.8);
        }
      }
      
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          transform: translate(-50%, -50%) scale(1.05);
        }
      }
      
      /* 合并成功后的动画效果 */
      .merge-success {
        animation: success-flash 1s ease;
      }
      
      @keyframes success-flash {
        0% {
          background-color: rgba(39, 174, 96, 0.8);
        }
        50% {
          background-color: rgba(39, 174, 96, 0.3);
        }
        100% {
          background-color: transparent;
        }
      }
    `;
    document.head.appendChild(style);
    
    // 调试日志
    console.log('当前布局:', layout);
    console.log('布局元素数量:', layout.length);
    console.log('标签容器:', tabContainers);
    
    // 添加全局快捷键ctrl+alt+c清除所有拖拽提示元素
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'c') {
        console.log('手动清理拖拽提示元素');
        forceCleanupDragIndicators();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // 添加一个加强版的全局清理函数
    window.forceCleanupDragIndicators = forceCleanupDragIndicators;
    
    return () => {
      document.head.removeChild(style);
      document.removeEventListener('keydown', handleKeyDown);
      delete window.forceCleanupDragIndicators;
    };
  }, [layout, tabContainers, forceUpdate]);
  
  const handleRemovePlugin = (pluginId: string) => {
    console.log('GridLayout: 移除插件', pluginId);
    removePlugin(pluginId);
  };
  
  // 检测是否拖动到另一个插件上方
  const checkDragOverPlugin = (e: MouseEvent) => {
    // 如果没有拖拽状态或不在拖拽过程中，直接返回
    if (!draggedPluginId || !gridRef.current || !document.body.classList.contains('dragging') || !dragStateRef.current) {
      // 如果不在拖拽中，清除所有相关提示和状态
      if (!document.body.classList.contains('dragging') || !dragStateRef.current) {
        // 删除所有提示元素
        document.querySelectorAll('.tab-drag-indicator').forEach(indicator => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
        });
        
        // 删除所有高亮样式
        document.querySelectorAll('.plugin-drag-over, .tab-container-hover').forEach(item => {
          if (item instanceof HTMLElement) {
            item.classList.remove('plugin-drag-over');
            item.classList.remove('tab-container-hover');
            item.style.transform = '';
            item.style.boxShadow = '';
          }
        });
      }
      return;
    }
    
    // 性能优化：添加节流
    if ((window as any).__lastDragCheck && Date.now() - (window as any).__lastDragCheck < 30) {
      return; // 限制检查频率
    }
    (window as any).__lastDragCheck = Date.now();
    
    // 记录鼠标位置，便于调试
    console.log('检查拖拽悬停，位置:', {x: e.clientX, y: e.clientY}, '拖拽ID:', draggedPluginId);
    
    // 获取鼠标位置下的元素
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    let foundTarget = false;
    
    // 特殊处理标签容器到标签容器的拖拽
    // 对于标签容器的拖拽，我们增大检测半径，使其更容易被拖入
    if (draggedPluginId.startsWith('tab-container-')) {
      // 获取所有的标签容器
      const allTabContainers = document.querySelectorAll('[data-item-id^="tab-container-"]');
      
      allTabContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          const containerId = container.getAttribute('data-item-id');
          
          // 确保不是拖到自己身上
          if (containerId && containerId !== draggedPluginId) {
            const rect = container.getBoundingClientRect();
            
            // 扩大检测范围，增加边缘检测的容忍度
            const expandedRect = {
              left: rect.left - 40,
              right: rect.right + 40,
              top: rect.top - 40,
              bottom: rect.bottom + 40
            };
            
            // 检查鼠标是否在扩大的检测范围内
            if (
              e.clientX >= expandedRect.left &&
              e.clientX <= expandedRect.right &&
              e.clientY >= expandedRect.top &&
              e.clientY <= expandedRect.bottom
            ) {
              // 鼠标在扩大的检测范围内，标记为找到目标
              foundTarget = true;
              setDragOverPluginId(containerId);
              setIsDragOver(true);
              
              // 高亮目标容器
              const allItems = document.querySelectorAll('.react-grid-item');
              allItems.forEach(item => {
                if (item instanceof HTMLElement) {
                  item.classList.remove('plugin-drag-over');
                  const oldIndicator = item.querySelector('.tab-drag-indicator');
                  if (oldIndicator) oldIndicator.remove();
                }
              });
              
              container.classList.add('plugin-drag-over');
              
              // 清除可能已经存在的提示元素
              const existingIndicator = document.getElementById(`indicator-${containerId}`);
              if (existingIndicator) {
                existingIndicator.remove();
              }
              
              // 创建提示元素
              const indicator = document.createElement('div');
              indicator.className = 'tab-drag-indicator';
              indicator.id = `indicator-${containerId}`; // 添加唯一ID便于后续清理
              indicator.textContent = '拖放这里合并两个标签容器';
              indicator.setAttribute('data-drag-state', 'active');
              indicator.style.pointerEvents = 'none';
              indicator.style.position = 'absolute';
              indicator.style.top = '50%';
              indicator.style.left = '50%';
              indicator.style.transform = 'translate(-50%, -50%)';
              indicator.style.backgroundColor = 'rgba(39, 174, 96, 0.8)';
              indicator.style.color = 'white';
              indicator.style.padding = '10px 15px';
              indicator.style.borderRadius = '5px';
              indicator.style.fontSize = '16px';
              indicator.style.fontWeight = 'bold';
              indicator.style.zIndex = '9999';
              indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              
              // 先移除可能存在的旧提示
              const oldIndicator = container.querySelector('.tab-drag-indicator');
              if (oldIndicator) oldIndicator.remove();
              
              container.appendChild(indicator);
              
              // 添加一个强烈的视觉反馈，以便用户知道可以拖放
              container.style.transform = 'scale(1.03)';
              container.style.boxShadow = '0 0 25px rgba(39, 174, 96, 0.7)';
              container.style.transition = 'all 0.2s ease';
              
              // 清除旧的延时器
              if (dragOverTimeout) {
                clearTimeout(dragOverTimeout);
                setDragOverTimeout(null);
              }
              
              // 找到目标后立即返回
              return;
            }
          }
        }
      });
      
      // 如果在扩展的检测中已经找到了目标，则不继续常规检测
      if (foundTarget) {
        return;
      }
    }
    
    // 查找是否拖动到了其他插件上
    for (const element of elementsAtPoint) {
      // 首先尝试查找标签容器目标
      const tabContainer = element.closest('[data-item-id^="tab-container-"]');
      if (tabContainer && tabContainer instanceof HTMLElement) {
        const tabId = tabContainer.getAttribute('data-item-id');
        // 确保不是拖到自己身上
        if (tabId && tabId !== draggedPluginId) {
          console.log('拖动到标签容器上:', tabId);
          foundTarget = true;
          setDragOverPluginId(tabId);
          setIsDragOver(true);
          
          // 高亮目标容器
          const allItems = document.querySelectorAll('.react-grid-item');
          allItems.forEach(item => {
            if (item instanceof HTMLElement) {
              item.classList.remove('plugin-drag-over');
              const oldIndicator = item.querySelector('.tab-drag-indicator');
              if (oldIndicator) oldIndicator.remove();
            }
          });
          
          tabContainer.classList.add('plugin-drag-over');
          
          // 清除可能已经存在的提示元素
          const existingIndicator = document.getElementById(`indicator-${tabId}`);
          if (existingIndicator) {
            existingIndicator.remove();
          }
          
          // 确定提示文本内容 - 根据是否是标签容器
          let indicatorText = '拖放这里添加到标签页';
          if (draggedPluginId.startsWith('tab-container-')) {
            indicatorText = '拖放这里合并两个标签页';
          }
          
          // 创建提示元素
          const indicator = document.createElement('div');
          indicator.className = 'tab-drag-indicator';
          indicator.id = `indicator-${tabId}`; // 添加唯一ID便于后续清理
          indicator.textContent = indicatorText;
          indicator.setAttribute('data-drag-state', 'active');
          indicator.style.pointerEvents = 'none';
          indicator.style.position = 'absolute';
          indicator.style.top = '50%';
          indicator.style.left = '50%';
          indicator.style.transform = 'translate(-50%, -50%)';
          indicator.style.backgroundColor = 'rgba(39, 174, 96, 0.8)';
          indicator.style.color = 'white';
          indicator.style.padding = '10px 15px';
          indicator.style.borderRadius = '5px';
          indicator.style.fontSize = '16px';
          indicator.style.fontWeight = 'bold';
          indicator.style.zIndex = '9999';
          indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
          
          tabContainer.appendChild(indicator);
          
          // 清除旧的延时器
          if (dragOverTimeout) {
            clearTimeout(dragOverTimeout);
            setDragOverTimeout(null);
          }
          
          return; // 找到标签容器目标后立即退出
        }
      }
      
      // 如果没找到标签容器，再查找普通插件
      const gridItem = element.closest('.react-grid-item');
      if (gridItem && gridItem instanceof HTMLElement) {
        const itemId = gridItem.getAttribute('data-item-id');
        
        // 检查两种情况:
        // 1. 拖动到普通插件上 - 创建标签容器
        // 2. 拖动到标签容器上 - 添加到现有标签容器
        if (itemId && itemId !== draggedPluginId) {
          foundTarget = true;
          
          // 处理拖动到标签容器的情况
          if (itemId.startsWith('tab-container-')) {
            console.log('拖拽悬停在标签容器上:', itemId);
            setDragOverPluginId(itemId);
            setIsDragOver(true);
            
            // 高亮目标容器
            const allItems = document.querySelectorAll('.react-grid-item');
            allItems.forEach(item => {
              if (item instanceof HTMLElement) {
                item.classList.remove('plugin-drag-over');
                const oldIndicator = item.querySelector('.tab-drag-indicator');
                if (oldIndicator) oldIndicator.remove();
              }
            });
            
            gridItem.classList.add('plugin-drag-over');
            
            // 清除可能已经存在的提示元素
            const existingIndicator = document.getElementById(`indicator-${itemId}`);
            if (existingIndicator) {
              existingIndicator.remove();
            }
            
            // 确定提示文本内容 - 根据是否是标签容器
            let indicatorText = '拖放这里添加到标签页';
            if (draggedPluginId.startsWith('tab-container-')) {
              indicatorText = '拖放这里合并两个标签页';
            }
            
            // 创建提示元素
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            indicator.id = `indicator-${itemId}`; // 添加唯一ID便于后续清理
            indicator.textContent = indicatorText;
            indicator.setAttribute('data-drag-state', 'active');
            indicator.style.pointerEvents = 'none';
            
            gridItem.appendChild(indicator);
            
            // 清除旧的延时器
            if (dragOverTimeout) {
              clearTimeout(dragOverTimeout);
              setDragOverTimeout(null);
            }
            
            return; // 找到标签容器目标后立即退出循环
          } 
          // 拖动到普通插件 - 创建新的标签容器
          else if (!itemId.startsWith('tab-container-')) {
            // 如果是新的目标插件
            console.log('拖拽悬停在普通插件上:', itemId);
            setDragOverPluginId(itemId);
            setIsDragOver(true);
            
            // 高亮目标插件
            const allItems = document.querySelectorAll('.react-grid-item');
            allItems.forEach(item => {
              if (item instanceof HTMLElement) {
                item.classList.remove('plugin-drag-over');
                // 删除可能的旧指示器
                const oldIndicator = item.querySelector('.tab-drag-indicator');
                if (oldIndicator) oldIndicator.remove();
              }
            });
            
            gridItem.classList.add('plugin-drag-over');
            
            // 清除可能已经存在的提示元素
            const existingIndicator = document.getElementById(`indicator-${itemId}`);
            if (existingIndicator) {
              existingIndicator.remove();
            }
            
            // 创建提示元素
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            indicator.id = `indicator-${itemId}`; // 添加唯一ID便于后续清理
            indicator.textContent = '拖放这里合并为标签页';
            indicator.setAttribute('data-drag-state', 'active');
            indicator.style.pointerEvents = 'none'; // 确保不阻挡事件
            
            gridItem.appendChild(indicator);
            
            // 清除旧的延时器
            if (dragOverTimeout) {
              clearTimeout(dragOverTimeout);
              setDragOverTimeout(null);
            }
            
            return; // 找到目标后立即退出循环
          }
        }
      }
    }
    
    // 如果没有找到合适的目标，清除状态
    if (!foundTarget && isDragOver) {
      console.log('离开拖拽目标区域');
      setDragOverPluginId(null);
      setIsDragOver(false);
      
      // 删除所有提示元素和高亮
      const allItems = document.querySelectorAll('.react-grid-item');
      allItems.forEach(item => {
        if (item instanceof HTMLElement) {
          item.classList.remove('plugin-drag-over');
          item.style.transform = '';
          item.style.boxShadow = '';
          const indicator = item.querySelector('.tab-drag-indicator');
          if (indicator) indicator.remove();
        }
      });
      
      if (dragOverTimeout) {
        clearTimeout(dragOverTimeout);
        setDragOverTimeout(null);
      }
    }
  };

  // 监听鼠标移动以检测拖拽悬停
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedPluginId && document.body.classList.contains('dragging')) {
        checkDragOverPlugin(e);
      } else {
        // 如果不在拖拽中但有提示元素，清除它们
        const indicators = document.querySelectorAll('.tab-drag-indicator');
        if (indicators.length > 0) {
          indicators.forEach(indicator => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          });
        }
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // 添加鼠标抬起事件监听，确保即使鼠标抬起时不在组件上也能清理
    const handleMouseUp = () => {
      if (document.querySelectorAll('.tab-drag-indicator').length > 0) {
        console.log('鼠标抬起，清理所有拖拽提示');
        cleanupDragState();
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPluginId, dragOverPluginId, isDragOver]);
  
  // 设置网格项属性的函数，确保data-item-id属性正确设置
  const setGridItemAttributes = () => {
    setTimeout(() => {
      const gridItems = document.querySelectorAll('.react-grid-item');
      layout.forEach((item, index) => {
        if (index < gridItems.length) {
          const element = gridItems[index] as HTMLElement;
          if (element) {
            element.setAttribute('data-item-id', item.i);
            
            // 确保可拖拽区域有正确的样式
            const header = element.querySelector('.plugin-header');
            if (header) {
              header.classList.add('plugin-drag-handle');
            }
          }
        }
      });
    }, 100);
  };
  
  // 确保每个网格项都有data-item-id属性，这对拖拽识别很重要
  useEffect(() => {
    setGridItemAttributes();
    
    // 当布局变化时重新设置属性
    window.addEventListener('resize', setGridItemAttributes);
    
    // 确保拖拽功能正常的额外检查
    const checkDraggableElements = () => {
      const handles = document.querySelectorAll('.plugin-drag-handle');
      console.log(`找到 ${handles.length} 个拖拽句柄`);
      
      handles.forEach(handle => {
        if (handle instanceof HTMLElement) {
          handle.style.cursor = 'move';
        }
      });
    };
    
    // 延迟执行以确保DOM已更新
    setTimeout(checkDraggableElements, 500);
    
    return () => {
      window.removeEventListener('resize', setGridItemAttributes);
    };
  }, [layout]);

  // 从Tab中拖出插件
  const handleTabPluginDragStart = (pluginId: string) => {
    console.log('标签插件拖拽开始:', pluginId);
    
    // 记录拖拽的标签和插件
    setDraggedTabPluginId(pluginId);
    
    // 防止文本选择
    document.body.classList.add('dragging');
    
    // 保存全局拖拽信息，供其他组件访问
    window.__draggedPluginInfo = {
      pluginId,
      // 不需要tabId，因为我们是从标签中拖出
      tabId: "",
      startTime: Date.now()
    };
    
    // 创建拖拽预览元素
    let preview = document.getElementById('plugin-drag-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'plugin-drag-preview';
      preview.className = 'plugin-drag-preview';
      
      // 获取插件名称作为预览内容
      const pluginInfo = pluginRegistry.get(pluginId);
      const pluginName = pluginInfo?.metadata.name || pluginId.replace('official-', '');
      
      preview.innerHTML = `<div>${pluginName}</div>`;
      document.body.appendChild(preview);
    }
    
    // 获取当前鼠标位置
    const mouseMoveHandler = (e: MouseEvent) => {
      // 更新预览元素位置
      if (preview) {
        preview.style.left = `${e.clientX - 50}px`;
        preview.style.top = `${e.clientY - 20}px`;
      }
      
      // 检查是否拖动到了某个标签容器上
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      
      // 清除之前的高亮
      const allTabContainers = document.querySelectorAll('[data-item-id^="tab-container-"]');
      allTabContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.classList.remove('plugin-drag-over');
          container.classList.remove('tab-container-hover');
          
          // 移除所有提示元素
          const indicators = container.querySelectorAll('.tab-drag-indicator');
          indicators.forEach(ind => ind.remove());
        }
      });
      
      // 查找目标标签容器
      for (const element of elementsAtPoint) {
        const tabContainer = element.closest('[data-item-id^="tab-container-"]');
        if (tabContainer && tabContainer instanceof HTMLElement) {
          const containerId = tabContainer.getAttribute('data-item-id');
          if (containerId) {
            // 高亮显示目标容器
            tabContainer.classList.add('plugin-drag-over');
            tabContainer.classList.add('tab-container-hover');
            
            // 创建提示元素
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            indicator.textContent = '拖放到此标签组';
            indicator.style.position = 'absolute';
            indicator.style.top = '50%';
            indicator.style.left = '50%';
            indicator.style.transform = 'translate(-50%, -50%)';
            indicator.style.backgroundColor = 'rgba(39, 174, 96, 0.7)';
            indicator.style.padding = '10px';
            indicator.style.borderRadius = '4px';
            indicator.style.color = 'white';
            indicator.style.pointerEvents = 'none';
            indicator.style.zIndex = '1000';
            
            // 先移除可能存在的旧提示
            const oldIndicator = tabContainer.querySelector('.tab-drag-indicator');
            if (oldIndicator) oldIndicator.remove();
            
            tabContainer.appendChild(indicator);
            
            // 记录当前拖放目标
            setDragOverPluginId(containerId);
            setIsDragOver(true);
            
            break;
          }
        }
      }
    };
    
    // 处理鼠标释放
    const mouseUpHandler = (e: MouseEvent) => {
      // 移除监听器
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      
      // 移除拖拽标志
      document.body.classList.remove('dragging');
      delete window.__draggedPluginInfo;
      
      // 移除预览元素
      const preview = document.getElementById('plugin-drag-preview');
      if (preview && preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
      
      // 删除所有拖拽提示元素，无论在哪个容器中
      document.querySelectorAll('.tab-drag-indicator').forEach(indicator => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      });
      
      // 移除所有高亮样式
      document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .tab-container-droppable').forEach(item => {
        if (item instanceof HTMLElement) {
          item.classList.remove('plugin-drag-over');
          item.classList.remove('tab-container-hover');
          item.classList.remove('tab-container-droppable');
          item.style.transform = '';
          item.style.boxShadow = '';
        }
      });
      
      // 检查是否拖放到了某个标签容器上
      if (dragOverPluginId && isDragOver && draggedTabPluginId) {
        console.log('拖放插件到标签容器:', draggedTabPluginId, '->', dragOverPluginId);
        
        // 调用合并函数
        createTabContainer(draggedTabPluginId, dragOverPluginId);
        
        // 添加成功动画效果
        const targetContainer = document.querySelector(`[data-item-id="${dragOverPluginId}"]`);
        if (targetContainer instanceof HTMLElement) {
          targetContainer.classList.add('tab-drop-highlight');
          setTimeout(() => {
            targetContainer.classList.remove('tab-drop-highlight');
          }, 500);
        }
      }
      
      // 全面清理拖拽状态
      cleanupDragState();
      
      // 强制更新UI
      setTimeout(() => {
        setForceUpdate && setForceUpdate(prev => prev + 1);
      }, 100);
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };
  
  // 添加组件挂载时的初始化函数
  useEffect(() => {
    // 初始化函数
    const initializeGridLayout = () => {
      console.log('初始化GridLayout组件，设置拖拽区域...');
      
      // 确保所有网格项有正确的属性
      setGridItemAttributes();
      
      // 修复拖拽句柄
      const fixDragHandles = () => {
        // 为所有插件容器头部添加拖拽句柄类
        const headers = document.querySelectorAll('.plugin-header');
        headers.forEach(header => {
          if (header instanceof HTMLElement) {
            header.classList.add('plugin-drag-handle');
            header.style.cursor = 'move';
          }
        });
        
        // 禁止拖拽区域内的按钮触发拖拽
        const buttons = document.querySelectorAll('.plugin-header button');
        buttons.forEach(button => {
          if (button instanceof HTMLElement) {
            button.classList.add('non-draggable');
            button.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            });
          }
        });
      };
      
      // 执行修复
      fixDragHandles();
      
      // 延迟执行以确保DOM完全加载
      setTimeout(fixDragHandles, 500);
      setTimeout(fixDragHandles, 1000);
      
      // 添加全局鼠标事件处理，作为降级防护
      const handleGlobalMouseUp = () => {
        // 如果没有拖拽标志，但有提示元素，执行清理
        if (!document.body.classList.contains('dragging') && document.querySelectorAll('.tab-drag-indicator').length > 0) {
          console.log('全局鼠标抬起事件: 检测到提示元素但没有拖拽状态，执行清理');
          removeAllDragIndicators();
          forceCleanupDragIndicators();
        }
      };
      
      // 鼠标移动事件处理，当鼠标移出容器时，如果有残留提示，执行清理
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // 如果鼠标接近屏幕边缘且存在提示元素，或者离开了拖拽范围，清理提示
        if (
          (e.clientX < 10 || e.clientX > window.innerWidth - 10 || 
           e.clientY < 10 || e.clientY > window.innerHeight - 10) && 
          document.querySelectorAll('.tab-drag-indicator').length > 0
        ) {
          console.log('全局鼠标移动事件: 鼠标接近屏幕边缘，执行清理');
          removeAllDragIndicators();
        }
        
        // 检查鼠标是否已离开标有提示的元素
        const indicators = document.querySelectorAll('.tab-drag-indicator');
        indicators.forEach(indicator => {
          if (indicator.parentElement) {
            const rect = indicator.parentElement.getBoundingClientRect();
            if (
              e.clientX < rect.left - 100 || 
              e.clientX > rect.right + 100 || 
              e.clientY < rect.top - 100 || 
              e.clientY > rect.bottom + 100
            ) {
              // 鼠标已远离提示元素所在容器
              console.log('全局鼠标移动事件: 鼠标已远离提示元素所在容器');
              indicator.remove();
            }
          }
        });
      };
      
      document.body.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.addEventListener('mousemove', handleGlobalMouseMove);
      
      // 返回清理函数
      return () => {
        document.body.removeEventListener('mouseup', handleGlobalMouseUp);
        document.body.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    };
    
    // 执行初始化
    const cleanup = initializeGridLayout();
    
    // 监听布局变化，重新初始化拖拽区域
    const observer = new MutationObserver(() => {
      setGridItemAttributes();
      setTimeout(() => {
        const handles = document.querySelectorAll('.plugin-drag-handle');
        console.log(`发现${handles.length}个拖拽句柄`);
      }, 100);
    });
    
    if (gridRef.current) {
      observer.observe(gridRef.current, {
        childList: true,
        subtree: true
      });
    }
    
    return () => {
      observer.disconnect();
      cleanup && cleanup();
    };
  }, []);

  // 添加一个用于强制检测和删除所有悬浮提示的函数
  function removeAllDragIndicators() {
    // 查找所有提示元素
    const indicators = document.querySelectorAll('.tab-drag-indicator');
    if (indicators.length > 0) {
      console.log('强制清理: 发现', indicators.length, '个拖拽提示元素');
      indicators.forEach(indicator => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
          console.log('已移除拖拽提示元素:', indicator.id || '未知ID');
        }
      });
    }
    
    // 移除所有高亮样式
    document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .tab-container-droppable').forEach(item => {
      if (item instanceof HTMLElement) {
        item.classList.remove('plugin-drag-over');
        item.classList.remove('tab-container-hover');
        item.classList.remove('tab-container-droppable');
        item.style.transform = '';
        item.style.boxShadow = '';
      }
    });
    
    // 确保body上没有dragging类
    document.body.classList.remove('dragging');
  }

  // 修改全局辅助函数用于强制清理所有拖拽提示元素
  function forceCleanupDragIndicators() {
    console.log('执行强制清理所有拖拽提示元素');
    
    // 重置全局拖拽状态
    setDragState(false);
    
    // 移除body上的dragging类
    document.body.classList.remove('dragging');
    
    // 首先移除所有拖拽提示元素
    removeAllDragIndicators();
    
    // 清理所有拖拽提示元素
    const selectors = [
      '.tab-drag-indicator', 
      '.drop-indicator', 
      '.success-indicator', 
      '.error-indicator',
      '.plugin-drag-preview'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
          console.log(`已移除元素: ${selector}`);
        }
      });
    });
    
    // 清除所有样式类
    const styleClasses = [
      'plugin-drag-over', 
      'tab-container-hover', 
      'tab-container-droppable',
      'tab-drop-highlight',
      'merge-success'
    ];
    
    styleClasses.forEach(className => {
      document.querySelectorAll(`.${className}`).forEach(element => {
        if (element instanceof HTMLElement) {
          element.classList.remove(className);
          // 重置关键样式属性
          element.style.transform = '';
          element.style.boxShadow = '';
          element.style.outline = '';
          element.style.border = '';
          element.style.backgroundColor = '';
          element.style.transition = '';
        }
      });
    });
    
    console.log('强制清理完成');
  }

  // 添加到window以便开发调试
  if (typeof window !== 'undefined') {
    (window as any).forceCleanupDragIndicators = forceCleanupDragIndicators;
    (window as any).removeAllDragIndicators = removeAllDragIndicators;
  }

  // 修改清理函数，使用通用清理方法
  const cleanupDragState = () => {
    console.log('执行全面清理拖拽状态');
    
    // 使用通用清理函数
    forceCleanupDragIndicators();
    
    // 重置拖动状态
    setDraggedPluginId(null);
    setDraggedTabPluginId(null);
    setDraggedTabId(null);
    setDragOverPluginId(null);
    setIsDragOver(false);
    if (dragOverTimeout) {
      clearTimeout(dragOverTimeout);
      setDragOverTimeout(null);
    }
    
    // 移除所有事件监听器
    document.removeEventListener('mousemove', checkDragOverPlugin);
    
    // 清除全局拖拽标记
    (window as any).__isDraggingTab = false;
    (window as any).__lastDragCheck = undefined;
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
    
    // 移除拖动样式
    document.body.classList.remove('dragging');
    
    // 强制触发一次布局更新
    setTimeout(() => {
      setForceUpdate && setForceUpdate(prev => prev + 1);
    }, 100);
  };

  // 添加键盘快捷键强制清理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape键按下时强制清理
      if (e.key === 'Escape') {
        console.log('Escape键按下，强制清理拖拽状态');
        setDragState(false);
        removeAllDragIndicators();
        forceCleanupDragIndicators();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 如果正在加载，显示加载提示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">正在加载插件...</p>
        </div>
      </div>
    );
  }
  
  // 如果布局为空，显示提示信息和重试按钮
  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400 mb-4">未能加载默认插件</p>
        <button 
          className="px-4 py-2 btn-theme-primary rounded"
          onClick={async () => {
            try {
              setIsLoading(true);
              await ensurePluginsLoaded();
              resetStore();
              initDefaultLayout();
            } finally {
              setIsLoading(false);
            }
          }}
        >
          重新加载默认插件
        </button>
      </div>
    );
  }
  
  return (
    <div ref={gridRef} className="w-full h-full overflow-hidden">
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={1200} // 这个值会被WidthProvider覆盖
        autoSize={true}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        onLayoutChange={handleLayoutChange}
        onDragStart={onDragStart}
        onDragStop={onDragStop}
        draggableHandle=".plugin-drag-handle"
        resizeHandles={['se']}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
        style={{ height: containerHeight }}
        isDraggable={true} // 确保拖拽功能开启
        isResizable={true} // 确保调整大小功能开启
        isBounded={false} // 不限制拖拽边界
        transformScale={1} // 确保没有缩放导致的位置计算错误
      >
        {layout.map((item) => {
          // 检查这个项是否是标签容器
          const tabContainer = tabContainers.find(t => t.id === item.i);
          
          if (tabContainer) {
            return (
              <div key={item.i} className="h-full" data-item-id={item.i}>
                <TabContainer 
                  plugins={tabContainer.plugins}
                  onRemovePlugin={(pluginId) => removePlugin(pluginId)}
                  onSplitTab={(pluginId) => createTabContainer(pluginId, '')}
                  tabId={tabContainer.id}
                  onDragTab={handleTabPluginDragStart}
                />
              </div>
            );
          }
          
          // 否则，这是一个普通插件
          return (
            <div key={item.i} className="h-full" data-item-id={item.i}>
              <PluginContainer 
                pluginId={item.i}
                onRemove={() => removePlugin(item.i)}
              />
            </div>
          );
        })}
      </ReactGridLayout>
    </div>
  );
} 

// 处理拖动开始
const onDragStart = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
  const itemId = newItem.i;
  console.log('开始拖动:', itemId);
  
  // 设置正在拖动的项目ID
  setDraggedPluginId(itemId);
  
  // 设置全局拖拽状态
  setDragState(true);
  
  // 添加拖动提示到所有可拖入的元素
  const gridItems = document.querySelectorAll('.react-grid-item:not([data-item-id="' + itemId + '"])');
  gridItems.forEach(item => {
    if (item instanceof HTMLElement) {
      const targetId = item.getAttribute('data-item-id');
      // 允许拖入到标签容器
      if (targetId) {
        // 如果是标签容器，添加特殊提示样式
        if (targetId.startsWith('tab-container-')) {
          // 允许标签容器拖拽到其他标签容器
          item.classList.add('tab-container-droppable');
          // 添加浅色边框提示
          item.style.outline = '2px dashed rgba(59, 130, 246, 0.4)';
          
          // 对所有标签容器降低透明度，突出显示可放置区域
          if (itemId.startsWith('tab-container-') && targetId !== itemId) {
            // 将其透明度降低，以突出目标区域
            item.style.transition = 'all 0.2s ease';
            item.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.4)';
            
            // 添加明显提示文本
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            indicator.textContent = '可拖入合并';
            indicator.style.position = 'absolute';
            indicator.style.top = '10px';
            indicator.style.left = '10px';
            indicator.style.backgroundColor = 'rgba(59, 130, 246, 0.8)';
            indicator.style.color = 'white';
            indicator.style.padding = '4px 8px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontSize = '12px';
            indicator.style.fontWeight = 'bold';
            indicator.style.zIndex = '999';
            indicator.style.pointerEvents = 'none';
            
            // 先移除可能存在的旧提示
            const oldIndicator = item.querySelector('.drop-indicator');
            if (oldIndicator) oldIndicator.remove();
            
            item.appendChild(indicator);
          }
        }
        // 普通插件则加入可拖入样式，但不允许拖拽到普通插件如果当前拖动的是标签容器
        else if (!targetId.startsWith('tab-container-')) {
          if (!itemId.startsWith('tab-container-')) {
            item.classList.add('plugin-draggable');
          }
        }
      }
    }
  });
  
  // 添加样式表明拖拽已开始
  document.body.classList.add('dragging');
  
  // 不需要再这里添加事件监听器，因为我们已经在useEffect中设置了
};

// 添加一个彻底清理拖拽提示的函数
const thoroughCleanup = () => {
  console.log('执行彻底清理操作');
  
  // 1. 首先重置所有状态
  setDragState(false);
  document.body.classList.remove('dragging');
  setDraggedPluginId(null);
  setDraggedTabPluginId(null);
  setDraggedTabId(null);
  setDragOverPluginId(null);
  setIsDragOver(false);
  
  // 2. 清除所有拖拽元素的悬停状态
  document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .tab-container-droppable').forEach(item => {
    if (item instanceof HTMLElement) {
      item.classList.remove('plugin-drag-over');
      item.classList.remove('tab-container-hover');
      item.classList.remove('tab-container-droppable');
      item.style.transform = '';
      item.style.boxShadow = '';
      item.style.outline = '';
      item.style.border = '';
    }
  });
  
  // 3. 移除所有拖拽提示元素
  ['tab-drag-indicator', 'drop-indicator', 'success-indicator', 'error-indicator', 'plugin-drag-preview'].forEach(selector => {
    document.querySelectorAll(`.${selector}`).forEach(indicator => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
        console.log(`已移除 ${selector}`);
      }
    });
  });
  
  // 4. 重置全局拖拽状态变量
  delete window.__draggedPluginInfo;
  delete window.__draggedPluginPosition;
  delete window.__isPotentialDrag;
  delete window.__lastDragCheck;
  delete window.__dragStartTime;
  
  // 5. 移除可能的全局事件监听器
  if (window.__handleDragMouseMove) {
    document.removeEventListener('mousemove', window.__handleDragMouseMove);
    delete window.__handleDragMouseMove;
  }
  
  if (window.__handleDragMouseUp) {
    document.removeEventListener('mouseup', window.__handleDragMouseUp);
    delete window.__handleDragMouseUp;
  }
  
  // 6. 添加新的短期监视器，确保在清理后不会再添加提示元素
  const tempObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement && 
             (node.classList.contains('tab-drag-indicator') || 
              node.classList.contains('drop-indicator'))) {
            console.log('发现清理后仍有新添加的提示元素，强制移除');
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          }
        });
      }
    });
  });
  
  // 启动监视
  tempObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // 2秒后取消监视
  setTimeout(() => {
    tempObserver.disconnect();
  }, 2000);
  
  // 强制刷新UI
  setTimeout(() => {
    setForceUpdate(prev => prev + 1);
  }, 100);
};

// 修改拖拽结束处理函数
const onDragStop = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
  console.log('拖动结束:', draggedPluginId, '->目标:', dragOverPluginId);
  
  // 调用彻底清理函数
  thoroughCleanup();
  
  // 如果有悬停目标，并且是在标签容器上释放
  if (isDragOver && dragOverPluginId && draggedPluginId) {
    // 处理标签容器合并
    if (draggedPluginId.startsWith('tab-container-') && dragOverPluginId.startsWith('tab-container-')) {
      console.log('处理标签容器合并:', draggedPluginId, '->', dragOverPluginId);
      mergeTabContainers(draggedPluginId, dragOverPluginId);
    }
    // 处理将插件添加到标签容器
    else if (!draggedPluginId.startsWith('tab-container-') && dragOverPluginId.startsWith('tab-container-')) {
      console.log('处理将插件添加到标签容器:', draggedPluginId, '->', dragOverPluginId);
      // 获取布局存储实例
      const layoutStore = useLayoutStore.getState();
      // 将插件添加到标签容器
      layoutStore.addPluginToTab(dragOverPluginId, draggedPluginId);
      // 从布局中移除原始插件
      layoutStore.removeItemFromLayout(draggedPluginId);
      // 保存布局
      layoutStore.saveCurrentLayout();
      // 显示成功提示
      showSuccessIndicator(dragOverPluginId, '插件已添加到标签容器');
    }
    // 处理两个插件合并为新的标签容器
    else if (!draggedPluginId.startsWith('tab-container-') && !dragOverPluginId.startsWith('tab-container-')) {
      console.log('处理两个插件合并为新的标签容器:', draggedPluginId, dragOverPluginId);
      // 获取布局存储实例
      const layoutStore = useLayoutStore.getState();
      // 创建新的标签容器
      layoutStore.createTabContainer(draggedPluginId, dragOverPluginId);
      // 保存布局
      layoutStore.saveCurrentLayout();
      // 显示成功提示
      const newTabId = `tab-container-${Date.now()}`;
      showSuccessIndicator(newTabId, '新标签容器已创建');
    }
  }
  
  // 强制刷新以确保UI更新
  setTimeout(() => {
    const forceUpdateFn = useLayoutStore.getState().updateLayout;
    if (forceUpdateFn) {
      forceUpdateFn([...layout]);
    }
    
    // 再次检查并删除可能残留的指示器
    document.querySelectorAll('.tab-drag-indicator').forEach(indicator => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    });
  }, 200);
};

// 合并两个标签容器
const mergeTabContainers = (sourceId: string, targetId: string) => {
  console.log('合并标签容器:', sourceId, '→', targetId);
  
  // 首先获取布局存储实例
  const layoutStore = useLayoutStore.getState();
  
  // 使用新添加的moveTabContainers方法合并标签容器
  layoutStore.moveTabContainers(sourceId, targetId);
  
  // 确保重新更新 state 和 UI
  setTimeout(() => {
    // 重新获取更新后的状态
    const updatedState = useLayoutStore.getState();
    console.log('合并后的状态:', {
      布局长度: updatedState.layout.length,
      标签容器: updatedState.tabContainers.length
    });
    // 触发强制更新
    setForceUpdate(prev => prev + 1);
    
    // 显示成功提示
    showSuccessIndicator(targetId, '标签容器已成功合并');
    
    // 添加成功视觉反馈
    const targetContainer = document.querySelector(`[data-item-id="${targetId}"]`);
    if (targetContainer instanceof HTMLElement) {
      targetContainer.classList.add('merge-success');
      targetContainer.classList.add('tab-drop-highlight');
      setTimeout(() => {
        targetContainer.classList.remove('merge-success');
        targetContainer.classList.remove('tab-drop-highlight');
      }, 1000);
    }
  }, 100);
};

// 显示成功提示
const showSuccessIndicator = (targetId: string, message: string) => {
  const targetElement = document.querySelector(`[data-item-id="${targetId}"]`);
  if (!targetElement) return;
  
  // 创建成功提示元素
  const indicator = document.createElement('div');
  indicator.className = 'success-indicator';
  indicator.textContent = message;
  indicator.style.position = 'absolute';
  indicator.style.top = '50%';
  indicator.style.left = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.backgroundColor = 'rgba(39, 174, 96, 0.9)';
  indicator.style.color = 'white';
  indicator.style.padding = '10px 15px';
  indicator.style.borderRadius = '5px';
  indicator.style.fontSize = '16px';
  indicator.style.fontWeight = 'bold';
  indicator.style.zIndex = '9999';
  indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  indicator.style.opacity = '0';
  indicator.style.transition = 'opacity 0.2s';
  
  // 添加图标
  const checkmark = document.createElement('span');
  checkmark.innerHTML = '✓ ';
  checkmark.style.marginRight = '5px';
  indicator.prepend(checkmark);
  
  // 添加到目标元素
  targetElement.appendChild(indicator);
  
  // 显示动画
  setTimeout(() => {
    indicator.style.opacity = '1';
  }, 10);
  
  // 设置自动消失
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }, 2000);
};

// 显示错误提示
const showErrorIndicator = (targetId: string, message: string) => {
  const targetElement = document.querySelector(`[data-item-id="${targetId}"]`);
  if (!targetElement) return;
  
  // 创建错误提示元素
  const indicator = document.createElement('div');
  indicator.className = 'error-indicator';
  indicator.textContent = message;
  indicator.style.position = 'absolute';
  indicator.style.top = '50%';
  indicator.style.left = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.backgroundColor = 'rgba(214, 48, 49, 0.9)';
  indicator.style.color = 'white';
  indicator.style.padding = '10px 15px';
  indicator.style.borderRadius = '5px';
  indicator.style.fontSize = '16px';
  indicator.style.fontWeight = 'bold';
  indicator.style.zIndex = '9999';
  indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  indicator.style.opacity = '0';
  indicator.style.transition = 'opacity 0.2s';
  
  // 添加图标
  const errorIcon = document.createElement('span');
  errorIcon.innerHTML = '✗ ';
  errorIcon.style.marginRight = '5px';
  indicator.prepend(errorIcon);
  
  // 添加到目标元素
  targetElement.appendChild(indicator);
  
  // 显示动画
  setTimeout(() => {
    indicator.style.opacity = '1';
  }, 10);
  
  // 设置自动消失
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }, 2000);
}; 

// 在组件挂载时注册全局函数
useEffect(() => {
  // 将彻底清理函数添加到window对象
  if (typeof window !== 'undefined') {
    window.forceCleanupDragIndicators = thoroughCleanup;
    
    // 添加全局鼠标监听，确保鼠标按钮抬起后，所有提示元素被移除
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // 如果鼠标抬起，但发现有拖拽提示元素，执行清理
      if (document.querySelectorAll('.tab-drag-indicator, .drop-indicator').length > 0) {
        console.log('鼠标抬起事件检测到残留的提示元素，立即清理');
        setTimeout(thoroughCleanup, 10);
      }
    };
    
    // 添加全局鼠标移动监听，如果鼠标移动但有提示元素且不在拖拽状态，清理提示
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current && document.querySelectorAll('.tab-drag-indicator, .drop-indicator').length > 0) {
        console.log('鼠标移动事件检测到未处于拖拽状态但有提示元素，立即清理');
        setTimeout(thoroughCleanup, 10);
      }
    };
    
    // 添加ESC键监听，按ESC强制清理
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('ESC键按下，强制清理');
        thoroughCleanup();
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp, true);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      // 清理事件监听
      document.removeEventListener('mouseup', handleGlobalMouseUp, true);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('keydown', handleGlobalKeyDown);
      
      // 移除全局函数
      delete window.forceCleanupDragIndicators;
    };
  }
}, []);