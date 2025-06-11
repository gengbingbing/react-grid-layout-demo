import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { pluginRegistry } from 'plugins/registry';

// 全局类型声明
declare global {
  interface Window {
    __recentlyRemovedPlugins?: {
      [pluginId: string]: number;
    };
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
    __lastDragCheck?: number;
  }
}

// 布局配置接口
interface LayoutConfig {
  id: string;         // 布局ID
  name: string;       // 布局名称
  layout: Layout[];   // 布局配置
  activePlugins: string[]; // 活跃插件
  tabContainers: TabGroup[]; // 标签容器
  createdAt: number;  // 创建时间
  updatedAt: number;  // 更新时间
}

// 添加TabContainer接口
interface TabGroup {
  id: string;         // 容器ID
  plugins: string[];  // 包含的插件ID列表
}

interface LayoutState {
  layout: Layout[];
  activePlugins: string[];
  // 新增: 标签容器组
  tabContainers: TabGroup[];
  updateLayout: (newLayout: Layout[]) => void;
  addPlugin: (pluginId: string) => void;
  removePlugin: (pluginId: string) => void;
  updateAllPluginsToken: (token: string, address: string) => void;
  hasInitializedDefault: boolean;
  initDefaultLayout: () => void;
  resetStore: () => void;
  // 新增: 标签页相关操作
  createTabContainer: (firstPluginId: string, secondPluginId: string) => void; 
  removePluginFromTab: (tabId: string, pluginId: string, customPosition?: {x: number, y: number, w: number, h: number}) => void;
  removeTabContainer: (tabId: string) => void;
  // 新增: 向Tab容器添加插件
  addPluginToTab: (tabId: string, pluginId: string) => void;
  // 新增: 将单个插件转换为标签容器
  convertToTab: (pluginId: string) => void;
  // 新增: 合并标签容器
  moveTabContainers: (sourceId: string, targetId: string) => void;
  _lastTokenUpdate?: number; // 用于跟踪token更新时间
  // 新增允许将插件从一个标签容器移动到另一个标签容器的函数
  movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => void;
  
  // 新增：多布局支持
  savedLayouts: LayoutConfig[]; // 保存的布局列表
  currentLayoutId: string | null; // 当前激活的布局ID
  saveCurrentLayout: (name?: string) => void; // 保存当前布局
  loadLayout: (layoutId: string) => void; // 加载指定布局
  deleteLayout: (layoutId: string) => void; // 删除指定布局
  renameLayout: (layoutId: string, newName: string) => void; // 重命名布局
  
  // 新增: 获取标签容器中的插件列表
  getTabPlugins: (tabId: string) => string[];
  // 新增: 更新容器尺寸
  updateItemSize: (itemId: string, width: number, height: number) => void;
  // 新增: 从布局中移除项目
  removeItemFromLayout: (itemId: string) => void;
  // 新增: 更新活跃容器
  updateActiveContainer?: (containerId: string) => void;
  // 活跃容器列表
  activeContainers?: string[];
}

// 默认添加的6个插件
const DEFAULT_PLUGINS = [
  'official-price-card',
  'official-price-chart', 
  'official-order-book',
  'official-market-signals',
  'official-twitter-sentiment',
  'official-onchain-data'
];

