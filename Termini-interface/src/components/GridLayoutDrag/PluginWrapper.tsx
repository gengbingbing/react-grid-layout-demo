import React, { useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import cx from 'classnames';

import type { PluginWrapperProps } from './types';

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
      <div className="mt-4 text-xs text-blue-500 dark:text-blue-400">
        时间: {new Date().toLocaleTimeString()}
      </div>
    </div>
  </div>
);

// 插件注册表（模拟，实际应该从插件系统导入）
const PLUGIN_REGISTRY: Record<string, React.ComponentType<any>> = {
  'official-price-card': () => <TestPlugin pluginId="official-price-card" title="价格卡片" />,
  'official-price-chart': () => <TestPlugin pluginId="official-price-chart" title="K线图表" />,
  'official-order-book': () => <TestPlugin pluginId="official-order-book" title="订单簿" />,
  'official-market-signals': () => <TestPlugin pluginId="official-market-signals" title="市场信号" />,
  'official-twitter-sentiment': () => <TestPlugin pluginId="official-twitter-sentiment" title="推特舆情" />,
  'official-onchain-data': () => <TestPlugin pluginId="official-onchain-data" title="链上数据" />,
  'official-crypto-news': () => <TestPlugin pluginId="official-crypto-news" title="加密新闻" />,
};

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

// 加载状态组件
const PluginLoading: React.FC<{ pluginId: string }> = ({ pluginId }) => (
  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <motion.div
        className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        加载 {getPluginDisplayName(pluginId)}...
      </p>
    </div>
  </div>
);

// 错误状态组件
const PluginError: React.FC<{ pluginId: string; error?: Error }> = ({ pluginId, error }) => (
  <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
    <div className="text-center p-4">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
        插件加载失败
      </h3>
      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
        {getPluginDisplayName(pluginId)} 暂时无法使用
      </p>
      {error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-300 font-mono">
          {error.message}
        </p>
      )}
    </div>
  </div>
);

// 空状态组件
const PluginEmpty: React.FC<{ pluginId: string }> = ({ pluginId }) => (
  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-4">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {getPluginDisplayName(pluginId)}
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        插件内容为空
      </p>
    </div>
  </div>
);

// 主要的插件包装器组件
export const PluginWrapper: React.FC<PluginWrapperProps> = ({
  pluginId,
  pluginProps,
  isActive = true,
  className,
  style,
}) => {
  // 获取插件组件
  const PluginComponent = useMemo(() => {
    return PLUGIN_REGISTRY[pluginId];
  }, [pluginId]);

  // 如果没有找到插件，显示测试插件
  if (!PluginComponent) {
    return (
      <div className={cx('h-full', className)} style={style}>
        <TestPlugin 
          pluginId={pluginId} 
          title={getPluginDisplayName(pluginId)} 
        />
      </div>
    );
  }

  return (
    <motion.div
      className={cx(
        'h-full w-full overflow-hidden',
        'transition-opacity duration-200',
        {
          'opacity-100': isActive,
          'opacity-50': !isActive,
        },
        className
      )}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5, 
        scale: 1 
      }}
      transition={{ 
        duration: 0.2,
        ease: "easeOut"
      }}
    >
      <Suspense fallback={<PluginLoading pluginId={pluginId} />}>
        <ErrorBoundary 
          fallback={<PluginError pluginId={pluginId} />}
          pluginId={pluginId}
        >
          <div className="h-full w-full">
            <PluginComponent 
              {...pluginProps}
              pluginId={pluginId}
              isActive={isActive}
            />
          </div>
        </ErrorBoundary>
      </Suspense>
    </motion.div>
  );
};

// 错误边界组件
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactElement;
  pluginId: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Plugin ${this.props.pluginId} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.cloneElement(this.props.fallback, { 
        error: this.state.error 
      });
    }

    return this.props.children;
  }
} 