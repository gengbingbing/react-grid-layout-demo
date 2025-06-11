import type { Layout } from 'react-grid-layout';

// 插件通信属性接口
export interface PluginProps {
  token: any; // 当前选中的token
  theme: 'light' | 'dark';
  locale: string; // 国际化语言代码
  onTokenChange?: (token: string) => void; // 跨插件通信
}

// 标签容器接口
export interface TabContainer {
  id: string;         // 容器ID
  plugins: string[];  // 包含的插件ID列表
  activeTab: string;  // 当前激活的标签
  layout?: Layout;    // 容器在网格中的布局信息
}

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  draggedItem: string | null;
  dragSource: 'plugin' | 'tab' | 'container' | null;
  sourceContainer?: string;
  targetPosition?: { x: number; y: number };
}

// 容器调整大小的状态
export interface ResizeState {
  isResizing: boolean;
  resizingContainer: string | null;
  initialSize?: { width: number; height: number };
}

// 拖拽项目的数据
export interface DragItem {
  id: string;
  type: 'plugin' | 'tab' | 'container';
  sourceContainer?: string;
  layout?: Layout;
}

// 放置目标的数据
export interface DropTarget {
  id: string;
  type: 'container' | 'grid' | 'tab';
  acceptedTypes: string[];
  position?: { x: number; y: number };
}

// 容器配置
export interface ContainerConfig {
  id: string;
  title?: string;
  plugins: string[];
  activeTab: string;
  layout: Layout;
  resizable: boolean;
  deletable: boolean;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

// 网格布局拖拽组件的Props
export interface GridLayoutDragProps {
  // 基础属性
  className?: string;
  style?: React.CSSProperties;
  
  // 布局配置
  layout: Layout[];
  containers: TabContainer[];
  activePlugins: string[];
  
  // 网格设置
  cols?: number;
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
  
  // 拖拽设置
  isDraggable?: boolean;
  isResizable?: boolean;
  allowOverlap?: boolean;
  
  // 回调函数
  onLayoutChange?: (newLayout: Layout[]) => void;
  onContainerChange?: (containers: TabContainer[]) => void;
  onPluginAdd?: (pluginId: string) => void;
  onPluginRemove?: (pluginId: string) => void;
  onPluginMove?: (pluginId: string, fromContainer?: string, toContainer?: string) => void;
  
  // 插件通信
  pluginProps?: PluginProps;
}

// 标签页组件的Props
export interface TabHeaderProps {
  container: TabContainer;
  onTabClick: (pluginId: string) => void;
  onTabClose: (pluginId: string) => void;
  onTabDrag: (pluginId: string, dragData: DragItem) => void;
  isEditable?: boolean;
  className?: string;
}

// 插件包装器的Props
export interface PluginWrapperProps {
  pluginId: string;
  pluginProps?: PluginProps;
  isActive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// 容器调整控制柄的Props
export interface ResizeHandleProps {
  containerId: string;
  direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  onResize: (containerId: string, delta: { width: number; height: number }) => void;
  className?: string;
}

// 拖拽覆盖层的Props
export interface DragOverlayProps {
  draggedItem: DragItem | null;
  isDragging: boolean;
  className?: string;
}

// 布局持久化相关
export interface LayoutConfig {
  id: string;
  name: string;
  layout: Layout[];
  containers: TabContainer[];
  activePlugins: string[];
  createdAt: number;
  updatedAt: number;
}

// 布局管理器的配置
export interface LayoutManagerConfig {
  autoSave?: boolean;
  saveInterval?: number;
  maxSavedLayouts?: number;
  storageKey?: string;
} 