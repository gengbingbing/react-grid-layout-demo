import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';

import type { 
  TabContainer, 
  LayoutConfig as GridLayoutConfig,
  PluginProps 
} from '../types';
import { generateContainerId } from './useDragDrop';

// 扩展的布局状态接口
interface GridLayoutState {
  // 基础布局状态
  layout: Layout[];
  containers: TabContainer[];
  activePlugins: string[];
  
  // 当前选中的token和主题
  currentToken: any;
  theme: 'light' | 'dark';
  locale: string;
  
  // 布局操作
  updateLayout: (newLayout: Layout[]) => void;
  updateContainers: (containers: TabContainer[]) => void;
  
  // 插件操作
  addPlugin: (pluginId: string, position?: { x: number; y: number; w: number; h: number }) => void;
  removePlugin: (pluginId: string) => void;
  
  // 容器操作
  createTabContainer: (pluginIds: string[], position?: { x: number; y: number; w: number; h: number }) => void;
  mergeContainers: (sourceId: string, targetId: string) => void;
  splitContainer: (containerId: string, pluginId: string) => void;
  updateContainerActiveTab: (containerId: string, pluginId: string) => void;
  
  // 插件移动
  movePlugin: (pluginId: string, fromContainer?: string, toContainer?: string) => void;
  
  // 布局持久化
  saveLayout: (name: string) => void;
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  savedLayouts: GridLayoutConfig[];
  
  // Token和主题更新
  updateToken: (token: any) => void;
  updateTheme: (theme: 'light' | 'dark') => void;
  updateLocale: (locale: string) => void;
  
  // 重置
  reset: () => void;
}

// 默认布局
const DEFAULT_LAYOUT: Layout[] = [
  { i: 'official-price-card', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 6 },
  { i: 'official-price-chart', x: 3, y: 0, w: 9, h: 12, minW: 6, minH: 8 },
  { i: 'official-order-book', x: 0, y: 8, w: 4, h: 8, minW: 3, minH: 6 },
  { i: 'official-market-signals', x: 4, y: 12, w: 4, h: 6, minW: 3, minH: 4 },
  { i: 'official-twitter-sentiment', x: 8, y: 12, w: 4, h: 6, minW: 3, minH: 4 },
];

const DEFAULT_PLUGINS = [
  'official-price-card',
  'official-price-chart', 
  'official-order-book',
  'official-market-signals',
  'official-twitter-sentiment',
];