// 默认布局配置
const DEFAULT_LAYOUT: Layout[] = [
  // 价格卡片 - 固定在左上角
  {
    i: 'official-price-card',
    x: 0,
    y: 0,
    w: 5,
    h: 16,
    minW: 3,
    minH: 4,
    static: true // 设置为静态，不可拖动
  },
  // K线图插件
  {
    i: 'official-price-chart',
    x: 5,
    y: 0,
    w: 7,
    h: 16,
    minW: 4,
    minH: 4
  },
  // 订单簿插件
  {
    i: 'official-order-book',
    x: 0,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 市场信号插件
  {
    i: 'official-market-signals',
    x: 4,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 推特舆情插件
  {
    i: 'official-twitter-sentiment',
    x: 8,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 链上数据插件
  {
    i: 'official-onchain-data',
    x: 0,
    y: 14,
    w: 12,
    h: 6,
    minW: 6,
    minH: 4
  }
];

// 寻找布局中的空位
const findEmptyPosition = (layout: Layout[], cols: number = 12) => {
  // 创建一个二维数组表示网格
  // 先初始化足够大的网格（假设最大占用高度为100行）
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
  
  // 找到能放置w=6, h=6的空位
  const placeWidth = 6;
  const placeHeight = 6;
  
  // 从上到下，从左到右查找合适位置
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x <= cols - placeWidth; x++) {
      let canPlace = true;
      
      // 判断从(x,y)开始的区域是否都是空的
      for (let cy = y; cy < y + placeHeight; cy++) {
        for (let cx = x; cx < x + placeWidth; cx++) {
          if (cy < grid.length && grid[cy][cx]) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }
      
      if (canPlace) {
        return { x, y };
      }
    }
  }
  
  // 如果没有找到合适位置，则放在最底部
  const maxY = layout.length > 0 ? Math.max(...layout.map(item => item.y + item.h)) : 0;
  return { x: 0, y: maxY };
};

// 布局直接存储在localStorage中的键名
export const LAYOUTS_STORAGE_KEY = 'termini-saved-layouts';
export const CURRENT_LAYOUT_ID_KEY = 'termini-current-layout-id';

// 通知布局列表变化的辅助函数
const notifyLayoutsChanged = () => {
  if (typeof window !== 'undefined') {
    // 触发自定义事件通知布局变化
    window.dispatchEvent(new Event('layoutsChanged'));
    console.log('已触发layoutsChanged事件');
  }
};

// 创建初始状态
const initialState = {
  layout: [], // 保持空，不直接使用DEFAULT_LAYOUT
  activePlugins: [], // 保持空，不直接使用DEFAULT_PLUGINS
  hasInitializedDefault: false,
  tabContainers: [], // 初始没有标签容器
  savedLayouts: [], // 初始没有保存的布局
  currentLayoutId: null // 初始没有当前布局
};

// 添加日志函数用于调试布局存储
const logStorageState = (message: string) => {
  try {
    const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    const layouts = rawLayouts ? JSON.parse(rawLayouts) : [];
    const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
    
    console.group(`[布局存储日志] ${message}`);
    console.log(`- localStorage中布局数量: ${layouts.length}`);
    console.log(`- 当前布局ID: ${currentId || '无'}`);
    if (layouts.length > 0) {
      console.log('- 布局列表:', layouts.map((l: any) => ({ id: l.id, name: l.name })));
    }
    console.groupEnd();
  } catch (error) {
    console.error('布局存储日志错误:', error);
  }
};

// 从localStorage读取布局
export function loadLayoutFromStorage(layoutId: string): LayoutConfig | undefined {
  try {
    const layoutsData = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    if (!layoutsData) return undefined;
    
    const layouts = JSON.parse(layoutsData);
    return layouts.find((layout: LayoutConfig) => layout.id === layoutId);
  } catch (error) {
    console.error('从localStorage读取布局失败:', error);
    return undefined;
  }
}

// 添加一个工具方法用于检查插件是否已存在于页面中（包括标签容器内的插件）
const isPluginAlreadyActive = (state: LayoutState, pluginId: string): boolean => {
  // 检查是否在活跃插件列表中
  if (state.activePlugins.includes(pluginId)) {
    return true;
  }
  
  // 检查是否在任何标签容器中
  for (const tabContainer of state.tabContainers) {
    if (tabContainer.plugins.includes(pluginId)) {
      return true;
    }
  }
  
  return false;
};

// 替换现有插件而不是添加新的
const replaceExistingPlugin = (state: LayoutState, pluginId: string): LayoutState => {
  let updatedState = {...state};
  let pluginFound = false;
  
  // 首先检查是否在layoutStore的activePlugins中
  if (state.activePlugins.includes(pluginId)) {
    // 已经存在于主布局，不需要额外操作
    console.log(`插件 ${pluginId} 已在主布局中`);
    pluginFound = true;
    return state;
  }
  
  // 然后检查是否在某个标签容器中
  updatedState.tabContainers = state.tabContainers.map(tabContainer => {
    if (tabContainer.plugins.includes(pluginId)) {
      console.log(`插件 ${pluginId} 已存在于标签容器 ${tabContainer.id}`);
      pluginFound = true;
      // 从该标签容器中移除插件
      return {
        ...tabContainer,
        plugins: tabContainer.plugins.filter(id => id !== pluginId)
      };
    }
    return tabContainer;
  });
  
  // 清理空标签容器
  updatedState.tabContainers = updatedState.tabContainers.filter(tab => tab.plugins.length > 0);
  
  // 如果标签容器已更新，则更新布局
  if (pluginFound) {
    // 更新layout，移除空标签容器
    updatedState.layout = state.layout.filter(item => {
      if (item.i.startsWith('tab-container-')) {
        return updatedState.tabContainers.some(tab => tab.id === item.i);
      }
      return true;
    });
  }
  
  return updatedState;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      ...initialState,  // 使用默认初始状态
      
      // 获取标签容器中的插件列表
      getTabPlugins: (tabId: string) => {
        const state = get();
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.error(`未找到标签容器: ${tabId}`);
          return [];
        }
        return [...tabContainer.plugins]; // 返回插件列表的副本
      },
      
      // 更新容器尺寸
      updateItemSize: (itemId: string, width: number, height: number) => set((state) => {
        console.log(`更新容器尺寸: ${itemId}, 宽: ${width}, 高: ${height}`);
        const updatedLayout = state.layout.map(item => {
          if (item.i === itemId) {
            return {
              ...item,
              w: width,
              h: height
            };
          }
          return item;
        });
        
        return {
          ...state,
          layout: updatedLayout
        };
      }),
      
      // 从布局中移除项目
      removeItemFromLayout: (itemId: string) => set((state) => {
        console.log(`从布局中移除项目: ${itemId}`);
        // 移除布局项
        const updatedLayout = state.layout.filter(item => item.i !== itemId);
        
        // 如果是标签容器，也要从标签容器列表中移除
        let updatedTabContainers = state.tabContainers;
        if (itemId.startsWith('tab-container-')) {
          updatedTabContainers = state.tabContainers.filter(tab => tab.id !== itemId);
        }
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
      }),
      
      // 更新活跃容器
      updateActiveContainer: (containerId: string) => set((state) => {
        console.log(`设置活跃容器: ${containerId}`);
        // 确保容器存在
        const containerExists = state.tabContainers.some(tab => tab.id === containerId);
        if (!containerExists) {
          console.error(`未找到容器: ${containerId}`);
          return state;
        }
        
        return {
          ...state,
          activeContainers: [containerId]
        };
      }),
      
      // 更新布局
      updateLayout: (newLayout: Layout[]) => set((state) => {
        // 保持固定插件的位置不变
        const fixedPlugins = state.layout.filter(item => {
          const plugin = pluginRegistry.get(item.i);
          return plugin?.metadata.isFixed;
        });
        
        // 新布局中非固定的插件
        const regularPlugins = newLayout.filter(item => {
          const plugin = pluginRegistry.get(item.i);
          return !plugin?.metadata.isFixed;
        });
        
        const updatedLayout = [...fixedPlugins, ...regularPlugins];
        
        // 自动会触发持久化保存
        console.log('布局已更新，自动保存到本地存储');
        
        return { layout: updatedLayout };
      }),
      
      // 保存当前布局
      saveCurrentLayout: (name?: string) => set((state) => {
        const { layout, activePlugins, tabContainers } = state;
        const now = Date.now();
        
        logStorageState('保存布局前');
        
        // 创建新的布局配置
        const newLayout: LayoutConfig = {
          id: `layout_${now}`,
          name: name || `布局 ${state.savedLayouts.length + 1}`,
          layout: JSON.parse(JSON.stringify(layout)),
          activePlugins: [...activePlugins],
          tabContainers: JSON.parse(JSON.stringify(tabContainers)),
          createdAt: now,
          updatedAt: now
        };
        
        let updatedLayouts: LayoutConfig[] = [];
        let newCurrentId = state.currentLayoutId;
        
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const existingLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          console.log('从localStorage读取到布局数量:', existingLayouts.length);
          
          // 如果当前有激活的布局，尝试更新它
          if (state.currentLayoutId) {
            // 在已有布局中查找当前布局
            const existingIndex = existingLayouts.findIndex((layout: LayoutConfig) => layout.id === state.currentLayoutId);
            
            if (existingIndex >= 0) {
              // 更新现有布局
              existingLayouts[existingIndex] = {
                ...existingLayouts[existingIndex],
                layout: JSON.parse(JSON.stringify(layout)),
                activePlugins: [...activePlugins],
                tabContainers: JSON.parse(JSON.stringify(tabContainers)),
                updatedAt: now
              };
              updatedLayouts = existingLayouts;
              console.log(`更新现有布局: ${existingLayouts[existingIndex].name}`);
            } else {
              // 找不到当前布局，创建新布局
              updatedLayouts = [...existingLayouts, newLayout];
              newCurrentId = newLayout.id;
              console.log('找不到当前布局ID，创建新布局:', newLayout.id);
            }
          } else {
            // 没有当前布局ID，创建新布局
            updatedLayouts = [...existingLayouts, newLayout];
            newCurrentId = newLayout.id;
            console.log('创建新布局:', newLayout.id);
          }
          
          // 直接保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentId || '');
          
          console.log(`布局保存完成，当前共有 ${updatedLayouts.length} 个布局`);
          logStorageState('保存布局后');
          
          // 通知布局列表变化
          notifyLayoutsChanged();
        } catch (error) {
          console.error('保存布局失败:', error);
          // 出错时仍然尝试保存单个布局
          updatedLayouts = [...state.savedLayouts, newLayout];
          newCurrentId = newLayout.id;
        }
        
        return {
          savedLayouts: updatedLayouts,
          currentLayoutId: newCurrentId
        };
      }),
      
      // 加载指定布局
      loadLayout: (layoutId: string) => set((state) => {
        console.log(`尝试加载布局: ${layoutId}`);
        
        try {
          // 直接从localStorage读取布局数据，确保获取最新
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          if (!rawLayouts) {
            console.error('找不到布局数据');
            return state;
          }
          
          // 解析所有布局
          const allLayouts = JSON.parse(rawLayouts);
          console.log(`从localStorage读取到${allLayouts.length}个布局`);
          
          // 查找指定布局
          const layoutToLoad = allLayouts.find((layout: LayoutConfig) => layout.id === layoutId);
          
          if (!layoutToLoad) {
            console.error(`找不到布局ID: ${layoutId}`);
            return state;
          }
          
          console.log(`加载布局: ${layoutToLoad.name}`, {
            layoutElements: layoutToLoad.layout.length,
            activePlugins: layoutToLoad.activePlugins.length,
            tabContainers: layoutToLoad.tabContainers.length
          });
          
          // 保存当前布局ID到localStorage
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, layoutId);
          
          // 确保完整的深拷贝以避免引用问题
          return {
            layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
            activePlugins: [...layoutToLoad.activePlugins],
            tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers)),
            currentLayoutId: layoutId,
            savedLayouts: allLayouts // 确保加载所有布局到状态
          };
        } catch (error) {
          console.error('加载布局失败:', error);
          return state;
        }
      }),
      
      // 删除指定布局
      deleteLayout: (layoutId: string) => set((state) => {
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const existingLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          
          // 过滤掉要删除的布局
          const updatedLayouts = existingLayouts.filter((layout: LayoutConfig) => layout.id !== layoutId);
          
          // 如果删除的是当前布局，重置当前布局ID
          let newCurrentLayoutId = state.currentLayoutId;
          if (state.currentLayoutId === layoutId) {
            newCurrentLayoutId = updatedLayouts.length > 0 ? updatedLayouts[0].id : null;
          }
          
          // 保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          if (newCurrentLayoutId) {
            localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentLayoutId);
          } else {
            localStorage.removeItem(CURRENT_LAYOUT_ID_KEY);
          }
          
          console.log(`已删除布局 ${layoutId}，当前活动布局: ${newCurrentLayoutId}`);
          
          // 通知布局列表变化
          notifyLayoutsChanged();
          
          // 如果需要加载新的布局
          if (newCurrentLayoutId && newCurrentLayoutId !== state.currentLayoutId) {
            const layoutToLoad = updatedLayouts.find((l: LayoutConfig) => l.id === newCurrentLayoutId);
            if (layoutToLoad) {
              return {
                savedLayouts: updatedLayouts,
                currentLayoutId: newCurrentLayoutId,
                layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
                activePlugins: [...layoutToLoad.activePlugins], 
                tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers))
              };
            }
          }
          
          return {
            savedLayouts: updatedLayouts,
            currentLayoutId: newCurrentLayoutId
          };
        } catch (error) {
          console.error('删除布局失败:', error);
          return state;
        }
      }),
      
      // 重命名布局
      renameLayout: (layoutId: string, newName: string) => set((state) => {
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const currentLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          
          // 更新布局名称
          const updatedLayouts = currentLayouts.map((layout: LayoutConfig) => 
            layout.id === layoutId 
              ? { ...layout, name: newName, updatedAt: Date.now() }
              : layout
          );
          
          // 直接保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          
          // 通知布局列表变化
          notifyLayoutsChanged();
          
          return {
            savedLayouts: updatedLayouts
          };
        } catch (error) {
          console.error('重命名布局失败:', error);
          return state;
        }
      }),
      addPlugin: (pluginId: string) => set((state: LayoutState) => {
        console.log('尝试添加插件:', pluginId);
        
        // 检查插件是否已存在
        if (isPluginAlreadyActive(state, pluginId)) {
          console.log('插件已存在，将从现有位置移除:', pluginId);
          // 从任何可能的位置移除插件
          state = replaceExistingPlugin(state, pluginId);
        }
        
        // 3. 修改：所有插件都需要在标签容器中
        // 为新插件创建标签容器ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 找一个合适的位置
        const emptyPos = findEmptyPosition(state.layout);
        
        // 创建标签容器布局
        const tabLayout: Layout = {
          i: tabId,
          x: emptyPos.x,
          y: emptyPos.y,
          w: 6,
          h: 6,
          minW: 3,
          minH: 4
        };
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [pluginId]
        };
        
        console.log('为插件创建新标签容器:', pluginId, '在标签:', tabId);
        
        // 需要同时更新activePlugins，以便系统能够正确识别插件
        const updatedActivePlugins = [...state.activePlugins];
        if (!updatedActivePlugins.includes(pluginId)) {
          updatedActivePlugins.push(pluginId);
        }
        
        return {
          layout: [...state.layout, tabLayout],
          activePlugins: updatedActivePlugins,  // 仍然需要在activePlugins中保留插件ID
          tabContainers: [...state.tabContainers, newTabContainer]
        };
      }),
      removePlugin: (pluginId: string) => set((state: LayoutState) => {
        console.log('移除插件:', pluginId);
        
        // 检查插件是否最近被删除过，如果是则不再处理
        if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId]) {
          console.log('此插件最近已被删除，忽略操作:', pluginId);
          return state;
        }
        
        // 创建一个标记，表示此插件刚刚被删除，设置更长的过期时间
        const deleteTimestamp = Date.now();
        window.__recentlyRemovedPlugins = window.__recentlyRemovedPlugins || {};
        window.__recentlyRemovedPlugins[pluginId] = deleteTimestamp;
        
        // 首先检查插件是否在某个标签容器中
        let isInTab = false;
        let tabId: string | null = null;
        
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(pluginId)) {
            isInTab = true;
            tabId = tab.id;
            break;
          }
        }
        
        // 创建最终状态的深拷贝，防止直接修改引用
        let finalState = JSON.parse(JSON.stringify({
          ...state,
          // 首先移除活跃插件列表中的该插件
          activePlugins: state.activePlugins.filter(id => id !== pluginId)
        }));
        
        // 如果在标签容器中，先从标签容器中移除
        if (isInTab && tabId) {
          console.log(`插件${pluginId}在标签容器${tabId}中，从标签容器中移除`);
          
          // 获取标签容器
          const tabContainer = finalState.tabContainers.find(tab => tab.id === tabId);
          
          // 如果标签容器只有这一个插件，则需要移除整个标签容器
          if (tabContainer && tabContainer.plugins.length <= 1) {
            console.log(`标签容器${tabId}只有一个插件，移除整个标签容器`);
            
            // 移除标签容器布局
            finalState.layout = finalState.layout.filter(item => item.i !== tabId);
            
            // 移除标签容器
            finalState.tabContainers = finalState.tabContainers.filter(tab => tab.id !== tabId);
          }
          // 如果标签容器有多个插件，只移除该插件
          else if (tabContainer) {
            console.log(`标签容器${tabId}有多个插件，只移除插件${pluginId}`);
            
            // 更新标签容器，移除插件
            finalState.tabContainers = finalState.tabContainers.map(tab => {
              if (tab.id === tabId) {
                // 从标签容器中移除插件
                const updatedPlugins = tab.plugins.filter(id => id !== pluginId);
                
                // 如果移除后插件列表为空，返回null以便后续过滤掉这个标签容器
                if (updatedPlugins.length === 0) {
                  console.log(`标签容器${tabId}在移除插件后为空，将删除整个标签容器`);
                  return null;
                }
                
                return {
                  ...tab,
                  plugins: updatedPlugins
                };
              }
              return tab;
            }).filter(Boolean) as TabGroup[]; // 过滤掉null值（空标签容器）
            
            // 如果标签容器变为空，也需要从布局中移除
            finalState.layout = finalState.layout.filter(item => {
              if (item.i.startsWith('tab-container-')) {
                // 只保留还存在于tabContainers中的标签容器
                return finalState.tabContainers.some(tab => tab && tab.id === item.i);
              }
              return item.i !== pluginId; // 同时移除被删除的插件
            });
          }
        } else {
          // 不在标签容器中，直接从布局中移除
          finalState.layout = finalState.layout.filter(item => item.i !== pluginId);
        }
        
        // 添加额外的检查，确保不留下空标签容器
        finalState.tabContainers = finalState.tabContainers.filter(tab => tab && tab.plugins && tab.plugins.length > 0);
        
        // 确保布局中不包含已删除的标签容器
        finalState.layout = finalState.layout.filter(item => {
          if (item.i.startsWith('tab-container-')) {
            // 检查此标签容器ID是否还存在于tabContainers中
            return finalState.tabContainers.some(tab => tab && tab.id === item.i);
          }
          return true; // 保留非标签容器的项目
        });
        
        // 设置一个延迟时间更长的定时器清理标记
        setTimeout(() => {
          if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId] === deleteTimestamp) {
            delete window.__recentlyRemovedPlugins[pluginId];
            console.log('清除插件删除标记:', pluginId);
          }
        }, 5000);
        
        return finalState;
      }),
      updateAllPluginsToken: (token: string, address: string) => set((state: LayoutState) => {
        console.log('全局更新Token:', token, address);
        
        // 获取所有活跃插件的配置并更新token信息
        const activePluginIds = state.activePlugins;
        
        activePluginIds.forEach(pluginId => {
          const plugin = pluginRegistry.get(pluginId);
          if (plugin && pluginId !== 'official-price-card') { // 不修改自身
            // 获取当前配置
            const currentConfig = plugin.metadata.defaultConfig || {};
            
            // 更新token相关配置
            if (currentConfig.token !== undefined) {
              currentConfig.token = token;
            }
            
            // 更新地址相关字段
            if (currentConfig.address !== undefined) {
              currentConfig.address = address;
            }
            if (currentConfig.tokenAddress !== undefined) {
              currentConfig.tokenAddress = address;
            }
            
            // 更新交易对
            if (currentConfig.symbol !== undefined && pluginId.includes('chart')) {
              currentConfig.symbol = `${token}USDT`;
            }
            
            // 确保更新的配置被存储回插件
            plugin.metadata.defaultConfig = {...currentConfig};
            
            console.log(`已更新插件[${pluginId}]配置:`, currentConfig);
          }
        });
        
        // 强制触发状态更新以通知所有订阅者
        return { 
          ...state,
          // 添加时间戳来确保状态变化被检测到
          _lastTokenUpdate: Date.now()
        };
      }),
      initDefaultLayout: () => set((state: LayoutState) => {
        console.log('强制初始化默认布局...');
        
        // 完全重置状态，忽略之前的初始化状态检查，强制初始化
        localStorage.removeItem('termini-layout-storage');
        
        // 使用默认插件数组并预初始化
        const priceCardPlugin = 'official-price-card';
        const orderBookPlugin = 'official-order-book';
        const chartPlugin = 'official-price-chart';
        const signalsPlugin = 'official-market-signals';
        const twitterPlugin = 'official-twitter-sentiment';
        const onchainPlugin = 'official-onchain-data';
        
        // 确保所有插件都在activePlugins中注册
        const allPluginsIds = [
          priceCardPlugin, 
          chartPlugin,
          orderBookPlugin, 
          signalsPlugin, 
          twitterPlugin, 
          onchainPlugin
        ];
        
        // 创建一个标签容器来包含价格卡片
        const priceCardTabId = `tab-container-${Date.now()}`;
        
        // 创建一个标签容器来包含K线图
        const chartTabId = `tab-container-${Date.now() + 1}`;
        
        // 创建一个标签容器来包含订单簿
        const orderBookTabId = `tab-container-${Date.now() + 2}`;
        
        // 创建一个标签容器来包含市场信号
        const signalsTabId = `tab-container-${Date.now() + 3}`;
        
        // 创建一个标签容器来包含推特舆情
        const twitterTabId = `tab-container-${Date.now() + 4}`;
        
        // 创建一个标签容器来包含链上数据
        const onchainTabId = `tab-container-${Date.now() + 5}`;
        
        // 创建所有标签容器
        const tabContainers: TabGroup[] = [
          { id: priceCardTabId, plugins: [priceCardPlugin] },
          { id: chartTabId, plugins: [chartPlugin] },
          { id: orderBookTabId, plugins: [orderBookPlugin] },
          { id: signalsTabId, plugins: [signalsPlugin] },
          { id: twitterTabId, plugins: [twitterPlugin] },
          { id: onchainTabId, plugins: [onchainPlugin] }
        ];
        
        // 创建布局
        const layout: Layout[] = [];
        
        // 价格卡片布局
        const priceCardLayout = DEFAULT_LAYOUT.find(item => item.i === priceCardPlugin);
        if (priceCardLayout) {
          layout.push({
            i: priceCardTabId,
            x: priceCardLayout.x,
            y: priceCardLayout.y,
            w: priceCardLayout.w,
            h: priceCardLayout.h,
            minW: 3,
            minH: 4,
            static: true // 价格卡片是静态的
          });
        }
        
        // K线图布局
        const chartLayout = DEFAULT_LAYOUT.find(item => item.i === chartPlugin);
        if (chartLayout) {
          layout.push({
            i: chartTabId,
            x: chartLayout.x,
            y: chartLayout.y,
            w: chartLayout.w,
            h: chartLayout.h,
            minW: 4,
            minH: 4
          });
        }
        
        // 订单簿布局
        const orderBookLayout = DEFAULT_LAYOUT.find(item => item.i === orderBookPlugin);
        if (orderBookLayout) {
          layout.push({
            i: orderBookTabId,
            x: orderBookLayout.x,
            y: orderBookLayout.y,
            w: orderBookLayout.w,
            h: orderBookLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 市场信号布局
        const signalsLayout = DEFAULT_LAYOUT.find(item => item.i === signalsPlugin);
        if (signalsLayout) {
          layout.push({
            i: signalsTabId,
            x: signalsLayout.x,
            y: signalsLayout.y,
            w: signalsLayout.w,
            h: signalsLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 推特舆情布局
        const twitterLayout = DEFAULT_LAYOUT.find(item => item.i === twitterPlugin);
        if (twitterLayout) {
          layout.push({
            i: twitterTabId,
            x: twitterLayout.x,
            y: twitterLayout.y,
            w: twitterLayout.w,
            h: twitterLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 链上数据布局
        const onchainLayout = DEFAULT_LAYOUT.find(item => item.i === onchainPlugin);
        if (onchainLayout) {
          layout.push({
            i: onchainTabId,
            x: onchainLayout.x,
            y: onchainLayout.y,
            w: onchainLayout.w,
            h: onchainLayout.h,
            minW: 6,
            minH: 4
          });
        }
        
        console.log('初始化完成，布局元素数:', layout.length);
        console.log('标签容器数:', tabContainers.length);
        console.log('活跃插件数:', allPluginsIds.length);
        
        // 强制更新本地存储以确保保存成功
        setTimeout(() => {
          localStorage.setItem('termini-layout-storage', JSON.stringify({
            state: {
              layout,
              activePlugins: allPluginsIds,
              tabContainers,
              hasInitializedDefault: true,
              savedLayouts: [],
              currentLayoutId: null,
              _lastTokenUpdate: Date.now()
            },
            version: 3
          }));
          console.log('初始化布局已保存到本地存储');
        }, 100);
        
        return {
          layout,
          activePlugins: allPluginsIds,
          tabContainers,
          hasInitializedDefault: true
        };
      }),
      // 添加重置功能
      resetStore: () => set((state) => {
        // 清除本地存储
        localStorage.removeItem('termini-layout-storage');
        return initialState;
      }),
      
      // 创建标签容器
      createTabContainer: (firstPluginId: string, secondPluginId: string) => set((state) => {
        console.log(`创建标签容器: ${firstPluginId} + ${secondPluginId}`);
        
        let updatedState = {...state};
        let activePlugins = [...state.activePlugins];
        
        // 检查两个插件是否已经在某个标签容器中
        let isFirstPluginInTab = false;
        let isSecondPluginInTab = false;
        
        // 检查第一个插件
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(firstPluginId)) {
            isFirstPluginInTab = true;
            break;
          }
        }
        
        // 检查第二个插件
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(secondPluginId)) {
            isSecondPluginInTab = true;
            break;
          }
        }
        
        // 如果第一个插件不在标签容器中，确保在activePlugins中
        if (!isFirstPluginInTab && !activePlugins.includes(firstPluginId)) {
          activePlugins.push(firstPluginId);
        }
        
        // 如果第二个插件不在标签容器中，确保在activePlugins中
        if (!isSecondPluginInTab && !activePlugins.includes(secondPluginId)) {
          activePlugins.push(secondPluginId);
        }
        
        // 检查第二个插件是否已存在于其他位置
        if (isPluginAlreadyActive(state, secondPluginId) && secondPluginId !== firstPluginId) {
          console.log(`插件 ${secondPluginId} 已存在，将从现有位置移除`);
          updatedState = replaceExistingPlugin(updatedState, secondPluginId);
        }
        
        // 为新容器生成唯一ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 获取第一个插件的布局位置
        const firstPluginLayout = updatedState.layout.find(item => item.i === firstPluginId);
        if (!firstPluginLayout) {
          console.error(`未找到插件布局: ${firstPluginId}`);
          return updatedState;
        }
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [firstPluginId, secondPluginId]
        };
        
        // 创建TabContainer的布局项
        const tabContainerLayout: Layout = {
          i: tabId,
          x: firstPluginLayout.x,
          y: firstPluginLayout.y,
          w: Math.max(firstPluginLayout.w, 6), // 至少6个单位宽
          h: Math.max(firstPluginLayout.h, 8), // 至少8个单位高
          minW: 4,
          minH: 6
        };
        
        // 从现有布局中移除两个插件的布局
        const updatedLayout = updatedState.layout.filter(
          item => item.i !== firstPluginId && item.i !== secondPluginId
        );
        
        // 添加标签容器布局
        updatedLayout.push(tabContainerLayout);
        
        console.log('新标签容器创建成功:', tabId, '包含插件:', [firstPluginId, secondPluginId]);
        
        return {
          ...updatedState,
          layout: updatedLayout,
          tabContainers: [...updatedState.tabContainers, newTabContainer],
          activePlugins: activePlugins // 使用更新后的活跃插件列表
        };
      }),
      
      // 将单个普通插件转换为标签容器 (新增方法)
      convertToTab: (pluginId: string) => set((state) => {
        console.log(`将插件转换为标签容器: ${pluginId}`);
        
        // 检查插件是否已经在某个标签容器中
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(pluginId)) {
            console.log(`插件 ${pluginId} 已经在标签容器 ${tab.id} 中`);
            return state;
          }
        }
        
        // 检查插件是否在布局中
        const pluginLayout = state.layout.find(item => item.i === pluginId);
        if (!pluginLayout) {
          console.error(`未找到插件布局: ${pluginId}`);
          return state;
        }
        
        // 为新容器生成唯一ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [pluginId]
        };
        
        // 创建TabContainer的布局项
        const tabContainerLayout: Layout = {
          i: tabId,
          x: pluginLayout.x,
          y: pluginLayout.y,
          w: Math.max(pluginLayout.w, 6), // 至少6个单位宽
          h: Math.max(pluginLayout.h, 8), // 至少8个单位高
          minW: 4,
          minH: 6
        };
        
        // 从现有布局中移除插件
        const updatedLayout = state.layout.filter(item => item.i !== pluginId);
        
        // 添加标签容器布局
        updatedLayout.push(tabContainerLayout);
        
        console.log('新单插件标签容器创建成功:', tabId, '包含插件:', [pluginId]);
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: [...state.tabContainers, newTabContainer],
        };
      }),
      
      // 在布局Store中
      removePluginFromTab: (tabId: string, pluginId: string, customPosition?: {x: number, y: number, w: number, h: number}) => set((state) => {
        console.log('开始执行removePluginFromTab:', { tabId, pluginId, customPosition });
        
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.warn('标签容器不存在:', tabId);
          return state;
        }
        
        // 检查该插件是否存在于标签容器中
        if (!tabContainer.plugins.includes(pluginId)) {
          console.warn('插件不存在于标签容器中:', pluginId, tabId);
          return state;
        }
        
        // 检查此插件是否最近被删除过，如果是则不再处理
        if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId]) {
          console.log('此插件最近已被删除，忽略操作:', pluginId);
          return state;
        }
        
        // 创建一个标记，表示此插件刚刚被删除
        const deleteTimestamp = Date.now();
        window.__recentlyRemovedPlugins = window.__recentlyRemovedPlugins || {};
        window.__recentlyRemovedPlugins[pluginId] = deleteTimestamp;
        
        // 从标签容器中移除插件
        const updatedTabContainers = state.tabContainers.map(tab => {
          if (tab.id === tabId) {
            const updatedPlugins = tab.plugins.filter(id => id !== pluginId);
            // 如果标签容器为空，返回null以便过滤
            if (updatedPlugins.length === 0) {
              return null;
            }
            return {
              ...tab,
              plugins: updatedPlugins
            };
          }
          return tab;
        }).filter(Boolean) as TabGroup[]; // 过滤掉null值
        
        // 如果提供了customPosition，为拆分的插件创建新的标签容器
        let updatedLayout = state.layout;
        
        if (customPosition) {
          console.log('为拆分的插件创建新标签容器:', pluginId, customPosition);
          
          // 创建新的标签容器ID
          const newTabId = `tab-container-${Date.now()}`;
          
          // 创建新的标签容器布局项
          const newTabLayout: Layout = {
            i: newTabId,
            x: customPosition.x,
            y: customPosition.y,
            w: customPosition.w,
            h: customPosition.h,
            minW: 3,
            minH: 4
          };
          
          // 创建新的标签容器
          const newTabContainer: TabGroup = {
            id: newTabId,
            plugins: [pluginId]
          };
          
          // 添加新的标签容器
          updatedTabContainers.push(newTabContainer);
          
          // 将新的标签容器布局添加到布局中
          updatedLayout = [...state.layout, newTabLayout];
        }
        
        // 如果原标签容器变为空，从布局中移除
        if (!updatedTabContainers.some(tab => tab && tab.id === tabId)) {
          console.log('原标签容器变为空，从布局中移除:', tabId);
          updatedLayout = updatedLayout.filter(item => item.i !== tabId);
        }
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
      }),
      
      // 移除标签容器
      removeTabContainer: (tabId: string) => set((state) => {
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          return state;
        }
        
        // 标签容器的位置
        const tabLayout = state.layout.find(item => item.i === tabId);
        if (!tabLayout) {
          return state;
        }
        
        // 为容器中的每个插件创建新的布局项
        const newLayouts: Layout[] = tabContainer.plugins.map((pluginId, index) => ({
          i: pluginId,
          x: (tabLayout.x + index) % 12, // 横向排列
          y: tabLayout.y + (Math.floor(index / 2) * 6), // 每两个一行
          w: 6,
          h: 6,
          minW: 3,
          minH: 4
        }));
        
        // 从布局中移除标签容器
        const updatedLayout = state.layout.filter(item => item.i !== tabId);
        
        // 添加拆分后的插件布局
        return {
          ...state,
          layout: [...updatedLayout, ...newLayouts],
          tabContainers: state.tabContainers.filter(tab => tab.id !== tabId)
        };
      }),
      
      // 向Tab容器添加插件
      addPluginToTab: (tabId: string, pluginId: string) => set((state) => {
        console.log(`向Tab容器 ${tabId} 添加插件: ${pluginId}`);
        
        // 检查插件是否已存在于其他位置
        if (isPluginAlreadyActive(state, pluginId)) {
          console.log(`插件 ${pluginId} 已存在，将从现有位置移除`);
          // 从其他标签容器中移除
          state = replaceExistingPlugin(state, pluginId);
          
          // 确保从布局中移除
          state = {
            ...state,
            layout: state.layout.filter(item => item.i !== pluginId)
          };
        }
        
        // 检查Tab容器是否存在
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.error(`未找到Tab容器: ${tabId}`);
          return state;
        }
        
        // 如果插件已经在这个Tab中，不做操作
        if (tabContainer.plugins.includes(pluginId)) {
          console.log(`插件 ${pluginId} 已存在于Tab容器 ${tabId} 中`);
          return state;
        }
        
        let { activePlugins } = state;
        // 检查插件是否已存在于活跃插件中
        if (!state.activePlugins.includes(pluginId)) {
          // 先注册插件
          const plugin = pluginRegistry.get(pluginId);
          if (!plugin) {
            console.error(`未找到插件: ${pluginId}`);
            return state;
          }
          
          // 添加到活跃插件列表
          activePlugins = [...activePlugins, pluginId];
        }
        
        // 更新Tab容器中的插件列表
        const updatedTabContainers = state.tabContainers.map(tab => {
          if (tab.id === tabId) {
            return {
              ...tab,
              plugins: [...tab.plugins, pluginId]
            };
          }
          return tab;
        });
        
        // 同步插件token配置
        const priceCardPlugin = pluginRegistry.get('official-price-card');
        if (priceCardPlugin && state.activePlugins.includes('official-price-card')) {
          const plugin = pluginRegistry.get(pluginId);
          if (plugin) {
            const priceCardConfig = priceCardPlugin.metadata.defaultConfig || {};
            const currentConfig = plugin.metadata.defaultConfig || {};
            
            // 同步token和地址
            if (currentConfig.token !== undefined && priceCardConfig.token) {
              currentConfig.token = priceCardConfig.token;
            }
            
            if ((currentConfig.address !== undefined || currentConfig.tokenAddress !== undefined) 
                && priceCardConfig.address) {
              currentConfig.address = priceCardConfig.address;
              currentConfig.tokenAddress = priceCardConfig.address;
            }
            
            // 更新插件默认配置
            plugin.metadata.defaultConfig = {...currentConfig};
          }
        }
        
        return {
          ...state,
          layout: state.layout.filter(item => item.i !== pluginId), // 确保从外部布局中移除
          tabContainers: updatedTabContainers,
          activePlugins: activePlugins
        };
      }),
      // 添加允许将插件从一个标签容器移动到另一个标签容器的函数
      movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => set((state) => {
        console.log(`移动插件 ${pluginId} 从标签 ${sourceTabId} 到标签 ${targetTabId}`);
        
        // 检查源标签容器和目标标签容器是否存在
        const sourceTab = state.tabContainers.find(tab => tab.id === sourceTabId);
        const targetTab = state.tabContainers.find(tab => tab.id === targetTabId);
        
        if (!sourceTab || !targetTab) {
          console.error('源标签或目标标签不存在', { sourceTab, targetTab });
          return state;
        }
        
        // 检查插件是否在源标签容器中
        if (!sourceTab.plugins.includes(pluginId)) {
          console.error('插件不在源标签容器中', { 
            pluginId, 
            sourceTabId, 
            sourceTabPlugins: sourceTab.plugins 
          });
          return state;
        }
        
        // 检查插件是否已经在目标标签容器中
        if (targetTab.plugins.includes(pluginId)) {
          console.log('插件已经在目标标签容器中，无需移动');
          return state;
        }
        
        console.log('源标签容器插件数量:', sourceTab.plugins.length);
        
        // 从源标签容器中移除插件
        const updatedSourceTab = {
          ...sourceTab,
          plugins: sourceTab.plugins.filter(id => id !== pluginId)
        };
        
        // 将插件添加到目标标签容器
        const updatedTargetTab = {
          ...targetTab,
          plugins: [...targetTab.plugins, pluginId]
        };
        
        let updatedTabContainers;
        
        // 根据源标签容器的插件数量决定处理方式
        if (sourceTab.plugins.length <= 1) {
          // 如果源标签容器只有一个插件，在移除源容器的同时更新目标容器
          console.log('源标签容器只有一个插件，将移除源容器并添加到目标容器', {
            pluginToMove: pluginId,
            targetContainerId: targetTabId
          });
          
          updatedTabContainers = state.tabContainers
            .filter(tab => tab.id !== sourceTabId) // 移除源标签容器
            .map(tab => {
              if (tab.id === targetTabId) {
                // 更新目标标签容器
                return updatedTargetTab;
              }
              return tab;
            });
        } else {
          // 如果源标签容器有多个插件，同时更新源容器和目标容器
          console.log('源标签容器有多个插件，将更新源容器和目标容器');
          
          updatedTabContainers = state.tabContainers.map(tab => {
            if (tab.id === sourceTabId) return updatedSourceTab;
            if (tab.id === targetTabId) return updatedTargetTab;
            return tab;
          });
        }
        
        // 更新布局，如果源标签容器为空，从布局中移除
        let updatedLayout = state.layout;
        if (sourceTab.plugins.length <= 1) {
          console.log('从布局中移除空的源标签容器:', sourceTabId);
          updatedLayout = state.layout.filter(item => item.i !== sourceTabId);
        }
        
        console.log('更新后的标签容器:', updatedTabContainers);
        console.log('目标容器现在包含插件:', updatedTabContainers.find(tab => tab.id === targetTabId)?.plugins);
        
        const newState = {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
        
        // 验证状态更新
        console.log('movePluginBetweenTabs完成 - 状态验证:', {
          操作: `${pluginId} 从 ${sourceTabId} 到 ${targetTabId}`,
          新状态中的目标容器: newState.tabContainers.find(tab => tab.id === targetTabId),
          布局项数量: newState.layout.length,
          标签容器数量: newState.tabContainers.length
        });
        
        return newState;
      }),
      // 新增: 合并标签容器
      moveTabContainers: (sourceId: string, targetId: string) => set((state) => {
        console.log(`合并标签容器 ${sourceId} -> ${targetId}`);
        
        // 检查源标签容器和目标标签容器是否存在
        const sourceTab = state.tabContainers.find(tab => tab.id === sourceId);
        const targetTab = state.tabContainers.find(tab => tab.id === targetId);
        
        if (!sourceTab || !targetTab) {
          console.error('源标签或目标标签不存在', { sourceTab, targetTab });
          return state;
        }
        
        // 获取源标签容器中的所有插件
        const pluginsToMove = [...sourceTab.plugins];
        
        if (pluginsToMove.length === 0) {
          console.error('源标签容器没有插件可以移动');
          return state;
        }
        
        // 创建一个新的目标标签容器，添加所有源标签的插件
        const updatedTargetTab = {
          ...targetTab,
          plugins: [...targetTab.plugins, ...pluginsToMove]
        };
        
        // 获取源标签容器的布局信息
        const sourceLayout = state.layout.find(item => item.i === sourceId);
        
        // 从布局中移除源标签容器
        const updatedLayout = state.layout.filter(item => item.i !== sourceId);
        
        // 更新目标标签容器大小
        if (sourceLayout) {
          const targetLayout = state.layout.find(item => item.i === targetId);
          if (targetLayout) {
            // 选择两者中较大的尺寸
            const newW = Math.max(targetLayout.w, sourceLayout.w);
            const newH = Math.max(targetLayout.h, sourceLayout.h);
            
            // 更新目标容器的布局
            const finalLayout = updatedLayout.map(item => {
              if (item.i === targetId) {
                return {
                  ...item,
                  w: newW,
                  h: newH
                };
              }
              return item;
            });
            
            // 更新标签容器列表，移除源容器，更新目标容器
            const updatedTabContainers = state.tabContainers
              .filter(tab => tab.id !== sourceId)
              .map(tab => {
                if (tab.id === targetId) {
                  return updatedTargetTab;
                }
                return tab;
              });
            
            console.log('标签容器合并成功', {
              targetId,
              移动的插件: pluginsToMove,
              更新后的插件: updatedTargetTab.plugins
            });
            
            return {
              ...state,
              layout: finalLayout,
              tabContainers: updatedTabContainers
            };
          }
        }
        
        // 如果没有找到布局信息，至少还是要更新标签容器
        const updatedTabContainers = state.tabContainers
          .filter(tab => tab.id !== sourceId)
          .map(tab => {
            if (tab.id === targetId) {
              return updatedTargetTab;
            }
            return tab;
          });
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
      })
    }),
    {
      name: 'termini-layout-storage',
      // 增加版本号以适应新的数据结构
      version: 3,
      // 显式指定要持久化的状态字段 - 移除savedLayouts和currentLayoutId以避免冲突
      partialize: (state) => ({
        layout: state.layout,
        activePlugins: state.activePlugins,
        tabContainers: state.tabContainers,
        hasInitializedDefault: state.hasInitializedDefault,
        // 不再自动持久化这两个字段，由我们的直接localStorage操作来管理
        // savedLayouts: state.savedLayouts, 
        // currentLayoutId: state.currentLayoutId,
      }),
      // 当从存储加载时的钩子
      onRehydrateStorage: () => (state) => {
        console.log('布局状态已从存储中恢复:', {
          activePluginsCount: state?.activePlugins?.length || 0
        });
        
        // 手动加载savedLayouts和currentLayoutId
        try {
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
          
          if (rawLayouts) {
            const savedLayouts = JSON.parse(rawLayouts);
            console.log(`从localStorage读取到${savedLayouts.length}个布局`);
            console.log('布局列表:', savedLayouts.map((l: any) => ({ id: l.id, name: l.name })));
            
            // 更新state - 重要修复：在store初始化时确保布局列表不为空
            if (state) {
              state.savedLayouts = savedLayouts;
              state.currentLayoutId = currentId;
              console.log('已将布局数据加载到store，布局数量:', savedLayouts.length);
              
              // 实现额外安全保障：定期检查store中的布局列表是否正确
              setTimeout(() => {
                const storeState = useLayoutStore.getState();
                if (storeState.savedLayouts.length === 0 && savedLayouts.length > 0) {
                  console.warn('检测到store中的布局列表为空，但localStorage中有布局，尝试修复...');
                  useLayoutStore.setState({
                    savedLayouts: savedLayouts,
                    currentLayoutId: currentId
                  });
                }
              }, 1000);
            }
          }
        } catch (error) {
          console.error('手动加载布局数据失败:', error);
        }
      }
    }
  )
);

