import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import cx from 'classnames';

import type { 
  GridLayoutDragProps, 
  TabContainer as TabContainerType,
  DragState,
} from './types';
import { TabContainer } from './TabContainer';
import { PluginWrapper } from './PluginWrapper';

// 导入样式
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const GridLayoutDrag: React.FC<GridLayoutDragProps> = ({
  layout,
  containers,
  activePlugins,
  className,
  style,
  cols = 12,
  rowHeight = 40,
  margin = [8, 8],
  containerPadding = [8, 8],
  isDraggable = true,
  isResizable = true,
  allowOverlap = false,
  onLayoutChange,
  onContainerChange,
  onPluginAdd,
  onPluginRemove,
  onPluginMove,
  pluginProps,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragSource: null,
    sourceContainer: undefined,
    targetPosition: undefined,
  });

  // 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px的移动距离才触发拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 生成拖拽项目ID列表
  const dragItemIds = useMemo(() => {
    const containerIds = containers.map(c => c.id);
    const standalonePlugins = activePlugins.filter(pluginId => 
      !containers.some(c => c.plugins.includes(pluginId))
    );
    return [...containerIds, ...standalonePlugins];
  }, [containers, activePlugins]);

  // 处理拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    
    // 确定拖拽源和类型
    let dragSource: 'plugin' | 'tab' | 'container' = 'plugin';
    let sourceContainer: string | undefined;

    // 检查是否从容器中拖拽
    for (const container of containers) {
      if (container.plugins.includes(activeId)) {
        sourceContainer = container.id;
        dragSource = 'tab';
        break;
      }
      if (container.id === activeId) {
        dragSource = 'container';
        break;
      }
    }

    setDragState({
      isDragging: true,
      draggedItem: activeId,
      dragSource,
      sourceContainer,
      targetPosition: undefined,
    });

    console.log('开始拖拽:', { activeId, dragSource, sourceContainer });
  }, [containers]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    if (over) {
      setDragState(prev => ({
        ...prev,
        targetPosition: {
          x: over.rect?.left || 0,
          y: over.rect?.top || 0,
        },
      }));
    }
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('拖拽结束:', { active: active.id, over: over?.id, dragState });
    
    if (!over) {
      // 拖拽到空白区域，可能创建新的独立插件
      if (dragState.sourceContainer && dragState.dragSource === 'tab') {
        handleContainerSplit(dragState.sourceContainer, active.id as string);
      }
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragSource: null,
        sourceContainer: undefined,
        targetPosition: undefined,
      });
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // 如果拖拽的是容器
    if (dragState.dragSource === 'container') {
      const targetContainer = containers.find(c => c.id === overId);
      if (targetContainer && activeId !== overId) {
        handleContainerMerge(activeId, overId);
      }
    }
    // 如果拖拽的是标签页
    else if (dragState.dragSource === 'tab') {
      const sourceContainer = dragState.sourceContainer;
      
      // 检查目标是否是容器
      const targetContainer = containers.find(c => c.id === overId);
      
      if (targetContainer && sourceContainer !== overId) {
        // 移动到另一个容器
        handlePluginMove(activeId, sourceContainer, overId);
      } else if (!targetContainer) {
        // 拖拽到网格中，创建新的独立插件
        handleContainerSplit(sourceContainer!, activeId);
      }
    }
    // 如果拖拽的是独立插件
    else if (dragState.dragSource === 'plugin') {
      const targetContainer = containers.find(c => c.id === overId);
      if (targetContainer) {
        // 将独立插件添加到容器中
        handlePluginMove(activeId, undefined, overId);
      }
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      dragSource: null,
      sourceContainer: undefined,
      targetPosition: undefined,
    });
  }, [dragState, containers]);

  // 处理插件移动
  const handlePluginMove = useCallback((pluginId: string, fromContainer?: string, toContainer?: string) => {
    console.log('移动插件:', { pluginId, fromContainer, toContainer });
    if (onPluginMove) {
      onPluginMove(pluginId, fromContainer, toContainer);
    }
  }, [onPluginMove]);

  // 处理容器合并
  const handleContainerMerge = useCallback((sourceId: string, targetId: string) => {
    console.log('合并容器:', { sourceId, targetId });
    const sourceContainer = containers.find(c => c.id === sourceId);
    const targetContainer = containers.find(c => c.id === targetId);
    
    if (sourceContainer && targetContainer && onContainerChange) {
      // 合并插件到目标容器
      const updatedTargetContainer: TabContainerType = {
        ...targetContainer,
        plugins: [...targetContainer.plugins, ...sourceContainer.plugins],
      };
      
      // 移除源容器，更新目标容器
      const updatedContainers = containers
        .filter(c => c.id !== sourceId)
        .map(c => c.id === targetId ? updatedTargetContainer : c);
      
      onContainerChange(updatedContainers);
    }
  }, [containers, onContainerChange]);

  // 处理容器分离（将插件从容器中拖出）
  const handleContainerSplit = useCallback((containerId: string, pluginId: string) => {
    console.log('分离容器:', { containerId, pluginId });
    const container = containers.find(c => c.id === containerId);
    
    if (container && onContainerChange) {
      const updatedPlugins = container.plugins.filter(id => id !== pluginId);
      
      if (updatedPlugins.length === 0) {
        // 如果容器为空，删除容器
        const updatedContainers = containers.filter(c => c.id !== containerId);
        onContainerChange(updatedContainers);
      } else {
        // 更新容器插件列表
        const updatedContainer: TabContainerType = {
          ...container,
          plugins: updatedPlugins,
          activeTab: updatedPlugins.includes(container.activeTab) 
            ? container.activeTab 
            : updatedPlugins[0],
        };
        
        const updatedContainers = containers.map(c => 
          c.id === containerId ? updatedContainer : c
        );
        onContainerChange(updatedContainers);
      }
    }
  }, [containers, onContainerChange]);

  // 处理标签点击
  const handleTabClick = useCallback((containerId: string, pluginId: string) => {
    console.log('标签点击:', { containerId, pluginId });
    if (onContainerChange) {
      const updatedContainers = containers.map(container => 
        container.id === containerId 
          ? { ...container, activeTab: pluginId }
          : container
      );
      onContainerChange(updatedContainers);
    }
  }, [containers, onContainerChange]);

  // 处理标签关闭
  const handleTabClose = useCallback((containerId: string, pluginId: string) => {
    console.log('关闭标签:', { containerId, pluginId });
    handleContainerSplit(containerId, pluginId);
    
    // 如果关闭的是激活标签，需要切换到下一个标签
    const container = containers.find(c => c.id === containerId);
    if (container && container.activeTab === pluginId) {
      const remainingPlugins = container.plugins.filter(id => id !== pluginId);
      if (remainingPlugins.length > 0) {
        handleTabClick(containerId, remainingPlugins[0]);
      }
    }
  }, [containers, handleTabClick, handleContainerSplit]);

  // 处理容器删除
  const handleContainerDelete = useCallback((containerId: string) => {
    console.log('删除容器:', containerId);
    if (onContainerChange) {
      const updatedContainers = containers.filter(c => c.id !== containerId);
      onContainerChange(updatedContainers);
    }
  }, [containers, onContainerChange]);

  // 处理网格布局变化
  const handleGridLayoutChange = useCallback((newLayout: Layout[]) => {
    console.log('布局变化:', newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  }, [onLayoutChange]);

  // 生成网格项目
  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    
    // 添加容器项目
    containers.forEach(container => {
      const containerLayout = layout.find(l => l.i === container.id);
      if (containerLayout) {
        items.push(
          <div 
            key={container.id} 
            className="grid-item-container"
            data-testid={`container-${container.id}`}
          >
            <TabContainer
              container={container}
              pluginProps={pluginProps}
              onTabClick={(pluginId) => handleTabClick(container.id, pluginId)}
              onTabClose={(pluginId) => handleTabClose(container.id, pluginId)}
              onContainerDelete={() => handleContainerDelete(container.id)}
              isDragging={dragState.draggedItem === container.id}
              className={cx({
                'ring-2 ring-blue-400 ring-opacity-50': dragState.isDragging && dragState.draggedItem !== container.id,
              })}
            />
          </div>
        );
      }
    });
    
    // 添加独立插件项目
    const standalonePlugins = activePlugins.filter(pluginId => 
      !containers.some(c => c.plugins.includes(pluginId))
    );
    
    standalonePlugins.forEach(pluginId => {
      const pluginLayout = layout.find(l => l.i === pluginId);
      if (pluginLayout) {
        items.push(
          <div 
            key={pluginId} 
            className="grid-item-plugin"
            data-testid={`plugin-${pluginId}`}
          >
            <motion.div
              className={cx(
                'h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden',
                'border border-gray-200 dark:border-gray-700',
                'cursor-move',
                {
                  'ring-2 ring-blue-400 ring-opacity-50': dragState.draggedItem === pluginId,
                  'scale-105 shadow-xl': dragState.draggedItem === pluginId,
                }
              )}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {/* 插件拖拽手柄 */}
              <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-2 cursor-move">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {pluginId.replace('official-', '').replace(/-/g, ' ')}
                  </span>
                  <button
                    onClick={() => onPluginRemove?.(pluginId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="h-full">
                <PluginWrapper
                  pluginId={pluginId}
                  pluginProps={pluginProps}
                  isActive={true}
                  className="h-full"
                />
              </div>
            </motion.div>
          </div>
        );
      }
    });
    
    return items;
  }, [
    containers, 
    activePlugins, 
    layout, 
    pluginProps, 
    dragState,
    handleTabClick,
    handleTabClose,
    handleContainerDelete,
    onPluginRemove
  ]);

  // 渲染拖拽覆盖层
  const renderDragOverlay = () => {
    if (!dragState.isDragging || !dragState.draggedItem) {
      return null;
    }

    // 如果拖拽的是容器
    const draggedContainer = containers.find(c => c.id === dragState.draggedItem);
    if (draggedContainer) {
      return (
        <div className="drag-overlay-container opacity-80">
          <TabContainer
            container={draggedContainer}
            pluginProps={pluginProps}
            onTabClick={() => {}}
            onTabClose={() => {}}
            isDragging={true}
            className="shadow-2xl scale-105"
          />
        </div>
      );
    }

    // 如果拖拽的是独立插件
    return (
      <div className="drag-overlay-plugin w-64 h-48 opacity-80">
        <motion.div
          className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1.05 }}
        >
          <div className="bg-gray-50 dark:bg-gray-900 p-2 border-b">
            <span className="text-sm font-medium">
              {dragState.draggedItem?.replace('official-', '').replace(/-/g, ' ')}
            </span>
          </div>
          <PluginWrapper
            pluginId={dragState.draggedItem}
            pluginProps={pluginProps}
            isActive={true}
            className="h-full"
          />
        </motion.div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext 
        items={dragItemIds} 
        strategy={rectSortingStrategy}
      >
        <div 
          className={cx(
            'grid-layout-drag-container relative w-full h-full',
            {
              'bg-blue-50 dark:bg-blue-900/10': dragState.isDragging,
            },
            className
          )}
          style={style}
        >
          {/* 主要网格布局 */}
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: cols, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={rowHeight}
            margin={margin}
            containerPadding={containerPadding}
            isDraggable={isDraggable}
            isResizable={isResizable}
            allowOverlap={allowOverlap}
            onLayoutChange={handleGridLayoutChange}
            useCSSTransforms={true}
            preventCollision={!allowOverlap}
            draggableHandle=".react-grid-dragHandleExample"
          >
            {gridItems}
          </ResponsiveGridLayout>

          {/* 拖拽覆盖层 */}
          <DragOverlay>
            {renderDragOverlay()}
          </DragOverlay>

          {/* 拖拽状态指示器 */}
          <AnimatePresence>
            {dragState.isDragging && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  正在拖拽: {dragState.draggedItem?.replace('official-', '').replace(/-/g, ' ')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 调试信息 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
              <div>容器数量: {containers.length}</div>
              <div>活跃插件: {activePlugins.length}</div>
              <div>拖拽状态: {dragState.isDragging ? '进行中' : '空闲'}</div>
              <div>拖拽项目: {dragState.draggedItem || '无'}</div>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}; 