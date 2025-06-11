import { useState, useCallback } from 'react';
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import type { DragState, DragItem, TabContainer } from '../types';

interface UseDragDropProps {
  containers: TabContainer[];
  onPluginMove: (pluginId: string, fromContainer?: string, toContainer?: string) => void;
  onContainerMerge: (sourceId: string, targetId: string) => void;
  onContainerSplit: (containerId: string, pluginId: string) => void;
}

interface UseDragDropReturn {
  dragState: DragState;
  sensors: any[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  isDraggedOver: (containerId: string) => boolean;
}

export function useDragDrop({
  containers,
  onPluginMove,
  onContainerMerge,
  onContainerSplit,
}: UseDragDropProps): UseDragDropReturn {
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
    
    if (!over) {
      // 拖拽到空白区域，可能创建新的独立插件
      if (dragState.sourceContainer && dragState.dragSource === 'tab') {
        onContainerSplit(dragState.sourceContainer, active.id as string);
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
        onContainerMerge(activeId, overId);
      }
    }
    // 如果拖拽的是标签页
    else if (dragState.dragSource === 'tab') {
      const sourceContainer = dragState.sourceContainer;
      
      // 检查目标是否是容器
      const targetContainer = containers.find(c => c.id === overId);
      
      if (targetContainer && sourceContainer !== overId) {
        // 移动到另一个容器
        onPluginMove(activeId, sourceContainer, overId);
      } else if (!targetContainer) {
        // 拖拽到网格中，创建新的独立插件
        onContainerSplit(sourceContainer!, activeId);
      }
    }
    // 如果拖拽的是独立插件
    else if (dragState.dragSource === 'plugin') {
      const targetContainer = containers.find(c => c.id === overId);
      if (targetContainer) {
        // 将独立插件添加到容器中
        onPluginMove(activeId, undefined, overId);
      }
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      dragSource: null,
      sourceContainer: undefined,
      targetPosition: undefined,
    });
  }, [dragState, containers, onPluginMove, onContainerMerge, onContainerSplit]);

  // 检查容器是否被拖拽悬停
  const isDraggedOver = useCallback((containerId: string) => {
    return dragState.isDragging && dragState.targetPosition !== undefined;
  }, [dragState]);

  return {
    dragState,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDraggedOver,
  };
}

// 工具函数：生成拖拽项目数据
export function createDragItem(
  id: string,
  type: 'plugin' | 'tab' | 'container',
  sourceContainer?: string
): DragItem {
  return {
    id,
    type,
    sourceContainer,
  };
}

// 工具函数：检查两个容器是否可以合并
export function canMergeContainers(
  sourceContainer: TabContainer,
  targetContainer: TabContainer
): boolean {
  // 检查合并后的插件数量是否超过限制
  const maxPluginsPerContainer = 8; // 可配置的最大插件数量
  
  return sourceContainer.plugins.length + targetContainer.plugins.length <= maxPluginsPerContainer;
}

// 工具函数：生成唯一的容器ID
export function generateContainerId(): string {
  return `container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 