// 添加一个全局调试函数，用于在控制台中检查布局存储状态
export function checkLayoutStorageStatus() {
  try {
    // 检查localStorage中的数据
    const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
    
    const storeState = useLayoutStore.getState();
    
    console.group('布局存储状态检查');
    
    // 检查localStorage
    console.log('== localStorage 状态 ==');
    if (rawLayouts) {
      const layoutsData = JSON.parse(rawLayouts);
      console.log(`找到 ${layoutsData.length} 个保存的布局`);
      console.table(layoutsData.map((layout: LayoutConfig) => ({
        id: layout.id,
        name: layout.name,
        plugins: layout.activePlugins.length,
        tabs: layout.tabContainers.length,
        updated: new Date(layout.updatedAt).toLocaleString()
      })));
    } else {
      console.log('localStorage中没有布局数据');
    }
    console.log('当前布局ID:', currentId);
    
    // 检查store状态
    console.log('== Zustand Store 状态 ==');
    console.log(`Store中有 ${storeState.savedLayouts.length} 个布局`);
    console.log('Store当前布局ID:', storeState.currentLayoutId);
    
    if (storeState.savedLayouts.length > 0) {
      console.table(storeState.savedLayouts.map((layout: LayoutConfig) => ({
        id: layout.id,
        name: layout.name,
        plugins: layout.activePlugins.length,
        tabs: layout.tabContainers.length,
        updated: new Date(layout.updatedAt).toLocaleString()
      })));
    }
    
    console.log('== 状态比较 ==');
    const hasLocalStorage = rawLayouts !== null;
    const hasStoreLayouts = storeState.savedLayouts.length > 0;
    const idMatch = currentId === storeState.currentLayoutId;
    const countMatch = hasLocalStorage && hasStoreLayouts ? 
      JSON.parse(rawLayouts).length === storeState.savedLayouts.length : false;
    
    console.log('localStorage有布局数据:', hasLocalStorage);
    console.log('Store有布局数据:', hasStoreLayouts);
    console.log('当前布局ID匹配:', idMatch);
    console.log('布局数量匹配:', countMatch);
    
    console.groupEnd();
    
    return {
      localStorage: {
        hasData: hasLocalStorage,
        layoutsCount: hasLocalStorage ? JSON.parse(rawLayouts).length : 0,
        currentId
      },
      store: {
        hasData: hasStoreLayouts,
        layoutsCount: storeState.savedLayouts.length,
        currentId: storeState.currentLayoutId
      },
      isConsistent: idMatch && countMatch
    };
  } catch (error) {
    console.error('检查布局存储状态出错:', error);
    return { error: String(error) };
  }
}

// 将检查函数暴露到全局，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).checkLayoutStorage = checkLayoutStorageStatus;
}
