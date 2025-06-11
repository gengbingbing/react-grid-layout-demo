import React, { useState } from 'react';
import { Transition } from '@headlessui/react';
import type { LayoutConfig } from './store/layoutStore01';

interface LayoutControlsProps {
  savedLayouts: any[]; // 已保存的布局列表
  currentLayoutId: string | null; // 当前布局ID
  onLoadLayout: (layoutId: string) => void; // 加载布局回调
  onSaveLayout: (name?: string) => void; // 保存布局回调
  onDeleteLayout: (layoutId: string) => void; // 删除布局回调
  onClose: () => void; // 关闭控制面板回调
  onThemeToggle: () => void; // 切换主题回调
  theme: 'light' | 'dark'; // 当前主题
  locale: string; // 当前语言
  onLocaleChange: (locale: string) => void; // 切换语言回调
}

/**
 * 布局控制面板组件
 */
const LayoutControls: React.FC<LayoutControlsProps> = ({
  savedLayouts,
  currentLayoutId,
  onLoadLayout,
  onSaveLayout,
  onDeleteLayout,
  onClose,
  onThemeToggle,
  theme,
  locale,
  onLocaleChange
}) => {
  const [newLayoutName, setNewLayoutName] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layouts' | 'settings'>('layouts');

  // 保存新布局
  const handleSaveLayout = () => {
    onSaveLayout(newLayoutName.trim() || undefined);
    setNewLayoutName('');
    setShowSaveDialog(false);
  };

  return (
    <div className="fixed top-16 right-4 z-40 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">布局控制面板</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          aria-label="关闭"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex" aria-label="标签页">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'layouts'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('layouts')}
          >
            布局
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'settings'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            设置
          </button>
        </nav>
      </div>
      
      {/* 布局管理 */}
      {activeTab === 'layouts' && (
        <div className="p-4">
          {/* 布局列表 */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">已保存的布局</div>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {savedLayouts.length > 0 ? (
                savedLayouts.map((layout) => (
                  <div 
                    key={layout.id} 
                    className={`flex justify-between items-center p-2 rounded-md ${
                      currentLayoutId === layout.id 
                        ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex-1 mr-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{layout.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(layout.updatedAt).toLocaleString('zh-CN', { 
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onLoadLayout(layout.id)}
                        disabled={currentLayoutId === layout.id}
                        className={`p-1 rounded-md ${
                          currentLayoutId === layout.id 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800'
                        }`}
                        aria-label="加载布局"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(layout.id)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                        aria-label="删除布局"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  没有已保存的布局
                </div>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              保存当前布局
            </button>
          </div>
        </div>
      )}
      
      {/* 设置页面 */}
      {activeTab === 'settings' && (
        <div className="p-4 space-y-4">
          {/* 主题设置 */}
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">主题设置</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                当前主题: {theme === 'light' ? '浅色' : '深色'}
              </span>
              <button
                onClick={onThemeToggle}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md text-sm"
              >
                切换主题
              </button>
            </div>
          </div>
          
          {/* 语言设置 */}
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">语言设置</div>
            <select
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English (US)</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
      )}
      
      {/* 保存布局对话框 */}
      <Transition
        show={showSaveDialog}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">保存布局</h3>
            <input
              type="text"
              placeholder="布局名称"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveLayout}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </Transition>
      
      {/* 删除确认对话框 */}
      <Transition
        show={showDeleteConfirm !== null}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              确定要删除此布局吗？此操作无法撤消。
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm) {
                    onDeleteLayout(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LayoutControls; 