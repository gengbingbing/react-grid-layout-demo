import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { pluginRegistry } from 'plugins/registry';

// 定义标签组类型
export interface TabGroup {
  id: string;         // 标签容器ID
  plugins: string[];  // 包含的插件ID列表
}

// 布局配置接口
export interface LayoutConfig {
  id: string;         // 布局ID
  name: string;       // 布局名称
  layout: Layout[];   // 布局配置
  activePlugins: string[]; // 活跃插件
  tabContainers: TabGroup[]; // 标签容器
  createdAt: number;  // 创建时间
  updatedAt: number;  // 更新时间
}

// 布局存储状态接口
interface LayoutState {
  layout: Layout[];           // 当前布局配置
  activePlugins: string[];    // 当前活跃的插件列表
  hasInitializedDefault: boolean; // 是否已初始化默认布局
  tabContainers: TabGroup[];  // 当前标签容器列表
  savedLayouts: LayoutConfig[]; // 已保存的布局列表
  currentLayoutId: string | null; // 当前布局ID
  _lastTokenUpdate?: number;   // 上次Token更新时间
  
  // 更新布局方法
  updateLayout: (newLayout: Layout[]) => void;
  
  // 插件管理方法
  addPlugin: (pluginId: string, position?: { x: number; y: number; w: number; h: number }) => void;
  removePlugin: (pluginId: string) => void;
  
  // 标签容器管理方法
  createTabContainer: (pluginIds: string[], position?: { x: number; y: number; w: number; h: number }) => string;
  removeTabContainer: (tabId: string) => void;
  addPluginToTab: (tabId: string, pluginId: string) => void;
  removePluginFromTab: (tabId: string, pluginId: string, position?: { x: number; y: number; w: number; h: number }) => void;
  movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => void;
  convertToTab: (pluginId: string) => void;
  
  // 布局存储管理方法
  saveCurrentLayout: (name?: string) => void;
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  
  // 系统方法
  initDefaultLayout: () => void;
  resetStore: () => void;
  updateToken: (token: any) => void;
}

// 存储键
const LAYOUTS_STORAGE_KEY = 'termini-layouts-v1';
const CURRENT_LAYOUT_ID_KEY = 'termini-current-layout-id-v1';

