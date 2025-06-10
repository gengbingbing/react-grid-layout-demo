export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon?: string;
  defaultConfig?: Record<string, any>;
  isFixed?: boolean; // 是否固定位置，不可拖动
}

// 通用的基础配置，所有插件共享
export interface BasePluginConfig {
  token?: string; // 当前选择的代币
  tokenAddress?: string; // 代币地址
  theme?: 'light' | 'dark'; // 主题配置
}

export interface Plugin {
  metadata: PluginMetadata;
  component: React.ComponentType<{
    config: Record<string, any> & BasePluginConfig;
    onConfigChange: (newConfig: Record<string, any>) => void;
  }>;
}

// 导出主题类型供插件使用
export type ThemeMode = 'light' | 'dark';
