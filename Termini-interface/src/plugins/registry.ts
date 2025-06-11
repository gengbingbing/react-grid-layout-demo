import type { Plugin } from './types';
import { useTheme } from 'context/ThemeContext';
import React from 'react';

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private initialized: boolean = false;
  
  register(plugin: Plugin): void {
    this.plugins.set(plugin.metadata.id, plugin);
  }
  
  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  async loadPlugin(id: string): Promise<Plugin> {
    // 确保插件注册表已初始化
    if (!this.initialized) {
      await this.initOfficialPlugins();
    }
    
    // 先检查是否已经注册
    const existingPlugin = this.plugins.get(id);
    if (existingPlugin) {
      return existingPlugin;
    }
    
    // 先尝试从官方目录加载
    try {
      const module = await import(/* @vite-ignore */ `./official/${id.replace('official-', '')}/index`);
      const plugin = module.default;
      this.register(plugin);
      return plugin;
    } catch (error) {
      console.error(`加载官方插件失败: ${id}`, error);
      // 如果不是官方插件，尝试从市场加载
      try {
        const module = await import(/* @vite-ignore */ `./marketplace/${id}/index`);
        const plugin = module.default;
        this.register(plugin);
        return plugin;
      } catch (marketplaceError) {
        console.error(`加载市场插件失败: ${id}`, marketplaceError);
        throw new Error(`无法加载插件: ${id}`);
      }
    }
  }
  
  // 初始化官方插件
  async initOfficialPlugins(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log('正在初始化官方插件...');
    
    try {
      // 加载价格卡片插件（新增）
      const priceCard = await import('./official/price-card');
      this.register(priceCard.default);
      console.log('已加载价格卡片插件');
      
      // 加载价格图表插件
      const priceChart = await import('./official/price-chart');
      this.register(priceChart.default);
      console.log('已加载价格图表插件');
      
      // 加载订单簿插件
      const orderBook = await import('./official/order-book');
      this.register(orderBook.default);
      console.log('已加载订单簿插件');
      
      // 加载推特舆情监控插件
      const twitterSentiment = await import('./official/twitter-sentiment');
      this.register(twitterSentiment.default);
      console.log('已加载推特舆情插件');
      
      // 加载市场信号雷达插件
      const marketSignals = await import('./official/market-signals');
      this.register(marketSignals.default);
      console.log('已加载市场信号插件');
      
      // 加载TradingView K线图插件
      const tradingChart = await import('./official/trading-chart');
      this.register(tradingChart.default);
      console.log('已加载TradingView K线图插件');
      
      // 加载加密新闻/Alpha源插件
      const cryptoNews = await import('./official/crypto-news');
      this.register(cryptoNews.default);
      console.log('已加载加密新闻插件');
      
      // 加载链上实时数据流插件
      const onchainData = await import('./official/onchain-data');
      this.register(onchainData.default);
      console.log('已加载链上数据插件');
      
      // 加载Threads聊天插件
      const threadsChat = await import('./official/threads-chat');
      this.register(threadsChat.default);
      console.log('已加载Threads聊天插件');
      
      this.initialized = true;
      console.log('所有官方插件初始化完成！可用插件:', Array.from(this.plugins.keys()));
    } catch (error) {
      console.error('初始化官方插件失败', error);
    }
  }
}

export const pluginRegistry = new PluginRegistry();

// 立即初始化官方插件
pluginRegistry.initOfficialPlugins().catch(console.error);

// 导出一个确保插件初始化完成的函数
export const ensurePluginsLoaded = async () => {
  if (!pluginRegistry.getAll().length) {
    await pluginRegistry.initOfficialPlugins();
  }
  return pluginRegistry.getAll();
};

// 修改插件包装逻辑，添加主题支持
export const wrapPluginWithTheme = (plugin: Plugin): Plugin => {
  const OriginalComponent = plugin.component;
  const themeMode = useTheme();
  
  // 创建包装后的组件
  const WrappedComponent: React.ComponentType<{
    config: Record<string, any>;
    onConfigChange: (newConfig: Record<string, any>) => void;
  }> = (props) => {
    // 获取当前主题
    
    // 合并主题到配置中
    const configWithTheme = {
      ...props.config,
      theme: themeMode
    };
    
    // 渲染原始组件
    return React.createElement(OriginalComponent, {
      ...props,
      config: configWithTheme
    });
  };
  
  // 返回包装后的插件
  return {
    ...plugin,
    component: WrappedComponent
  };
};
