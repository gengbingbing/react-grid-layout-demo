import React, { useState, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { motion } from 'framer-motion';

import { GridLayoutDrag } from './GridLayoutDrag';
import type { TabContainer, PluginProps } from './types';

// 简单的测试插件组件
const TestPlugin: React.FC<{ pluginId: string; title: string }> = ({ pluginId, title }) => (
  <div className="h-full p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
      {title}
    </h3>
    <div className="text-sm text-blue-600 dark:text-blue-300">
      <p>插件 ID: {pluginId}</p>
      <p>这是一个测试插件，用于验证拖拽和标签功能。</p>
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded"></div>
        <div className="h-2 bg-blue-300 dark:bg-blue-600 rounded w-3/4"></div>
        <div className="h-2 bg-blue-200 dark:bg-blue-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// 测试用的插件注册表
const TEST_PLUGINS: Record<string, { component: React.ComponentType; title: string }> = {
  'official-price-card': {
    component: () => <TestPlugin pluginId="official-price-card" title="价格卡片" />,
    title: '价格卡片'
  },
  'official-price-chart': {
    component: () => <TestPlugin pluginId="official-price-chart" title="K线图表" />,
    title: 'K线图表'
  },
  'official-order-book': {
    component: () => <TestPlugin pluginId="official-order-book" title="订单簿" />,
    title: '订单簿'
  },
  'official-market-signals': {
    component: () => <TestPlugin pluginId="official-market-signals" title="市场信号" />,
    title: '市场信号'
  },
  'official-twitter-sentiment': {
    component: () => <TestPlugin pluginId="official-twitter-sentiment" title="推特舆情" />,
    title: '推特舆情'
  },
  'official-onchain-data': {
    component: () => <TestPlugin pluginId="official-onchain-data" title="链上数据" />,
    title: '链上数据'
  },
};

// 默认布局
const DEFAULT_LAYOUT: Layout[] = [
  { i: 'container-1', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
  { i: 'container-2', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
  { i: 'official-onchain-data', x: 0, y: 8, w: 4, h: 6, minW: 2, minH: 4 },
];

// 默认容器
const DEFAULT_CONTAINERS: TabContainer[] = [
  {
    id: 'container-1',
    plugins: ['official-price-card', 'official-price-chart'],
    activeTab: 'official-price-card',
  },
  {
    id: 'container-2',
    plugins: ['official-order-book', 'official-market-signals', 'official-twitter-sentiment'],
    activeTab: 'official-order-book',
  },
];

// 默认活跃插件
const DEFAULT_ACTIVE_PLUGINS = [
  'official-price-card',
  'official-price-chart',
  'official-order-book',
  'official-market-signals',
  'official-twitter-sentiment',
  'official-onchain-data',
];

export const GridLayoutTest: React.FC = () => {
  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT);
  const [containers, setContainers] = useState<TabContainer[]>(DEFAULT_CONTAINERS);
  const [activePlugins, setActivePlugins] = useState<string[]>(DEFAULT_ACTIVE_PLUGINS);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 插件属性
  const pluginProps: PluginProps = {
    token: { symbol: 'BTC', price: 45000 },
    theme,
    locale: 'zh-CN',
    onTokenChange: (token: string) => console.log('Token changed:', token),
  };

  // 处理布局变化
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    console.log('Layout changed:', newLayout);
    setLayout(newLayout);
  }, []);

  // 处理容器变化
  const handleContainerChange = useCallback((newContainers: TabContainer[]) => {
    console.log('Containers changed:', newContainers);
    setContainers(newContainers);
  }, []);

  // 处理插件移动
  const handlePluginMove = useCallback((pluginId: string, fromContainer?: string, toContainer?: string) => {
    console.log('Plugin moved:', { pluginId, fromContainer, toContainer });
    
    if (toContainer) {
      // 移动到容器中
      setContainers(prev => prev.map(container => {
        if (container.id === toContainer) {
          return {
            ...container,
            plugins: [...container.plugins, pluginId],
            activeTab: pluginId,
          };
        }
        if (container.id === fromContainer) {
          return {
            ...container,
            plugins: container.plugins.filter(id => id !== pluginId),
            activeTab: container.plugins.filter(id => id !== pluginId)[0] || container.activeTab,
          };
        }
        return container;
      }));
      
      // 从独立插件列表中移除
      setLayout(prev => prev.filter(item => item.i !== pluginId));
    } else if (fromContainer) {
      // 从容器移动到网格
      const newLayoutItem: Layout = {
        i: pluginId,
        x: 8,
        y: 0,
        w: 4,
        h: 6,
        minW: 2,
        minH: 4,
      };
      setLayout(prev => [...prev, newLayoutItem]);
    }
  }, []);

  // 处理插件添加
  const handlePluginAdd = useCallback((pluginId: string) => {
    if (!activePlugins.includes(pluginId)) {
      setActivePlugins(prev => [...prev, pluginId]);
      
      const newLayoutItem: Layout = {
        i: pluginId,
        x: 0,
        y: 12,
        w: 4,
        h: 6,
        minW: 2,
        minH: 4,
      };
      setLayout(prev => [...prev, newLayoutItem]);
    }
  }, [activePlugins]);

  // 处理插件移除
  const handlePluginRemove = useCallback((pluginId: string) => {
    setActivePlugins(prev => prev.filter(id => id !== pluginId));
    setLayout(prev => prev.filter(item => item.i !== pluginId));
    setContainers(prev => prev.map(container => ({
      ...container,
      plugins: container.plugins.filter(id => id !== pluginId),
      activeTab: container.plugins.filter(id => id !== pluginId)[0] || container.activeTab,
    })).filter(container => container.plugins.length > 0));
  }, []);

  // 可添加的插件
  const availablePlugins = Object.keys(TEST_PLUGINS).filter(
    pluginId => !activePlugins.includes(pluginId)
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* 头部工具栏 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              网格拖拽布局测试
            </h1>
            
            <div className="flex items-center gap-4">
              {/* 主题切换 */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {theme === 'light' ? '🌙 暗色模式' : '☀️ 亮色模式'}
              </button>
              
              {/* 重置布局 */}
              <button
                onClick={() => {
                  setLayout(DEFAULT_LAYOUT);
                  setContainers(DEFAULT_CONTAINERS);
                  setActivePlugins(DEFAULT_ACTIVE_PLUGINS);
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重置布局
              </button>
            </div>
          </div>

          {/* 插件添加工具栏 */}
          {availablePlugins.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                添加插件:
              </span>
              {availablePlugins.map((pluginId) => (
                <button
                  key={pluginId}
                  onClick={() => handlePluginAdd(pluginId)}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                >
                  + {TEST_PLUGINS[pluginId].title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 主要布局区域 */}
        <div className="p-4 h-[calc(100vh-200px)]">
          <GridLayoutDrag
            layout={layout}
            containers={containers}
            activePlugins={activePlugins}
            pluginProps={pluginProps}
            onLayoutChange={handleLayoutChange}
            onContainerChange={handleContainerChange}
            onPluginMove={handlePluginMove}
            onPluginAdd={handlePluginAdd}
            onPluginRemove={handlePluginRemove}
            className="h-full"
            cols={12}
            rowHeight={30}
            margin={[8, 8]}
            isDraggable={true}
            isResizable={true}
          />
        </div>

        {/* 状态信息 */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs border border-gray-200 dark:border-gray-700 max-w-xs">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">状态信息</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>活跃插件: {activePlugins.length}</div>
            <div>标签容器: {containers.length}</div>
            <div>布局项目: {layout.length}</div>
          </div>
          
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">使用说明</h4>
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>• 拖拽标签页到其他容器进行合并</div>
            <div>• 拖拽标签页到空白区域创建独立插件</div>
            <div>• 点击标签切换活跃插件</div>
            <div>• 点击 × 删除插件</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 