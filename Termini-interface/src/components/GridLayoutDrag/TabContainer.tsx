import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdClose, MdDragIndicator } from 'react-icons/md';
import cx from 'classnames';

import type { TabContainer as TabContainerType, PluginProps } from './types';
import { PluginWrapper } from './PluginWrapper';

interface TabContainerProps {
  container: TabContainerType;
  pluginProps?: PluginProps;
  onTabClick: (pluginId: string) => void;
  onTabClose: (pluginId: string) => void;
  onContainerResize?: (containerId: string, size: { width: number; height: number }) => void;
  onContainerDelete?: (containerId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isResizing?: boolean;
}

// 获取插件显示名称
function getPluginDisplayName(pluginId: string): string {
  const nameMap: Record<string, string> = {
    'official-price-card': '价格卡片',
    'official-price-chart': 'K线图表',
    'official-order-book': '订单簿',
    'official-market-signals': '市场信号',
    'official-twitter-sentiment': '推特舆情',
    'official-onchain-data': '链上数据',
    'official-crypto-news': '加密新闻',
  };
  
  return nameMap[pluginId] || pluginId.replace('official-', '').replace(/-/g, ' ');
}

export const TabContainer: React.FC<TabContainerProps> = ({
  container,
  pluginProps,
  onTabClick,
  onTabClose,
  onContainerResize,
  onContainerDelete,
  className,
  style,
  isDragging = false,
  isResizing = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 设置拖拽能力
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: container.id,
    data: { type: 'container', container }
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 获取当前激活的插件
  const activePlugin = useMemo(() => {
    if (!container.plugins || container.plugins.length === 0) return null;
    return container.plugins.find(id => id === container.activeTab) || container.plugins[0];
  }, [container.plugins, container.activeTab]);

  // 处理标签点击
  const handleTabClick = useCallback((pluginId: string) => {
    console.log('TabContainer: 标签点击', pluginId);
    onTabClick(pluginId);
  }, [onTabClick]);

  // 处理标签关闭
  const handleTabClose = useCallback((pluginId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('TabContainer: 关闭标签', pluginId);
    onTabClose(pluginId);
  }, [onTabClose]);

  // 处理容器删除
  const handleContainerDelete = useCallback(() => {
    console.log('TabContainer: 删除容器', container.id);
    if (onContainerDelete) {
      onContainerDelete(container.id);
    }
  }, [container.id, onContainerDelete]);

  // 如果容器没有插件，显示空状态
  if (!container.plugins || container.plugins.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">空容器</p>
          <button
            onClick={handleContainerDelete}
            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            删除容器
          </button>
        </div>
      </div>
    );
  }

  // 计算激活指示器的位置
  const activeTabIndex = container.plugins.indexOf(container.activeTab);
  const indicatorWidth = container.plugins.length > 0 ? 100 / container.plugins.length : 0;
  const indicatorX = activeTabIndex >= 0 ? activeTabIndex * indicatorWidth : 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...sortableStyle,
        ...style,
      }}
      className={cx(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-200 ease-in-out h-full',
        {
          'ring-2 ring-blue-500 ring-opacity-50': isDragging || isSortableDragging,
          'shadow-xl scale-105': isDragging,
          'opacity-50': isSortableDragging,
          'cursor-grabbing': isDragging,
        },
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      layout
      animate={{
        scale: isDragging ? 1.05 : 1,
        opacity: isSortableDragging ? 0.5 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* 拖拽手柄和标签栏 */}
      <div className="relative flex flex-col h-full">
        {/* 标签栏 */}
        <div className="flex items-center bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-h-[44px]">
          {/* 拖拽手柄 */}
          <motion.div
            {...attributes}
            {...listeners}
            className={cx(
              'flex items-center justify-center w-8 h-8 cursor-grab flex-shrink-0',
              'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
              'transition-colors duration-150 react-grid-dragHandleExample',
              { 'cursor-grabbing': isDragging }
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <MdDragIndicator className="w-4 h-4" />
          </motion.div>

          {/* 标签列表 */}
          <div className="flex flex-1 overflow-x-auto scrollbar-hide">
            {container.plugins.map((pluginId, index) => (
              <motion.div
                key={pluginId}
                className={cx(
                  'flex items-center gap-1 px-3 py-2 text-sm font-medium cursor-pointer',
                  'border-r border-gray-200 dark:border-gray-700 last:border-r-0',
                  'transition-all duration-150 min-w-0 flex-shrink-0',
                  {
                    'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400': 
                      pluginId === container.activeTab,
                    'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': 
                      pluginId !== container.activeTab,
                  }
                )}
                onClick={() => handleTabClick(pluginId)}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -1 }}
              >
                {/* 标签文字 */}
                <span className="truncate max-w-24" title={getPluginDisplayName(pluginId)}>
                  {getPluginDisplayName(pluginId)}
                </span>
                
                {/* 关闭按钮 */}
                <motion.button
                  onClick={(e) => handleTabClose(pluginId, e)}
                  className={cx(
                    'ml-1 p-0.5 rounded-full text-gray-400 hover:text-red-500',
                    'hover:bg-red-50 dark:hover:bg-red-900/20',
                    'transition-all duration-150 flex-shrink-0'
                  )}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                >
                  <MdClose className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* 容器操作按钮 */}
          <AnimatePresence>
            {isHovered && container.plugins.length === 1 && (
              <motion.button
                onClick={handleContainerDelete}
                className={cx(
                  'mr-2 p-1.5 rounded-md text-gray-400 hover:text-red-500',
                  'hover:bg-red-50 dark:hover:bg-red-900/20',
                  'transition-all duration-150 flex-shrink-0'
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdClose className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 激活指示器 */}
        {container.plugins.length > 0 && (
          <motion.div
            className="absolute bottom-0 left-8 h-0.5 bg-blue-500 z-10"
            initial={{ width: 0 }}
            animate={{ 
              width: `${indicatorWidth}%`,
              x: `${indicatorX}%`
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        {/* 插件内容区域 */}
        <div className="relative flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {activePlugin && (
              <motion.div
                key={activePlugin}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <PluginWrapper
                  pluginId={activePlugin}
                  pluginProps={pluginProps}
                  isActive={true}
                  className="h-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 调整大小手柄 */}
      <AnimatePresence>
        {isHovered && !isDragging && (
          <>
            {/* 右下角调整手柄 */}
            <motion.div
              className={cx(
                'absolute bottom-0 right-0 w-4 h-4 cursor-se-resize',
                'bg-gray-300 dark:bg-gray-600 opacity-50 hover:opacity-100',
                'transition-opacity duration-150'
              )}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ opacity: 1, scale: 1.2 }}
            />
            
            {/* 右边缘调整手柄 */}
            <motion.div
              className={cx(
                'absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 cursor-e-resize',
                'bg-gray-300 dark:bg-gray-600 opacity-0 hover:opacity-50',
                'transition-opacity duration-150'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 0.5 }}
            />
            
            {/* 底边缘调整手柄 */}
            <motion.div
              className={cx(
                'absolute bottom-0 left-1/2 w-8 h-1 -translate-x-1/2 cursor-s-resize',
                'bg-gray-300 dark:bg-gray-600 opacity-0 hover:opacity-50',
                'transition-opacity duration-150'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 0.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* 拖拽状态遮罩 */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-blue-500 bg-opacity-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
          <div>ID: {container.id}</div>
          <div>插件: {container.plugins.length}</div>
          <div>激活: {container.activeTab}</div>
        </div>
      )}
    </motion.div>
  );
}; 