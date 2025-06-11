import React from 'react';

interface PluginContainerProps {
  pluginId: string;
  onRemove?: () => void;
  hideHeader?: boolean;
  theme?: 'light' | 'dark';
  token?: any;
  locale?: string;
  onTokenChange?: (token: any) => void;
}

declare const PluginContainer: React.FC<PluginContainerProps>;
export default PluginContainer; 