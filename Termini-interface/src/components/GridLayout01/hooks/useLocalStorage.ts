import { useState, useEffect } from 'react';

/**
 * 使用localStorage存储和检索数据的自定义钩子
 * 
 * @param key - localStorage中的键名
 * @param initialValue - 初始值，如果localStorage中没有数据
 * @returns 存储的值和更新函数的元组
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // 从localStorage获取数据或使用初始值
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`读取localStorage键"${key}"时出错:`, error);
      return initialValue;
    }
  };

  // 使用读取到的值初始化状态
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 更新localStorage和状态的函数
  const setValue = (value: T) => {
    try {
      // 允许值为函数，类似useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 保存到状态
      setStoredValue(valueToStore);
      
      // 保存到localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // 触发自定义事件，用于在同一页面中的其他组件间同步
      window.dispatchEvent(new Event('local-storage-update'));
    } catch (error) {
      console.warn(`无法存储到localStorage键"${key}":`, error);
    }
  };

  // 监听storage事件以在多窗口/标签页间同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    // 监听页内事件更新
    const handleLocalUpdate = () => {
      setStoredValue(readValue());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate);
    };
  }, [key]);

  return [storedValue, setValue];
} 