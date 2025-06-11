import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdSave, MdRefresh, MdSettings } from 'react-icons/md';

import { GridLayoutDrag, useGridLayout } from './index';
import type { PluginProps } from './types';

// 示例插件组件列表
const AVAILABLE_PLUGINS = [
  { id: 'official-price-card', name: '价格卡片', category: '交易' },
  { id: 'official-price-chart', name: 'K线图表', category: '图表' },
  { id: 'official-order-book', name: '订单簿', category: '交易' },
  { id: 'official-market-signals', name: '市场信号', category: '分析' },
  { id: 'official-twitter-sentiment', name: '推特舆情', category: '情绪' },
  { id: 'official-onchain-data', name: '链上数据', category: '数据' },
];

export const GridLayoutExample: React.FC = () => {
  const {
    layout,
    containers,
    activePlugins,
    savedLayouts,
    pluginProps,
    updateLayout,
    updateContainers,
    addPlugin,
    removePlugin,
    movePlugin,
    saveLayout,
    loadLayout,
    deleteLayout,
    reset,
    updateTheme,
    theme,
  } = useGridLayout();

  // 处理插件添加
  const handleAddPlugin = useCallback((pluginId: string) => {
    addPlugin(pluginId);
  }, [addPlugin]);

  // 处理插件移动
  const handlePluginMove = useCallback((
    pluginId: string, 
    fromContainer?: string, 
    toContainer?: string
  ) => {
    movePlugin(pluginId, fromContainer, toContainer);
  }, [movePlugin]);

  // 处理布局保存
  const handleSaveLayout = useCallback(() => {
    const name = prompt('请输入布局名称:', `布局_${Date.now()}`);
    if (name) {
      saveLayout(name);
    }
  }, [saveLayout]);

  // 处理主题切换
  const handleThemeToggle = useCallback(() => {
    updateTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, updateTheme]);

  // 可添加的插件（未激活的插件）
  const availablePlugins = AVAILABLE_PLUGINS.filter(
    plugin => !activePlugins.includes(plugin.id)
  );

  return (
    <div className={`grid-layout-example min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* 工具栏 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                网格拖拽布局系统
              </h1>
              
              {/* 主题切换 */}
              <motion.button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              {/* 保存布局 */}
              <motion.button
                onClick={handleSaveLayout}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdSave className="w-4 h-4" />
                保存布局
              </motion.button>

              {/* 重置布局 */}
              <motion.button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MdRefresh className="w-4 h-4" />
                重置
              </motion.button>
            </div>
          </div>

          {/* 插件添加工具栏 */}
          {availablePlugins.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                添加插件:
              </span>
              {availablePlugins.map((plugin) => (
                <motion.button
                  key={plugin.id}
                  onClick={() => handleAddPlugin(plugin.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdAdd className="w-3 h-3" />
                  {plugin.name}
                </motion.button>
              ))}
            </div>
          )}

          {/* 保存的布局列表 */}
          {savedLayouts.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                已保存的布局:
              </span>
              <div className="flex flex-wrap gap-2">
                {savedLayouts.map((savedLayout) => (
                  <div key={savedLayout.id} className="flex items-center gap-1">
                    <motion.button
                      onClick={() => loadLayout(savedLayout.id)}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {savedLayout.name}
                    </motion.button>
                    <motion.button
                      onClick={() => deleteLayout(savedLayout.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      ×
                    </motion.button>
                  </div>
                ))}
              </div>
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
            onLayoutChange={updateLayout}
            onContainerChange={updateContainers}
            onPluginMove={handlePluginMove}
            className="h-full"
            cols={12}
            rowHeight={30}
            margin={[8, 8]}
            isDraggable={true}
            isResizable={true}
          />
        </div>

        {/* 状态信息 */}
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs border border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400">
            <div>活跃插件: {activePlugins.length}</div>
            <div>标签容器: {containers.length}</div>
            <div>已保存布局: {savedLayouts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 演示如何在应用中使用
export const GridLayoutDemo: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <GridLayoutExample />
    </div>
  );
}; 