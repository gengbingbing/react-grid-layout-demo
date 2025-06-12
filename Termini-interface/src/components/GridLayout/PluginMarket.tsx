import { useState, useEffect } from 'react';
import { useLayoutStore } from 'store/layoutStore';
import { pluginRegistry } from 'plugins/registry';
import type { Plugin } from 'plugins/types';

export default function PluginMarket() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activePlugins, addPlugin, tabContainers, layout } = useLayoutStore();
  
  // 🔧 修复：全局检查插件是否已添加到系统中
  const isPluginActive = (pluginId: string): boolean => {
    // 检查是否在活跃插件列表中
    if (activePlugins.includes(pluginId)) {
      return true;
    }
    
    // 检查是否在任何标签容器中
    for (const tabContainer of tabContainers) {
      if (tabContainer.plugins.includes(pluginId)) {
        return true;
      }
    }
    
    // 检查是否作为独立布局项存在
    if (layout.some(item => item.i === pluginId)) {
      return true;
    }
    
    return false;
  };
  
  useEffect(() => {
    // 模拟从API获取插件列表
    const fetchPlugins = async () => {
      setIsLoading(true);
      try {
        // 实际项目中这里会从后端API获取
        const officialPlugins = pluginRegistry.getAll();
        // 可能还会有来自第三方的插件
        setPlugins(officialPlugins);
      } catch (error) {
        console.error('加载插件失败', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlugins();
  }, []);

  // 🔧 新增：监听全局状态变化，实时更新插件状态
  useEffect(() => {
    console.log('🔄 PluginMarket: 全局状态变化，重新检查插件状态');
    
    // 强制重新渲染，确保插件状态正确显示
    setPlugins(prevPlugins => [...prevPlugins]);
  }, [activePlugins, tabContainers, layout]);
  
  return (
    <div className="h-full pb-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {plugins.map((plugin) => {
            const pluginIsActive = isPluginActive(plugin.metadata.id);
            
            return (
              <div 
                key={plugin.metadata.id} 
                className="plugin-card"
              >
                <div className="flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      {plugin.metadata.icon && (
                        <img 
                          src={plugin.metadata.icon} 
                          alt="" 
                          className="w-6 h-6 mr-2 rounded"
                        />
                      )}
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{plugin.metadata.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        if (!pluginIsActive) {
                          console.log(`🎯 从PluginMarket添加插件: ${plugin.metadata.name} (${plugin.metadata.id})`);
                          addPlugin(plugin.metadata.id);
                        }
                      }}
                      disabled={pluginIsActive}
                      className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                        pluginIsActive
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'btn-theme-primary hover:opacity-80'
                      }`}
                      title={pluginIsActive ? '插件已添加到系统中' : '点击添加插件'}
                    >
                      {pluginIsActive ? '已添加' : '添加'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{plugin.metadata.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>作者: {plugin.metadata.author}</span>
                    <span>v{plugin.metadata.version}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {plugins.length === 0 && (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              暂无可用插件
            </div>
          )}
        </div>
      )}
    </div>
  );
}
