import { useState, useEffect } from 'react'
import './App.css'
import GridLayout from './components/GridLayout'
import PluginMarket from './components/PluginMarket'
import LayoutManager from './components/LayoutManager'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { 
  useLayoutStore, 
  LAYOUTS_STORAGE_KEY, 
  CURRENT_LAYOUT_ID_KEY,
  checkLayoutStorageStatus 
} from './store/layoutStore'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './store/themeStore'

// 添加全局样式修复
import './fixStyles.css'

function App() {
  const [isMarketOpen, setIsMarketOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { mode } = useTheme();
  const { 
    activePlugins, 
    hasInitializedDefault, 
    initDefaultLayout, 
    loadLayout
  } = useLayoutStore()
  
  // 在组件挂载时检查是否需要初始化默认布局
  useEffect(() => {
    console.log('检查布局初始化状态:', { 
      hasInitializedDefault, 
      pluginsCount: activePlugins.length
    });
    
    // 直接从localStorage检查布局数据
    try {
      const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
      
      if (rawLayouts) {
        const parsedLayouts = JSON.parse(rawLayouts);
        console.log('找到已保存的布局:', {
          count: parsedLayouts.length,
          currentId: currentId
        });
        
        // 强制确保布局同步到store - 确保这一步总是执行
        useLayoutStore.setState({
          savedLayouts: parsedLayouts,
          currentLayoutId: currentId
        });
        console.log('已将布局数据同步到store，布局数量:', parsedLayouts.length);
        
        // 显示布局列表供调试
        parsedLayouts.forEach((layout: any, index: number) => {
          console.log(`布局 ${index + 1}: ${layout.name} (ID: ${layout.id})`);
        });
        
        // 优先尝试加载上次使用的布局
        if (currentId && parsedLayouts.some((layout: any) => layout.id === currentId)) {
          console.log('尝试加载上次使用的布局:', currentId);
          setTimeout(() => loadLayout(currentId), 800); // 延长延时
          return; // 如果有保存的布局则不初始化默认布局
        }
        
        // 如果没有当前布局ID但有保存的布局，加载第一个
        if (parsedLayouts.length > 0) {
          const firstLayout = parsedLayouts[0];
          console.log('加载第一个保存的布局:', firstLayout.id);
          setTimeout(() => loadLayout(firstLayout.id), 800); // 延长延时
          return;
        }
      } else {
        console.log('没有找到保存的布局数据，将初始化默认布局');
      }
    } catch (error) {
      console.error('读取保存的布局失败:', error);
    }

    // 如果未初始化默认布局或无活跃插件，则初始化默认布局
    if (!hasInitializedDefault || activePlugins.length === 0) {
      console.log('正在初始化默认布局...');
      initDefaultLayout();
    }
  }, [hasInitializedDefault, activePlugins.length, initDefaultLayout, loadLayout]);

  // 添加调试函数
  const debugStorage = () => {
    try {
      // 使用我们新创建的全局函数检查布局状态
      const status = checkLayoutStorageStatus() as any;
      console.log('布局存储状态检查完成:', status);
      
      // 显示状态提示
      alert(`发现${status.localStorage?.layoutsCount || 0}个布局。
布局数据${status.isConsistent ? '一致' : '不一致'}。
详情请查看控制台。`);
      
      // 如果数据不一致，尝试修复
      if (!status.isConsistent) {
        console.warn('检测到布局数据不一致，尝试修复...');
        
        // 从localStorage同步到store
        if (status.localStorage?.hasData) {
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const layouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
          
          useLayoutStore.setState({
            savedLayouts: layouts,
            currentLayoutId: currentId
          });
          
          console.log('已将localStorage数据同步到store');
        }
      }
    } catch (error) {
      console.error('调试存储出错:', error);
      alert('读取布局存储失败，请查看控制台获取详细信息。');
    }
  };
  
  // 强制重新加载布局
  const forceReloadLayout = () => {
    try {
      const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
      const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      
      if (rawLayouts) {
        const parsedLayouts = JSON.parse(rawLayouts);
        console.log('强制重新加载布局数据:', {
          layoutCount: parsedLayouts.length,
          currentId: currentId
        });
        
        // 先更新store中的布局列表
        useLayoutStore.setState({
          savedLayouts: parsedLayouts
        });
        
        // 如果有当前激活的布局，加载它
        if (currentId && parsedLayouts.some((layout: any) => layout.id === currentId)) {
          loadLayout(currentId);
          alert(`已重新加载布局：${currentId}`);
          return;
        }
        
        // 如果没有当前ID但有布局，加载第一个
        if (parsedLayouts.length > 0) {
          const firstLayout = parsedLayouts[0];
          loadLayout(firstLayout.id);
          alert(`已加载第一个布局：${firstLayout.name}`);
          return;
        }
      }
      
      // 如果没有布局，初始化默认布局
      alert('没有找到布局，将初始化默认布局');
      initDefaultLayout();
    } catch (error) {
      console.error('强制重新加载布局失败:', error);
      alert('重新加载布局失败，将初始化默认布局');
      initDefaultLayout();
    }
  };

  // 添加安全保障机制，定期检查布局列表是否被清空
  useEffect(() => {
    // 定期检查localStorage和store中的布局数据是否一致
    const checkInterval = setInterval(() => {
      try {
        const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
        if (rawLayouts) {
          const localLayouts = JSON.parse(rawLayouts);
          const storeState = useLayoutStore.getState();
          
          // 如果store中的布局列表为空但localStorage中有布局，则修复
          if (storeState.savedLayouts.length === 0 && localLayouts.length > 0) {
            console.warn('定期检查: 检测到store中的布局列表为空，但localStorage中有布局，执行修复...');
            useLayoutStore.setState({
              savedLayouts: localLayouts,
              currentLayoutId: localStorage.getItem(CURRENT_LAYOUT_ID_KEY)
            });
          }
        }
      } catch (error) {
        console.error('布局检查出错:', error);
      }
    }, 5000); // 每5秒检查一次
    
    return () => clearInterval(checkInterval);
  }, []);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`全屏请求失败: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`h-full flex flex-col bg-theme-panel ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <header className="bg-theme-header shadow-md">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-theme-primary">交易终端</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              {/* 全屏按钮 */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                title={isFullscreen ? "退出全屏" : "全屏模式"}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H7.414l2.293 2.293a1 1 0 1 1-1.414 1.414L6 6.414V9a1 1 0 0 1-2 0V4zm14 12a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h2.586l-2.293-2.293a1 1 0 1 1 1.414-1.414L18 13.586V11a1 1 0 0 1 2 0v5z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H5.414l2.293 2.293a1 1 0 1 1-1.414 1.414L4 6.414V9a1 1 0 0 1-2 0V4zm14 0a1 1 0 0 1 1 1v5a1 1 0 0 1-2 0V6.414l-2.293 2.293a1 1 0 1 1-1.414-1.414L14.586 5H12a1 1 0 0 1 0-2h5zM4 16a1 1 0 0 1 1-1h2.586l-2.293-2.293a1 1 0 1 1 1.414-1.414L9 13.586V11a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm14-3a1 1 0 0 1-2 0v-2.586l-2.293 2.293a1 1 0 1 1-1.414-1.414L14.586 9H12a1 1 0 0 1 0-2h5a1 1 0 0 1 1 1v5z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={debugStorage}
                className="px-3 py-1.5 rounded-md btn-theme-secondary text-sm hidden md:block"
                title="查看布局存储信息"
              >
                调试
              </button>
              <button
                onClick={forceReloadLayout}
                className="px-3 py-1.5 rounded-md btn-theme-secondary text-sm"
                title="强制重新加载布局"
              >
                重载布局
              </button>
              <LayoutManager />
              
              <button
                onClick={() => setIsMarketOpen(true)}
                className="px-4 py-2 rounded-md btn-theme-primary"
              >
                插件市场
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden p-2">
        {activePlugins.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="mb-4">暂无插件，请从插件市场添加</p>
            <button
              onClick={() => setIsMarketOpen(true)}
              className="px-4 py-2 rounded-md btn-theme-primary"
            >
              打开插件市场
            </button>
          </div>
        ) : (
          <GridLayout />
        )}
      </main>
      
      {/* 插件市场侧边栏 */}
      <Transition.Root show={isMarketOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsMarketOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-theme-card shadow-xl">
                      <div className="px-4 py-6 sm:px-6 border-b border-theme">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            插件市场
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-full p-1 bg-theme-card text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={() => setIsMarketOpen(false)}
                            >
                              <span className="sr-only">关闭面板</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative flex-1 px-4 sm:px-6 py-4">
                        <PluginMarket />
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  )
}

export default App
