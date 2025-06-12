// 添加TypeScript类型声明扩展，支持全局Window属性
declare global {
  interface Window {
    __draggedPluginInfo?: {
      pluginId: string;
      tabId: string;
      startTime: number;
      confirmedDragTime?: number;
      isDraggingContainer?: boolean; // 新增：标记是否是拖拽整个容器
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
    __currentDragTargetTabId?: string | null; // 新增：存储当前悬浮的TabContainer ID
    __recentlyRemovedPlugins?: {
      [pluginId: string]: number;
    };
  }
}

import { useState, useEffect, useRef } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useLayoutStore } from 'store/layoutStore';
import { ensurePluginsLoaded, pluginRegistry } from 'plugins/registry';
import PluginContainer from './PluginContainer';
import TabContainer from './TabContainer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ReactGridLayout = WidthProvider(RGL);

export default function GridLayout() {
  const { 
    layout, 
    updateLayout, 
    removePlugin, 
    initDefaultLayout, 
    resetStore,
    tabContainers,
    createTabContainer,
    removePluginFromTab,
    removeTabContainer,
    addPluginToTab,
    convertToTab,
    movePluginBetweenTabs,
    loadLayout,
    savedLayouts,
    currentLayoutId
  } = useLayoutStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedPluginId, setDraggedPluginId] = useState<string | null>(null);
  const [draggedTabPluginId, setDraggedTabPluginId] = useState<string | null>(null); // 从Tab拖出的插件ID
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null); // 所属的Tab容器ID
  const [dragOverPluginId, setDragOverPluginId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverTimeout, setDragOverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabContainerRefs = useRef<Record<string, HTMLDivElement | null>>({}); // 存储TabContainer的引用

  // 新增状态，用于在拖拽过程中显示合并提示
  const [hoveredTabContainerId, setHoveredTabContainerId] = useState<string | null>(null);

  // 在状态声明部分添加sourceTabId状态
  const [sourceTabId, setSourceTabId] = useState<string | null>(null);

  // 添加一个变量来跟踪源标签容器ID，而不是使用状态
  let dragSourceTabId: string | null = null;

  useEffect(() => {
    ensurePluginsLoaded();
  }, []);
  
  // 添加状态来跟踪插件拖拽预览
  const [previewPosition, setPreviewPosition] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  
  // 首次加载时智能初始化 - 优先恢复已保存的布局
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        if (!isInitialized) {
          // 确保插件已加载
          await ensurePluginsLoaded();
          
          // **重要修复：检查是否有已保存的布局**
          const { loadLayout, savedLayouts, currentLayoutId } = useLayoutStore.getState();
          
          console.log('初始化检查 - 布局状态:', {
            已保存布局数量: savedLayouts.length,
            当前布局ID: currentLayoutId,
            localStorage中的布局数量: localStorage.getItem('termini-layouts') ? JSON.parse(localStorage.getItem('termini-layouts') || '[]').length : 0
          });
          
          // 检查localStorage中是否有直接保存的布局数据
          const rawLayouts = localStorage.getItem('termini-layouts');
          const currentIdFromStorage = localStorage.getItem('termini-current-layout-id');
          
          let hasValidLayout = false;
          
          // 如果localStorage中有布局数据
          if (rawLayouts) {
            try {
              const layoutsFromStorage = JSON.parse(rawLayouts);
              if (layoutsFromStorage.length > 0) {
                console.log('发现localStorage中的布局数据，尝试恢复...');
                
                // 先更新store中的布局列表
                useLayoutStore.setState({
                  savedLayouts: layoutsFromStorage,
                  currentLayoutId: currentIdFromStorage
                });
                
                // 如果有当前布局ID且布局存在，加载它
                if (currentIdFromStorage && layoutsFromStorage.some((layout: any) => layout.id === currentIdFromStorage)) {
                  console.log('恢复当前布局:', currentIdFromStorage);
                  loadLayout(currentIdFromStorage);
                  hasValidLayout = true;
                } else if (layoutsFromStorage.length > 0) {
                  // 如果没有有效的当前布局ID，加载最新的布局
                  const latestLayout = layoutsFromStorage.reduce((latest: any, current: any) => 
                    current.updatedAt > latest.updatedAt ? current : latest
                  );
                  console.log('恢复最新布局:', latestLayout.name);
                  loadLayout(latestLayout.id);
                  hasValidLayout = true;
                }
              }
            } catch (error) {
              console.error('解析localStorage布局数据失败:', error);
            }
          }
          
          // 如果store中有布局但没有加载成功，尝试从store恢复
          if (!hasValidLayout && savedLayouts.length > 0) {
            console.log('从store中恢复布局...');
            if (currentLayoutId && savedLayouts.some(layout => layout.id === currentLayoutId)) {
              loadLayout(currentLayoutId);
              hasValidLayout = true;
            } else {
              // 加载最新的布局
              const latestLayout = savedLayouts.reduce((latest, current) => 
                current.updatedAt > latest.updatedAt ? current : latest
              );
              loadLayout(latestLayout.id);
              hasValidLayout = true;
            }
          }
          
          // 只有在没有任何已保存布局的情况下才初始化默认布局
          if (!hasValidLayout) {
            console.log('没有发现已保存的布局，初始化默认布局...');
            // 注意：不再调用resetStore()，避免清除可能的persist数据
            initDefaultLayout();
            
            // 初始化完成后，保存默认布局到本地存储
            setTimeout(() => {
              try {
                const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
                if (!currentLayoutId) {
                  saveCurrentLayout('默认布局');
                  console.log('默认布局已保存到本地存储');
                }
              } catch (error) {
                console.error('保存默认布局失败:', error);
              }
            }, 1000);
          } else {
            console.log('已成功恢复保存的布局');
          }
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        // 出错时才重置并初始化默认布局
        console.log('初始化出错，将重置并加载默认布局');
        resetStore();
        initDefaultLayout();
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
      .plugin-drag-over {
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
      .tab-drag-indicator {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        color: #3498db;
        z-index: 100;
        pointer-events: none;
      }
      /* 标签容器悬停样式 */
      [data-item-id^="tab-container-"] {
        transition: all 0.2s ease;
      }
      [data-item-id^="tab-container-"].plugin-drag-over {
        background-color: rgba(39, 174, 96, 0.1);
        border: 3px dashed #27ae60 !important;
      }
      /* 添加标签容器悬停高亮样式 */
      [data-item-id^="tab-container-"].tab-container-hover {
        background-color: rgba(39, 174, 96, 0.2);
        border: 3px dashed #27ae60 !important;
        transform: scale(1.01);
        box-shadow: 0 0 10px rgba(39, 174, 96, 0.3);
      }
      /* 标签容器成功放置后的高亮样式 */
      [data-item-id^="tab-container-"].tab-drop-highlight {
        background-color: rgba(39, 174, 96, 0.3);
        border: 3px solid #27ae60 !important;
        transition: all 0.3s ease;
      }
      /* 标签容器中的拖放指示器样式 */
      [data-item-id^="tab-container-"] .tab-drag-indicator {
        background-color: rgba(39, 174, 96, 0.7);
        color: white;
        font-weight: bold;
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
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: none;
      }
    `;
    document.head.appendChild(style);
    
    // 调试日志
    return () => {
      document.head.removeChild(style);
    };
  }, [layout, tabContainers]);
  
  const onLayoutChange = (newLayout: Layout[]) => {
    updateLayout(newLayout);
    
    // 确保布局变更后自动保存到本地存储
    const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
    
    // 延迟保存，确保状态更新完成
    setTimeout(() => {
      try {
        if (currentLayoutId) {
          // 如果有当前布局ID，保存到对应布局
          saveCurrentLayout();
          console.log('布局已更新并保存到现有布局:', currentLayoutId);
        } else {
          // 如果没有布局ID，创建新布局并保存
          saveCurrentLayout('自动保存布局');
          console.log('布局已保存为新布局');
        }
        console.log('布局已成功保存到本地存储');
      } catch (error) {
        console.error('保存布局失败:', error);
      }
    }, 150);
  };
  
  const handleRemovePlugin = (pluginId: string) => {
    removePlugin(pluginId);
    
    // 延迟触发布局保存，确保状态更新完成
    setTimeout(() => {
      try {
        const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
        if (currentLayoutId) {
          saveCurrentLayout();
          console.log('插件移除后 - 布局已保存到现有布局:', currentLayoutId);
        } else {
          saveCurrentLayout('移除插件保存');
          console.log('插件移除后 - 布局已保存为新布局');
        }
        console.log('插件移除后布局已成功保存到本地存储');
      } catch (error) {
        console.error('插件移除后保存布局失败:', error);
      }
    }, 200);
  };
  
  // 处理从标签容器中移除插件 - 彻底删除插件，而不是拆分出来
  const handleTabPluginRemove = (tabId: string, pluginId: string) => {
    // 从Tab中移除插件
    removePluginFromTab(tabId, pluginId);
    
    // 然后从活动插件中完全删除它
    removePlugin(pluginId);
    
    // 延迟保存布局，确保TabContainer变空时的自动重排已完成
    setTimeout(() => {
      try {
        const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
        if (currentLayoutId) {
          saveCurrentLayout();
          console.log('标签插件移除后 - 布局已保存到现有布局:', currentLayoutId);
        } else {
          saveCurrentLayout('标签插件移除保存');
          console.log('标签插件移除后 - 布局已保存为新布局');
        }
        console.log('标签插件移除后布局已成功保存到本地存储');
      } catch (error) {
        console.error('标签插件移除后保存布局失败:', error);
      }
    }, 300);
  };
  
  // 处理拖动开始
  const onDragStart = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    // 判断是否是拖拽整个标签容器（而非其中的插件）
    const isDraggingContainer = oldItem.i.startsWith('tab-container-');
  
    window.__draggedPluginInfo = {
      pluginId: oldItem.i,
      tabId: isDraggingContainer ? oldItem.i : '', // 如果拖拽的是容器，tabId就是容器ID
      startTime: Date.now(),
      isDraggingContainer,
    };
    window.__isPotentialDrag = true;
  
    // 强制清理悬浮提示
    setHoveredTabContainerId(null);
    setDraggedPluginId(oldItem.i);
  };

  const onDrag = (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
  
    let currentHoveredId: string | null = null;
  
    if (window.__draggedPluginInfo?.isDraggingContainer && !newItem.i.startsWith('tab-container-')) {
      Object.entries(tabContainerRefs.current).forEach(([tabId, ref]) => {
        if (ref && tabId !== newItem.i) {
          const rect = ref.getBoundingClientRect();
          if (mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom) {
            currentHoveredId = tabId;
          }
        }
      });
    }
  
    setHoveredTabContainerId(currentHoveredId);
    window.__currentDragTargetTabId = currentHoveredId;
  };
  
  // 处理拖动结束
  const onDragStop = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    // 检查是否是自定义拖拽（标签间拖拽）
    const isCustomDrag = window.__draggedPluginInfo?.tabId;
    
    setTimeout(() => {
      setDraggedPluginId(null);
      setHoveredTabContainerId(null);
      setIsDragOver(false);
      setDragOverPluginId(null);
      window.__draggedPluginInfo = undefined;
      window.__currentDragTargetTabId = null;
  
      document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .tab-drag-indicator').forEach(el => el.classList.remove('plugin-drag-over', 'tab-container-hover'));
      document.querySelectorAll('.tab-drag-indicator').forEach(el => el.remove());
      
      document.body.classList.remove('dragging');
      
      // 确保拖拽结束后总是保存布局
      try {
        if (!isCustomDrag) {
          const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
          if (currentLayoutId) {
            saveCurrentLayout();
            console.log('拖拽结束 - 布局已保存到现有布局:', currentLayoutId);
          } else {
            saveCurrentLayout('拖拽布局保存');
            console.log('拖拽结束 - 布局已保存为新布局');
          }
          console.log('拖拽结束后布局已成功保存到本地存储');
        } else {
          console.log('自定义拖拽结束，布局保存将在其他地方处理');
        }
      } catch (error) {
        console.error('拖拽结束后保存布局失败:', error);
      }
    }, 50);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      setHoveredTabContainerId(null);
      setDraggedPluginId(null);
      window.__isPotentialDrag = false;
      document.body.classList.remove('dragging');
    };
  
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);
  
  // 检测是否拖动到另一个插件上方
  const checkDragOverPlugin = (e: MouseEvent) => {
    if (!draggedPluginId || !gridRef.current) return;
    
    // 获取鼠标位置下的元素
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    let foundTarget = false;
    
    // 查找是否拖动到了其他插件上
    for (const element of elementsAtPoint) {
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
            setDragOverPluginId(itemId);
            setIsDragOver(true);
            
            // 高亮目标容器
            const allItems = document.querySelectorAll('.react-grid-item');
            allItems.forEach(item => {
              item.classList.remove('plugin-drag-over');
              const oldIndicator = item.querySelector('.tab-drag-indicator');
              if (oldIndicator) oldIndicator.remove();
            });
            
            gridItem.classList.add('plugin-drag-over');
            
            // 创建提示元素
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            indicator.textContent = '拖放这里添加到标签页';
            indicator.style.pointerEvents = 'none';
            
            // 先移除可能存在的旧提示
            const oldIndicator = gridItem.querySelector('.tab-drag-indicator');
            if (oldIndicator) oldIndicator.remove();
            
            gridItem.appendChild(indicator);
            
            // 清除旧的延时器
            if (dragOverTimeout) {
              clearTimeout(dragOverTimeout);
              setDragOverTimeout(null);
            }
            
            return; // 找到标签容器目标后立即退出
          } 
          // 拖动到普通插件 - 创建新的标签容器
          else if (!itemId.startsWith('tab-container-')) {
            // 如果是新的目标插件
            setDragOverPluginId(itemId);
            setIsDragOver(true);
            
            // 高亮目标插件
            const allItems = document.querySelectorAll('.react-grid-item');
            allItems.forEach(item => {
              item.classList.remove('plugin-drag-over');
              // 删除可能的旧指示器
              const oldIndicator = item.querySelector('.tab-drag-indicator');
              if (oldIndicator) oldIndicator.remove();
            });
            
            gridItem.classList.add('plugin-drag-over');
            
            // 创建提示元素
            const indicator = document.createElement('div');
            indicator.className = 'tab-drag-indicator';
            indicator.textContent = '拖放这里合并为标签页';
            indicator.style.pointerEvents = 'none'; // 确保不阻挡事件
            
            // 先移除可能存在的旧提示
            const oldIndicator = gridItem.querySelector('.tab-drag-indicator');
            if (oldIndicator) oldIndicator.remove();
            
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
      setDragOverPluginId(null);
      setIsDragOver(false);
      
      // 删除所有提示元素和高亮
      const allItems = document.querySelectorAll('.react-grid-item');
      allItems.forEach(item => {
        item.classList.remove('plugin-drag-over');
        const indicator = item.querySelector('.tab-drag-indicator');
        if (indicator) indicator.remove();
      });
      
      if (dragOverTimeout) {
        clearTimeout(dragOverTimeout);
        setDragOverTimeout(null);
      }
    }
  };
  
  // 从Tab中拖出插件
  const handleTabPluginDragStart = (tabId: string, pluginId: string) => {
    // **强制清理任何残留的拖拽状态**
    (window as any).__isDraggingTab = false;
    (window as any).__isPotentialDrag = false;
    
    // 清理残留的DOM元素
    document.querySelectorAll('.drop-out-indicator, .tab-drag-indicator, .drop-indicator, .plugin-drag-preview').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    
    // 移除拖拽样式
    document.body.classList.remove('dragging');
    
    // 清理全局状态
    delete window.__draggedPluginInfo;
    delete window.__draggedPluginPosition;
    delete window.__gridParams;
    
    // 设置源标签容器ID
    dragSourceTabId = tabId;
    
    // 清除可能存在的旧状态和元素
    cleanupDragElements();
    
    // 记录拖拽的标签和插件
    setDraggedTabId(tabId);
    setDraggedTabPluginId(pluginId);
    
    // 防止文本选择
    document.body.classList.add('dragging');
    
    // 保存全局拖拽信息，供其他组件访问
    window.__draggedPluginInfo = {
      pluginId,
      tabId,
      startTime: Date.now()
    };
    
    // 添加一个标志来标记这是即将开始的拖拽，但尚未确认
    // 直到鼠标移动超过阈值才确认为拖拽操作
    (window as any).__isPotentialDrag = true;
    
    // 获取Grid的几何信息，用于计算拖拽位置
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const firstGridItem = document.querySelector('.react-grid-item');
      const rowHeight = firstGridItem ? parseInt(window.getComputedStyle(firstGridItem).height) / 6 : 30;
      const margin = 10;  // 默认margin
      const cols = 12;    // 默认列数
      const colWidth = (rect.width - margin * (cols + 1)) / cols;
      
      // 保存网格参数供后续使用
      window.__gridParams = {
        rect,
        rowHeight,
        margin,
        cols,
        colWidth
      };
      
    }
    
    // 获取标签容器的布局信息，用于确定尺寸
    const containerLayout = layout.find(item => item.i === tabId);
    
    // 获取标签容器的位置信息
    const tabContainerElement = document.querySelector(`[data-item-id="${tabId}"]`);
    if (tabContainerElement instanceof HTMLElement) {
      const tabRect = tabContainerElement.getBoundingClientRect();
      const tabPos = {
        x: tabRect.left,
        y: tabRect.top,
        w: tabRect.width,
        h: tabRect.height
      };
      
      // 先移除可能存在的旧预览元素
      const oldPreview = document.querySelector('.plugin-drag-preview');
      if (oldPreview && oldPreview.parentNode) {
        oldPreview.parentNode.removeChild(oldPreview);
      }
      
      // 获取插件名称
      const pluginInfo = pluginRegistry.get(pluginId);
      const pluginName = pluginInfo?.metadata.name || pluginId.replace('official-', '');
      
      // 确定预览尺寸 - 使用原始标签容器的实际尺寸
      let previewWidth = tabPos.w;
      let previewHeight = tabPos.h;
      
      // 如果有网格参数，确保尺寸匹配网格单位
      if (window.__gridParams && containerLayout) {
        const { colWidth, rowHeight, margin } = window.__gridParams;
        // 使用布局项的尺寸来计算网格单位尺寸
        previewWidth = containerLayout.w * colWidth + (containerLayout.w - 1) * margin;
        previewHeight = containerLayout.h * rowHeight + (containerLayout.h - 1) * margin;
      }
      
      // 创建拖拽预览元素
      const preview = document.createElement('div');
      preview.className = 'plugin-drag-preview';
      preview.id = 'plugin-drag-preview'; // 添加ID方便后续查找
      preview.style.position = 'fixed'; // 使用fixed以确保在滚动时位置正确
      preview.style.left = `${tabPos.x}px`;
      preview.style.top = `${tabPos.y}px`;
      preview.style.width = `${previewWidth}px`;  // 使用完整尺寸
      preview.style.height = `${previewHeight}px`; // 使用完整尺寸
      preview.style.backgroundColor = 'rgba(52, 152, 219, 0.7)'; // 更鲜明的蓝色，增加不透明度
      preview.style.border = '2px solid #3498db'; // 实线边框代替虚线，更清晰
      preview.style.zIndex = '1000';
      preview.style.pointerEvents = 'none';
      preview.style.borderRadius = '6px'; // 增加圆角
      preview.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'; // 更明显的阴影
      preview.style.transition = 'all 0.1s ease'; // 轻微过渡效果但保持响应迅速
      preview.style.maxHeight = '300px';
      
      // 添加插件图标和名称，增强视觉效果
      preview.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 8px; color: #fff;">
          <div style="font-weight: bold; font-size: 14px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
            ${pluginName}
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: rgba(255,255,255,0.9);">
            正在拖动...
          </div>
        </div>
      `;
      
      document.body.appendChild(preview);
      
      // 保存初始位置信息
      window.__draggedPluginPosition = {
        x: tabPos.x,
        y: tabPos.y,
        w: previewWidth,  // 使用实际尺寸
        h: previewHeight  // 使用实际尺寸
      };
      
      // 设置拖拽预览位置
      setPreviewPosition(window.__draggedPluginPosition);
    }
    
    // 高亮显示所有可拖入的标签容器
    const tabContainers = document.querySelectorAll('[data-item-id^="tab-container-"]');
    tabContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        const containerId = container.getAttribute('data-item-id');
        // 不高亮当前标签容器
        if (containerId && containerId !== tabId) {
          container.classList.add('tab-container-droppable');
          container.style.outline = '2px dashed rgba(39, 174, 96, 0.4)';
          // 添加提示文字
          const hint = document.createElement('div');
          hint.className = 'drop-zone-hint';
          hint.textContent = '可放置区域';
          hint.style.position = 'absolute';
          hint.style.top = '5px';
          hint.style.right = '5px';
          hint.style.backgroundColor = 'rgba(39, 174, 96, 0.7)';
          hint.style.color = 'white';
          hint.style.padding = '3px 6px';
          hint.style.fontSize = '10px';
          hint.style.borderRadius = '3px';
          hint.style.pointerEvents = 'none';
          hint.style.zIndex = '999';
          container.appendChild(hint);
        }
      }
    });
    
    // 添加鼠标移动事件监听器，跟踪拖拽位置
    const handleMouseMove = (e: MouseEvent) => {
      // 阻止默认事件和冒泡
      e.preventDefault();
      e.stopPropagation();
      
      // 更新拖拽位置
      updatePositionAndPreview(e);
      
      // 检查是否悬停在其他标签容器上
      checkDragOverPlugin(e);
    };
    
    // 添加鼠标释放事件监听器，处理拖拽结束
    const handleMouseUp = (e: MouseEvent) => {
      // 阻止默认事件和冒泡
      e.preventDefault();
      e.stopPropagation();
      
      // 处理拖拽释放
      handleDragRelease(e);
      
      // 移除事件监听器
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 清除全局引用
      delete window.__handleDragMouseMove;
      delete window.__handleDragMouseUp;
    };
    
    // 保存事件处理函数的引用，以便后续清理
    window.__handleDragMouseMove = handleMouseMove;
    window.__handleDragMouseUp = handleMouseUp;
    
    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
  };
  
  // 移动鼠标时更新预览位置
  const updatePositionAndPreview = (e: MouseEvent) => {
    try {
      // 检查是否是潜在拖拽状态，如果是则需要验证移动距离
      if ((window as any).__isPotentialDrag && window.__draggedPluginInfo) {
        // 获取初始位置
        const initialPos = window.__draggedPluginPosition;
        if (initialPos) {
          // 计算移动距离
          const deltaX = e.clientX - initialPos.x;
          const deltaY = e.clientY - initialPos.y;
          const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // 如果移动距离小于阈值(10px)，则不触发拖拽
          if (moveDistance < 10) {
            return; // 移动距离太小，不视为拖拽
          } else {
            // 已确认是拖拽操作，移除潜在拖拽标志
            (window as any).__isPotentialDrag = false;
            // 记录确认拖拽的时间
            window.__draggedPluginInfo.confirmedDragTime = Date.now();
          }
        }
      }
      
      // 确保拖拽信息存在
      if (!window.__draggedPluginInfo || !window.__draggedPluginPosition) {
        return;
      }
      
      // **重要**：实时更新全局拖拽位置为当前鼠标位置
      window.__draggedPluginPosition.x = e.clientX;
      window.__draggedPluginPosition.y = e.clientY;
      
      // 更新预览元素位置
      const preview = document.getElementById('plugin-drag-preview');
      if (!preview) return;
      
      preview.style.left = `${e.clientX - window.__draggedPluginPosition.w / 2}px`;
      preview.style.top = `${e.clientY - 20}px`; // 偏移一点，避免鼠标正好在中心
      
      // 高亮显示鼠标下方的标签容器
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      let foundTabContainer = false;
      
      // 移除所有标签容器的高亮
      const allTabContainers = document.querySelectorAll('[data-item-id^="tab-container-"]');
      allTabContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.classList.remove('tab-container-hover');
          // 移除所有提示元素
          const oldIndicator = container.querySelector('.tab-drop-indicator');
          if (oldIndicator) oldIndicator.remove();
          
          // 减弱非目标区域的提示
          const hint = container.querySelector('.drop-zone-hint');
          if (hint instanceof HTMLElement) {
            hint.style.opacity = '0.5';
          }
        }
      });
      
      // 检查鼠标是否在标签容器上
      for (const element of elementsAtPoint) {
        const closestContainer = element.closest('[data-item-id^="tab-container-"]');
        if (closestContainer && closestContainer instanceof HTMLElement) {
          const containerId = closestContainer.getAttribute('data-item-id');
          const dragInfo = window.__draggedPluginInfo;
          
          // 不高亮当前拖拽的标签容器
          if (containerId && dragInfo && containerId !== dragInfo.tabId) {
            closestContainer.classList.add('tab-container-hover');
            
            // 高亮当前目标区域的提示
            const hint = closestContainer.querySelector('.drop-zone-hint');
            if (hint instanceof HTMLElement) {
              hint.style.opacity = '1';
              hint.textContent = '放置到这里';
              hint.style.backgroundColor = 'rgba(39, 174, 96, 0.9)';
              hint.style.fontWeight = 'bold';
            }
            
            // 添加拖放提示指示器
            const indicator = document.createElement('div');
            indicator.className = 'tab-drop-indicator';
            indicator.textContent = '拖放到此标签组';
            indicator.style.position = 'absolute';
            indicator.style.top = '50%';
            indicator.style.left = '50%';
            indicator.style.transform = 'translate(-50%, -50%)';
            indicator.style.backgroundColor = 'rgba(39, 174, 96, 0.85)';
            indicator.style.color = 'white';
            indicator.style.padding = '10px 15px';
            indicator.style.borderRadius = '5px';
            indicator.style.fontSize = '14px';
            indicator.style.fontWeight = 'bold';
            indicator.style.zIndex = '1000';
            indicator.style.pointerEvents = 'none';
            indicator.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
            
            // 删除可能存在的旧指示器
            const oldIndicator = closestContainer.querySelector('.tab-drop-indicator');
            if (oldIndicator) oldIndicator.remove();
            
            closestContainer.appendChild(indicator);
            foundTabContainer = true;
            
            // 给预览元素添加"目标锁定"效果
            preview.style.transform = 'scale(0.9)';
            preview.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.5), 0 4px 15px rgba(0,0,0,0.3)';
            break;
          }
        }
      }

      // 如果没找到标签容器，检查是否在网格区域内以显示放置预览
      if (!foundTabContainer && window.__gridParams) {
        const { rect, rowHeight, margin, cols, colWidth } = window.__gridParams;
        
        // 如果鼠标在网格区域内
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          // 计算网格位置
          const gridX = Math.floor((e.clientX - rect.left) / (colWidth + margin));
          const gridY = Math.floor((e.clientY - rect.top) / (rowHeight + margin));
          
          // 显示网格位置指示
          const positionInfo = document.createElement('div');
          positionInfo.className = 'grid-position-info';
          positionInfo.textContent = `位置: (${gridX}, ${gridY})`;
          positionInfo.style.position = 'fixed';
          positionInfo.style.left = `${e.clientX + 15}px`;
          positionInfo.style.top = `${e.clientY - 25}px`;
          positionInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          positionInfo.style.color = 'white';
          positionInfo.style.padding = '3px 6px';
          positionInfo.style.borderRadius = '3px';
          positionInfo.style.fontSize = '11px';
          positionInfo.style.zIndex = '1002';
          positionInfo.style.pointerEvents = 'none';
          
          // 删除可能存在的旧指示器
          const oldPositionInfo = document.querySelector('.grid-position-info');
          if (oldPositionInfo && oldPositionInfo.parentNode) {
            oldPositionInfo.parentNode.removeChild(oldPositionInfo);
          }
          
          document.body.appendChild(positionInfo);
          
          // 更新预览元素样式以指示将放置为独立组件
          preview.style.border = '2px solid #e67e22';
          preview.style.backgroundColor = 'rgba(230, 126, 34, 0.7)';
          preview.style.transform = 'scale(1)';
          preview.style.boxShadow = '0 0 0 3px rgba(230, 126, 34, 0.3), 0 4px 15px rgba(0,0,0,0.3)';
          preview.style.maxHeight = '300px';
          
          // 可以添加一个文本提示
          if (!preview.querySelector('.preview-label')) {
            const label = document.createElement('div');
            label.className = 'preview-label';
            label.textContent = '拖放到此处创建新标签组';
            label.style.position = 'absolute';
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            label.style.color = 'white';
            label.style.fontWeight = 'bold';
            label.style.fontSize = '12px';
            label.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
            label.style.textAlign = 'center';
            label.style.width = '100%';
            preview.appendChild(label);
          } else {
            const label = preview.querySelector('.preview-label');
            if (label instanceof HTMLElement) {
              label.textContent = '拖放到此处创建新标签组';
            }
          }
        } else {
          // 鼠标在网格外，恢复默认样式
          preview.style.border = '2px solid #3498db';
          preview.style.backgroundColor = 'rgba(52, 152, 219, 0.7)';
          preview.style.transform = 'scale(1)';
          preview.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          
          // 移除网格位置指示器
          const positionInfo = document.querySelector('.grid-position-info');
          if (positionInfo && positionInfo.parentNode) {
            positionInfo.parentNode.removeChild(positionInfo);
          }
          
          // 移除网格辅助线
          const gridHelpers = document.querySelectorAll('.grid-helper-line');
          gridHelpers.forEach(helper => {
            if (helper.parentNode) {
              helper.parentNode.removeChild(helper);
            }
          });
          
          // 更新提示文字
          const label = preview.querySelector('.preview-label');
          if (label instanceof HTMLElement) {
            label.textContent = '拖回网格区域';
          }
        }
      }
    } catch (error) {
      console.error('更新预览位置失败:', error);
    }
  };
  
  // 处理拖拽释放
  const handleDragRelease = (e: MouseEvent) => {
    // 获取拖拽信息
    const dragInfo = window.__draggedPluginInfo;
    if (!dragInfo) {
      cleanupDragElements();
      return;
    }
    
    const { pluginId, tabId } = dragInfo;
    
    // 检查是否拖放到了其他标签容器上
    let targetFound = false;
    const tabContainerElements = document.querySelectorAll('[data-item-id^="tab-container-"]');
    
    tabContainerElements.forEach(container => {
      if (container instanceof HTMLElement) {
        const targetTabId = container.getAttribute('data-item-id');
        if (targetTabId && targetTabId !== tabId) {
          const rect = container.getBoundingClientRect();
          // 检查鼠标是否在这个标签容器内
          if (
            e.clientX >= rect.left && 
            e.clientX <= rect.right && 
            e.clientY >= rect.top && 
            e.clientY <= rect.bottom
          ) {
            try {
              // 获取store实例
              const store = useLayoutStore.getState();
              
              // 🎯 在合并前记录源容器的布局信息
              const sourceTabLayout = store.layout.find(item => item.i === tabId);
              const sourceTab = store.tabContainers.find(tab => tab.id === tabId);
              const willRemoveSourceContainer = sourceTab && sourceTab.plugins.length <= 1;
              
              console.log('🎯 拖拽合并检测:', {
                源容器: tabId,
                目标容器: targetTabId,
                源容器插件数量: sourceTab?.plugins.length,
                将移除源容器: willRemoveSourceContainer,
                源容器布局: sourceTabLayout ? `(${sourceTabLayout.x},${sourceTabLayout.y}) ${sourceTabLayout.w}x${sourceTabLayout.h}` : '未找到'
              });
              
              // 使用movePluginBetweenTabs函数，它已经集成了智能空间填充
              store.movePluginBetweenTabs(tabId, targetTabId, pluginId);
              
              targetFound = true;
              
              // 添加成功动画效果
              container.classList.add('tab-drop-highlight');
              setTimeout(() => {
                container.classList.remove('tab-drop-highlight');
              }, 500);
              
              // 显示成功提示
              const successIndicator = document.createElement('div');
              successIndicator.className = 'drop-success-indicator';
              successIndicator.textContent = '✓ 成功添加到标签组';
              successIndicator.style.position = 'absolute';
              successIndicator.style.top = '50%';
              successIndicator.style.left = '50%';
              successIndicator.style.transform = 'translate(-50%, -50%)';
              successIndicator.style.backgroundColor = 'rgba(39, 174, 96, 0.9)';
              successIndicator.style.color = 'white';
              successIndicator.style.padding = '12px 20px';
              successIndicator.style.borderRadius = '5px';
              successIndicator.style.fontSize = '16px';
              successIndicator.style.fontWeight = 'bold';
              successIndicator.style.zIndex = '1001';
              successIndicator.style.pointerEvents = 'none';
              successIndicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
              successIndicator.style.opacity = '1';
              successIndicator.style.transition = 'opacity 0.3s, transform 0.3s';
              
              container.appendChild(successIndicator);
              
              // 如果源容器被移除，显示特殊提示
              if (willRemoveSourceContainer) {
                const fillIndicator = document.createElement('div');
                fillIndicator.className = 'space-fill-indicator';
                fillIndicator.textContent = '🎯 智能空间填充已应用';
                fillIndicator.style.position = 'fixed';
                fillIndicator.style.top = '20px';
                fillIndicator.style.right = '20px';
                fillIndicator.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
                fillIndicator.style.color = 'white';
                fillIndicator.style.padding = '8px 12px';
                fillIndicator.style.borderRadius = '4px';
                fillIndicator.style.fontSize = '12px';
                fillIndicator.style.fontWeight = 'bold';
                fillIndicator.style.zIndex = '1002';
                fillIndicator.style.pointerEvents = 'none';
                fillIndicator.style.opacity = '0';
                fillIndicator.style.transition = 'opacity 0.3s';
                
                document.body.appendChild(fillIndicator);
                
                // 显示动画
                setTimeout(() => {
                  fillIndicator.style.opacity = '1';
                }, 100);
                
                // 消失动画
                setTimeout(() => {
                  fillIndicator.style.opacity = '0';
                  setTimeout(() => {
                    if (fillIndicator.parentNode) {
                      fillIndicator.parentNode.removeChild(fillIndicator);
                    }
                  }, 300);
                }, 3000);
              }
              
              // 添加消失动画
              setTimeout(() => {
                successIndicator.style.opacity = '0';
                successIndicator.style.transform = 'translate(-50%, -70%)';
                setTimeout(() => {
                  if (successIndicator.parentNode) {
                    successIndicator.parentNode.removeChild(successIndicator);
                  }
                }, 300);
              }, 1500);
              
              // 延迟保存布局，确保状态更新完成
              setTimeout(() => {
                try {
                  const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
                  if (currentLayoutId) {
                    saveCurrentLayout();
                    console.log('标签拖拽结束 - 布局已保存到现有布局:', currentLayoutId);
                  } else {
                    saveCurrentLayout('标签拖拽保存');
                    console.log('标签拖拽结束 - 布局已保存为新布局');
                  }
                  console.log('标签拖拽结束后布局已成功保存到本地存储');
                } catch (error) {
                  console.error('标签拖拽后保存布局失败:', error);
                }
              }, 200);
            } catch (error) {
              // 显示错误提示
              const errorIndicator = document.createElement('div');
              errorIndicator.className = 'drop-error-indicator';
              errorIndicator.textContent = '× 移动失败';
              errorIndicator.style.position = 'absolute';
              errorIndicator.style.top = '50%';
              errorIndicator.style.left = '50%';
              errorIndicator.style.transform = 'translate(-50%, -50%)';
              errorIndicator.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
              errorIndicator.style.color = 'white';
              errorIndicator.style.padding = '12px 20px';
              errorIndicator.style.borderRadius = '5px';
              errorIndicator.style.fontSize = '16px';
              errorIndicator.style.fontWeight = 'bold';
              errorIndicator.style.zIndex = '1001';
              errorIndicator.style.pointerEvents = 'none';
              errorIndicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
              
              container.appendChild(errorIndicator);
              
              setTimeout(() => {
                if (errorIndicator.parentNode) {
                  errorIndicator.parentNode.removeChild(errorIndicator);
                }
              }, 2000);
            }
          }
        }
      }
    });
    
    // 如果没有找到目标，检查是否拖放到了空白区域 (创建新的标签容器)
    if (!targetFound) {
      // 获取网格参数
      const gridParams = window.__gridParams;
      
      // 使用全局拖拽信息而不是局部状态变量
      if (gridParams && dragInfo && dragInfo.pluginId && dragInfo.tabId) {
        const { rect, rowHeight, margin, colWidth } = gridParams;
        
        // 检查是否在网格区域内
        const isInGrid = e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        
        if (isInGrid) {
          // 计算网格位置
          const gridX = Math.floor((e.clientX - rect.left) / (colWidth + margin));
          const gridY = Math.floor((e.clientY - rect.top) / (rowHeight + margin));
          
          // 限制在有效范围内
          const x = Math.max(0, Math.min(gridX, 11)); // 限制在0-11列内
          const y = Math.max(0, Math.min(gridY, 20)); // 限制在0-20行内
          
          // 调用拆分标签函数
          handleTabSplit(dragInfo.tabId, dragInfo.pluginId);
          targetFound = true;
        } else {
          console.log('鼠标释放位置不在网格区域内:', {
            鼠标位置: { x: e.clientX, y: e.clientY },
            网格区域: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
          });
        }
      } else {
        console.log('缺少拖拽信息或网格参数:', {
          hasGridParams: !!gridParams,
          hasDragInfo: !!dragInfo,
          dragInfo: dragInfo
        });
      }
    }
    
    // 清理拖拽状态和元素
    cleanupDragElements();
  };
  
  // 处理拖拽时拆分标签内容
  const handleTabSplit = (tabId: string, pluginId: string) => {
    try {
      // 获取当前鼠标位置，用于放置新容器
      const mousePosition = { x: 0, y: 0 };
      if (window.__draggedPluginPosition) {
        mousePosition.x = window.__draggedPluginPosition.x;
        mousePosition.y = window.__draggedPluginPosition.y;
      }
      
      // 获取网格参数
      const gridParams = window.__gridParams;
      if (gridParams) {
        const { rect, rowHeight, margin, colWidth } = gridParams;
        
        // 计算网格位置
        const gridX = Math.floor((mousePosition.x - rect.left) / (colWidth + margin));
        const gridY = Math.floor((mousePosition.y - rect.top) / (rowHeight + margin));
        
        // 限制在有效范围内
        const x = Math.max(0, Math.min(gridX, 11)); // 限制在0-11列内
        const y = Math.max(0, Math.min(gridY, 20)); // 限制在0-20行内
        
        // 调用store方法，将插件从原容器移除并创建新容器
        const store = useLayoutStore.getState();
        
        // 从原容器中移除插件，并自动创建新的独立布局
        store.removePluginFromTab(tabId, pluginId, {
          x: x,
          y: y,
          w: 6, // 默认宽度
          h: 6  // 默认高度
        });
        
        // 显示成功提示
        showSuccessIndicator(mousePosition.x, mousePosition.y);
        
        // 延迟保存布局，确保状态完全更新
        setTimeout(() => {
          try {
            const { saveCurrentLayout, currentLayoutId } = useLayoutStore.getState();
            if (currentLayoutId) {
              saveCurrentLayout();
              console.log('标签拆分结束 - 布局已保存到现有布局:', currentLayoutId);
            } else {
              saveCurrentLayout('标签拆分保存');
              console.log('标签拆分结束 - 布局已保存为新布局');
            }
            console.log('标签拆分结束后布局已成功保存到本地存储');
          } catch (error) {
            console.error('标签拆分后保存布局失败:', error);
          }
        }, 200);
        
      } else {
        console.error('无法获取网格参数，无法创建新容器');
        showErrorIndicator(mousePosition.x, mousePosition.y);
      }
    } catch (err) {
      console.error('从标签拆分插件失败:', err);
      
      // 显示错误提示
      if (window.__draggedPluginPosition) {
        showErrorIndicator(window.__draggedPluginPosition.x, window.__draggedPluginPosition.y);
      }
    } finally {
      // 清理拖拽状态
      cleanupDragElements();
    }
  };

  // 显示成功指示器
  const showSuccessIndicator = (x: number, y: number) => {
    const indicator = document.createElement('div');
    indicator.className = 'drop-success-indicator';
    indicator.style.position = 'fixed';
    indicator.style.left = `${x - 15}px`;
    indicator.style.top = `${y - 15}px`;
    indicator.style.width = '30px';
    indicator.style.height = '30px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
    indicator.style.border = '2px solid rgb(34, 197, 94)';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.zIndex = '10000';
    indicator.style.animation = 'success-indicator 1s forwards';
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes success-indicator {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // 添加成功图标
    indicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    
    document.body.appendChild(indicator);
    
    // 1秒后移除
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 1000);
  };

  // 显示错误指示器
  const showErrorIndicator = (x: number, y: number) => {
    const indicator = document.createElement('div');
    indicator.className = 'drop-error-indicator';
    indicator.style.position = 'fixed';
    indicator.style.left = `${x - 15}px`;
    indicator.style.top = `${y - 15}px`;
    indicator.style.width = '30px';
    indicator.style.height = '30px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    indicator.style.border = '2px solid rgb(239, 68, 68)';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.zIndex = '10000';
    indicator.style.animation = 'error-indicator 1s forwards';
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes error-indicator {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // 添加错误图标
    indicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    document.body.appendChild(indicator);
    
    // 1秒后移除
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 1000);
  };
  
  // 清理拖拽相关的元素和状态
  const cleanupDragElements = () => {
    try {
      console.log('清理拖拽元素和状态');
      
      // 清除全局拖拽标志
      (window as any).__isDraggingTab = false;
      (window as any).__isPotentialDrag = false;
      
      // 移除拖拽样式
      document.body.classList.remove('dragging');
      
      // 移除所有标签容器的高亮和提示样式
      const tabContainers = document.querySelectorAll('[data-item-id^="tab-container-"]');
      tabContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.classList.remove('tab-container-droppable');
          container.classList.remove('tab-container-hover');
          container.classList.remove('tab-drop-highlight');
          container.style.outline = '';
          
          // 移除所有提示元素
          const indicators = container.querySelectorAll('.tab-drop-indicator, .drop-zone-hint');
          indicators.forEach(ind => ind.remove());
        }
      });
      
      // 清理预览元素
      const previewElement = document.getElementById('plugin-drag-preview');
      if (previewElement && previewElement.parentNode) {
        previewElement.parentNode.removeChild(previewElement);
      }
      
      // 移除其他可能的旧预览元素
      const oldPreview = document.querySelector('.plugin-drag-preview');
      if (oldPreview && oldPreview.parentNode) {
        oldPreview.parentNode.removeChild(oldPreview);
      }
      
      // 移除网格辅助线和位置指示器
      ['grid-helper-line', 'grid-position-info'].forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(el => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      });
      
      // 移除成功/错误/取消指示器
      ['drop-success-indicator', 'drop-error-indicator', 'drop-cancel-indicator'].forEach(className => {
        const indicators = document.querySelectorAll(`.${className}`);
        indicators.forEach(ind => {
          if (ind.parentNode) {
            ind.parentNode.removeChild(ind);
          }
        });
      });
      
      // 清理状态
      setDraggedTabPluginId(null);
      setDraggedTabId(null);
      setPreviewPosition(null);
      
      // 清理全局状态
      delete window.__draggedPluginInfo;
      delete window.__draggedPluginPosition;
      delete window.__gridParams;
      
      // 清理最近删除的插件标记，允许后续操作
      setTimeout(() => {
        window.__recentlyRemovedPlugins = {};
      }, 500);
      
      // 移除事件监听器
      if (window.__handleDragMouseMove) {
        document.removeEventListener('mousemove', window.__handleDragMouseMove);
        delete window.__handleDragMouseMove;
      }
      
      if (window.__handleDragMouseUp) {
        document.removeEventListener('mouseup', window.__handleDragMouseUp);
        delete window.__handleDragMouseUp;
      }
    } catch (error) {
      console.error('清理拖拽元素失败:', error);
    }
  };
  
  // 监听鼠标移动以检测拖拽悬停
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedPluginId) {
        checkDragOverPlugin(e);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [draggedPluginId, dragOverPluginId, isDragOver]);

  useEffect(() => {
    if (hoveredTabContainerId && draggedPluginId && window.__draggedPluginInfo?.isDraggingContainer) {
      const tabElement = document.querySelector(`[data-item-id="${hoveredTabContainerId}"]`);
      if (tabElement && !tabElement.querySelector('.tab-drag-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'tab-drag-indicator';
        indicator.textContent = '拖放这里添加到标签页';
        tabElement.appendChild(indicator);
      }
    } else {
      document.querySelectorAll('.tab-drag-indicator').forEach(el => el.remove());
    }
  }, [hoveredTabContainerId, draggedPluginId]);
  
  // 如果正在加载，显示加载提示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载插件...</p>
        </div>
      </div>
    );
  }
  
  // 如果布局为空，显示提示信息和重试按钮
  if (layout.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">未能加载默认插件</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
    <div ref={gridRef}>
      <ReactGridLayout
        className="layout !h-[80vh]"
        layout={layout}
        cols={12}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        onDragStart={onDragStart}
        onDragStop={onDragStop}
        onDrag={onDrag}
        isDraggable={true}
        isResizable={true}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        draggableHandle=".plugin-drag-handle"
        resizeHandles={['se', 'e', 's']}
        draggableCancel=".non-draggable"
      >
        {layout.map((item: Layout) => (
          <div 
            key={item.i} 
            data-item-id={item.i}
            className="border border-gray-200 rounded shadow-sm"
          >
            {/* 如果是标签容器，渲染TabContainer组件 */}
            {item.i.startsWith('tab-container-') ? (
              <TabContainer 
                plugins={
                  (() => {
                    const tabContainer = tabContainers.find(tab => tab.id === item.i);
                    const plugins = tabContainer?.plugins || [];
                    
                    return plugins;
                  })()
                }
                onRemovePlugin={(pluginId) => handleTabPluginRemove(item.i, pluginId)}
                onSplitTab={(pluginId) => handleTabSplit(item.i, pluginId)}
                onDragTab={(pluginId) => handleTabPluginDragStart(item.i, pluginId)}
                tabId={item.i}
              />
            ) : (
              /* 否则渲染普通插件容器 */
              <PluginContainer 
                pluginId={item.i} 
                onRemove={() => handleRemovePlugin(item.i)}
              />
            )}
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
