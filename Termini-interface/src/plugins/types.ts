import React from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

// 在导出类型声明中添加配置项类型
export interface PluginSettingOption {
  name: string;
  label: string;
  type: 'boolean' | 'text' | 'select' | 'number';
  defaultValue?: any;
  placeholder?: string;
  options?: Array<{value: string, label: string}>;
}

export interface PluginMetadata {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  defaultConfig?: Record<string, any>;
  hideHeader?: boolean; // 是否隐藏头部
  isFixed?: boolean; // 是否固定位置，不可拖动
  settings?: PluginSettingOption[]; // 插件设置选项
}

// 通用的基础配置，所有插件共享
export interface BasePluginConfig {
  token?: any;
  tokenAddress?: string; // 代币地址
  theme?: ThemeMode;
  locale?: string;
}

export interface Plugin {
  metadata: PluginMetadata;
  component: React.ComponentType<{
    config: Record<string, any> & BasePluginConfig;
    onConfigChange: (newConfig: Record<string, any>) => void;
    token?: any;
    theme?: ThemeMode;
    locale?: string;
  }>;
}
