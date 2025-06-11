import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import RGL, { Layout, WidthProvider } from 'react-grid-layout';
import { useLayoutStore01 } from './store/layoutStore01';
import { ensurePluginsLoaded } from 'plugins/registry';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Transition } from '@headlessui/react';
import { useLocalStorage } from './hooks/useLocalStorage';
import PluginContainer from './PluginContainer';
import TabContainer from './TabContainer';
import LayoutControls from './LayoutControls';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './styles.css';

// 响应式网格布局
const ReactGridLayout = WidthProvider(RGL);

// 定义布局元素类型，用于区分普通插件和标签容器
type ItemType = 'plugin' | 'tabContainer';

// 扩展布局元素接口，添加元素类型标识
interface ExtendedLayoutItem extends Layout {
  itemType: ItemType;
}

// 全局类型声明
declare global {
  interface Window {
    __draggedPluginInfo?: {
      pluginId: string;
      tabId: string;
      startTime: number;
      confirmedDragTime?: number;
      isDraggingContainer?: boolean;
    };
    __currentDragTargetId?: string | null;
  }
}

/**
 * GridLayout01 组件 - 实现高级布局功能
 */
const GridLayout01: React.FC = () => {
  // 从自定义存储中获取状态和方法
  const {
    layout,
    activePlugins,
    tabContainers,
    updateLayout,
    removePlugin,
    initDefaultLayout,
    resetStore,
    savedLayouts,
    currentLayoutId,
    createTabContainer,
    removeTabContainer,
    addPluginToTab,
    movePluginBetweenTabs,
    convertToTab,
    removePluginFromTab,
    saveCurrentLayout,
    loadLayout,
    deleteLayout
  } = useLayoutStore01();

  // 组件状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedTabPluginId, setDraggedTabPluginId] = useState<string | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [hoveredContainerId, setHoveredContainerId] = useState<string | null>(null);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [token, setToken] = useState<any>(null);
  const [locale, setLocale] = useState('zh-CN');

  // 引用
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // DnD Kit 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动8像素后激活拖拽
      },
    })
  );

  // 首次加载时初始化默认布局
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        if (!isInitialized) {
          console.log('正在初始化GridLayout01布局...');
          
          // 确保插件已加载
          await ensurePluginsLoaded();
          console.log('插件已加载完成');
          
          // 检查是否有已保存的布局，没有则初始化默认布局
          if (savedLayouts.length === 0) {
            console.log('没有找到已保存的布局，初始化默认布局...');
            resetStore();
            initDefaultLayout();
          } else if (currentLayoutId) {
            console.log(`加载当前布局: ${currentLayoutId}`);
            loadLayout(currentLayoutId);
          }
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [isInitialized, initDefaultLayout, resetStore, savedLayouts.length, currentLayoutId, loadLayout]);

  // 布局变更处理
  const onLayoutChange = (newLayout: Layout[]) => {
    updateLayout(newLayout);
    
    // 自动保存当前布局
    if (currentLayoutId) {
      setTimeout(() => saveCurrentLayout(), 100);
    }
  };

  // 处理插件移除
  const handleRemovePlugin = (pluginId: string) => {
    console.log('移除插件:', pluginId);
    
    // 检查插件是否在标签容器中
    const containerWithPlugin = tabContainers.find(tab => tab.plugins.includes(pluginId));
    
    if (containerWithPlugin) {
      // 如果在标签容器中，使用标签容器的移除方法
      handleTabPluginRemove(containerWithPlugin.id, pluginId);
    } else {
      // 直接从布局中移除
      removePlugin(pluginId);
    }
  };
  
  // 处理从标签容器中移除插件
  const handleTabPluginRemove = (tabId: string, pluginId: string) => {
    console.log('从标签容器移除插件:', pluginId, '从', tabId);
    removePluginFromTab(tabId, pluginId);
  };

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggedItemId(active.id.toString());
    
    // 记录拖拽信息到全局
    window.__draggedPluginInfo = {
      pluginId: active.id.toString(),
      tabId: '',
      startTime: Date.now()
    };
    
    // 添加拖拽样式
    document.body.classList.add('dragging');
    
    // 高亮所有可能的放置目标（标签容器）
    document.querySelectorAll('[data-item-id^="tab-container-"]').forEach(el => {
      el.classList.add('potential-drop-target');
    });

    console.log('开始拖拽:', active.id.toString());
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('拖拽结束:', { active: active.id, over: over?.id });
    
    // 确保有有效的拖放目标
    if (!over) {
      // 清理拖拽状态
      setDraggedItemId(null);
      setHoveredContainerId(null);
      window.__draggedPluginInfo = undefined;
      window.__currentDragTargetId = null;
      document.body.classList.remove('dragging');
      
      // 移除所有高亮样式
      document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .potential-drop-target').forEach(el => {
        el.classList.remove('plugin-drag-over', 'tab-container-hover', 'potential-drop-target');
      });
      
      return;
    }
    
    // 获取源和目标ID
    const sourceId = active.id.toString();
    const targetId = over.id.toString();
    
    console.log('拖拽详情:', { sourceId, targetId });
    
    // 如果拖拽到了标签容器上
    if (targetId.startsWith('tab-container-')) {
      // 检查源是否也是标签容器
      if (sourceId.startsWith('tab-container-')) {
        // 处理容器之间的合并（标签容器到标签容器）
        console.log('尝试合并标签容器:', sourceId, '到', targetId);

        // 避免源容器和目标容器相同
        if (sourceId === targetId) {
          console.log('源和目标相同，取消操作');
        } else {
          // 查找源标签容器和目标标签容器
          const sourceTabContainer = tabContainers.find(tab => tab.id === sourceId);
          const targetTabContainer = tabContainers.find(tab => tab.id === targetId);
          
          // 确保两个容器都存在
          if (sourceTabContainer && targetTabContainer) {
            console.log('源容器插件:', sourceTabContainer.plugins);
            console.log('目标容器插件:', targetTabContainer.plugins);
            
            // 获取源标签容器中的所有插件
            const pluginsToMove = [...sourceTabContainer.plugins];
            
            if (pluginsToMove.length > 0) {
              console.log(`合并 ${pluginsToMove.length} 个插件从 ${sourceId} 到 ${targetId}`);
              
              // 将所有插件一一移动到目标标签容器
              pluginsToMove.forEach(pluginId => {
                movePluginBetweenTabs(sourceId, targetId, pluginId);
              });
              
              // 此时源容器应该为空并在movePluginBetweenTabs中被移除
              console.log('合并完成，检查源容器是否已移除');
              
              // 保存当前布局
              setTimeout(() => saveCurrentLayout(), 100);
              
              // 添加成功反馈动画
              const targetElement = containerRefs.current[targetId];
              if (targetElement) {
                targetElement.classList.add('tab-drop-highlight');
                setTimeout(() => {
                  targetElement.classList.remove('tab-drop-highlight');
                }, 500);
              }
            }
          } else {
            console.error('找不到源或目标标签容器:', { sourceId, targetId });
          }
        }
      } else {
        // 处理插件到标签容器的拖放
        try {
          const pluginId = sourceId;
          console.log('插件拖放到标签容器:', { targetTabId: targetId, pluginId });
          
          // 查找插件是否已经在某个标签容器中
          const containerWithPlugin = tabContainers.find(tab => tab.plugins.includes(pluginId));
          
          if (containerWithPlugin) {
            // 如果已在某个容器中，使用movePluginBetweenTabs
            console.log(`插件 ${pluginId} 已在容器 ${containerWithPlugin.id} 中，移动到 ${targetId}`);
            movePluginBetweenTabs(containerWithPlugin.id, targetId, pluginId);
          } else {
            // 从布局中删除插件并添加到标签容器
            console.log(`插件 ${pluginId} 不在任何容器中，直接添加到 ${targetId}`);
            
            // 首先从原始布局中移除该插件
            const filteredLayout = layout.filter(item => item.i !== pluginId);
            updateLayout(filteredLayout);
            
            // 添加插件到标签容器
            addPluginToTab(targetId, pluginId);
          }
          
          // 添加成功动画效果
          const targetElement = containerRefs.current[targetId];
          if (targetElement) {
            targetElement.classList.add('tab-drop-highlight');
            setTimeout(() => {
              targetElement.classList.remove('tab-drop-highlight');
            }, 500);
          }
          
          // 保存当前布局
          setTimeout(() => saveCurrentLayout(), 100);
        } catch (error) {
          console.error('添加插件到标签容器失败:', error);
        }
      }
    }
    
    // 清理拖拽状态
    setDraggedItemId(null);
    setHoveredContainerId(null);
    window.__draggedPluginInfo = undefined;
    window.__currentDragTargetId = null;
    document.body.classList.remove('dragging');
    
    // 移除所有高亮样式
    document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .potential-drop-target').forEach(el => {
      el.classList.remove('plugin-drag-over', 'tab-container-hover', 'potential-drop-target');
    });

    // 清除所有after伪元素样式
    document.querySelectorAll('[data-item-id^="tab-container-"]').forEach(el => {
      (el as HTMLElement).style.position = '';
    });
  };

  // 添加容器悬停处理
  const handleDragOver = (event: any) => {
    const { over } = event;
    
    // 如果悬停在标签容器上
    if (over && over.id.toString().startsWith('tab-container-')) {
      const targetTabId = over.id.toString();
      setHoveredContainerId(targetTabId);
      
      // 添加悬停样式
      document.querySelectorAll('.tab-container-hover').forEach(el => {
        el.classList.remove('tab-container-hover');
      });
      
      const targetElement = containerRefs.current[targetTabId];
      if (targetElement) {
        targetElement.classList.add('tab-container-hover');
        
        // 增强视觉反馈
        enhanceDragOverVisualFeedback(targetElement);
      }
      
      console.log('悬停在容器上:', targetTabId);
    } else {
      setHoveredContainerId(null);
    }
  };

  // 增强拖拽反馈函数 - 添加视觉效果
  const enhanceDragOverVisualFeedback = (element: HTMLElement) => {
    // 添加脉冲动画效果
    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
    
    // 添加内部高亮边框
    const innerBorder = document.createElement('div');
    innerBorder.className = 'inner-highlight-border';
    innerBorder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 3px dashed #3b82f6;
      border-radius: 4px;
      pointer-events: none;
      animation: pulse-border 1.5s infinite;
      z-index: 10;
    `;
    
    // 移除已有的高亮边框
    const existingBorder = element.querySelector('.inner-highlight-border');
    if (existingBorder) {
      existingBorder.remove();
    }
    
    // 添加新边框
    element.style.position = 'relative';
    element.appendChild(innerBorder);
    
    // 3秒后自动移除高亮效果
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.transition = '';
      const border = element.querySelector('.inner-highlight-border');
      if (border) {
        border.remove();
      }
    }, 3000);
  };

  // 处理标签容器内标签拖拽
  const handleTabDragStart = (tabId: string, pluginId: string) => {
    console.log('标签拖拽开始:', pluginId, '从', tabId);
    setDraggedTabId(tabId);
    setDraggedTabPluginId(pluginId);
    
    // 记录拖拽信息到全局
    window.__draggedPluginInfo = {
      pluginId,
      tabId,
      startTime: Date.now()
    };
    
    // 添加拖拽样式
    document.body.classList.add('dragging');
    
    // 高亮所有可能的放置目标（其他标签容器）
    document.querySelectorAll('[data-item-id^="tab-container-"]').forEach(el => {
      if (el.getAttribute('data-item-id') !== tabId) {
        el.classList.add('potential-drop-target');
        
        // 为潜在目标添加视觉提示
        if (el instanceof HTMLElement) {
          // 更微妙的提示，不使用完整的高亮效果
          el.style.transition = 'all 0.3s ease';
          el.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.3)';
        }
      }
    });
  };

  // 处理标签拖拽结束和拖拽到其他标签容器
  const handleTabDragEnd = (event: DragEndEvent) => {
    if (!draggedTabId || !draggedTabPluginId) return;
    
    const { active, over } = event;
    
    // 如果拖拽到了另一个标签容器
    if (over && over.id.toString().startsWith('tab-container-') && over.id.toString() !== draggedTabId) {
      const targetTabId = over.id.toString();
      
      console.log('标签拖拽到其他标签容器:', {
        sourceTabId: draggedTabId,
        targetTabId,
        pluginId: draggedTabPluginId
      });
      
      try {
        // 在标签容器间移动插件
        movePluginBetweenTabs(draggedTabId, targetTabId, draggedTabPluginId);
        
        // 添加成功动画
        const targetElement = containerRefs.current[targetTabId];
        if (targetElement) {
          targetElement.classList.add('tab-drop-highlight');
          setTimeout(() => {
            targetElement.classList.remove('tab-drop-highlight');
          }, 500);
        }
        
        // 保存当前布局
        setTimeout(() => saveCurrentLayout(), 100);
      } catch (error) {
        console.error('移动插件失败:', error);
      }
    }
    
    // 清理拖拽状态
    setDraggedTabId(null);
    setDraggedTabPluginId(null);
    setHoveredContainerId(null);
    window.__draggedPluginInfo = undefined;
    window.__currentDragTargetId = null;
    document.body.classList.remove('dragging');
    
    // 移除所有高亮样式
    document.querySelectorAll('.plugin-drag-over, .tab-container-hover, .potential-drop-target').forEach(el => {
      el.classList.remove('plugin-drag-over', 'tab-container-hover', 'potential-drop-target');
      
      // 清理添加的内联样式
      if (el instanceof HTMLElement) {
        el.style.boxShadow = '';
        el.style.transition = '';
        
        // 移除内部高亮边框
        const border = el.querySelector('.inner-highlight-border');
        if (border) {
          border.remove();
        }
      }
    });
  };

  // 处理拆分标签为独立插件
  const handleTabSplit = (tabId: string, pluginId: string, position?: { x: number; y: number; w: number; h: number }) => {
    console.log('从标签拆分插件:', pluginId, '从', tabId);
    
    try {
      // 从标签容器中移除插件，同时提供放置位置信息
      removePluginFromTab(tabId, pluginId, position);
      
      // 保存布局
      setTimeout(() => saveCurrentLayout(), 100);
    } catch (error) {
      console.error('从标签拆分插件失败:', error);
    }
  };

  // 监听token变化，并传递到插件
  const handleTokenChange = useCallback((newToken: any) => {
    console.log('Token已更新:', newToken);
    setToken(newToken);
  }, []);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // 设置语言
  const setLanguage = useCallback((lang: string) => {
    setLocale(lang);
  }, []);

  // 添加清理空标签容器的函数
  const cleanupEmptyTabContainers = useCallback(() => {
    // 查找空的标签容器
    const emptyTabContainers = tabContainers.filter(tab => tab.plugins.length === 0);
    
    if (emptyTabContainers.length > 0) {
      console.log('发现空标签容器，开始清理...');
      
      // 为每个空容器创建一个过滤函数
      const emptyTabIds = emptyTabContainers.map(tab => tab.id);
      
      // 过滤掉空标签容器
      const filteredTabContainers = tabContainers.filter(tab => tab.plugins.length > 0);
      const filteredLayout = layout.filter(item => !emptyTabIds.includes(item.i));
      
      // 更新布局
      updateLayout(filteredLayout);
      
      // 保存更改
      setTimeout(() => saveCurrentLayout(), 100);
      
      console.log(`已清理 ${emptyTabIds.length} 个空标签容器`);
    }
  }, [tabContainers, layout, updateLayout, saveCurrentLayout]);

  // 在组件挂载和布局/标签容器更新时执行清理
  useEffect(() => {
    // 延迟执行以确保其他操作已完成
    const cleanupTimer = setTimeout(() => {
      cleanupEmptyTabContainers();
    }, 500);
    
    return () => clearTimeout(cleanupTimer);
  }, [layout, tabContainers, cleanupEmptyTabContainers]);

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
    <div className="grid-layout-container" ref={gridRef}>
      {/* 布局控制面板按钮 */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowLayoutControls(!showLayoutControls)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
          aria-label="布局控制"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
      
      {/* 布局控制面板 */}
      <Transition
        show={showLayoutControls}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <LayoutControls
          savedLayouts={savedLayouts}
          currentLayoutId={currentLayoutId}
          onLoadLayout={loadLayout}
          onSaveLayout={saveCurrentLayout}
          onDeleteLayout={deleteLayout}
          onClose={() => setShowLayoutControls(false)}
          onThemeToggle={toggleTheme}
          theme={theme}
          locale={locale}
          onLocaleChange={setLanguage}
        />
      </Transition>

      {/* DnD上下文提供拖拽功能 */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        modifiers={[restrictToWindowEdges]}
        collisionDetection={closestCenter}
      >
        {/* 网格布局 */}
        <ReactGridLayout
          className={`layout !h-[80vh] ${theme}`}
          layout={layout}
          cols={12}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
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
          {layout.map((item) => {
            // 查找对应的标签容器插件列表
            const containerPlugins = tabContainers.find(tab => tab.id === item.i)?.plugins || [];
            
            // 如果是空容器，不进行渲染
            if (containerPlugins.length === 0) {
              return null;
            }
            
            return (
              <div 
                key={item.i} 
                data-item-id={item.i}
                className="border border-gray-200 dark:border-gray-700 rounded shadow-sm bg-white dark:bg-gray-800"
                ref={(el) => containerRefs.current[item.i] = el}
              >
                {/* 所有容器都作为标签容器处理 */}
                <TabContainer 
                  plugins={containerPlugins}
                  onRemovePlugin={(pluginId) => handleTabPluginRemove(item.i, pluginId)}
                  onSplitTab={(pluginId) => handleTabSplit(item.i, pluginId)}
                  onDragTab={(pluginId) => handleTabDragStart(item.i, pluginId)}
                  tabId={item.i}
                  theme={theme}
                  token={token}
                  locale={locale}
                  onTokenChange={handleTokenChange}
                />
              </div>
            );
          })}
        </ReactGridLayout>
        
        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {draggedItemId && (
            <div className="plugin-drag-preview border-2 border-dashed border-blue-500 bg-blue-100 dark:bg-blue-900 bg-opacity-70 dark:bg-opacity-60 rounded-md p-4 flex items-center justify-center shadow-xl">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {draggedItemId.replace('official-', '')}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  拖动至标签容器合并
                </span>
              </div>
            </div>
          )}

          {draggedTabId && draggedTabPluginId && (
            <div className="plugin-drag-preview border-2 border-dashed border-blue-500 bg-blue-100 dark:bg-blue-900 bg-opacity-70 dark:bg-opacity-60 rounded-md p-4 flex items-center justify-center shadow-xl">
              <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {draggedTabPluginId.replace('official-', '')}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  拖动至标签容器或空白区域
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default GridLayout01; 