// 默认布局配置
const DEFAULT_LAYOUT: Layout[] = [
  { i: 'official-price-card', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
  { i: 'official-price-chart', x: 3, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
  { i: 'official-order-book', x: 9, y: 0, w: 3, h: 10, minW: 3, minH: 6 },
  { i: 'official-market-signals', x: 0, y: 4, w: 3, h: 9, minW: 2, minH: 6 },
  { i: 'official-twitter-sentiment', x: 0, y: 13, w: 6, h: 8, minW: 3, minH: 6 },
  { i: 'official-onchain-data', x: 6, y: 10, w: 6, h: 8, minW: 3, minH: 6 }
];

// 默认插件列表
const DEFAULT_PLUGINS = [
  'official-price-card',
  'official-price-chart', 
  'official-order-book',
  'official-market-signals',
  'official-twitter-sentiment',
  'official-onchain-data'
];

// 创建初始状态
const initialState = {
  layout: [], // 保持空，不直接使用DEFAULT_LAYOUT
  activePlugins: [], // 保持空，不直接使用DEFAULT_PLUGINS
  hasInitializedDefault: false,
  tabContainers: [], // 初始没有标签容器
  savedLayouts: [], // 初始没有保存的布局
  currentLayoutId: null // 初始没有当前布局
};

// 布局变更通知
const LAYOUT_CHANGE_EVENT = 'termini-layout-changed';
const notifyLayoutsChanged = () => {
  window.dispatchEvent(new CustomEvent(LAYOUT_CHANGE_EVENT, { detail: Date.now() }));
};

// 创建并导出Store
export const useLayoutStore01 = create<LayoutState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 更新布局
      updateLayout: (newLayout: Layout[]) => set({ layout: newLayout }),

      // 添加插件
      addPlugin: (pluginId: string, position) => set(state => {
        const { layout, activePlugins } = state;

        // 如果插件已存在，则不重复添加
        if (activePlugins.includes(pluginId)) {
          console.log(`插件 ${pluginId} 已存在，不重复添加`);
          return state;
        }

        // 获取插件元数据
        const plugin = pluginRegistry.get(pluginId);
        if (!plugin) {
          console.error(`插件 ${pluginId} 未找到`);
          return state;
        }

        // 默认位置
        const defaultPosition = {
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          minW: 2,
          minH: 2
        };

        // 合并位置信息
        const itemPosition = {
          ...defaultPosition,
          ...position
        };

        // 创建一个标签容器并将插件放入其中，而不是直接放入布局
        const tabId = `tab-container-${Date.now()}`;
        const tabContainerPosition = {
          ...itemPosition,
          i: tabId
        };

        // 更新布局、活跃插件列表和标签容器列表
        return {
          activePlugins: [...activePlugins, pluginId],
          layout: [...layout, tabContainerPosition],
          tabContainers: [...state.tabContainers, { id: tabId, plugins: [pluginId] }]
        };
      }),

      // 移除插件
      removePlugin: (pluginId: string) => set(state => {
        const { layout, activePlugins, tabContainers } = state;
        
        // 从布局中移除插件
        const newLayout = layout.filter(item => item.i !== pluginId);
        
        // 从活跃插件列表中移除
        const newActivePlugins = activePlugins.filter(id => id !== pluginId);
        
        // 从所有标签容器中移除此插件
        const newTabContainers = tabContainers.map(tab => ({
          ...tab,
          plugins: tab.plugins.filter(id => id !== pluginId)
        }));

        // 移除空的标签容器
        const validTabContainers = newTabContainers.filter(tab => tab.plugins.length > 0);
        
        // 更新布局中的标签容器
        const finalLayout = newLayout.filter(item => {
          // 保留非标签容器项目
          if (!item.i.startsWith('tab-container-')) return true;
          
          // 检查此标签容器是否还有插件
          const tabExists = validTabContainers.some(tab => tab.id === item.i);
          return tabExists;
        });

        return {
          layout: finalLayout,
          activePlugins: newActivePlugins,
          tabContainers: validTabContainers
        };
      }),

      // 创建标签容器
      createTabContainer: (pluginIds, position) => {
        console.log('创建新标签容器:', { pluginIds });
        
        const tabId = `tab-container-${Date.now()}`;
        
        // 调用操作并返回tabId
        set(state => {
          const { layout, tabContainers } = state;
          
          // 标签容器基本位置
          const containerPosition = {
            i: tabId,
            x: position?.x || 0,
            y: position?.y || 0,
            w: position?.w || 6,
            h: position?.h || 8,
            minW: 3,
            minH: 4
          };
          
          // 创建新标签容器
          const newTabContainer = {
            id: tabId,
            plugins: [...pluginIds]
          };
          
          return {
            tabContainers: [...tabContainers, newTabContainer],
            layout: [...layout, containerPosition]
          };
        });
        
        return tabId;
      },

      // 移除标签容器
      removeTabContainer: (tabId: string) => set(state => {
        const { layout, tabContainers } = state;
        
        // 从布局中移除容器
        const newLayout = layout.filter(item => item.i !== tabId);
        
        // 从标签容器列表中移除
        const newTabContainers = tabContainers.filter(container => container.id !== tabId);
        
        return {
          layout: newLayout,
          tabContainers: newTabContainers
        };
      }),

      // 添加插件到标签容器
      addPluginToTab: (tabId: string, pluginId: string) => set(state => {
        const { tabContainers, activePlugins } = state;
        
        // 检查标签容器是否存在
        const targetTabIndex = tabContainers.findIndex(tab => tab.id === tabId);
        if (targetTabIndex === -1) {
          console.error(`标签容器 ${tabId} 未找到`);
          return state;
        }
        
        // 如果插件不在活跃列表中，添加它
        let updatedActivePlugins = [...activePlugins];
        if (!activePlugins.includes(pluginId)) {
          updatedActivePlugins.push(pluginId);
        }
        
        // 更新标签容器的插件列表
        const updatedTabContainers = [...tabContainers];
        const currentPlugins = updatedTabContainers[targetTabIndex].plugins;
        
        // 如果插件已经在此标签容器中，则不重复添加
        if (currentPlugins.includes(pluginId)) {
          return state;
        }
        
        updatedTabContainers[targetTabIndex] = {
          ...updatedTabContainers[targetTabIndex],
          plugins: [...currentPlugins, pluginId]
        };
        
        return {
          activePlugins: updatedActivePlugins,
          tabContainers: updatedTabContainers
        };
      }),

      // 从标签容器移除插件
      removePluginFromTab: (tabId: string, pluginId: string, position) => set(state => {
        const { tabContainers, layout } = state;
        
        // 找到目标标签容器
        const targetTabIndex = tabContainers.findIndex(tab => tab.id === tabId);
        if (targetTabIndex === -1) {
          console.error(`标签容器 ${tabId} 未找到`);
          return state;
        }
        
        // 获取标签容器位置（用于计算新插件位置）
        const tabContainerLayout = layout.find(item => item.i === tabId);
        if (!tabContainerLayout) {
          console.error(`标签容器布局 ${tabId} 未找到`);
          return state;
        }
        
        // 更新标签容器的插件列表
        const updatedTabContainers = [...tabContainers];
        const remainingPlugins = updatedTabContainers[targetTabIndex].plugins.filter(id => id !== pluginId);
        
        // 计算新插件位置
        const newPosition = position || {
          x: tabContainerLayout.x,
          y: tabContainerLayout.y,
          w: Math.max(4, Math.min(tabContainerLayout.w, 5)),
          h: Math.max(5, Math.min(tabContainerLayout.h, 6))
        };

        // 将拆分出的插件添加到新的标签容器中
        const newTabId = `tab-container-${Date.now() + 1}`;
        
        // 将插件添加到布局中作为新的标签容器
        const newTabLayoutItem = {
          i: newTabId,
          x: newPosition.x,
          y: newPosition.y,
          w: newPosition.w,
          h: newPosition.h,
          minW: 2,
          minH: 2
        };
        
        // 创建新标签容器
        const newTabContainer = {
          id: newTabId,
          plugins: [pluginId]
        };
        
        // 处理更新后的布局和容器
        let finalLayout = [...layout];
        let finalTabContainers = [...updatedTabContainers];
        
        // 如果原标签容器变为空，则删除它
        if (remainingPlugins.length === 0) {
          console.log(`标签容器 ${tabId} 为空，将被删除`);
          finalLayout = finalLayout.filter(item => item.i !== tabId);
          finalTabContainers = finalTabContainers.filter(tab => tab.id !== tabId);
        } else {
          // 更新原标签容器中剩余的插件
          const sourceTabIndex = finalTabContainers.findIndex(tab => tab.id === tabId);
          if (sourceTabIndex !== -1) {
            finalTabContainers[sourceTabIndex] = {
              ...finalTabContainers[sourceTabIndex],
              plugins: remainingPlugins
            };
          }
        }
        
        // 添加新的标签容器
        finalTabContainers.push(newTabContainer);
        finalLayout.push(newTabLayoutItem);
        
        return {
          tabContainers: finalTabContainers,
          layout: finalLayout
        };
      }),

      // 在标签容器之间移动插件
      movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => set(state => {
        const { tabContainers, layout } = state;
        
        console.log('移动插件:', { pluginId, from: sourceTabId, to: targetTabId });
        
        // 源标签容器
        const sourceTabIndex = tabContainers.findIndex(tab => tab.id === sourceTabId);
        if (sourceTabIndex === -1) {
          console.error(`源标签容器 ${sourceTabId} 未找到`);
          return state;
        }
        
        // 目标标签容器
        const targetTabIndex = tabContainers.findIndex(tab => tab.id === targetTabId);
        if (targetTabIndex === -1) {
          console.error(`目标标签容器 ${targetTabId} 未找到`);
          return state;
        }
        
        // 检查插件是否已经在目标容器中
        if (tabContainers[targetTabIndex].plugins.includes(pluginId)) {
          console.log(`插件 ${pluginId} 已在目标容器 ${targetTabId} 中`);
          
          // 如果插件已在目标容器中，只从源容器移除
          const updatedTabContainers = [...tabContainers];
          const remainingPlugins = updatedTabContainers[sourceTabIndex].plugins.filter(id => id !== pluginId);
          updatedTabContainers[sourceTabIndex].plugins = remainingPlugins;
          
          // 处理空的源容器
          let finalLayout = [...layout];
          let finalTabContainers = [...updatedTabContainers];
          
          if (remainingPlugins.length === 0) {
            console.log(`源标签容器 ${sourceTabId} 为空，将被删除`);
            finalLayout = finalLayout.filter(item => item.i !== sourceTabId);
            finalTabContainers = finalTabContainers.filter(tab => tab.id !== sourceTabId);
          }
          
          return {
            tabContainers: finalTabContainers,
            layout: finalLayout
          };
        }
        
        // 更新标签容器
        const updatedTabContainers = [...tabContainers];
        
        // 从源容器中获取剩余插件（排除被移动的插件）
        const sourcePlugins = updatedTabContainers[sourceTabIndex].plugins;
        
        // 检查插件是否在源容器中
        if (!sourcePlugins.includes(pluginId)) {
          console.error(`插件 ${pluginId} 不在源标签容器 ${sourceTabId} 中`);
          return state;
        }
        
        // 从源容器移除插件
        const remainingPlugins = sourcePlugins.filter(id => id !== pluginId);
        updatedTabContainers[sourceTabIndex].plugins = remainingPlugins;
        
        // 更新目标容器，添加插件到目标容器
        updatedTabContainers[targetTabIndex] = {
          ...updatedTabContainers[targetTabIndex],
          plugins: [...updatedTabContainers[targetTabIndex].plugins, pluginId]
        };
        
        // 处理布局和容器
        let finalLayout = [...layout];
        let finalTabContainers = [...updatedTabContainers];
        
        // 如果源容器变为空，则删除它
        if (remainingPlugins.length === 0) {
          console.log(`源标签容器 ${sourceTabId} 为空，将被删除`);
          finalLayout = finalLayout.filter(item => item.i !== sourceTabId);
          finalTabContainers = finalTabContainers.filter(tab => tab.id !== sourceTabId);
        }
        
        // 通知布局变更
        setTimeout(() => notifyLayoutsChanged(), 0);
        
        return {
          tabContainers: finalTabContainers,
          layout: finalLayout
        };
      }),

      // 将普通插件转换为标签容器
      convertToTab: (pluginId: string) => set(state => {
        const { layout, activePlugins } = state;
        
        // 检查插件是否存在
        const pluginLayoutItem = layout.find(item => item.i === pluginId);
        if (!pluginLayoutItem) {
          console.error(`插件 ${pluginId} 未找到`);
          return state;
        }
        
        // 创建新的标签容器ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 创建标签容器
        const tabContainer = {
          id: tabId,
          plugins: [pluginId]
        };
        
        // 创建标签容器布局项
        const tabLayoutItem = {
          i: tabId,
          x: pluginLayoutItem.x,
          y: pluginLayoutItem.y,
          w: pluginLayoutItem.w,
          h: pluginLayoutItem.h,
          minW: 3,
          minH: 4
        };
        
        // 更新布局 - 移除原插件、添加标签容器
        const newLayout = [
          ...layout.filter(item => item.i !== pluginId),
          tabLayoutItem
        ];
        
        return {
          tabContainers: [...state.tabContainers, tabContainer],
          layout: newLayout
        };
      }),

      // 保存当前布局
      saveCurrentLayout: (name?: string) => set(state => {
        try {
          const { layout, activePlugins, tabContainers, savedLayouts, currentLayoutId } = state;
          
          const now = Date.now();
          let updatedLayouts = [...savedLayouts];
          let newCurrentId = currentLayoutId;
          
          // 创建新布局配置
          const newLayout: LayoutConfig = {
            id: currentLayoutId || `layout-${now}`,
            name: name || `布局 ${new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            layout: JSON.parse(JSON.stringify(layout)), // 深拷贝布局
            activePlugins: [...activePlugins],
            tabContainers: JSON.parse(JSON.stringify(tabContainers)), // 深拷贝标签容器
            createdAt: currentLayoutId ? (savedLayouts.find(l => l.id === currentLayoutId)?.createdAt || now) : now,
            updatedAt: now
          };
          
          // 如果当前有激活的布局，尝试更新它
          if (currentLayoutId) {
            const existingIndex = updatedLayouts.findIndex(layout => layout.id === currentLayoutId);
            
            if (existingIndex >= 0) {
              // 更新现有布局
              updatedLayouts[existingIndex] = newLayout;
            } else {
              // 创建新布局
              updatedLayouts = [...updatedLayouts, newLayout];
              newCurrentId = newLayout.id;
            }
          } else {
            // 创建新布局
            updatedLayouts = [...updatedLayouts, newLayout];
            newCurrentId = newLayout.id;
          }
          
          // 保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentId || '');
          
          // 通知布局变更
          notifyLayoutsChanged();
          
          return {
            savedLayouts: updatedLayouts,
            currentLayoutId: newCurrentId
          };
        } catch (error) {
          console.error('保存布局失败:', error);
          return state;
        }
      }),

      // 加载指定布局
      loadLayout: (layoutId: string) => set(state => {
        try {
          // 从localStorage读取布局数据
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          if (!rawLayouts) {
            console.error('找不到布局数据');
            return state;
          }
          
          // 解析所有布局
          const allLayouts = JSON.parse(rawLayouts);
          
          // 查找指定布局
          const layoutToLoad = allLayouts.find((layout: LayoutConfig) => layout.id === layoutId);
          
          if (!layoutToLoad) {
            console.error(`找不到布局ID: ${layoutId}`);
            return state;
          }
          
          // 保存当前布局ID到localStorage
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, layoutId);
          
          // 返回加载的布局状态
          return {
            layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
            activePlugins: [...layoutToLoad.activePlugins],
            tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers)),
            currentLayoutId: layoutId,
            savedLayouts: allLayouts
          };
        } catch (error) {
          console.error(`加载布局 ${layoutId} 失败:`, error);
          return state;
        }
      }),

      // 删除指定布局
      deleteLayout: (layoutId: string) => set(state => {
        try {
          const { savedLayouts, currentLayoutId } = state;
          
          // 过滤移除要删除的布局
          const updatedLayouts = savedLayouts.filter(layout => layout.id !== layoutId);
          
          // 如果删除的是当前布局，则切换到最新的布局
          let newCurrentId = currentLayoutId;
          if (currentLayoutId === layoutId) {
            newCurrentId = updatedLayouts.length > 0 ? updatedLayouts[updatedLayouts.length - 1].id : null;
            
            // 如果还有其他布局，加载它
            if (newCurrentId) {
              const layoutToLoad = updatedLayouts.find(layout => layout.id === newCurrentId);
              if (layoutToLoad) {
                set({
                  layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
                  activePlugins: [...layoutToLoad.activePlugins],
                  tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers))
                });
              }
            } else {
              // 如果没有其他布局，重置为默认空布局
              set({
                layout: [],
                activePlugins: [],
                tabContainers: []
              });
            }
          }
          
          // 更新localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentId || '');
          
          // 通知布局变更
          notifyLayoutsChanged();
          
          return {
            savedLayouts: updatedLayouts,
            currentLayoutId: newCurrentId
          };
        } catch (error) {
          console.error(`删除布局 ${layoutId} 失败:`, error);
          return state;
        }
      }),

      // 初始化默认布局
      initDefaultLayout: () => set(state => {
        console.log('初始化默认布局...');
        
        // 使用默认插件列表
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
        
        // 创建标签容器
        const priceTabId = `tab-container-${Date.now()}`;
        const marketTabId = `tab-container-${Date.now() + 1}`;
        const chartTabId = `tab-container-${Date.now() + 2}`;
        const onchainTabId = `tab-container-${Date.now() + 3}`;
        
        // 创建所有标签容器
        const tabContainers: TabGroup[] = [
          { id: priceTabId, plugins: [priceCardPlugin, orderBookPlugin] },
          { id: marketTabId, plugins: [signalsPlugin, twitterPlugin] },
          { id: chartTabId, plugins: [chartPlugin] },
          { id: onchainTabId, plugins: [onchainPlugin] }
        ];
        
        // 创建布局
        const layout: Layout[] = [];
        
        // 价格相关标签布局
        layout.push({
          i: priceTabId,
          x: 0,
          y: 0,
          w: 4,
          h: 6,
          minW: 3,
          minH: 4
        });
        
        // K线图标签布局
        layout.push({
          i: chartTabId,
          x: 4,
          y: 0,
          w: 8,
          h: 10,
          minW: 4,
          minH: 4
        });
        
        // 市场信息标签布局
        layout.push({
          i: marketTabId,
          x: 0,
          y: 6,
          w: 4,
          h: 8,
          minW: 3,
          minH: 4
        });
        
        // 链上数据标签布局
        layout.push({
          i: onchainTabId,
          x: 4,
          y: 10,
          w: 8,
          h: 8,
          minW: 3,
          minH: 4
        });
        
        // 创建新的布局配置
        const now = Date.now();
        const defaultLayoutConfig: LayoutConfig = {
          id: `default-${now}`,
          name: '默认布局',
          layout,
          activePlugins: allPluginsIds,
          tabContainers,
          createdAt: now,
          updatedAt: now
        };
        
        // 保存到localStorage
        localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify([defaultLayoutConfig]));
        localStorage.setItem(CURRENT_LAYOUT_ID_KEY, defaultLayoutConfig.id);
        
        return {
          layout,
          activePlugins: allPluginsIds,
          tabContainers,
          hasInitializedDefault: true,
          savedLayouts: [defaultLayoutConfig],
          currentLayoutId: defaultLayoutConfig.id
        };
      }),

      // 重置存储
      resetStore: () => {
        console.log('重置布局存储...');
        return initialState;
      },
      
      // 更新Token
      updateToken: (token: any) => set(state => ({
        _lastTokenUpdate: Date.now()
      }))
    }),
    {
      name: 'termini-layout01-storage',
      version: 1,
      partialize: (state) => ({
        layout: state.layout,
        activePlugins: state.activePlugins,
        tabContainers: state.tabContainers,
        hasInitializedDefault: state.hasInitializedDefault
      }),
      onRehydrateStorage: () => (state) => {
        console.log('布局01状态已从存储中恢复');
        
        // 手动加载savedLayouts和currentLayoutId
        try {
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
          
          if (rawLayouts && state) {
            const savedLayouts = JSON.parse(rawLayouts);
            state.savedLayouts = savedLayouts;
            state.currentLayoutId = currentId;
          }
        } catch (error) {
          console.error('手动加载布局01数据失败:', error);
        }
      }
    }
  )
); 