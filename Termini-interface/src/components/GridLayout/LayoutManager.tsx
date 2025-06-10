import { useState, useEffect, useRef, useCallback } from 'react';
import { useLayoutStore } from 'store/layoutStore';

// 常量定义
const LAYOUTS_STORAGE_KEY = 'termini-saved-layouts';
const CURRENT_LAYOUT_ID_KEY = 'termini-current-layout-id';

// 布局配置接口
interface LayoutConfig {
  id: string;
  name: string;
  layout: any[];
  activePlugins: string[];
  tabContainers: {id: string; plugins: string[]}[];
  createdAt: number;
  updatedAt: number;
}

const LayoutManager: React.FC = () => {
  // 从store获取必要的函数，但不依赖store中的布局列表状态
  const { loadLayout } = useLayoutStore();
  
  // 直接在组件中管理布局列表
  const [layouts, setLayouts] = useState<LayoutConfig[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [localLayouts, setLocalLayouts] = useState<LayoutConfig[]>([]);  // 新增：直接从localStorage读取的布局
  const [forceUpdate, setForceUpdate] = useState(0); // 新增：强制组件更新的计数器
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 从localStorage读取布局 - 使用useCallback缓存函数
  const loadLayoutsFromStorage = useCallback((): LayoutConfig[] => {
    try {
      const layoutsJson = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      if (layoutsJson) {
        const parsedLayouts = JSON.parse(layoutsJson);
        console.log(`从localStorage读取了 ${parsedLayouts.length} 个布局`);
        return Array.isArray(parsedLayouts) ? parsedLayouts : [];
      }
    } catch (error) {
      console.error('读取布局失败:', error);
    }
    return [];
  }, []);
  
  // 保存布局到localStorage
  const saveLayoutsToStorage = (layouts: LayoutConfig[]): void => {
    try {
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
      console.log(`已保存 ${layouts.length} 个布局到localStorage`);
    } catch (error) {
      console.error('保存布局失败:', error);
    }
  };
  
  // 获取当前布局ID
  const getCurrentLayoutId = (): string | null => {
    try {
      return localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
    } catch (error) {
      console.error('读取当前布局ID失败:', error);
      return null;
    }
  };
  
  // 保存当前布局ID
  const saveCurrentLayoutId = (id: string | null): void => {
    try {
      if (id) {
        localStorage.setItem(CURRENT_LAYOUT_ID_KEY, id);
      } else {
        localStorage.removeItem(CURRENT_LAYOUT_ID_KEY);
      }
    } catch (error) {
      console.error('保存当前布局ID失败:', error);
    }
  };
  
  // 初始化: 加载布局和当前布局ID - 添加强制刷新逻辑
  useEffect(() => {
    console.log('LayoutManager组件初始化');
    
    const refreshAll = () => {
      const storedLayouts = loadLayoutsFromStorage();
      console.log('LayoutManager初始化，从localStorage读取到布局数:', storedLayouts.length);
      
      // 如果从localStorage读取到布局，显示它们
      if (storedLayouts.length > 0) {
        console.log('布局列表:', storedLayouts.map(l => ({ id: l.id, name: l.name })));
      }
      
      setLayouts(storedLayouts);
      setLocalLayouts(storedLayouts);
      
      const storedLayoutId = getCurrentLayoutId();
      setCurrentLayoutId(storedLayoutId);
      
      setDebugInfo(`布局数: ${storedLayouts.length} | 当前ID: ${storedLayoutId || '无'}`);
      
      // 同步到Zustand store
      useLayoutStore.setState({
        savedLayouts: storedLayouts,
        currentLayoutId: storedLayoutId
      });
      
      // 再次确认store中的布局列表已正确更新
      setTimeout(() => {
        const storeState = useLayoutStore.getState();
        if (storeState.savedLayouts.length !== storedLayouts.length) {
          console.warn('初始化后检测到store中的布局数量与localStorage不一致，再次同步...');
          useLayoutStore.setState({
            savedLayouts: storedLayouts
          });
        }
      }, 500);
      
      // 添加多次延时刷新，确保布局列表正确显示
      const refreshTimes = [100, 500, 1000, 2000];
      refreshTimes.forEach(delay => {
        setTimeout(() => {
          console.log(`延时${delay}ms刷新布局列表`);
          const currentLayouts = loadLayoutsFromStorage();
          setLayouts(currentLayouts);
          setLocalLayouts(currentLayouts);
          // 增加forceUpdate以强制重新渲染
          setForceUpdate(prev => prev + 1);
        }, delay);
      });
    };
    
    // 立即执行一次
    refreshAll();
    
    // 再次执行，确保数据加载
    setTimeout(refreshAll, 1000);
    
    // 添加一个事件监听器以检测localStorage变化
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAYOUTS_STORAGE_KEY || event.key === CURRENT_LAYOUT_ID_KEY) {
        refreshAll();
      }
    };
    
    // 监听layoutsChanged自定义事件
    const handleLayoutsChanged = () => {
      console.log('接收到layoutsChanged事件，刷新布局列表');
      refreshAll();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('layoutsChanged', handleLayoutsChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('layoutsChanged', handleLayoutsChanged);
    };
  }, [loadLayoutsFromStorage]);
  
  // 下拉菜单打开时刷新布局列表
  useEffect(() => {
    if (isOpen) {
      const storedLayouts = loadLayoutsFromStorage();
      setLayouts(storedLayouts);
      setLocalLayouts(storedLayouts);
      
      // 确保当前布局ID是最新的
      const storedLayoutId = getCurrentLayoutId();
      setCurrentLayoutId(storedLayoutId);
      
      setDebugInfo(`布局数: ${storedLayouts.length} | 当前ID: ${storedLayoutId || '无'}`);
    }
  }, [isOpen, loadLayoutsFromStorage]);
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 添加一个自动刷新布局列表的机制
  useEffect(() => {
    // 监听布局变化并自动刷新
    const refreshLayouts = () => {
      const storedLayouts = loadLayoutsFromStorage();
      setLayouts(storedLayouts);
      setLocalLayouts(storedLayouts);
      
      const storedLayoutId = getCurrentLayoutId();
      setCurrentLayoutId(storedLayoutId);
      
      setDebugInfo(`自动刷新 | 布局数: ${storedLayouts.length} | 当前ID: ${storedLayoutId || '无'}`);
    };
    
    // 监听localStorage变化的自定义事件
    window.addEventListener('layoutsChanged', refreshLayouts);
    
    // 定期刷新布局列表以确保UI与实际数据同步
    const autoRefreshInterval = setInterval(() => {
      if (isOpen) { // 只在下拉菜单打开时刷新
        refreshLayouts();
      }
    }, 1000); // 每秒刷新一次
    
    return () => {
      window.removeEventListener('layoutsChanged', refreshLayouts);
      clearInterval(autoRefreshInterval);
    };
  }, [isOpen, loadLayoutsFromStorage, getCurrentLayoutId]);
  
  // 强制更新机制：布局列表计数器发生变化时
  useEffect(() => {
    if (forceUpdate > 0) {
      console.log('强制更新布局列表, 次数:', forceUpdate);
      const storedLayouts = loadLayoutsFromStorage();
      setLayouts(storedLayouts);
      setLocalLayouts(storedLayouts);
    }
  }, [forceUpdate, loadLayoutsFromStorage]);
  
  // 保存当前布局
  const handleSaveLayout = () => {
    try {
      // 获取当前store的状态
      const state = useLayoutStore.getState();
      const now = Date.now();
      
      // 创建新布局或更新现有布局的信息
      const layoutName = newLayoutName.trim() || `布局 ${layouts.length + 1}`;
      console.log('开始保存布局:', layoutName);
      
      // 直接从localStorage获取最新数据，确保我们有完整的布局列表
      const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      let currentLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
      console.log('从localStorage读取到布局数:', currentLayouts.length);
      
      let newLayoutId = currentLayoutId;
      
      // 如果有当前布局ID，尝试更新它
      if (currentLayoutId) {
        const existingIndex = currentLayouts.findIndex((layout: LayoutConfig) => layout.id === currentLayoutId);
        
        if (existingIndex >= 0) {
          // 更新现有布局
          console.log('更新现有布局:', currentLayouts[existingIndex].name);
          currentLayouts[existingIndex] = {
            ...currentLayouts[existingIndex],
            name: layoutName, // 使用新名称
            layout: JSON.parse(JSON.stringify(state.layout)),
            activePlugins: [...state.activePlugins],
            tabContainers: JSON.parse(JSON.stringify(state.tabContainers)),
            updatedAt: now
          };
        } else {
          // 当前ID不存在，创建新布局
          const newId = `layout_${now}`;
          console.log('当前布局ID不存在，创建新布局:', newId);
          const newLayout: LayoutConfig = {
            id: newId,
            name: layoutName,
            layout: JSON.parse(JSON.stringify(state.layout)),
            activePlugins: [...state.activePlugins],
            tabContainers: JSON.parse(JSON.stringify(state.tabContainers)),
            createdAt: now,
            updatedAt: now
          };
          currentLayouts.push(newLayout);
          newLayoutId = newId;
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newId);
        }
      } else {
        // 没有当前布局ID，创建新布局
        const newId = `layout_${now}`;
        console.log('创建新布局:', newId);
        const newLayout: LayoutConfig = {
          id: newId,
          name: layoutName,
          layout: JSON.parse(JSON.stringify(state.layout)),
          activePlugins: [...state.activePlugins],
          tabContainers: JSON.parse(JSON.stringify(state.tabContainers)),
          createdAt: now,
          updatedAt: now
        };
        currentLayouts.push(newLayout);
        newLayoutId = newId;
        localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newId);
      }
      
      // 直接保存到localStorage
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(currentLayouts));
      console.log('保存到localStorage成功, 共有布局:', currentLayouts.length);
      
      // 更新本地状态
      setLayouts(currentLayouts);
      setLocalLayouts(currentLayouts);
      setCurrentLayoutId(newLayoutId);
      setNewLayoutName('');
      
      // 同步到store - 这是非常重要的一步
      useLayoutStore.setState({
        savedLayouts: currentLayouts,
        currentLayoutId: newLayoutId
      });
      
      // 显示成功提示
      showFeedback(`布局已保存：${layoutName}`, 'success');
      
      // 触发布局列表刷新
      refreshLayouts();
      
      // 触发强制更新
      setForceUpdate(prev => prev + 1);
      
      // 触发自定义事件，通知其他组件布局已更改
      window.dispatchEvent(new Event('layoutsChanged'));
    } catch (error) {
      console.error('保存布局失败:', error);
      showFeedback('保存失败', 'error');
    }
  };
  
  // 刷新布局列表，手动触发
  const refreshLayouts = () => {
    console.log('手动刷新布局列表');
    const storedLayouts = loadLayoutsFromStorage();
    console.log(`读取到 ${storedLayouts.length} 个布局`);
    
    // 同时更新两个状态
    setLayouts(storedLayouts);
    setLocalLayouts(storedLayouts);
    
    const storedLayoutId = getCurrentLayoutId();
    setCurrentLayoutId(storedLayoutId);
    
    setDebugInfo(`刷新成功 | 布局数: ${storedLayouts.length} | 当前ID: ${storedLayoutId || '无'}`);
    
    // 同步到Zustand store以确保一致性
    useLayoutStore.setState({
      savedLayouts: storedLayouts,
      currentLayoutId: storedLayoutId
    });
    
    // 如果当前没有激活的布局但存储中有布局，则激活第一个布局
    if (!storedLayoutId && storedLayouts.length > 0) {
      handleLoadLayout(storedLayouts[0].id);
    }
    
    // 触发强制更新
    setForceUpdate(prev => prev + 1);
    
    showFeedback('布局列表已刷新', 'info');
    
    return storedLayouts; // 返回布局列表以便其他函数使用
  };
  
  // 加载布局
  const handleLoadLayout = (layoutId: string) => {
    try {
      // 首先检查本地状态
      let layoutToLoad = layouts.find(layout => layout.id === layoutId);
      
      // 如果本地状态没有，则检查直接从localStorage读取的布局
      if (!layoutToLoad) {
        layoutToLoad = localLayouts.find(layout => layout.id === layoutId);
      }
      
      // 如果还是没有，尝试直接从localStorage读取
      if (!layoutToLoad) {
        const allLayouts = loadLayoutsFromStorage();
        layoutToLoad = allLayouts.find(layout => layout.id === layoutId);
        
        // 如果找到了，更新本地状态
        if (layoutToLoad) {
          setLayouts(allLayouts);
          setLocalLayouts(allLayouts);
        }
      }
      
      if (!layoutToLoad) {
        console.error(`找不到布局: ${layoutId}`);
        showFeedback('找不到布局，请尝试刷新', 'error');
        return;
      }
      
      // 保存当前布局ID
      saveCurrentLayoutId(layoutId);
      setCurrentLayoutId(layoutId);
      
      // 调用store的loadLayout函数
      loadLayout(layoutId);
      
      console.log(`成功加载布局: ${layoutToLoad.name}`);
      setIsOpen(false);
      showFeedback(`已加载布局: ${layoutToLoad.name}`, 'success');
    } catch (error) {
      console.error('加载布局失败:', error);
      showFeedback('加载失败，请查看控制台', 'error');
    }
  };
  
  // 删除布局
  const handleDeleteLayout = (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('确定要删除此布局吗？')) return;
    
    try {
      // 获取最新布局列表
      let currentLayouts = loadLayoutsFromStorage();
      
      // 过滤掉要删除的布局
      currentLayouts = currentLayouts.filter(layout => layout.id !== layoutId);
      
      // 更新当前布局ID
      if (currentLayoutId === layoutId) {
        const newCurrentId = currentLayouts.length > 0 ? currentLayouts[0].id : null;
        saveCurrentLayoutId(newCurrentId);
        setCurrentLayoutId(newCurrentId);
        
        // 如果有新的当前布局，加载它
        if (newCurrentId) {
          const newCurrentLayout = currentLayouts.find(layout => layout.id === newCurrentId);
          if (newCurrentLayout) {
            loadLayout(newCurrentId);
          }
        }
      }
      
      // 保存更新后的布局列表
      saveLayoutsToStorage(currentLayouts);
      setLayouts(currentLayouts);
      setLocalLayouts(currentLayouts);
      showFeedback('布局已删除', 'info');
      
      // 同步到Zustand store
      useLayoutStore.setState({
        savedLayouts: currentLayouts,
        currentLayoutId: currentLayoutId === layoutId ? (currentLayouts.length > 0 ? currentLayouts[0].id : null) : currentLayoutId
      });
      
      // 触发强制更新
      setForceUpdate(prev => prev + 1);
      
      // 触发自定义事件，通知其他组件布局已更改
      window.dispatchEvent(new Event('layoutsChanged'));
    } catch (error) {
      console.error('删除布局失败:', error);
      showFeedback('删除失败', 'error');
    }
  };
  
  // 开始编辑布局名称
  const startEditingName = (layoutId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayoutId(layoutId);
    setEditingName(currentName);
  };
  
  // 保存编辑后的布局名称
  const saveLayoutName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingLayoutId || !editingName.trim()) return;
    
    try {
      // 获取最新布局列表
      let currentLayouts = loadLayoutsFromStorage();
      
      // 更新布局名称
      currentLayouts = currentLayouts.map(layout => 
        layout.id === editingLayoutId 
          ? { ...layout, name: editingName.trim(), updatedAt: Date.now() }
          : layout
      );
      
      // 保存更新后的布局列表
      saveLayoutsToStorage(currentLayouts);
      setLayouts(currentLayouts);
      setLocalLayouts(currentLayouts);
      setEditingLayoutId(null);
      showFeedback('布局已重命名', 'info');
      
      // 同步到Zustand store
      useLayoutStore.setState({
        savedLayouts: currentLayouts
      });
      
      // 触发强制更新
      setForceUpdate(prev => prev + 1);
      
      // 触发自定义事件，通知其他组件布局已更改
      window.dispatchEvent(new Event('layoutsChanged'));
    } catch (error) {
      console.error('重命名布局失败:', error);
      showFeedback('重命名失败', 'error');
    }
  };
  
  // 显示反馈信息
  const showFeedback = (message: string, type: 'success' | 'info' | 'error') => {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.className = `layout-feedback ${type}`;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.right = '20px';
    feedback.style.backgroundColor = 
      type === 'success' ? 'rgba(39, 174, 96, 0.9)' : 
      type === 'info' ? 'rgba(52, 152, 219, 0.9)' : 
      'rgba(231, 76, 60, 0.9)';
    feedback.style.color = 'white';
    feedback.style.padding = '10px 20px';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '9999';
    feedback.style.transition = 'opacity 0.5s';
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 500);
    }, 2000);
  };
  
  // 获取当前布局名称
  const getCurrentLayoutName = () => {
    if (!currentLayoutId) return '默认布局';
    
    const layout = layouts.find(layout => layout.id === currentLayoutId);
    if (layout) return layout.name;
    
    return '未命名布局';
  };
  
  // 创建默认布局
  const createDefaultLayout = () => {
    handleSaveLayout();
  };
  
  // 修改isOpen状态，打开时自动刷新布局列表
  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      console.log('打开布局管理器，刷新布局列表');
      // 打开时立即刷新布局列表
      setTimeout(() => {
        const layouts = refreshLayouts();
        console.log(`已刷新布局列表，找到 ${layouts.length} 个布局`);
      }, 0);
    }
  };
  
  return (
    <div className="relative layout-manager">
      <button 
        onClick={toggleOpen}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-dark text-white"
      >
        <span className="font-medium">布局</span>
        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">{localLayouts.length}</span>
      </button>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-12 w-80 bg-white shadow-lg rounded-md overflow-hidden z-50 layout-dropdown"
        >
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700">布局管理</h3>
            <div className="flex space-x-2">
              <button 
                onClick={refreshLayouts}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                title="刷新布局列表"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </button>
              <button 
                onClick={createDefaultLayout}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                title="创建默认布局"
              >
                默认
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {localLayouts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                没有保存的布局
              </div>
            ) : (
              <ul>
                {localLayouts.map(layout => (
                  <li 
                    key={layout.id}
                    onClick={() => handleLoadLayout(layout.id)}
                    className={`p-3 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center ${currentLayoutId === layout.id ? 'bg-blue-100' : ''}`}
                  >
                    {editingLayoutId === layout.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveLayoutName({} as React.MouseEvent);
                          }
                        }}
                        className="border px-2 py-1 rounded flex-1 mr-2"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex-1">
                        <span className="font-medium">{layout.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(layout.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-1" onClick={e => e.stopPropagation()}>
                      {editingLayoutId === layout.id ? (
                        <>
                          <button
                            onClick={saveLayoutName}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="保存"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingLayoutId(null)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="取消"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={e => startEditingName(layout.id, layout.name, e)}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="重命名"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                          <button
                            onClick={e => handleDeleteLayout(layout.id, e)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="删除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">{debugInfo}</div>
            <div className="flex">
              <input
                type="text"
                placeholder="新布局名称"
                value={newLayoutName}
                onChange={e => setNewLayoutName(e.target.value)}
                className="border px-2 py-1 rounded flex-1 mr-2"
              />
              <button
                onClick={handleSaveLayout}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
          
          <div className="p-2 bg-gray-100 flex justify-center">
            <button 
              onClick={refreshLayouts}
              className="flex items-center justify-center w-full py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="mr-1">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              刷新布局列表 ({localLayouts.length})
            </button>
          </div>
          
          <div className="p-2 bg-gray-200 flex justify-between items-center text-xs text-gray-600">
            <div>
              <div><strong>总布局数:</strong> {localLayouts.length}</div>
              <div><strong>更新次数:</strong> {forceUpdate}</div>
            </div>
            <button 
              onClick={() => setForceUpdate(prev => prev + 1)}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
              title="强制刷新布局列表"
            >
              强制刷新
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutManager; 