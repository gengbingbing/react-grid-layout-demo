import React from 'react';

interface PluginCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  dragHandleClassName?: string;
  buttons?: React.ReactNode;
  onRemove?: () => void;
}

/**
 * 插件卡片组件 - 为插件提供统一的卡片样式
 */
const PluginCard: React.FC<PluginCardProps> = ({
  children,
  title,
  className = '',
  dragHandleClassName = '',
  buttons,
  onRemove
}) => {
  return (
    <div className={`plugin-card ${className}`}>
      {/* 卡片头部 */}
      {(title || buttons || onRemove) && (
        <div className={`flex items-center justify-between mb-2 ${dragHandleClassName}`}>
          {title && (
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          )}
          
          <div className="flex items-center space-x-1">
            {buttons}
            
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                title="移除插件"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 卡片内容 */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default PluginCard; 