// 创建zustand store
export const useGridLayoutStore = create<GridLayoutState>()(
  persist(
    (set, get) => ({
      // 初始状态
      layout: DEFAULT_LAYOUT,
      containers: [],
      activePlugins: DEFAULT_PLUGINS,
      currentToken: null,
      theme: 'light',
      locale: 'zh-CN',
      savedLayouts: [],

      // 更新布局
      updateLayout: (newLayout: Layout[]) => {
        set({ layout: newLayout });
      },

      // 更新容器
      updateContainers: (containers: TabContainer[]) => {
        set({ containers });
      },

      // 添加插件
      addPlugin: (pluginId: string, position?) => {
        const { activePlugins, layout } = get();
        
        if (activePlugins.includes(pluginId)) {
          return; // 插件已存在
        }

        const newPosition = position || findEmptyPosition(layout);
        const newLayoutItem: Layout = {
          i: pluginId,
          x: newPosition.x,
          y: newPosition.y,
          w: newPosition.w,
          h: newPosition.h,
          minW: 2,
          minH: 4,
        };

        set({
          activePlugins: [...activePlugins, pluginId],
          layout: [...layout, newLayoutItem],
        });
      },

      // 移除插件
      removePlugin: (pluginId: string) => {
        const { activePlugins, layout, containers } = get();
        
        // 从活跃插件列表中移除
        const newActivePlugins = activePlugins.filter(id => id !== pluginId);
        
        // 从布局中移除
        const newLayout = layout.filter(item => item.i !== pluginId);
        
        // 从容器中移除
        const newContainers = containers.map(container => ({
          ...container,
          plugins: container.plugins.filter(id => id !== pluginId),
          activeTab: container.activeTab === pluginId 
            ? container.plugins.find(id => id !== pluginId) || container.plugins[0]
            : container.activeTab,
        })).filter(container => container.plugins.length > 0);

        set({
          activePlugins: newActivePlugins,
          layout: newLayout,
          containers: newContainers,
        });
      },

      // 创建标签容器
      createTabContainer: (pluginIds: string[], position?) => {
        const { containers, layout } = get();
        
        const containerId = generateContainerId();
        const newPosition = position || findEmptyPosition(layout);
        
        const newContainer: TabContainer = {
          id: containerId,
          plugins: pluginIds,
          activeTab: pluginIds[0],
        };

        const newLayoutItem: Layout = {
          i: containerId,
          x: newPosition.x,
          y: newPosition.y,
          w: newPosition.w,
          h: newPosition.h,
          minW: 4,
          minH: 6,
        };

        // 移除原有插件的布局项
        const newLayout = layout
          .filter(item => !pluginIds.includes(item.i))
          .concat(newLayoutItem);

        set({
          containers: [...containers, newContainer],
          layout: newLayout,
        });
      },

      // 合并容器
      mergeContainers: (sourceId: string, targetId: string) => {
        const { containers, layout } = get();
        
        const sourceContainer = containers.find(c => c.id === sourceId);
        const targetContainer = containers.find(c => c.id === targetId);
        
        if (!sourceContainer || !targetContainer) return;

        const updatedTargetContainer: TabContainer = {
          ...targetContainer,
          plugins: [...targetContainer.plugins, ...sourceContainer.plugins],
        };

        const newContainers = containers
          .filter(c => c.id !== sourceId)
          .map(c => c.id === targetId ? updatedTargetContainer : c);

        const newLayout = layout.filter(item => item.i !== sourceId);

        set({
          containers: newContainers,
          layout: newLayout,
        });
      },

      // 分离容器
      splitContainer: (containerId: string, pluginId: string) => {
        const { containers, layout } = get();
        
        const container = containers.find(c => c.id === containerId);
        if (!container) return;

        const remainingPlugins = container.plugins.filter(id => id !== pluginId);
        
        if (remainingPlugins.length === 0) {
          // 删除容器
          const newContainers = containers.filter(c => c.id !== containerId);
          const newLayout = layout.filter(item => item.i !== containerId);
          set({ containers: newContainers, layout: newLayout });
        } else {
          // 更新容器
          const updatedContainer: TabContainer = {
            ...container,
            plugins: remainingPlugins,
            activeTab: remainingPlugins.includes(container.activeTab) 
              ? container.activeTab 
              : remainingPlugins[0],
          };
          
          const newContainers = containers.map(c => 
            c.id === containerId ? updatedContainer : c
          );
          set({ containers: newContainers });
        }

        // 为分离的插件创建新的布局项
        const containerLayout = layout.find(item => item.i === containerId);
        if (containerLayout) {
          const newPluginLayout: Layout = {
            i: pluginId,
            x: containerLayout.x + containerLayout.w,
            y: containerLayout.y,
            w: 4,
            h: 6,
            minW: 2,
            minH: 4,
          };
          
          set({ layout: [...layout, newPluginLayout] });
        }
      },

      // 更新容器激活标签
      updateContainerActiveTab: (containerId: string, pluginId: string) => {
        const { containers } = get();
        
        const newContainers = containers.map(container => 
          container.id === containerId 
            ? { ...container, activeTab: pluginId }
            : container
        );
        
        set({ containers: newContainers });
      },

      // 移动插件
      movePlugin: (pluginId: string, fromContainer?: string, toContainer?: string) => {
        const { containers, layout, activePlugins } = get();
        
        // 如果移动到容器中
        if (toContainer) {
          const targetContainer = containers.find(c => c.id === toContainer);
          if (!targetContainer) return;

          // 如果插件已在目标容器中，直接返回
          if (targetContainer.plugins.includes(pluginId)) return;

          // 从源容器移除（如果有）
          let newContainers = containers;
          if (fromContainer) {
            newContainers = containers.map(container => 
              container.id === fromContainer
                ? {
                    ...container,
                    plugins: container.plugins.filter(id => id !== pluginId),
                    activeTab: container.activeTab === pluginId 
                      ? container.plugins.find(id => id !== pluginId) || container.plugins[0]
                      : container.activeTab,
                  }
                : container
            ).filter(container => container.plugins.length > 0);
          }

          // 添加到目标容器
          newContainers = newContainers.map(container => 
            container.id === toContainer
              ? {
                  ...container,
                  plugins: [...container.plugins, pluginId],
                  activeTab: pluginId, // 切换到新添加的插件
                }
              : container
          );

          // 移除独立插件的布局项
          const newLayout = layout.filter(item => item.i !== pluginId);

          set({ containers: newContainers, layout: newLayout });
        }
        // 如果从容器移动到网格
        else if (fromContainer) {
          get().splitContainer(fromContainer, pluginId);
        }
      },

      // 保存布局
      saveLayout: (name: string) => {
        const { layout, containers, activePlugins, savedLayouts } = get();
        
        const newLayout: GridLayoutConfig = {
          id: `layout-${Date.now()}`,
          name,
          layout: [...layout],
          containers: [...containers],
          activePlugins: [...activePlugins],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set({ savedLayouts: [...savedLayouts, newLayout] });
      },

      // 加载布局
      loadLayout: (layoutId: string) => {
        const { savedLayouts } = get();
        const savedLayout = savedLayouts.find(l => l.id === layoutId);
        
        if (savedLayout) {
          set({
            layout: savedLayout.layout,
            containers: savedLayout.containers,
            activePlugins: savedLayout.activePlugins,
          });
        }
      },

      // 删除布局
      deleteLayout: (layoutId: string) => {
        const { savedLayouts } = get();
        const newSavedLayouts = savedLayouts.filter(l => l.id !== layoutId);
        set({ savedLayouts: newSavedLayouts });
      },

      // 更新token
      updateToken: (token: any) => {
        set({ currentToken: token });
      },

      // 更新主题
      updateTheme: (theme: 'light' | 'dark') => {
        set({ theme });
      },

      // 更新语言
      updateLocale: (locale: string) => {
        set({ locale });
      },

      // 重置
      reset: () => {
        set({
          layout: DEFAULT_LAYOUT,
          containers: [],
          activePlugins: DEFAULT_PLUGINS,
          currentToken: null,
          theme: 'light',
          locale: 'zh-CN',
        });
      },
    }),
    {
      name: 'grid-layout-storage',
      partialize: (state) => ({
        layout: state.layout,
        containers: state.containers,
        activePlugins: state.activePlugins,
        savedLayouts: state.savedLayouts,
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);

// 寻找空位置的辅助函数
function findEmptyPosition(layout: Layout[], cols: number = 12): { x: number; y: number; w: number; h: number } {
  const grid: boolean[][] = Array(100).fill(null).map(() => Array(cols).fill(false));
  
  // 标记已占用的格子
  layout.forEach(item => {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        if (y < grid.length && x < cols) {
          grid[y][x] = true;
        }
      }
    }
  });
  
  const placeWidth = 4;
  const placeHeight = 6;
  
  // 查找合适位置
  for (let y = 0; y < grid.length - placeHeight; y++) {
    for (let x = 0; x <= cols - placeWidth; x++) {
      let canPlace = true;
      
      for (let dy = 0; dy < placeHeight && canPlace; dy++) {
        for (let dx = 0; dx < placeWidth && canPlace; dx++) {
          if (grid[y + dy][x + dx]) {
            canPlace = false;
          }
        }
      }
      
      if (canPlace) {
        return { x, y, w: placeWidth, h: placeHeight };
      }
    }
  }
  
  // 如果找不到合适位置，放在最后
  const maxY = Math.max(...layout.map(item => item.y + item.h), 0);
  return { x: 0, y: maxY, w: placeWidth, h: placeHeight };
}

// 导出用于组件使用的hook
export function useGridLayout() {
  const store = useGridLayoutStore();
  
  // 生成插件属性
  const pluginProps = useMemo((): PluginProps => ({
    token: store.currentToken,
    theme: store.theme,
    locale: store.locale,
    onTokenChange: store.updateToken,
  }), [store.currentToken, store.theme, store.locale, store.updateToken]);

  // 生成独立插件列表
  const standalonePlugins = useMemo(() => {
    return store.activePlugins.filter(pluginId => 
      !store.containers.some(container => container.plugins.includes(pluginId))
    );
  }, [store.activePlugins, store.containers]);

  return {
    ...store,
    pluginProps,
    standalonePlugins,
  };
} 