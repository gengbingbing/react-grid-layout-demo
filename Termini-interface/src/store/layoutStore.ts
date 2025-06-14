import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';
import { pluginRegistry } from 'plugins/registry';

// 全局类型声明
declare global {
  interface Window {
    __recentlyRemovedPlugins?: {
      [pluginId: string]: number;
    };
    __draggedPluginInfo?: {
      pluginId: string;
      tabId: string;
      startTime: number;
      confirmedDragTime?: number;
      isDraggingContainer?: boolean; // 新增：标记是否是拖拽整个容器
    };
    __draggedPluginPosition?: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    __gridParams?: {
      rect: DOMRect;
      rowHeight: number;
      margin: number;
      cols: number;
      colWidth: number;
    };
    __handleDragMouseMove?: (e: MouseEvent) => void;
    __handleDragMouseUp?: (e: MouseEvent) => void;
    __isPotentialDrag?: boolean;
    __lastDragCheck?: number;
  }
}

// 布局配置接口
interface LayoutConfig {
  id: string;         // 布局ID
  name: string;       // 布局名称
  layout: Layout[];   // 布局配置
  activePlugins: string[]; // 活跃插件
  tabContainers: TabGroup[]; // 标签容器
  createdAt: number;  // 创建时间
  updatedAt: number;  // 更新时间
}

// 添加TabContainer接口
interface TabGroup {
  id: string;         // 容器ID
  plugins: string[];  // 包含的插件ID列表
}

interface LayoutState {
  layout: Layout[];
  activePlugins: string[];
  // 新增: 标签容器组
  tabContainers: TabGroup[];
  updateLayout: (newLayout: Layout[]) => void;
  addPlugin: (pluginId: string) => void;
  removePlugin: (pluginId: string) => void;
  updateAllPluginsToken: (token: string, address: string) => void;
  hasInitializedDefault: boolean;
  initDefaultLayout: () => void;
  resetStore: () => void;
  // 新增: 标签页相关操作
  createTabContainer: (firstPluginId: string, secondPluginId: string) => void; 
  removePluginFromTab: (tabId: string, pluginId: string, customPosition?: {x: number, y: number, w: number, h: number}) => void;
  removeTabContainer: (tabId: string) => void;
  // 新增: 向Tab容器添加插件
  addPluginToTab: (tabId: string, pluginId: string) => void;
  // 新增: 将单个插件转换为标签容器
  convertToTab: (pluginId: string) => void;
  // 新增: 合并标签容器
  moveTabContainers: (sourceId: string, targetId: string) => void;
  _lastTokenUpdate?: number; // 用于跟踪token更新时间
  // 新增允许将插件从一个标签容器移动到另一个标签容器的函数
  movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => void;
  
  // 新增：多布局支持
  savedLayouts: LayoutConfig[]; // 保存的布局列表
  currentLayoutId: string | null; // 当前激活的布局ID
  saveCurrentLayout: (name?: string) => void; // 保存当前布局
  loadLayout: (layoutId: string) => void; // 加载指定布局
  deleteLayout: (layoutId: string) => void; // 删除指定布局
  renameLayout: (layoutId: string, newName: string) => void; // 重命名布局
  
  // 新增: 获取标签容器中的插件列表
  getTabPlugins: (tabId: string) => string[];
  // 新增: 更新容器尺寸
  updateItemSize: (itemId: string, width: number, height: number) => void;
  // 新增: 从布局中移除项目
  removeItemFromLayout: (itemId: string) => void;
  // 新增: 更新活跃容器
  updateActiveContainer?: (containerId: string) => void;
  // 活跃容器列表
  activeContainers?: string[];
  // 🚀 新增：智能容器重排功能
  smartRepositionContainer: (
    containerId: string, 
    insertPosition: { x: number, y: number }, 
    targetRowContainers: Layout[]
  ) => void;
  // 🆕 新增：空白区域智能放置功能
  smartPlaceInEmptySpace: (
    containerId: string,
    position: { x: number, y: number },
    size: { w: number, h: number }
  ) => void;
}

// 默认添加的6个插件
const DEFAULT_PLUGINS = [
  'official-price-card',
  'official-price-chart', 
  'official-order-book',
  'official-market-signals',
  'official-twitter-sentiment',
  'official-onchain-data'
];

// 默认布局配置
const DEFAULT_LAYOUT: Layout[] = [
  // 价格卡片 - 固定在左上角
  {
    i: 'official-price-card',
    x: 0,
    y: 0,
    w: 5,
    h: 16,
    minW: 3,
    minH: 4,
    // static: false // 设置为静态，不可拖动
  },
  // K线图插件
  {
    i: 'official-price-chart',
    x: 5,
    y: 0,
    w: 7,
    h: 16,
    minW: 4,
    minH: 4
  },
  // 订单簿插件
  {
    i: 'official-order-book',
    x: 0,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 市场信号插件
  {
    i: 'official-market-signals',
    x: 4,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 推特舆情插件
  {
    i: 'official-twitter-sentiment',
    x: 8,
    y: 8,
    w: 4,
    h: 6,
    minW: 3,
    minH: 4
  },
  // 链上数据插件
  {
    i: 'official-onchain-data',
    x: 0,
    y: 14,
    w: 12,
    h: 6,
    minW: 6,
    minH: 4
  }
];

// 寻找布局中的空位
const findEmptyPosition = (layout: Layout[], cols: number = 12) => {
  // 创建一个二维数组表示网格
  // 先初始化足够大的网格（假设最大占用高度为100行）
  const grid: boolean[][] = Array(100).fill(null).map(() => Array(cols).fill(false));
  
  // 标记已占用的格子
  layout.forEach(item => {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        if (y < grid.length && x < cols) {
          grid[y][x] = true; 
        }
      }
    }
  });
  
  // 找到能放置w=6, h=6的空位
  const placeWidth = 6;
  const placeHeight = 6;
  
  // 从上到下，从左到右查找合适位置
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x <= cols - placeWidth; x++) {
      let canPlace = true;
      
      // 判断从(x,y)开始的区域是否都是空的
      for (let cy = y; cy < y + placeHeight; cy++) {
        for (let cx = x; cx < x + placeWidth; cx++) {
          if (cy < grid.length && grid[cy][cx]) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }
      
      if (canPlace) {
        return { x, y };
      }
    }
  }
  
  // 如果没有找到合适位置，则放在最底部
  const maxY = layout.length > 0 ? Math.max(...layout.map(item => item.y + item.h)) : 0;
  return { x: 0, y: maxY };
};

// 垂直紧缩布局，移除空白行并重新排列元素
const compactLayoutVertically = (layout: Layout[], cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  // 使用智能布局重排替代原有的简单垂直紧缩
  return smartCompactLayout(layout, cols);
};

// 智能布局重排 - 综合处理垂直和水平空白填充
const smartCompactLayout = (layout: Layout[], cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  console.log('开始智能布局重排，原始布局:', layout.map(item => ({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h })));
  
  // 第一步：智能重排，解决占满宽度元素的阻塞问题
  let compactedLayout = intelligentRearrangement(layout, cols);
  
  // 第二步：基础垂直紧缩，移除空白行
  // 🚫 暂时禁用垂直压缩，避免布局混乱
  // compactedLayout = basicVerticalCompact(compactedLayout, cols);
  console.log('📏 垂直压缩已禁用 - 保持原有垂直位置');
  
  // 第三步：水平优化，让元素扩展填充空白区域
  compactedLayout = horizontalSpaceOptimization(compactedLayout, cols);
  
  console.log('智能布局重排完成，最终布局:', compactedLayout.map(item => ({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h })));
  
  return compactedLayout;
};

// 智能重排算法 - 解决占满宽度元素阻塞问题
const intelligentRearrangement = (layout: Layout[], cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  console.log('开始智能重排算法');
  
  // 复制布局数组
  const workingLayout = [...layout];
  
  // 分析布局结构，识别问题区域
  const layoutAnalysis = analyzeLayoutStructure(workingLayout, cols);
  console.log('布局结构分析:', layoutAnalysis);
  
  // 如果存在阻塞问题，进行重排
  if (layoutAnalysis.hasBlockingIssues) {
    console.log('检测到布局阻塞问题，开始重排');
    return performIntelligentRearrangement(workingLayout, layoutAnalysis, cols);
  }
  
  return workingLayout;
};

// 分析布局结构，识别阻塞问题
const analyzeLayoutStructure = (layout: Layout[], cols: number = 12) => {
  const analysis = {
    hasBlockingIssues: false,
    fullWidthElements: [] as Layout[],
    partialWidthElements: [] as Layout[],
    emptyRows: [] as number[],
    suboptimalPlacements: [] as Layout[]
  };
  
  // 按行分组分析
  const rowGroups = new Map<number, Layout[]>();
  layout.forEach(item => {
    for (let y = item.y; y < item.y + item.h; y++) {
      if (!rowGroups.has(y)) {
        rowGroups.set(y, []);
      }
      rowGroups.get(y)!.push(item);
    }
  });
  
  // 分析每一行
  for (let y = 0; y <= Math.max(...layout.map(item => item.y + item.h)); y++) {
    const rowItems = rowGroups.get(y) || [];
    
    if (rowItems.length === 0) {
      analysis.emptyRows.push(y);
    } else {
      // 检查是否有占满宽度的元素
      const fullWidthItems = rowItems.filter(item => item.w >= cols * 0.9); // 90%以上认为是占满
      const partialWidthItems = rowItems.filter(item => item.w < cols * 0.9);
      
      analysis.fullWidthElements.push(...fullWidthItems);
      analysis.partialWidthElements.push(...partialWidthItems);
      
      // 检查是否存在阻塞问题
      if (fullWidthItems.length > 0 && analysis.emptyRows.length > 0) {
        // 如果有占满宽度的元素，且上方有空行，可能存在阻塞
        const emptyRowsAbove = analysis.emptyRows.filter(emptyY => emptyY < y);
        if (emptyRowsAbove.length > 0) {
          analysis.hasBlockingIssues = true;
          console.log(`发现阻塞问题：行${y}有占满宽度元素，但上方有空行${emptyRowsAbove}`);
        }
      }
    }
  }
  
  // 检查局部元素是否可以得到更好的排列
  analysis.partialWidthElements.forEach(item => {
    const canImprove = canElementBePlacedBetter(item, layout, cols);
    if (canImprove) {
      analysis.suboptimalPlacements.push(item);
      analysis.hasBlockingIssues = true;
    }
  });
  
  return analysis;
};

// 检查元素是否可以获得更好的位置
const canElementBePlacedBetter = (element: Layout, layout: Layout[], cols: number = 12): boolean => {
  // 创建网格状态（排除当前元素）
  const maxY = Math.max(...layout.map(item => item.y + item.h), 10);
  const grid: boolean[][] = Array(maxY + 5).fill(null).map(() => Array(cols).fill(false));
  
  // 标记其他元素占用的位置
  layout.forEach(item => {
    if (item.i !== element.i) {
      markGridPosition(grid, item.x, item.y, item.w, item.h);
    }
  });
  
  // 检查是否有更好的位置（更靠上或更靠左）
  for (let y = 0; y < element.y; y++) {
    for (let x = 0; x <= cols - element.w; x++) {
      if (canPlaceAtPosition(grid, x, y, element.w, element.h, cols, maxY + 5)) {
        console.log(`元素 ${element.i} 可以从 (${element.x},${element.y}) 移动到更好位置 (${x},${y})`);
        return true;
      }
    }
  }
  
  return false;
};

// 执行智能重排
const performIntelligentRearrangement = (layout: Layout[], analysis: any, cols: number = 12): Layout[] => {
  console.log('执行智能重排');
  
  const rearrangedLayout = [...layout];
  
  // 策略1: 将局部宽度元素移动到更好的位置
  const elementsToReposition = [...analysis.suboptimalPlacements];
  
  // 按优先级排序：优先移动较小的元素
  elementsToReposition.sort((a, b) => {
    const aSize = a.w * a.h;
    const bSize = b.w * b.h;
    return aSize - bSize;
  });
  
  elementsToReposition.forEach(element => {
    const betterPosition = findBetterPositionForElement(element, rearrangedLayout, cols);
    if (betterPosition) {
      const elementIndex = rearrangedLayout.findIndex(item => item.i === element.i);
      if (elementIndex !== -1) {
        rearrangedLayout[elementIndex] = {
          ...rearrangedLayout[elementIndex],
          x: betterPosition.x,
          y: betterPosition.y
        };
        
        console.log(`重新定位元素 ${element.i}:`, {
          原位置: `(${element.x},${element.y})`,
          新位置: `(${betterPosition.x},${betterPosition.y})`
        });
      }
    }
  });
  
  // 策略2: 优化占满宽度元素的位置
  if (analysis.fullWidthElements.length > 0) {
    console.log('优化占满宽度元素位置');
    rearrangedLayout.sort((a, b) => {
      // 占满宽度的元素往后排
      const aIsFullWidth = a.w >= cols * 0.9;
      const bIsFullWidth = b.w >= cols * 0.9;
      
      if (aIsFullWidth && !bIsFullWidth) return 1;
      if (!aIsFullWidth && bIsFullWidth) return -1;
      
      // 同类型元素按y坐标排序
      return a.y - b.y;
    });
    
    // 重新计算y坐标
    let currentY = 0;
    const processedElements = new Set<string>();
    
    rearrangedLayout.forEach(item => {
      if (!processedElements.has(item.i)) {
        const elementIndex = rearrangedLayout.findIndex(el => el.i === item.i);
        if (elementIndex !== -1) {
          rearrangedLayout[elementIndex].y = currentY;
          currentY += item.h;
          processedElements.add(item.i);
        }
      }
    });
  }
  
  return rearrangedLayout;
};

// 为元素寻找更好的位置
const findBetterPositionForElement = (element: Layout, layout: Layout[], cols: number = 12): { x: number, y: number } | null => {
  // 创建网格状态（排除当前元素）
  const maxY = Math.max(...layout.map(item => item.y + item.h), 10);
  const grid: boolean[][] = Array(maxY + 5).fill(null).map(() => Array(cols).fill(false));
  
  // 标记其他元素占用的位置
  layout.forEach(item => {
    if (item.i !== element.i) {
      markGridPosition(grid, item.x, item.y, item.w, item.h);
    }
  });
  
  // 寻找最优位置：优先考虑靠上靠左的位置
  for (let y = 0; y < element.y; y++) {
    for (let x = 0; x <= cols - element.w; x++) {
      if (canPlaceAtPosition(grid, x, y, element.w, element.h, cols, maxY + 5)) {
        return { x, y };
      }
    }
  }
  
  // 如果没有找到更好的位置，尝试同一行的左侧位置
  for (let x = 0; x < element.x; x++) {
    if (canPlaceAtPosition(grid, x, element.y, element.w, element.h, cols, maxY + 5)) {
      return { x, y: element.y };
    }
  }
  
  return null;
};

// 基础垂直紧缩 - 只处理垂直方向的空白移除
const basicVerticalCompact = (layout: Layout[], cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  console.log('开始基础垂直紧缩');
  
  // 复制布局数组，避免修改原数组
  const newLayout = [...layout];
  
  // 按优先级排序：小元素优先，占满宽度元素后置
  newLayout.sort((a, b) => {
    const aIsFullWidth = a.w >= cols * 0.9;
    const bIsFullWidth = b.w >= cols * 0.9;
    
    // 非满宽元素优先处理
    if (!aIsFullWidth && bIsFullWidth) return -1;
    if (aIsFullWidth && !bIsFullWidth) return 1;
    
    // 同类型元素按原有y坐标排序
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  // 创建网格状态映射，用于跟踪哪些位置已被占用
  const maxY = Math.max(...newLayout.map(item => item.y + item.h), 20);
  const grid: boolean[][] = Array(maxY + 10).fill(null).map(() => Array(cols).fill(false));
  
  // 重新为每个元素分配位置，采用分层策略
  const compactedLayout: Layout[] = [];
  
  // 第一阶段：处理非满宽元素
  console.log('第一阶段：处理非满宽元素');
  const nonFullWidthElements = newLayout.filter(item => item.w < cols * 0.9);
  
  nonFullWidthElements.forEach(item => {
    const bestPosition = findOptimalPosition(item, grid, cols, maxY + 10, 'non-full-width');
    
    // 在网格中标记这个元素占用的位置
    markGridPosition(grid, bestPosition.x, bestPosition.y, item.w, item.h);
    
    // 添加到紧缩后的布局
    compactedLayout.push({
      ...item,
      x: bestPosition.x,
      y: bestPosition.y
    });
    
    console.log(`非满宽元素 ${item.i} 重新定位:`, {
      原位置: `(${item.x},${item.y})`,
      新位置: `(${bestPosition.x},${bestPosition.y})`,
      尺寸: `${item.w}x${item.h}`
    });
  });
  
  // 第二阶段：处理满宽元素
  console.log('第二阶段：处理满宽元素');
  const fullWidthElements = newLayout.filter(item => item.w >= cols * 0.9);
  
  fullWidthElements.forEach(item => {
    const bestPosition = findOptimalPosition(item, grid, cols, maxY + 10, 'full-width');
    
    // 在网格中标记这个元素占用的位置
    markGridPosition(grid, bestPosition.x, bestPosition.y, item.w, item.h);
    
    // 添加到紧缩后的布局
    compactedLayout.push({
      ...item,
      x: bestPosition.x,
      y: bestPosition.y
    });
    
    console.log(`满宽元素 ${item.i} 重新定位:`, {
      原位置: `(${item.x},${item.y})`,
      新位置: `(${bestPosition.x},${bestPosition.y})`,
      尺寸: `${item.w}x${item.h}`
    });
  });
  
  console.log('基础垂直紧缩完成');
  return compactedLayout;
};

// 寻找元素的最优位置
const findOptimalPosition = (
  element: Layout, 
  grid: boolean[][], 
  cols: number, 
  maxY: number, 
  elementType: 'full-width' | 'non-full-width'
): { x: number, y: number } => {
  
  // 对于满宽元素，优先寻找整行空闲的位置
  if (elementType === 'full-width') {
    for (let y = 0; y < maxY - element.h + 1; y++) {
      let rowIsFree = true;
      
      // 检查从y到y+h的所有行是否完全空闲
      for (let checkY = y; checkY < y + element.h && rowIsFree; checkY++) {
        for (let x = 0; x < cols; x++) {
          if (grid[checkY] && grid[checkY][x]) {
            rowIsFree = false;
            break;
          }
        }
      }
      
      if (rowIsFree) {
        console.log(`满宽元素 ${element.i} 找到完全空闲行位置: (${element.x || 0}, ${y})`);
        return { x: element.x || 0, y };
      }
    }
  }
  
  // 对于非满宽元素或找不到完全空闲行的满宽元素，使用标准策略
  // 优先尝试保持原有x坐标，寻找最高可用位置
  for (let y = 0; y < maxY - element.h + 1; y++) {
    if (canPlaceAtPosition(grid, element.x, y, element.w, element.h, cols, maxY)) {
      return { x: element.x, y };
    }
  }
  
  // 如果原x坐标不可用，尝试其他x坐标
  for (let y = 0; y < maxY - element.h + 1; y++) {
    for (let x = 0; x <= cols - element.w; x++) {
      if (x !== element.x && canPlaceAtPosition(grid, x, y, element.w, element.h, cols, maxY)) {
        return { x, y };
      }
    }
  }
  
  // 如果所有位置都不可用，放在最底部
  const bottomY = findBottomPosition(grid, maxY);
  return { x: element.x, y: bottomY };
};

// 寻找最底部可用位置
const findBottomPosition = (grid: boolean[][], maxY: number): number => {
  for (let y = maxY - 1; y >= 0; y--) {
    const row = grid[y];
    if (row && row.some(cell => cell)) {
      return y + 1;
    }
  }
  return 0;
};

// 辅助函数：检查是否可以在指定位置放置元素
const canPlaceAtPosition = (grid: boolean[][], x: number, y: number, w: number, h: number, cols: number, maxY: number): boolean => {
  // 检查边界
  if (x + w > cols || y + h > maxY || x < 0 || y < 0) {
    return false;
  }
  
  // 检查网格位置是否空闲
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (grid[y + dy] && grid[y + dy][x + dx]) {
        return false;
      }
    }
  }
  
  return true;
};

// 辅助函数：在网格中标记占用的位置
const markGridPosition = (grid: boolean[][], x: number, y: number, w: number, h: number): void => {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (y + dy < grid.length && x + dx < grid[0].length) {
        grid[y + dy][x + dx] = true;
      }
    }
  }
};

// 水平空间优化 - 让元素扩展填充水平空白
const horizontalSpaceOptimization = (layout: Layout[], cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  console.log('开始水平空间优化');
  
  const optimizedLayout = [...layout];
  
  // 按y坐标分组，找出每一行的元素
  const levelGroups = new Map<number, Layout[]>();
  layout.forEach(item => {
    if (!levelGroups.has(item.y)) {
      levelGroups.set(item.y, []);
    }
    levelGroups.get(item.y)!.push(item);
  });
  
  // 对每个层级进行优化
  levelGroups.forEach((items, y) => {
    if (items.length === 0) return;
    
    // 按x坐标排序
    items.sort((a, b) => a.x - b.x);
    
    // 计算总占用宽度和最右位置
    let rightmostPosition = 0;
    items.forEach(item => {
      rightmostPosition = Math.max(rightmostPosition, item.x + item.w);
    });
    
    // 计算可用的额外空间
    const availableSpace = cols - rightmostPosition;
    
    console.log(`层级 ${y} 空间分析:`, {
      元素数量: items.length,
      最右位置: rightmostPosition,
      可用额外空间: availableSpace,
      元素详情: items.map(item => ({ i: item.i, x: item.x, w: item.w }))
    });
    
    // 智能扩展策略
    if (availableSpace > 0 && items.length > 0) {
      
      // 策略1: 如果只有一个元素，让它充分扩展填充整行
      if (items.length === 1) {
        const singleItem = items[0];
        const itemIndex = optimizedLayout.findIndex(item => item.i === singleItem.i);
        
        if (itemIndex !== -1) {
          // 计算可以扩展到的最大宽度（填充到行末）
          const maxPossibleWidth = cols - singleItem.x;
          const currentWidth = optimizedLayout[itemIndex].w;
          
          // 如果可以扩展，就扩展到最大可能宽度
          if (maxPossibleWidth > currentWidth) {
            optimizedLayout[itemIndex].w = maxPossibleWidth;
            
            console.log(`单元素行充分扩展 ${singleItem.i}:`, {
              原宽度: currentWidth,
              新宽度: optimizedLayout[itemIndex].w,
              扩展量: maxPossibleWidth - currentWidth,
              原始x位置: singleItem.x,
              填充到: singleItem.x + maxPossibleWidth
            });
          }
        }
      }
      // 策略2: 如果有多个元素，优先扩展最右侧的元素
      else {
        const lastItem = items[items.length - 1];
        const lastItemIndex = optimizedLayout.findIndex(item => item.i === lastItem.i);
        
        if (lastItemIndex !== -1) {
          // 计算最右元素可以扩展的最大空间
          const maxExpansionForLastItem = cols - (lastItem.x + lastItem.w);
          
          // 根据可用空间确定扩展量
          let expansionAmount;
          if (availableSpace <= 6) {
            // 如果空间较小，全部给最后一个元素
            expansionAmount = availableSpace;
          } else {
            // 如果空间较大，给最后一个元素合理的扩展（最多8个单位），其余可以分配给其他元素
            expansionAmount = Math.min(availableSpace, 8);
          }
          
          const oldWidth = optimizedLayout[lastItemIndex].w;
          optimizedLayout[lastItemIndex].w = oldWidth + expansionAmount;
          
          console.log(`多元素行扩展最右元素 ${lastItem.i}:`, {
            原宽度: oldWidth,
            新宽度: optimizedLayout[lastItemIndex].w,
            扩展量: expansionAmount,
            剩余可用空间: availableSpace - expansionAmount
          });
          
          // 如果还有剩余空间，尝试扩展其他元素
          const remainingSpace = availableSpace - expansionAmount;
          if (remainingSpace > 0 && items.length > 1) {
            // 从右到左依次扩展其他元素
            for (let i = items.length - 2; i >= 0 && remainingSpace > 0; i--) {
              const item = items[i];
              const itemIndex = optimizedLayout.findIndex(opt => opt.i === item.i);
              
              if (itemIndex !== -1) {
                // 计算这个元素可以扩展的空间（不能与右侧元素重叠）
                const rightItem = items[i + 1];
                const maxExpansion = Math.min(
                  remainingSpace, 
                  Math.max(0, rightItem.x - (item.x + item.w)), // 与右侧元素的间距
                  4 // 限制单个元素的扩展量
                );
                
                if (maxExpansion > 0) {
                  const oldWidth = optimizedLayout[itemIndex].w;
                  optimizedLayout[itemIndex].w = oldWidth + maxExpansion;
                  
                  console.log(`多元素行扩展其他元素 ${item.i}:`, {
                    原宽度: oldWidth,
                    新宽度: optimizedLayout[itemIndex].w,
                    扩展量: maxExpansion
                  });
                }
              }
            }
          }
        }
      }
    }
  });
  
  // 检查是否有可以向左移动的元素（填充左侧空白）
  const leftShiftOptimized = optimizeLeftShift(optimizedLayout, cols);
  
  return leftShiftOptimized;
};

// 左移优化 - 让右侧元素向左移动填充左侧空白
const optimizeLeftShift = (layout: Layout[], cols: number = 12): Layout[] => {
  const optimizedLayout = [...layout];
  
  // 按行处理，检查每一行是否有左侧空白可以填充
  const rowElements = new Map<number, Layout[]>();
  
  layout.forEach(item => {
    if (!rowElements.has(item.y)) {
      rowElements.set(item.y, []);
    }
    rowElements.get(item.y)!.push(item);
  });
  
  rowElements.forEach((items, y) => {
    if (items.length === 0) return;
    
    // 按x坐标排序
    items.sort((a, b) => a.x - b.x);
    
    // 检查是否有左侧空白
    let leftmostX = Math.min(...items.map(item => item.x));
    
    if (leftmostX > 0) {
      // 有左侧空白，尝试左移所有元素
      const shiftAmount = leftmostX;
      
      console.log(`层级 ${y} 检测到左侧空白，左移量: ${shiftAmount}`);
      
      items.forEach(item => {
        const itemIndex = optimizedLayout.findIndex(opt => opt.i === item.i);
        if (itemIndex !== -1) {
          optimizedLayout[itemIndex].x = Math.max(0, optimizedLayout[itemIndex].x - shiftAmount);
          console.log(`左移元素 ${item.i}:`, {
            原x位置: item.x,
            新x位置: optimizedLayout[itemIndex].x,
            左移量: shiftAmount
          });
        }
      });
      
      // 左移后，重新计算空间利用率，看是否可以进一步扩展
      const shiftedItems = items.map(item => {
        const itemIndex = optimizedLayout.findIndex(opt => opt.i === item.i);
        return itemIndex !== -1 ? optimizedLayout[itemIndex] : item;
      }).sort((a, b) => a.x - b.x);
      
      // 计算左移后的最右位置
      let rightmostAfterShift = 0;
      shiftedItems.forEach(item => {
        rightmostAfterShift = Math.max(rightmostAfterShift, item.x + item.w);
      });
      
      // 计算左移后的可用空间
      const availableSpaceAfterShift = cols - rightmostAfterShift;
      
      if (availableSpaceAfterShift > 0) {
        console.log(`层级 ${y} 左移后仍有可用空间: ${availableSpaceAfterShift}，进行进一步扩展`);
        
        // 如果只有一个元素，让它充分扩展
        if (shiftedItems.length === 1) {
          const singleItem = shiftedItems[0];
          const itemIndex = optimizedLayout.findIndex(opt => opt.i === singleItem.i);
          
          if (itemIndex !== -1) {
            const maxPossibleWidth = cols - singleItem.x;
            const currentWidth = optimizedLayout[itemIndex].w;
            
            if (maxPossibleWidth > currentWidth) {
              optimizedLayout[itemIndex].w = maxPossibleWidth;
              
              console.log(`左移后单元素充分扩展 ${singleItem.i}:`, {
                原宽度: currentWidth,
                新宽度: optimizedLayout[itemIndex].w,
                扩展量: maxPossibleWidth - currentWidth
              });
            }
          }
        }
        // 如果有多个元素，扩展最右侧的元素
        else if (shiftedItems.length > 1) {
          const lastItem = shiftedItems[shiftedItems.length - 1];
          const lastItemIndex = optimizedLayout.findIndex(opt => opt.i === lastItem.i);
          
          if (lastItemIndex !== -1) {
            const expansionAmount = Math.min(availableSpaceAfterShift, 6); // 适度扩展
            const oldWidth = optimizedLayout[lastItemIndex].w;
            optimizedLayout[lastItemIndex].w = oldWidth + expansionAmount;
            
            console.log(`左移后扩展最右元素 ${lastItem.i}:`, {
              原宽度: oldWidth,
              新宽度: optimizedLayout[lastItemIndex].w,
              扩展量: expansionAmount
            });
          }
        }
      }
    }
  });
  
  return optimizedLayout;
};

// 布局直接存储在localStorage中的键名
export const LAYOUTS_STORAGE_KEY = 'termini-saved-layouts';
export const CURRENT_LAYOUT_ID_KEY = 'termini-current-layout-id';

// 通知布局列表变化的辅助函数
const notifyLayoutsChanged = () => {
  if (typeof window !== 'undefined') {
    // 触发自定义事件通知布局变化
    window.dispatchEvent(new Event('layoutsChanged'));
    console.log('已触发layoutsChanged事件');
  }
};

// 创建初始状态
const initialState = {
  layout: [], // 保持空，不直接使用DEFAULT_LAYOUT
  activePlugins: [], // 保持空，不直接使用DEFAULT_PLUGINS
  hasInitializedDefault: false,
  tabContainers: [], // 初始没有标签容器
  savedLayouts: [], // 初始没有保存的布局
  currentLayoutId: null // 初始没有当前布局
};

// 添加日志函数用于调试布局存储
const logStorageState = (message: string) => {
  try {
    const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    const layouts = rawLayouts ? JSON.parse(rawLayouts) : [];
    const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
    
    console.group(`[布局存储日志] ${message}`);
    console.log(`- localStorage中布局数量: ${layouts.length}`);
    console.log(`- 当前布局ID: ${currentId || '无'}`);
    if (layouts.length > 0) {
      console.log('- 布局列表:', layouts.map((l: any) => ({ id: l.id, name: l.name })));
    }
    console.groupEnd();
  } catch (error) {
    console.error('布局存储日志错误:', error);
  }
};

// 从localStorage读取布局
export function loadLayoutFromStorage(layoutId: string): LayoutConfig | undefined {
  try {
    const layoutsData = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    if (!layoutsData) return undefined;
    
    const layouts = JSON.parse(layoutsData);
    return layouts.find((layout: LayoutConfig) => layout.id === layoutId);
  } catch (error) {
    console.error('从localStorage读取布局失败:', error);
    return undefined;
  }
}

// 添加一个工具方法用于检查插件是否已存在于页面中（包括标签容器内的插件）
const isPluginAlreadyActive = (state: LayoutState, pluginId: string): boolean => {
  // 检查是否在活跃插件列表中
  if (state.activePlugins.includes(pluginId)) {
    return true;
  }
  
  // 检查是否在任何标签容器中
  for (const tabContainer of state.tabContainers) {
    if (tabContainer.plugins.includes(pluginId)) {
      return true;
    }
  }
  
  return false;
};

// 替换现有插件而不是添加新的
const replaceExistingPlugin = (state: LayoutState, pluginId: string): LayoutState => {
  let updatedState = {...state};
  let pluginFound = false;
  
  // 首先检查是否在layoutStore的activePlugins中
  if (state.activePlugins.includes(pluginId)) {
    // 已经存在于主布局，不需要额外操作
    console.log(`插件 ${pluginId} 已在主布局中`);
    pluginFound = true;
    return state;
  }
  
  // 然后检查是否在某个标签容器中
  updatedState.tabContainers = state.tabContainers.map(tabContainer => {
    if (tabContainer.plugins.includes(pluginId)) {
      console.log(`插件 ${pluginId} 已存在于标签容器 ${tabContainer.id}`);
      pluginFound = true;
      // 从该标签容器中移除插件
      return {
        ...tabContainer,
        plugins: tabContainer.plugins.filter(id => id !== pluginId)
      };
    }
    return tabContainer;
  });
  
  // 清理空标签容器
  updatedState.tabContainers = updatedState.tabContainers.filter(tab => tab.plugins.length > 0);
  
  // 如果标签容器已更新，则更新布局
  if (pluginFound) {
    // 更新layout，移除空标签容器
    updatedState.layout = state.layout.filter(item => {
      if (item.i.startsWith('tab-container-')) {
        return updatedState.tabContainers.some(tab => tab.id === item.i);
      }
      return true;
    });
  }
  
  return updatedState;
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      ...initialState,  // 使用默认初始状态
      
      // 获取标签容器中的插件列表
      getTabPlugins: (tabId: string) => {
        const state = get();
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.error(`未找到标签容器: ${tabId}`);
          return [];
        }
        return [...tabContainer.plugins]; // 返回插件列表的副本
      },
      
      // 更新容器尺寸
      updateItemSize: (itemId: string, width: number, height: number) => set((state) => {
        console.log(`更新容器尺寸: ${itemId}, 宽: ${width}, 高: ${height}`);
        const updatedLayout = state.layout.map(item => {
          if (item.i === itemId) {
            return {
              ...item,
              w: width,
              h: height
            };
          }
          return item;
        });
        
        return {
          ...state,
          layout: updatedLayout
        };
      }),
      
      // 从布局中移除项目
      removeItemFromLayout: (itemId: string) => set((state) => {
        console.log(`从布局中移除项目: ${itemId}`);
        // 移除布局项
        const updatedLayout = state.layout.filter(item => item.i !== itemId);
        
        // 如果是标签容器，也要从标签容器列表中移除
        let updatedTabContainers = state.tabContainers;
        if (itemId.startsWith('tab-container-')) {
          updatedTabContainers = state.tabContainers.filter(tab => tab.id !== itemId);
        }
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
      }),
      
      // 更新活跃容器
      updateActiveContainer: (containerId: string) => set((state) => {
        console.log(`设置活跃容器: ${containerId}`);
        // 确保容器存在
        const containerExists = state.tabContainers.some(tab => tab.id === containerId);
        if (!containerExists) {
          console.error(`未找到容器: ${containerId}`);
          return state;
        }
        
        return {
          ...state,
          activeContainers: [containerId]
        };
      }),
      
      // 更新布局
      updateLayout: (newLayout: Layout[]) => set((state) => {
        // 保持固定插件的位置不变
        const fixedPlugins = state.layout.filter(item => {
          const plugin = pluginRegistry.get(item.i);
          return plugin?.metadata.isFixed;
        });
        
        // 新布局中非固定的插件
        const regularPlugins = newLayout.filter(item => {
          const plugin = pluginRegistry.get(item.i);
          return !plugin?.metadata.isFixed;
        });
        
        const updatedLayout = [...fixedPlugins, ...regularPlugins];
        
        // 自动会触发持久化保存
        console.log('布局已更新，自动保存到本地存储');
        
        return { layout: updatedLayout };
      }),
      
      // 保存当前布局
      saveCurrentLayout: (name?: string) => set((state) => {
        const { layout, activePlugins, tabContainers } = state;
        const now = Date.now();
        
        logStorageState('保存布局前');
        
        // 创建新的布局配置
        const newLayout: LayoutConfig = {
          id: `layout_${now}`,
          name: name || `布局 ${state.savedLayouts.length + 1}`,
          layout: JSON.parse(JSON.stringify(layout)),
          activePlugins: [...activePlugins],
          tabContainers: JSON.parse(JSON.stringify(tabContainers)),
          createdAt: now,
          updatedAt: now
        };
        
        let updatedLayouts: LayoutConfig[] = [];
        let newCurrentId = state.currentLayoutId;
        
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const existingLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          console.log('从localStorage读取到布局数量:', existingLayouts.length);
          
          // 如果当前有激活的布局，尝试更新它
          if (state.currentLayoutId) {
            // 在已有布局中查找当前布局
            const existingIndex = existingLayouts.findIndex((layout: LayoutConfig) => layout.id === state.currentLayoutId);
            
            if (existingIndex >= 0) {
              // 更新现有布局
              existingLayouts[existingIndex] = {
                ...existingLayouts[existingIndex],
                layout: JSON.parse(JSON.stringify(layout)),
                activePlugins: [...activePlugins],
                tabContainers: JSON.parse(JSON.stringify(tabContainers)),
                updatedAt: now
              };
              updatedLayouts = existingLayouts;
              console.log(`更新现有布局: ${existingLayouts[existingIndex].name}`);
            } else {
              // 找不到当前布局，创建新布局
              updatedLayouts = [...existingLayouts, newLayout];
              newCurrentId = newLayout.id;
              console.log('找不到当前布局ID，创建新布局:', newLayout.id);
            }
          } else {
            // 没有当前布局ID，创建新布局
            updatedLayouts = [...existingLayouts, newLayout];
            newCurrentId = newLayout.id;
            console.log('创建新布局:', newLayout.id);
          }
          
          // 直接保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentId || '');
          
          console.log(`布局保存完成，当前共有 ${updatedLayouts.length} 个布局`);
          logStorageState('保存布局后');
          
          // 通知布局列表变化
          notifyLayoutsChanged();
        } catch (error) {
          console.error('保存布局失败:', error);
          // 出错时仍然尝试保存单个布局
          updatedLayouts = [...state.savedLayouts, newLayout];
          newCurrentId = newLayout.id;
        }
        
        return {
          savedLayouts: updatedLayouts,
          currentLayoutId: newCurrentId
        };
      }),
      
      // 加载指定布局
      loadLayout: (layoutId: string) => set((state) => {
        console.log(`尝试加载布局: ${layoutId}`);
        
        try {
          // 直接从localStorage读取布局数据，确保获取最新
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          if (!rawLayouts) {
            console.error('找不到布局数据');
            return state;
          }
          
          // 解析所有布局
          const allLayouts = JSON.parse(rawLayouts);
          console.log(`从localStorage读取到${allLayouts.length}个布局`);
          
          // 查找指定布局
          const layoutToLoad = allLayouts.find((layout: LayoutConfig) => layout.id === layoutId);
          
          if (!layoutToLoad) {
            console.error(`找不到布局ID: ${layoutId}`);
            return state;
          }
          
          console.log(`加载布局: ${layoutToLoad.name}`, {
            layoutElements: layoutToLoad.layout.length,
            activePlugins: layoutToLoad.activePlugins.length,
            tabContainers: layoutToLoad.tabContainers.length
          });
          
          // 保存当前布局ID到localStorage
          localStorage.setItem(CURRENT_LAYOUT_ID_KEY, layoutId);
          
          // 确保完整的深拷贝以避免引用问题
          return {
            layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
            activePlugins: [...layoutToLoad.activePlugins],
            tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers)),
            currentLayoutId: layoutId,
            savedLayouts: allLayouts // 确保加载所有布局到状态
          };
        } catch (error) {
          console.error('加载布局失败:', error);
          return state;
        }
      }),
      
      // 删除指定布局
      deleteLayout: (layoutId: string) => set((state) => {
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const existingLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          
          // 过滤掉要删除的布局
          const updatedLayouts = existingLayouts.filter((layout: LayoutConfig) => layout.id !== layoutId);
          
          // 如果删除的是当前布局，重置当前布局ID
          let newCurrentLayoutId = state.currentLayoutId;
          if (state.currentLayoutId === layoutId) {
            newCurrentLayoutId = updatedLayouts.length > 0 ? updatedLayouts[0].id : null;
          }
          
          // 保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          if (newCurrentLayoutId) {
            localStorage.setItem(CURRENT_LAYOUT_ID_KEY, newCurrentLayoutId);
          } else {
            localStorage.removeItem(CURRENT_LAYOUT_ID_KEY);
          }
          
          console.log(`已删除布局 ${layoutId}，当前活动布局: ${newCurrentLayoutId}`);
          
          // 通知布局列表变化
          notifyLayoutsChanged();
          
          // 如果需要加载新的布局
          if (newCurrentLayoutId && newCurrentLayoutId !== state.currentLayoutId) {
            const layoutToLoad = updatedLayouts.find((l: LayoutConfig) => l.id === newCurrentLayoutId);
            if (layoutToLoad) {
              return {
                savedLayouts: updatedLayouts,
                currentLayoutId: newCurrentLayoutId,
                layout: JSON.parse(JSON.stringify(layoutToLoad.layout)),
                activePlugins: [...layoutToLoad.activePlugins], 
                tabContainers: JSON.parse(JSON.stringify(layoutToLoad.tabContainers))
              };
            }
          }
          
          return {
            savedLayouts: updatedLayouts,
            currentLayoutId: newCurrentLayoutId
          };
        } catch (error) {
          console.error('删除布局失败:', error);
          return state;
        }
      }),
      
      // 重命名布局
      renameLayout: (layoutId: string, newName: string) => set((state) => {
        try {
          // 直接从localStorage读取现有布局
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const currentLayouts = rawLayouts ? JSON.parse(rawLayouts) : [];
          
          // 更新布局名称
          const updatedLayouts = currentLayouts.map((layout: LayoutConfig) => 
            layout.id === layoutId 
              ? { ...layout, name: newName, updatedAt: Date.now() }
              : layout
          );
          
          // 直接保存到localStorage
          localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(updatedLayouts));
          
          // 通知布局列表变化
          notifyLayoutsChanged();
          
          return {
            savedLayouts: updatedLayouts
          };
        } catch (error) {
          console.error('重命名布局失败:', error);
          return state;
        }
      }),
      addPlugin: (pluginId: string) => set((state: LayoutState) => {
        console.log('尝试添加插件:', pluginId);
        
        // 检查插件是否已存在
        if (isPluginAlreadyActive(state, pluginId)) {
          console.log('插件已存在，将从现有位置移除:', pluginId);
          // 从任何可能的位置移除插件
          state = replaceExistingPlugin(state, pluginId);
        }
        
        // 3. 修改：所有插件都需要在标签容器中
        // 为新插件创建标签容器ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 找一个合适的位置
        const emptyPos = findEmptyPosition(state.layout);
        
        // 创建标签容器布局
        const tabLayout: Layout = {
          i: tabId,
          x: emptyPos.x,
          y: emptyPos.y,
          w: 6,
          h: 6,
          minW: 3,
          minH: 4
        };
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [pluginId]
        };
        
        console.log('为插件创建新标签容器:', pluginId, '在标签:', tabId);
        
        // 需要同时更新activePlugins，以便系统能够正确识别插件
        const updatedActivePlugins = [...state.activePlugins];
        if (!updatedActivePlugins.includes(pluginId)) {
          updatedActivePlugins.push(pluginId);
        }
        
        return {
          layout: [...state.layout, tabLayout],
          activePlugins: updatedActivePlugins,  // 仍然需要在activePlugins中保留插件ID
          tabContainers: [...state.tabContainers, newTabContainer]
        };
      }),
      removePlugin: (pluginId: string) => set((state: LayoutState) => {
        console.log('移除插件:', pluginId);
        
        // 检查插件是否最近被删除过，如果是则不再处理
        if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId]) {
          console.log('此插件最近已被删除，忽略操作:', pluginId);
          return state;
        }
        
        // 创建一个标记，表示此插件刚刚被删除，设置更长的过期时间
        const deleteTimestamp = Date.now();
        window.__recentlyRemovedPlugins = window.__recentlyRemovedPlugins || {};
        window.__recentlyRemovedPlugins[pluginId] = deleteTimestamp;
        
        // 首先检查插件是否在某个标签容器中
        let isInTab = false;
        let tabId: string | null = null;
        
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(pluginId)) {
            isInTab = true;
            tabId = tab.id;
            break;
          }
        }
        
        // 创建最终状态的深拷贝，防止直接修改引用
        let finalState = JSON.parse(JSON.stringify({
          ...state,
          // 首先移除活跃插件列表中的该插件
          activePlugins: state.activePlugins.filter(id => id !== pluginId)
        }));
        
        // 如果在标签容器中，先从标签容器中移除
        if (isInTab && tabId) {
          console.log(`插件${pluginId}在标签容器${tabId}中，从标签容器中移除`);
          
          // 获取标签容器
          const tabContainer = finalState.tabContainers.find(tab => tab.id === tabId);
          
          // 如果标签容器只有这一个插件，则需要移除整个标签容器
          if (tabContainer && tabContainer.plugins.length <= 1) {
            console.log(`标签容器${tabId}只有一个插件，移除整个标签容器`);
            
            // 移除标签容器布局
            finalState.layout = finalState.layout.filter(item => item.i !== tabId);
            
            // 移除标签容器
            finalState.tabContainers = finalState.tabContainers.filter(tab => tab.id !== tabId);
          }
          // 如果标签容器有多个插件，只移除该插件
          else if (tabContainer) {
            console.log(`标签容器${tabId}有多个插件，只移除插件${pluginId}`);
            
            // 更新标签容器，移除插件
            finalState.tabContainers = finalState.tabContainers.map(tab => {
              if (tab.id === tabId) {
                // 从标签容器中移除插件
                const updatedPlugins = tab.plugins.filter(id => id !== pluginId);
                
                // 如果移除后插件列表为空，返回null以便后续过滤掉这个标签容器
                if (updatedPlugins.length === 0) {
                  console.log(`标签容器${tabId}在移除插件后为空，将删除整个标签容器`);
                  return null;
                }
                
                return {
                  ...tab,
                  plugins: updatedPlugins
                };
              }
              return tab;
            }).filter(Boolean) as TabGroup[]; // 过滤掉null值（空标签容器）
            
            // 如果标签容器变为空，也需要从布局中移除
            finalState.layout = finalState.layout.filter(item => {
              if (item.i.startsWith('tab-container-')) {
                // 只保留还存在于tabContainers中的标签容器
                return finalState.tabContainers.some(tab => tab && tab.id === item.i);
              }
              return item.i !== pluginId; // 同时移除被删除的插件
            });
          }
        } else {
          // 不在标签容器中，直接从布局中移除
          finalState.layout = finalState.layout.filter(item => item.i !== pluginId);
        }
        
        // 添加额外的检查，确保不留下空标签容器
        finalState.tabContainers = finalState.tabContainers.filter(tab => tab && tab.plugins && tab.plugins.length > 0);
        
        // 确保布局中不包含已删除的标签容器
        finalState.layout = finalState.layout.filter(item => {
          if (item.i.startsWith('tab-container-')) {
            // 检查此标签容器ID是否还存在于tabContainers中
            return finalState.tabContainers.some(tab => tab && tab.id === item.i);
          }
          return true; // 保留非标签容器的项目
        });
        
        // 设置一个延迟时间更长的定时器清理标记
        setTimeout(() => {
          if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId] === deleteTimestamp) {
            delete window.__recentlyRemovedPlugins[pluginId];
            console.log('清除插件删除标记:', pluginId);
          }
        }, 5000);
        
        return finalState;
      }),
      updateAllPluginsToken: (token: string, address: string) => set((state: LayoutState) => {
        console.log('全局更新Token:', token, address);
        
        // 获取所有活跃插件的配置并更新token信息
        const activePluginIds = state.activePlugins;
        
        activePluginIds.forEach(pluginId => {
          const plugin = pluginRegistry.get(pluginId);
          if (plugin && pluginId !== 'official-price-card') { // 不修改自身
            // 获取当前配置
            const currentConfig = plugin.metadata.defaultConfig || {};
            
            // 更新token相关配置
            if (currentConfig.token !== undefined) {
              currentConfig.token = token;
            }
            
            // 更新地址相关字段
            if (currentConfig.address !== undefined) {
              currentConfig.address = address;
            }
            if (currentConfig.tokenAddress !== undefined) {
              currentConfig.tokenAddress = address;
            }
            
            // 更新交易对
            if (currentConfig.symbol !== undefined && pluginId.includes('chart')) {
              currentConfig.symbol = `${token}USDT`;
            }
            
            // 确保更新的配置被存储回插件
            plugin.metadata.defaultConfig = {...currentConfig};
            
            console.log(`已更新插件[${pluginId}]配置:`, currentConfig);
          }
        });
        
        // 强制触发状态更新以通知所有订阅者
        return { 
          ...state,
          // 添加时间戳来确保状态变化被检测到
          _lastTokenUpdate: Date.now()
        };
      }),
      initDefaultLayout: () => set((state: LayoutState) => {
        console.log('初始化默认布局...');
        
        // **重要修复：不再强制清除本地存储，保护已保存的布局**
        // localStorage.removeItem('termini-layout-storage'); // 移除这行
        
        // 检查是否已经有布局数据，如果有则不执行初始化
        const existingLayouts = localStorage.getItem('termini-layouts');
        if (existingLayouts) {
          try {
            const parsedLayouts = JSON.parse(existingLayouts);
            if (parsedLayouts.length > 0) {
              console.log('检测到已存在的布局，跳过默认布局初始化');
              return state; // 不执行初始化，保持现有状态
            }
          } catch (error) {
            console.error('解析已存在布局失败，将继续初始化默认布局');
          }
        }
        
        // 使用默认插件数组并预初始化
        const priceCardPlugin = 'official-price-card';
        const orderBookPlugin = 'official-order-book';
        const chartPlugin = 'official-price-chart';
        const signalsPlugin = 'official-market-signals';
        const twitterPlugin = 'official-twitter-sentiment';
        const onchainPlugin = 'official-onchain-data';
        
        // 确保所有插件都在activePlugins中注册
        const allPluginsIds = [
          priceCardPlugin, 
          chartPlugin,
          orderBookPlugin, 
          signalsPlugin, 
          twitterPlugin, 
          onchainPlugin
        ];
        
        // 创建一个标签容器来包含价格卡片
        const priceCardTabId = `tab-container-${Date.now()}`;
        
        // 创建一个标签容器来包含K线图
        const chartTabId = `tab-container-${Date.now() + 1}`;
        
        // 创建一个标签容器来包含订单簿
        const orderBookTabId = `tab-container-${Date.now() + 2}`;
        
        // 创建一个标签容器来包含市场信号
        const signalsTabId = `tab-container-${Date.now() + 3}`;
        
        // 创建一个标签容器来包含推特舆情
        const twitterTabId = `tab-container-${Date.now() + 4}`;
        
        // 创建一个标签容器来包含链上数据
        const onchainTabId = `tab-container-${Date.now() + 5}`;
        
        // 创建所有标签容器
        const tabContainers: TabGroup[] = [
          { id: priceCardTabId, plugins: [priceCardPlugin] },
          { id: chartTabId, plugins: [chartPlugin] },
          { id: orderBookTabId, plugins: [orderBookPlugin] },
          { id: signalsTabId, plugins: [signalsPlugin] },
          { id: twitterTabId, plugins: [twitterPlugin] },
          { id: onchainTabId, plugins: [onchainPlugin] }
        ];
        
        // 创建布局
        const layout: Layout[] = [];
        
        // 价格卡片布局
        const priceCardLayout = DEFAULT_LAYOUT.find(item => item.i === priceCardPlugin);
        if (priceCardLayout) {
          layout.push({
            i: priceCardTabId,
            x: priceCardLayout.x,
            y: priceCardLayout.y,
            w: priceCardLayout.w,
            h: priceCardLayout.h,
            minW: 3,
            minH: 4,
            // static: true // 价格卡片是静态的
          });
        }
        
        // K线图布局
        const chartLayout = DEFAULT_LAYOUT.find(item => item.i === chartPlugin);
        if (chartLayout) {
          layout.push({
            i: chartTabId,
            x: chartLayout.x,
            y: chartLayout.y,
            w: chartLayout.w,
            h: chartLayout.h,
            minW: 4,
            minH: 4
          });
        }
        
        // 订单簿布局
        const orderBookLayout = DEFAULT_LAYOUT.find(item => item.i === orderBookPlugin);
        if (orderBookLayout) {
          layout.push({
            i: orderBookTabId,
            x: orderBookLayout.x,
            y: orderBookLayout.y,
            w: orderBookLayout.w,
            h: orderBookLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 市场信号布局
        const signalsLayout = DEFAULT_LAYOUT.find(item => item.i === signalsPlugin);
        if (signalsLayout) {
          layout.push({
            i: signalsTabId,
            x: signalsLayout.x,
            y: signalsLayout.y,
            w: signalsLayout.w,
            h: signalsLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 推特舆情布局
        const twitterLayout = DEFAULT_LAYOUT.find(item => item.i === twitterPlugin);
        if (twitterLayout) {
          layout.push({
            i: twitterTabId,
            x: twitterLayout.x,
            y: twitterLayout.y,
            w: twitterLayout.w,
            h: twitterLayout.h,
            minW: 3,
            minH: 4
          });
        }
        
        // 链上数据布局
        const onchainLayout = DEFAULT_LAYOUT.find(item => item.i === onchainPlugin);
        if (onchainLayout) {
          layout.push({
            i: onchainTabId,
            x: onchainLayout.x,
            y: onchainLayout.y,
            w: onchainLayout.w,
            h: onchainLayout.h,
            minW: 6,
            minH: 4
          });
        }
        
        console.log('初始化完成，布局元素数:', layout.length);
        console.log('标签容器数:', tabContainers.length);
        console.log('活跃插件数:', allPluginsIds.length);
        
        // 强制更新本地存储以确保保存成功
        setTimeout(() => {
          localStorage.setItem('termini-layout-storage', JSON.stringify({
            state: {
              layout,
              activePlugins: allPluginsIds,
              tabContainers,
              hasInitializedDefault: true,
              savedLayouts: [],
              currentLayoutId: null,
              _lastTokenUpdate: Date.now()
            },
            version: 3
          }));
          console.log('初始化布局已保存到本地存储');
        }, 100);
        
        return {
          layout,
          activePlugins: allPluginsIds,
          tabContainers,
          hasInitializedDefault: true
        };
      }),
      // 添加重置功能
      resetStore: () => set((state) => {
        // 清除本地存储
        localStorage.removeItem('termini-layout-storage');
        return initialState;
      }),
      
      // 创建标签容器
      createTabContainer: (firstPluginId: string, secondPluginId: string) => set((state) => {
        console.log(`创建标签容器: ${firstPluginId} + ${secondPluginId}`);
        
        let updatedState = {...state};
        let activePlugins = [...state.activePlugins];
        
        // 检查两个插件是否已经在某个标签容器中
        let isFirstPluginInTab = false;
        let isSecondPluginInTab = false;
        
        // 检查第一个插件
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(firstPluginId)) {
            isFirstPluginInTab = true;
            break;
          }
        }
        
        // 检查第二个插件
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(secondPluginId)) {
            isSecondPluginInTab = true;
            break;
          }
        }
        
        // 如果第一个插件不在标签容器中，确保在activePlugins中
        if (!isFirstPluginInTab && !activePlugins.includes(firstPluginId)) {
          activePlugins.push(firstPluginId);
        }
        
        // 如果第二个插件不在标签容器中，确保在activePlugins中
        if (!isSecondPluginInTab && !activePlugins.includes(secondPluginId)) {
          activePlugins.push(secondPluginId);
        }
        
        // 检查第二个插件是否已存在于其他位置
        if (isPluginAlreadyActive(state, secondPluginId) && secondPluginId !== firstPluginId) {
          console.log(`插件 ${secondPluginId} 已存在，将从现有位置移除`);
          updatedState = replaceExistingPlugin(updatedState, secondPluginId);
        }
        
        // 为新容器生成唯一ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 获取第一个插件的布局位置
        const firstPluginLayout = updatedState.layout.find(item => item.i === firstPluginId);
        if (!firstPluginLayout) {
          console.error(`未找到插件布局: ${firstPluginId}`);
          return updatedState;
        }
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [firstPluginId, secondPluginId]
        };
        
        // 创建TabContainer的布局项
        const tabContainerLayout: Layout = {
          i: tabId,
          x: firstPluginLayout.x,
          y: firstPluginLayout.y,
          w: Math.max(firstPluginLayout.w, 6), // 至少6个单位宽
          h: Math.max(firstPluginLayout.h, 8), // 至少8个单位高
          minW: 4,
          minH: 6
        };
        
        // 从现有布局中移除两个插件的布局
        const updatedLayout = updatedState.layout.filter(
          item => item.i !== firstPluginId && item.i !== secondPluginId
        );
        
        // 添加标签容器布局
        updatedLayout.push(tabContainerLayout);
        
        console.log('新标签容器创建成功:', tabId, '包含插件:', [firstPluginId, secondPluginId]);
        
        return {
          ...updatedState,
          layout: updatedLayout,
          tabContainers: [...updatedState.tabContainers, newTabContainer],
          activePlugins: activePlugins // 使用更新后的活跃插件列表
        };
      }),
      
      // 将单个普通插件转换为标签容器 (新增方法)
      convertToTab: (pluginId: string) => set((state) => {
        console.log(`将插件转换为标签容器: ${pluginId}`);
        
        // 检查插件是否已经在某个标签容器中
        for (const tab of state.tabContainers) {
          if (tab.plugins.includes(pluginId)) {
            console.log(`插件 ${pluginId} 已经在标签容器 ${tab.id} 中`);
            return state;
          }
        }
        
        // 检查插件是否在布局中
        const pluginLayout = state.layout.find(item => item.i === pluginId);
        if (!pluginLayout) {
          console.error(`未找到插件布局: ${pluginId}`);
          return state;
        }
        
        // 为新容器生成唯一ID
        const tabId = `tab-container-${Date.now()}`;
        
        // 创建新的标签容器
        const newTabContainer: TabGroup = {
          id: tabId,
          plugins: [pluginId]
        };
        
        // 创建TabContainer的布局项
        const tabContainerLayout: Layout = {
          i: tabId,
          x: pluginLayout.x,
          y: pluginLayout.y,
          w: Math.max(pluginLayout.w, 6), // 至少6个单位宽
          h: Math.max(pluginLayout.h, 8), // 至少8个单位高
          minW: 4,
          minH: 6
        };
        
        // 从现有布局中移除插件
        const updatedLayout = state.layout.filter(item => item.i !== pluginId);
        
        // 添加标签容器布局
        updatedLayout.push(tabContainerLayout);
        
        console.log('新单插件标签容器创建成功:', tabId, '包含插件:', [pluginId]);
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: [...state.tabContainers, newTabContainer],
        };
      }),
      
      // 在布局Store中
      removePluginFromTab: (tabId: string, pluginId: string, customPosition?: {x: number, y: number, w: number, h: number}) => set((state) => {
        console.log('开始执行removePluginFromTab:', { tabId, pluginId, customPosition });
        
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.warn('标签容器不存在:', tabId);
          return state;
        }
        
        // 检查该插件是否存在于标签容器中
        if (!tabContainer.plugins.includes(pluginId)) {
          console.warn('插件不存在于标签容器中:', pluginId, tabId);
          return state;
        }
        
        // 检查此插件是否最近被删除过，如果是则不再处理
        if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId]) {
          console.log('此插件最近已被删除，忽略操作:', pluginId);
          return state;
        }
        
        // 创建一个标记，表示此插件刚刚被删除
        const deleteTimestamp = Date.now();
        window.__recentlyRemovedPlugins = window.__recentlyRemovedPlugins || {};
        window.__recentlyRemovedPlugins[pluginId] = deleteTimestamp;
        
        // 从标签容器中移除插件
        const updatedTabContainers = state.tabContainers.map(tab => {
          if (tab.id === tabId) {
            const updatedPlugins = tab.plugins.filter(id => id !== pluginId);
            // 如果标签容器为空，返回null以便过滤
            if (updatedPlugins.length === 0) {
              return null;
            }
            return {
              ...tab,
              plugins: updatedPlugins
            };
          }
          return tab;
        }).filter(Boolean) as TabGroup[]; // 过滤掉null值
        
        // 如果提供了customPosition，为拆分的插件创建新的标签容器
        let updatedLayout = state.layout;
        
        if (customPosition) {
          console.log('为拆分的插件创建新标签容器:', pluginId, customPosition);
          
          // 创建新的标签容器ID
          const newTabId = `tab-container-${Date.now()}`;
          
          // 创建新的标签容器布局项
          const newTabLayout: Layout = {
            i: newTabId,
            x: customPosition.x,
            y: customPosition.y,
            w: customPosition.w,
            h: customPosition.h,
            minW: 3,
            minH: 4
          };
          
          // 创建新的标签容器
          const newTabContainer: TabGroup = {
            id: newTabId,
            plugins: [pluginId]
          };
          
          // 添加新的标签容器
          updatedTabContainers.push(newTabContainer);
          
          // 将新的标签容器布局添加到布局中
          updatedLayout = [...state.layout, newTabLayout];
        }
        
        // 如果原标签容器变为空，从布局中移除
        if (!updatedTabContainers.some(tab => tab && tab.id === tabId)) {
          console.log('原标签容器变为空，从布局中移除:', tabId);
          updatedLayout = updatedLayout.filter(item => item.i !== tabId);
          
          // 强制触发布局紧缩重排 - 移除空白区域，让其他元素向上填充
          updatedLayout = compactLayoutVertically(updatedLayout);
        }
        
        // 设置一个延迟清理删除标记
        setTimeout(() => {
          if (window.__recentlyRemovedPlugins && window.__recentlyRemovedPlugins[pluginId] === deleteTimestamp) {
            delete window.__recentlyRemovedPlugins[pluginId];
            console.log('清除插件删除标记:', pluginId);
          }
        }, 2000);
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
      }),
      
      // 移除标签容器
      removeTabContainer: (tabId: string) => set((state) => {
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          return state;
        }
        
        // 标签容器的位置
        const tabLayout = state.layout.find(item => item.i === tabId);
        if (!tabLayout) {
          return state;
        }
        
        // 为容器中的每个插件创建新的布局项
        const newLayouts: Layout[] = tabContainer.plugins.map((pluginId, index) => ({
          i: pluginId,
          x: (tabLayout.x + index) % 12, // 横向排列
          y: tabLayout.y + (Math.floor(index / 2) * 6), // 每两个一行
          w: 6,
          h: 6,
          minW: 3,
          minH: 4
        }));
        
        // 从布局中移除标签容器
        const updatedLayout = state.layout.filter(item => item.i !== tabId);
        
        // 添加拆分后的插件布局
        return {
          ...state,
          layout: [...updatedLayout, ...newLayouts],
          tabContainers: state.tabContainers.filter(tab => tab.id !== tabId)
        };
      }),
      
      // 🔧 优化：向Tab容器添加插件 - 增强插件唯一性检查
      addPluginToTab: (tabId: string, pluginId: string) => set((state) => {
        console.log(`📝 向Tab容器 ${tabId} 添加插件: ${pluginId}`);
        
        // 🔧 严格的插件存在性检查
        if (isPluginAlreadyActive(state, pluginId)) {
          console.log(`⚠️ 插件 ${pluginId} 已在系统中存在，将从现有位置移除并重新添加`);
          
          // 从其他位置移除插件
          state = replaceExistingPlugin(state, pluginId);
          
          // 确保从直接布局中移除
          state = {
            ...state,
            layout: state.layout.filter(item => item.i !== pluginId)
          };
        }
        
        // 检查Tab容器是否存在
        const tabContainer = state.tabContainers.find(tab => tab.id === tabId);
        if (!tabContainer) {
          console.error(`❌ 未找到Tab容器: ${tabId}`);
          return state;
        }
        
        // 🔧 严格检查：如果插件已经在目标Tab中，直接返回
        if (tabContainer.plugins.includes(pluginId)) {
          console.log(`⚠️ 插件 ${pluginId} 已存在于目标Tab容器 ${tabId} 中，跳过添加`);
          return state;
        }
        
        // 检查插件是否存在于插件注册表中
        const plugin = pluginRegistry.get(pluginId);
        if (!plugin) {
          console.error(`❌ 未找到插件注册信息: ${pluginId}`);
          return state;
        }
        
        // 🔧 确保插件在活跃插件列表中
        let { activePlugins } = state;
        if (!activePlugins.includes(pluginId)) {
          activePlugins = [...activePlugins, pluginId];
          console.log(`✅ 将插件 ${pluginId} 添加到活跃插件列表`);
        }
        
        // 更新Tab容器中的插件列表
        const updatedTabContainers = state.tabContainers.map(tab => {
          if (tab.id === tabId) {
            const newPlugins = [...tab.plugins, pluginId];
            console.log(`✅ 更新Tab容器 ${tabId}，插件列表: [${newPlugins.join(', ')}]`);
            return {
              ...tab,
              plugins: newPlugins
            };
          }
          return tab;
        });
        
        // 🔧 同步插件token配置 - 从价格卡片插件同步配置
        const priceCardPlugin = pluginRegistry.get('official-price-card');
        if (priceCardPlugin && activePlugins.includes('official-price-card')) {
          const currentConfig = plugin.metadata.defaultConfig || {};
          const priceCardConfig = priceCardPlugin.metadata.defaultConfig || {};
          
          // 同步token和地址信息
          if (currentConfig.token !== undefined && priceCardConfig.token) {
            currentConfig.token = priceCardConfig.token;
          }
          
          if ((currentConfig.address !== undefined || currentConfig.tokenAddress !== undefined) 
              && priceCardConfig.address) {
            currentConfig.address = priceCardConfig.address;
            currentConfig.tokenAddress = priceCardConfig.address;
          }
          
          // 更新插件默认配置
          plugin.metadata.defaultConfig = {...currentConfig};
          console.log(`🔄 已同步插件 ${pluginId} 的token配置`);
        }
        
        console.log(`✅ 插件 ${pluginId} 成功添加到Tab容器 ${tabId}`);
        
        return {
          ...state,
          layout: state.layout.filter(item => item.i !== pluginId), // 确保从外部布局中移除
          tabContainers: updatedTabContainers,
          activePlugins: activePlugins
        };
      }),
      // 添加允许将插件从一个标签容器移动到另一个标签容器的函数
      movePluginBetweenTabs: (sourceTabId: string, targetTabId: string, pluginId: string) => set((state) => {
        console.log(`移动插件 ${pluginId} 从标签 ${sourceTabId} 到标签 ${targetTabId}`);
        
        // 检查源标签容器和目标标签容器是否存在
        const sourceTab = state.tabContainers.find(tab => tab.id === sourceTabId);
        const targetTab = state.tabContainers.find(tab => tab.id === targetTabId);
        
        if (!sourceTab || !targetTab) {
          console.error('源标签或目标标签不存在', { sourceTab, targetTab });
          return state;
        }
        
        // 检查插件是否在源标签容器中
        if (!sourceTab.plugins.includes(pluginId)) {
          console.error('插件不在源标签容器中', pluginId, sourceTabId);
          return state;
        }
        
        console.log('源标签容器插件数量:', sourceTab.plugins.length);
        
        // 从源标签容器中移除插件
        const updatedSourceTab = {
          ...sourceTab,
          plugins: sourceTab.plugins.filter(id => id !== pluginId)
        };
        
        // 将插件添加到目标标签容器
        const updatedTargetTab = {
          ...targetTab,
          plugins: [...targetTab.plugins, pluginId]
        };
        
        let updatedTabContainers;
        let updatedLayout = state.layout;
        
        // 根据源标签容器的插件数量决定处理方式
        if (sourceTab.plugins.length <= 1) {
          // 如果源标签容器只有一个插件，在移除源容器的同时更新目标容器
          console.log('源标签容器只有一个插件，将移除源容器并添加到目标容器', {
            pluginToMove: pluginId,
            targetContainerId: targetTabId
          });
          
          // 🎯 记录被移除的TabContainer的位置和尺寸，用于智能空间填充
          const removedTabLayout = state.layout.find(item => item.i === sourceTabId);
          
          updatedTabContainers = state.tabContainers
            .filter(tab => tab.id !== sourceTabId) // 移除源标签容器
            .map(tab => {
              if (tab.id === targetTabId) {
                // 更新目标标签容器
                return updatedTargetTab;
              }
              return tab;
            });
            
          // 从布局中移除空的源标签容器
          console.log('从布局中移除空的源标签容器:', sourceTabId);
          updatedLayout = state.layout.filter(item => item.i !== sourceTabId);
          
          // 🚀 应用智能空间填充替代简单的垂直压缩
          if (removedTabLayout) {
            console.log('🎯 应用智能空间填充，被移除容器信息:', {
              id: removedTabLayout.i,
              位置: `(${removedTabLayout.x},${removedTabLayout.y})`,
              尺寸: `${removedTabLayout.w}x${removedTabLayout.h}`
            });
            
            updatedLayout = intelligentSpaceFill(updatedLayout, {
              x: removedTabLayout.x,
              y: removedTabLayout.y,
              w: removedTabLayout.w,
              h: removedTabLayout.h
            });
          } else {
            // 如果没有找到布局信息，回退到基础压缩
            console.log('⚠️  未找到被移除容器的布局信息，使用基础压缩');
            updatedLayout = compactLayoutVertically(updatedLayout);
          }
        } else {
          // 如果源标签容器有多个插件，同时更新源容器和目标容器
          console.log('源标签容器有多个插件，将更新源容器和目标容器');
          
          updatedTabContainers = state.tabContainers.map(tab => {
            if (tab.id === sourceTabId) return updatedSourceTab;
            if (tab.id === targetTabId) return updatedTargetTab;
            return tab;
          });
        }
        
        console.log('更新后的标签容器:', updatedTabContainers);
        console.log('目标容器现在包含插件:', updatedTabContainers.find(tab => tab.id === targetTabId)?.plugins);
        
        const newState = {
          ...state,
          layout: updatedLayout,
          tabContainers: updatedTabContainers
        };
        
        // 验证状态更新
        console.log('movePluginBetweenTabs完成 - 状态验证:', {
          操作: `${pluginId} 从 ${sourceTabId} 到 ${targetTabId}`,
          新状态中的目标容器: newState.tabContainers.find(tab => tab.id === targetTabId),
          布局项数量: newState.layout.length,
          标签容器数量: newState.tabContainers.length
        });
        
        return newState;
      }),
      // 新增: 合并标签容器
      moveTabContainers: (sourceId: string, targetId: string) => set((state) => {
        console.log(`合并标签容器 ${sourceId} -> ${targetId}`);
        
        // 检查源标签容器和目标标签容器是否存在
        const sourceTab = state.tabContainers.find(tab => tab.id === sourceId);
        const targetTab = state.tabContainers.find(tab => tab.id === targetId);
        
        if (!sourceTab || !targetTab) {
          console.error('源标签或目标标签不存在', { sourceTab, targetTab });
          return state;
        }
        
        // 获取源标签容器中的所有插件
        const pluginsToMove = [...sourceTab.plugins];
        
        if (pluginsToMove.length === 0) {
          console.error('源标签容器没有插件可以移动');
          return state;
        }
        
        // 创建一个新的目标标签容器，添加所有源标签的插件
        const updatedTargetTab = {
          ...targetTab,
          plugins: [...targetTab.plugins, ...pluginsToMove]
        };
        
        // 🎯 记录被移除的源标签容器的布局信息，用于智能空间填充
        const removedSourceLayout = state.layout.find(item => item.i === sourceId);
        
        // 从布局中移除源标签容器
        let updatedLayout = state.layout.filter(item => item.i !== sourceId);
        
        // 更新目标标签容器大小和应用智能空间填充
        if (removedSourceLayout) {
          const targetLayout = state.layout.find(item => item.i === targetId);
          if (targetLayout) {
            // 选择两者中较大的尺寸
            const newW = Math.max(targetLayout.w, removedSourceLayout.w);
            const newH = Math.max(targetLayout.h, removedSourceLayout.h);
            
            // 更新目标容器的布局
            updatedLayout = updatedLayout.map(item => {
              if (item.i === targetId) {
                return {
                  ...item,
                  w: newW,
                  h: newH
                };
              }
              return item;
            });
            
            console.log('🎯 目标容器扩展:', {
              原始尺寸: `${targetLayout.w}x${targetLayout.h}`,
              新尺寸: `${newW}x${newH}`,
              来源尺寸: `${removedSourceLayout.w}x${removedSourceLayout.h}`
            });
          }
          
          // 🚀 应用智能空间填充，处理被移除源容器留下的空白
          console.log('🎯 应用智能空间填充，被移除源容器信息:', {
            id: removedSourceLayout.i,
            位置: `(${removedSourceLayout.x},${removedSourceLayout.y})`,
            尺寸: `${removedSourceLayout.w}x${removedSourceLayout.h}`
          });
          
          updatedLayout = intelligentSpaceFill(updatedLayout, {
            x: removedSourceLayout.x,
            y: removedSourceLayout.y,
            w: removedSourceLayout.w,
            h: removedSourceLayout.h
          });
        } else {
          console.log('⚠️  未找到源容器布局信息，使用基础压缩');
          updatedLayout = compactLayoutVertically(updatedLayout);
        }
        
        // 更新标签容器列表，移除源容器，更新目标容器
        const finalTabContainers = state.tabContainers
          .filter(tab => tab.id !== sourceId)
          .map(tab => {
            if (tab.id === targetId) {
              return updatedTargetTab;
            }
            return tab;
          });
        
        console.log('标签容器合并成功', {
          targetId,
          移动的插件: pluginsToMove,
          更新后的插件: updatedTargetTab.plugins
        });
        
        return {
          ...state,
          layout: updatedLayout,
          tabContainers: finalTabContainers
        };
      }),
      // 🚀 新增：智能容器重排功能
      smartRepositionContainer: (
        containerId: string, 
        insertPosition: { x: number, y: number }, 
        targetRowContainers: Layout[]
      ) => set((state) => {
        console.log(`智能容器重排: ${containerId} 插入到位置: (${insertPosition.x}, ${insertPosition.y})`);
        
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === containerId);
        if (!tabContainer) {
          console.error(`未找到容器: ${containerId}`);
          return state;
        }
        
        // 创建新的布局
        const newLayout = smartContainerReposition(state.layout, containerId, insertPosition, targetRowContainers);
        
        return {
          ...state,
          layout: newLayout
        };
      }),
      // 🆕 新增：空白区域智能放置功能
      smartPlaceInEmptySpace: (
        containerId: string,
        position: { x: number, y: number },
        size: { w: number, h: number }
      ) => set((state) => {
        console.log(`智能放置容器: ${containerId} 放置到位置: (${position.x}, ${position.y})`);
        
        // 找到对应的标签容器
        const tabContainer = state.tabContainers.find(tab => tab.id === containerId);
        if (!tabContainer) {
          console.error(`未找到容器: ${containerId}`);
          return state;
        }
        
        // 创建新的布局
        const newLayout = smartPlaceInEmptySpace(state.layout, containerId, position, size);
        
        return {
          ...state,
          layout: newLayout
        };
      })
    }),
    {
      name: 'termini-layout-storage',
      // 增加版本号以适应新的数据结构
      version: 3,
      // 显式指定要持久化的状态字段 - 重新启用savedLayouts和currentLayoutId的持久化
      partialize: (state) => ({
        layout: state.layout,
        activePlugins: state.activePlugins,
        tabContainers: state.tabContainers,
        hasInitializedDefault: state.hasInitializedDefault,
        // **修复：重新启用这两个字段的持久化，与localStorage操作协同工作**
        savedLayouts: state.savedLayouts, 
        currentLayoutId: state.currentLayoutId,
      }),
      // 当从存储加载时的钩子
      onRehydrateStorage: () => (state) => {
        console.log('布局状态已从存储中恢复:', {
          activePluginsCount: state?.activePlugins?.length || 0
        });
        
        // 手动加载savedLayouts和currentLayoutId
        try {
          const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
          const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
          
          if (rawLayouts && state) {
            const savedLayouts = JSON.parse(rawLayouts);
            console.log(`从localStorage读取到${savedLayouts.length}个布局`);
            console.log('布局列表:', savedLayouts.map((l: any) => ({ id: l.id, name: l.name })));
            
            // 更新state - 重要修复：在store初始化时确保布局列表不为空
            state.savedLayouts = savedLayouts;
            state.currentLayoutId = currentId;
            console.log('已将布局数据加载到store，布局数量:', savedLayouts.length);
            
            // **新增：如果persist恢复的状态为空但localStorage中有布局，自动加载最后使用的布局**
            if (currentId && savedLayouts.length > 0 && (!state.layout || state.layout.length === 0)) {
              console.log('检测到persist状态为空但有保存的布局，将加载最后使用的布局:', currentId);
              
              const layoutToLoad = savedLayouts.find((layout: any) => layout.id === currentId);
              if (layoutToLoad) {
                console.log('恢复布局:', layoutToLoad.name);
                state.layout = layoutToLoad.layout;
                state.activePlugins = layoutToLoad.activePlugins;
                state.tabContainers = layoutToLoad.tabContainers;
                state.hasInitializedDefault = true;
              } else {
                console.log('未找到指定布局，加载最新布局');
                const latestLayout = savedLayouts.reduce((latest: any, current: any) => 
                  current.updatedAt > latest.updatedAt ? current : latest
                );
                state.layout = latestLayout.layout;
                state.activePlugins = latestLayout.activePlugins;
                state.tabContainers = latestLayout.tabContainers;
                state.currentLayoutId = latestLayout.id;
                state.hasInitializedDefault = true;
                
                // 更新当前布局ID
                localStorage.setItem(CURRENT_LAYOUT_ID_KEY, latestLayout.id);
              }
            }
            
            // 实现额外安全保障：定期检查store中的布局列表是否正确
            setTimeout(() => {
              const storeState = useLayoutStore.getState();
              if (storeState.savedLayouts.length === 0 && savedLayouts.length > 0) {
                console.warn('检测到store中的布局列表为空，但localStorage中有布局，尝试修复...');
                useLayoutStore.setState({
                  savedLayouts: savedLayouts,
                  currentLayoutId: currentId
                });
              }
            }, 1000);
          }
        } catch (error) {
          console.error('手动加载布局数据失败:', error);
        }
      }
    }
  )
);

// 添加一个全局调试函数，用于在控制台中检查布局存储状态
export function checkLayoutStorageStatus() {
  try {
    // 检查localStorage中的数据
    const rawLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
    const currentId = localStorage.getItem(CURRENT_LAYOUT_ID_KEY);
    
    const storeState = useLayoutStore.getState();
    
    console.group('布局存储状态检查');
    
    // 检查localStorage
    console.log('== localStorage 状态 ==');
    if (rawLayouts) {
      const layoutsData = JSON.parse(rawLayouts);
      console.log(`找到 ${layoutsData.length} 个保存的布局`);
      console.table(layoutsData.map((layout: LayoutConfig) => ({
        id: layout.id,
        name: layout.name,
        plugins: layout.activePlugins.length,
        tabs: layout.tabContainers.length,
        updated: new Date(layout.updatedAt).toLocaleString()
      })));
    } else {
      console.log('localStorage中没有布局数据');
    }
    console.log('当前布局ID:', currentId);
    
    // 检查store状态
    console.log('== Zustand Store 状态 ==');
    console.log(`Store中有 ${storeState.savedLayouts.length} 个布局`);
    console.log('Store当前布局ID:', storeState.currentLayoutId);
    
    if (storeState.savedLayouts.length > 0) {
      console.table(storeState.savedLayouts.map((layout: LayoutConfig) => ({
        id: layout.id,
        name: layout.name,
        plugins: layout.activePlugins.length,
        tabs: layout.tabContainers.length,
        updated: new Date(layout.updatedAt).toLocaleString()
      })));
    }
    
    console.log('== 状态比较 ==');
    const hasLocalStorage = rawLayouts !== null;
    const hasStoreLayouts = storeState.savedLayouts.length > 0;
    const idMatch = currentId === storeState.currentLayoutId;
    const countMatch = hasLocalStorage && hasStoreLayouts ? 
      JSON.parse(rawLayouts).length === storeState.savedLayouts.length : false;
    
    console.log('localStorage有布局数据:', hasLocalStorage);
    console.log('Store有布局数据:', hasStoreLayouts);
    console.log('当前布局ID匹配:', idMatch);
    console.log('布局数量匹配:', countMatch);
    
    console.groupEnd();
    
    return {
      localStorage: {
        hasData: hasLocalStorage,
        layoutsCount: hasLocalStorage ? JSON.parse(rawLayouts).length : 0,
        currentId
      },
      store: {
        hasData: hasStoreLayouts,
        layoutsCount: storeState.savedLayouts.length,
        currentId: storeState.currentLayoutId
      },
      isConsistent: idMatch && countMatch
    };
  } catch (error) {
    console.error('检查布局存储状态出错:', error);
    return { error: String(error) };
  }
}

// 将检查函数暴露到全局，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).checkLayoutStorage = checkLayoutStorageStatus;
}

// 专门用于TabContainer移除后的智能空间填充
const intelligentSpaceFill = (layout: Layout[], removedItemBounds: { x: number, y: number, w: number, h: number }, cols: number = 12): Layout[] => {
  if (layout.length === 0) return layout;
  
  console.log('🎯 开始智能空间填充:', {
    被移除项边界: removedItemBounds,
    当前布局项数量: layout.length
  });
  
  const filledLayout = [...layout];
  
  // 🔧 第一步：严格验证是否应该进行空间填充
  // 只有在有明确的相邻容器时才进行填充
  const shouldPerformFill = validateFillNecessity(filledLayout, removedItemBounds);
  
  if (!shouldPerformFill) {
    console.log('❌ 没有发现合适的相邻容器，跳过智能填充');
    return smartCompactLayout(filledLayout, cols);
  }
  
  // 第二步：优先水平填充 - 查找可以水平扩展的相邻容器
  const horizontalFillResult = performHorizontalFill(filledLayout, removedItemBounds, cols);
  let updatedLayout = horizontalFillResult.layout;
  let remainingSpace = horizontalFillResult.remainingSpace;
  
  console.log('💫 水平填充结果:', {
    是否有填充: horizontalFillResult.wasFilled,
    剩余空间: remainingSpace
  });
  
  // 第三步：如果仍有剩余空间，进行垂直填充
  // 🚫 暂时禁用垂直填充，因为逻辑混乱
  /*
  if (remainingSpace && (remainingSpace.w > 0 || remainingSpace.h > 0)) {
    const verticalFillResult = performVerticalFill(updatedLayout, remainingSpace, cols);
    updatedLayout = verticalFillResult.layout;
    
    console.log('📏 垂直填充结果:', {
      是否有填充: verticalFillResult.wasFilled
    });
  }
  */
  
  console.log('📏 垂直填充已禁用 - 跳过垂直方向的智能填充');
  
  // 第四步：应用智能布局重排，确保整体布局最优
  const finalLayout = smartCompactLayout(updatedLayout, cols);
  
  
  console.log('✅ 智能空间填充完成');
  
  return finalLayout;
};

// 🔧 新增：验证是否需要进行空间填充
const validateFillNecessity = (layout: Layout[], removedBounds: { x: number, y: number, w: number, h: number }): boolean => {
  // 检查是否有紧邻的容器
  const hasAdjacentContainers = layout.some(item => {
    // 左侧紧邻
    if (item.x + item.w === removedBounds.x) {
      const verticalOverlap = Math.max(0, Math.min(item.y + item.h, removedBounds.y + removedBounds.h) - Math.max(item.y, removedBounds.y));
      return verticalOverlap > 0;
    }
    
    // 右侧紧邻
    if (item.x === removedBounds.x + removedBounds.w) {
      const verticalOverlap = Math.max(0, Math.min(item.y + item.h, removedBounds.y + removedBounds.h) - Math.max(item.y, removedBounds.y));
      return verticalOverlap > 0;
    }
    
    // 上方紧邻
    if (item.y + item.h === removedBounds.y) {
      const horizontalOverlap = Math.max(0, Math.min(item.x + item.w, removedBounds.x + removedBounds.w) - Math.max(item.x, removedBounds.x));
      return horizontalOverlap > 0;
    }
    
    // 下方紧邻
    if (item.y === removedBounds.y + removedBounds.h) {
      const horizontalOverlap = Math.max(0, Math.min(item.x + item.w, removedBounds.x + removedBounds.w) - Math.max(item.x, removedBounds.x));
      return horizontalOverlap > 0;
    }
    
    return false;
  });
  
  console.log('🔍 填充必要性验证:', {
    有相邻容器: hasAdjacentContainers,
    被移除区域: `(${removedBounds.x},${removedBounds.y}) ${removedBounds.w}x${removedBounds.h}`
  });
  
  return hasAdjacentContainers;
};

// 执行水平填充
const performHorizontalFill = (layout: Layout[], removedBounds: { x: number, y: number, w: number, h: number }, cols: number = 12) => {
  const filledLayout = [...layout];
  let wasFilled = false;
  let remainingSpace = { ...removedBounds };
  
  // 查找可以水平扩展的候选容器
  const horizontalCandidates = findHorizontalFillCandidates(filledLayout, removedBounds);
  
  console.log('🔍 水平填充候选项:', horizontalCandidates.map(c => ({ 
    id: c.item.i, 
    priority: c.priority,
    canExpand: c.canExpandWidth,
    位置: `(${c.item.x},${c.item.y})`,
    尺寸: `${c.item.w}x${c.item.h}`
  })));
  
  if (horizontalCandidates.length > 0) {
    // 按优先级排序：左侧相邻 > 右侧相邻 > 同行其他
    horizontalCandidates.sort((a, b) => a.priority - b.priority);
    
    for (const candidate of horizontalCandidates) {
      if (remainingSpace.w <= 0) break;
      
      const itemIndex = filledLayout.findIndex(item => item.i === candidate.item.i);
      if (itemIndex === -1) continue;
      
      const currentItem = filledLayout[itemIndex];
      
      // 计算可扩展的宽度
      let expandableWidth = 0;
      
      if (candidate.direction === 'right') {
        // 向右扩展：可以占用被移除区域的左侧部分
        const maxRightExpansion = (removedBounds.x + removedBounds.w) - (currentItem.x + currentItem.w);
        expandableWidth = Math.min(maxRightExpansion, remainingSpace.w, candidate.canExpandWidth);
      } else if (candidate.direction === 'left') {
        // 向左扩展：可以占用被移除区域的右侧部分
        const maxLeftExpansion = currentItem.x - removedBounds.x;
        expandableWidth = Math.min(maxLeftExpansion, remainingSpace.w, candidate.canExpandWidth);
        
        // 向左扩展需要同时调整x坐标
        if (expandableWidth > 0) {
          filledLayout[itemIndex].x -= expandableWidth;
        }
      }
      
      if (expandableWidth > 0) {
        filledLayout[itemIndex].w += expandableWidth;
        remainingSpace.w -= expandableWidth;
        wasFilled = true;
        
        console.log(`📈 水平扩展 ${currentItem.i}:`, {
          方向: candidate.direction,
          扩展宽度: expandableWidth,
          新尺寸: `${filledLayout[itemIndex].w}x${filledLayout[itemIndex].h}`,
          新位置: `(${filledLayout[itemIndex].x},${filledLayout[itemIndex].y})`,
          剩余空间宽度: remainingSpace.w
        });
      }
    }
  }
  
  return {
    layout: filledLayout,
    wasFilled,
    remainingSpace: remainingSpace.w > 0 || remainingSpace.h > 0 ? remainingSpace : null
  };
};

// 查找水平填充候选项 - 修复后的版本
const findHorizontalFillCandidates = (layout: Layout[], removedBounds: { x: number, y: number, w: number, h: number }): Array<{
  item: Layout;
  priority: number;
  direction: 'left' | 'right';
  canExpandWidth: number;
}> => {
  const candidates: Array<{
    item: Layout;
    priority: number;
    direction: 'left' | 'right';
    canExpandWidth: number;
  }> = [];
  
  layout.forEach(item => {
    // 🔧 严格检查垂直重叠：必须有实际的垂直范围重叠
    const verticalOverlapStart = Math.max(item.y, removedBounds.y);
    const verticalOverlapEnd = Math.min(item.y + item.h, removedBounds.y + removedBounds.h);
    const hasVerticalOverlap = verticalOverlapStart < verticalOverlapEnd;
    
    if (!hasVerticalOverlap) return;
    
    let priority = 10; // 默认优先级
    let direction: 'left' | 'right' | null = null;
    let canExpandWidth = 0;
    
    // 🎯 检查是否是左侧紧邻（可以向右扩展填充）
    if (item.x + item.w === removedBounds.x) {
      direction = 'right';
      priority = 1; // 最高优先级：紧邻扩展
      canExpandWidth = removedBounds.w;
    }
    // 🎯 检查是否是右侧紧邻（可以向左扩展填充）
    else if (item.x === removedBounds.x + removedBounds.w) {
      direction = 'left';
      priority = 2; // 次高优先级：紧邻扩展
      canExpandWidth = removedBounds.w;
    }
    // 🔧 更严格的同行检查：必须完全在同一水平线上且有足够的重叠
    else if (
      Math.abs(item.y - removedBounds.y) <= 1 && // 几乎同一行（允许1格误差）
      Math.abs(item.h - removedBounds.h) <= 2 && // 高度接近（允许2格误差）
      verticalOverlapEnd - verticalOverlapStart >= Math.min(item.h, removedBounds.h) * 0.6 // 至少60%重叠
    ) {
      // 检查是否在合理的距离内
      const horizontalDistance = item.x < removedBounds.x 
        ? removedBounds.x - (item.x + item.w)
        : item.x - (removedBounds.x + removedBounds.w);
      
      // 🔧 只考虑距离较近的同行元素（最多3格距离）
      if (horizontalDistance >= 0 && horizontalDistance <= 3) {
        if (item.x < removedBounds.x) {
          // 在左侧，可以向右扩展一部分
          direction = 'right';
          priority = 5;
          canExpandWidth = Math.min(3, removedBounds.w, horizontalDistance + removedBounds.w); // 限制扩展量
        } else if (item.x > removedBounds.x + removedBounds.w) {
          // 在右侧，可以向左扩展一部分
          direction = 'left';
          priority = 6;
          canExpandWidth = Math.min(3, removedBounds.w, horizontalDistance + removedBounds.w); // 限制扩展量
        }
      }
    }
    
    if (direction && canExpandWidth > 0) {
      candidates.push({
        item,
        priority,
        direction,
        canExpandWidth
      });
      
      console.log(`🎯 水平填充候选项: ${item.i}`, {
        位置: `(${item.x},${item.y})`,
        尺寸: `${item.w}x${item.h}`,
        方向: direction,
        优先级: priority,
        可扩展宽度: canExpandWidth,
        移除区域: `(${removedBounds.x},${removedBounds.y}) ${removedBounds.w}x${removedBounds.h}`
      });
    }
  });
  
  return candidates;
};

// 执行垂直填充
const performVerticalFill = (layout: Layout[], remainingSpace: { x: number, y: number, w: number, h: number }, cols: number = 12): {
  layout: Layout[];
  wasFilled: boolean;
} => {
  const filledLayout = [...layout];
  let wasFilled = false;
  
  // 查找可以垂直扩展的候选容器
  const verticalCandidates = findVerticalFillCandidates(filledLayout, remainingSpace);
  
  console.log('🔍 垂直填充候选项:', verticalCandidates.map(c => ({ 
    id: c.item.i, 
    priority: c.priority,
    canExpand: c.canExpandHeight,
    位置: `(${c.item.x},${c.item.y})`,
    尺寸: `${c.item.w}x${c.item.h}`
  })));
  
  if (verticalCandidates.length > 0) {
    // 按优先级排序：上方相邻 > 下方相邻 > 同列其他
    verticalCandidates.sort((a, b) => a.priority - b.priority);
    
    for (const candidate of verticalCandidates) {
      if (remainingSpace.h <= 0) break;
      
      const itemIndex = filledLayout.findIndex(item => item.i === candidate.item.i);
      if (itemIndex === -1) continue;
      
      const currentItem = filledLayout[itemIndex];
      
      // 计算可扩展的高度
      let expandableHeight = 0;
      
      if (candidate.direction === 'down') {
        // 向下扩展
        const maxDownExpansion = (remainingSpace.y + remainingSpace.h) - (currentItem.y + currentItem.h);
        expandableHeight = Math.min(maxDownExpansion, remainingSpace.h, candidate.canExpandHeight);
      } else if (candidate.direction === 'up') {
        // 向上扩展
        const maxUpExpansion = currentItem.y - remainingSpace.y;
        expandableHeight = Math.min(maxUpExpansion, remainingSpace.h, candidate.canExpandHeight);
        
        // 向上扩展需要同时调整y坐标
        if (expandableHeight > 0) {
          filledLayout[itemIndex].y -= expandableHeight;
        }
      }
      
      if (expandableHeight > 0) {
        filledLayout[itemIndex].h += expandableHeight;
        remainingSpace.h -= expandableHeight;
        wasFilled = true;
        
        console.log(`📏 垂直扩展 ${currentItem.i}:`, {
          方向: candidate.direction,
          扩展高度: expandableHeight,
          新尺寸: `${filledLayout[itemIndex].w}x${filledLayout[itemIndex].h}`,
          新位置: `(${filledLayout[itemIndex].x},${filledLayout[itemIndex].y})`,
          剩余空间高度: remainingSpace.h
        });
      }
    }
  }
  
  return {
    layout: filledLayout,
    wasFilled
  };
};

// 查找垂直填充候选项 - 修复后的版本
const findVerticalFillCandidates = (layout: Layout[], remainingSpace: { x: number, y: number, w: number, h: number }): Array<{
  item: Layout;
  priority: number;
  direction: 'up' | 'down';
  canExpandHeight: number;
}> => {
  const candidates: Array<{
    item: Layout;
    priority: number;
    direction: 'up' | 'down';
    canExpandHeight: number;
  }> = [];
  
  layout.forEach(item => {
    // 🔧 严格检查水平重叠：必须有实际的水平范围重叠
    const horizontalOverlapStart = Math.max(item.x, remainingSpace.x);
    const horizontalOverlapEnd = Math.min(item.x + item.w, remainingSpace.x + remainingSpace.w);
    const hasHorizontalOverlap = horizontalOverlapStart < horizontalOverlapEnd;
    
    if (!hasHorizontalOverlap) return;
    
    let priority = 10; // 默认优先级
    let direction: 'up' | 'down' | null = null;
    let canExpandHeight = 0;
    
    // 🎯 检查是否是上方紧邻（可以向下扩展填充）
    if (item.y + item.h === remainingSpace.y) {
      direction = 'down';
      priority = 1; // 最高优先级：紧邻扩展
      canExpandHeight = remainingSpace.h;
    }
    // 🎯 检查是否是下方紧邻（可以向上扩展填充）
    else if (item.y === remainingSpace.y + remainingSpace.h) {
      direction = 'up';
      priority = 2; // 次高优先级：紧邻扩展
      canExpandHeight = remainingSpace.h;
    }
    // 🔧 更严格的同列检查：必须完全在同一垂直线上且有足够的重叠
    else if (
      Math.abs(item.x - remainingSpace.x) <= 1 && // 几乎同一列（允许1格误差）
      Math.abs(item.w - remainingSpace.w) <= 2 && // 宽度接近（允许2格误差）
      horizontalOverlapEnd - horizontalOverlapStart >= Math.min(item.w, remainingSpace.w) * 0.6 // 至少60%重叠
    ) {
      // 检查是否在合理的距离内
      const verticalDistance = item.y < remainingSpace.y 
        ? remainingSpace.y - (item.y + item.h)
        : item.y - (remainingSpace.y + remainingSpace.h);
      
      // 🔧 只考虑距离较近的同列元素（最多2格距离）
      if (verticalDistance >= 0 && verticalDistance <= 2) {
        if (item.y < remainingSpace.y) {
          // 在上方，可以向下扩展一部分
          direction = 'down';
          priority = 5;
          canExpandHeight = Math.min(2, remainingSpace.h, verticalDistance + remainingSpace.h); // 限制扩展量
        } else if (item.y > remainingSpace.y + remainingSpace.h) {
          // 在下方，可以向上扩展一部分
          direction = 'up';
          priority = 6;
          canExpandHeight = Math.min(2, remainingSpace.h, verticalDistance + remainingSpace.h); // 限制扩展量
        }
      }
    }
    
    if (direction && canExpandHeight > 0) {
      candidates.push({
        item,
        priority,
        direction,
        canExpandHeight
      });
      
      console.log(`🎯 垂直填充候选项: ${item.i}`, {
        位置: `(${item.x},${item.y})`,
        尺寸: `${item.w}x${item.h}`,
        方向: direction,
        优先级: priority,
        可扩展高度: canExpandHeight,
        剩余空间: `(${remainingSpace.x},${remainingSpace.y}) ${remainingSpace.w}x${remainingSpace.h}`
      });
    }
  });
  
  return candidates;
};

// 🚀 新增：智能TabContainer拖拽重排功能
// 这个函数将容器拖拽到指定位置，并智能调整其他容器的大小和位置
const smartContainerReposition = (
  layout: Layout[], 
  containerId: string, 
  insertPosition: { x: number, y: number }, 
  targetRowContainers: Layout[],
  cols: number = 12
): Layout[] => {
  console.log('🎯 开始智能容器重排:', {
    容器ID: containerId,
    插入位置: insertPosition,
    目标行容器数量: targetRowContainers.length
  });

  const workingLayout = [...layout];
  const containerToMove = workingLayout.find(item => item.i === containerId);
  
  if (!containerToMove) {
    console.error('未找到要移动的容器:', containerId);
    return layout;
  }

  // 记录原始位置信息，用于后续空白填充
  const originalBounds = {
    x: containerToMove.x,
    y: containerToMove.y, 
    w: containerToMove.w,
    h: containerToMove.h
  };

  // 第一步：在目标位置为容器分配空间
  const spaceAllocationResult = allocateSpaceForContainer(
    workingLayout, 
    containerToMove, 
    insertPosition, 
    targetRowContainers, 
    cols
  );

  let updatedLayout = spaceAllocationResult.layout;
  const finalPosition = spaceAllocationResult.finalPosition;

  // 第二步：移动容器到新位置
  updatedLayout = updatedLayout.map(item => {
    if (item.i === containerId) {
      return {
        ...item,
        x: finalPosition.x,
        y: finalPosition.y,
        w: finalPosition.w,
        h: finalPosition.h
      };
    }
    return item;
  });

  console.log('📍 容器移动到新位置:', {
    容器: containerId,
    新位置: `(${finalPosition.x},${finalPosition.y}) ${finalPosition.w}x${finalPosition.h}`,
    原位置: `(${originalBounds.x},${originalBounds.y}) ${originalBounds.w}x${originalBounds.h}`
  });

  // 第三步：智能填充原位置留下的空白
  updatedLayout = intelligentSpaceFill(updatedLayout, originalBounds, cols);

  // 第四步：整体布局优化
  updatedLayout = smartCompactLayout(updatedLayout, cols);

  console.log('✅ 智能容器重排完成');
  return updatedLayout;
};

// 🎯 为容器在目标位置分配空间
const allocateSpaceForContainer = (
  layout: Layout[], 
  containerToMove: Layout, 
  insertPosition: { x: number, y: number }, 
  targetRowContainers: Layout[],
  cols: number = 12
): {
  layout: Layout[];
  finalPosition: { x: number, y: number, w: number, h: number };
} => {
  const workingLayout = [...layout];
  
  // 计算需要的空间
  const requiredSpace = {
    x: insertPosition.x,
    y: insertPosition.y,
    w: containerToMove.w,
    h: containerToMove.h
  };

  console.log('💫 为容器分配空间:', {
    需要的空间: `(${requiredSpace.x},${requiredSpace.y}) ${requiredSpace.w}x${requiredSpace.h}`,
    目标行容器: targetRowContainers.map(c => c.i)
  });

  // 如果目标行为空，直接放置
  if (targetRowContainers.length === 0) {
    return {
      layout: workingLayout,
      finalPosition: requiredSpace
    };
  }

  // 智能调整目标行中的容器大小，为新容器让出空间
  const adjustmentResult = adjustRowContainersForInsertion(
    workingLayout, 
    requiredSpace, 
    targetRowContainers, 
    cols
  );

  return {
    layout: adjustmentResult.layout,
    finalPosition: adjustmentResult.finalPosition
  };
};

// 🔧 调整行中的容器大小，为插入的容器让出空间
const adjustRowContainersForInsertion = (
  layout: Layout[], 
  insertSpace: { x: number, y: number, w: number, h: number }, 
  rowContainers: Layout[],
  cols: number = 12
): {
  layout: Layout[];
  finalPosition: { x: number, y: number, w: number, h: number };
} => {
  const workingLayout = [...layout];
  
  // 按x坐标排序容器
  const sortedContainers = [...rowContainers].sort((a, b) => a.x - b.x);
  
  console.log('🔧 调整行容器以插入新容器:', {
    插入空间: `(${insertSpace.x},${insertSpace.y}) ${insertSpace.w}x${insertSpace.h}`,
    行容器: sortedContainers.map(c => `${c.i}:(${c.x},${c.y}) ${c.w}x${c.h}`)
  });

  // 找到插入位置的左右容器
  let leftContainers: Layout[] = [];
  let rightContainers: Layout[] = [];
  
  sortedContainers.forEach(container => {
    if (container.x + container.w <= insertSpace.x) {
      leftContainers.push(container);
    } else if (container.x >= insertSpace.x + insertSpace.w) {
      rightContainers.push(container);
    }
  });

  // 如果插入位置与现有容器重叠，需要调整
  const overlappingContainers = sortedContainers.filter(container => {
    return !(container.x + container.w <= insertSpace.x || container.x >= insertSpace.x + insertSpace.w);
  });

  if (overlappingContainers.length > 0) {
    console.log('🔀 发现重叠容器，需要调整:', overlappingContainers.map(c => c.i));
    
    // 策略：压缩重叠的容器，为新容器让出空间
    const totalAvailableWidth = cols;
    const requiredWidth = insertSpace.w;
    
    // 计算重叠容器的总宽度
    const overlappingTotalWidth = overlappingContainers.reduce((sum, c) => sum + c.w, 0);
    
    // 如果可以通过压缩让出空间
    if (overlappingTotalWidth > requiredWidth) {
      const compressionRatio = (overlappingTotalWidth - requiredWidth) / overlappingTotalWidth;
      
      console.log('📏 通过压缩让出空间:', {
        重叠容器总宽度: overlappingTotalWidth,
        需要宽度: requiredWidth,
        压缩比例: compressionRatio
      });

      // 按比例压缩重叠的容器
      overlappingContainers.forEach(container => {
        const newWidth = Math.max(3, Math.floor(container.w * compressionRatio)); // 最小宽度3
        const containerIndex = workingLayout.findIndex(item => item.i === container.i);
        
        if (containerIndex !== -1) {
          workingLayout[containerIndex] = {
            ...workingLayout[containerIndex],
            w: newWidth
          };
          
          console.log(`📐 压缩容器 ${container.i}: ${container.w} -> ${newWidth}`);
        }
      });

      // 重新排列压缩后的容器位置
      let currentX = 0;
      const sameRowContainers = workingLayout
        .filter(item => item.y === insertSpace.y && item.i !== insertSpace.x.toString())
        .sort((a, b) => a.x - b.x);

      sameRowContainers.forEach(container => {
        if (currentX === insertSpace.x) {
          currentX += insertSpace.w; // 为新容器预留空间
        }
        
        const containerIndex = workingLayout.findIndex(item => item.i === container.i);
        if (containerIndex !== -1) {
          workingLayout[containerIndex] = {
            ...workingLayout[containerIndex],
            x: currentX
          };
          currentX += workingLayout[containerIndex].w;
        }
      });
    } else {
      // 如果压缩不够，将重叠的容器移动到其他位置
      console.log('🔄 压缩不够，移动重叠容器到其他位置');
      
      overlappingContainers.forEach(container => {
        const newPosition = findContainerAlternativePosition(workingLayout, container, cols);
        const containerIndex = workingLayout.findIndex(item => item.i === container.i);
        
        if (containerIndex !== -1 && newPosition) {
          workingLayout[containerIndex] = {
            ...workingLayout[containerIndex],
            x: newPosition.x,
            y: newPosition.y
          };
          
          console.log(`🚀 移动容器 ${container.i} 到新位置: (${newPosition.x},${newPosition.y})`);
        }
      });
    }
  }

  // 调整右侧容器的位置
  rightContainers.forEach(container => {
    const containerIndex = workingLayout.findIndex(item => item.i === container.i);
    if (containerIndex !== -1) {
      const newX = Math.min(cols - container.w, container.x + insertSpace.w);
      workingLayout[containerIndex] = {
        ...workingLayout[containerIndex],
        x: newX
      };
      
      console.log(`➡️  调整右侧容器 ${container.i} 位置: ${container.x} -> ${newX}`);
    }
  });

  return {
    layout: workingLayout,
    finalPosition: insertSpace
  };
};

// 🔍 为容器寻找替代位置
const findContainerAlternativePosition = (layout: Layout[], container: Layout, cols: number = 12): { x: number, y: number } | null => {
  // 创建网格占用图
  const maxY = Math.max(...layout.map(item => item.y + item.h), 10);
  const grid: boolean[][] = Array(maxY + 5).fill(null).map(() => Array(cols).fill(false));
  
  // 标记已占用的位置（排除当前容器）
  layout.forEach(item => {
    if (item.i !== container.i) {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          if (grid[y] && grid[y][x] !== undefined) {
            grid[y][x] = true;
          }
        }
      }
    }
  });

  // 寻找第一个可用位置
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x <= cols - container.w; x++) {
      if (canPlaceAtPosition(grid, x, y, container.w, container.h, cols, grid.length)) {
        return { x, y };
      }
    }
  }

  // 如果没找到，在底部添加新行
  return { x: 0, y: maxY + 1 };
};

// 🎯 检测TabContainer拖拽插入位置
export const detectContainerInsertPosition = (
  layout: Layout[], 
  draggedContainerId: string, 
  mouseX: number, 
  mouseY: number,
  gridParams: {
    rect: DOMRect;
    rowHeight: number;
    margin: number;
    cols: number;
    colWidth: number;
  }
): {
  insertPosition: { x: number, y: number } | null;
  targetRowContainers: Layout[];
  insertType: 'between' | 'newRow' | 'replace' | 'emptySpace';
  emptySpaceSize?: { w: number, h: number };
} | null => {
  const { rect, rowHeight, margin, cols, colWidth } = gridParams;
  
  // 将鼠标位置转换为网格坐标
  const gridX = Math.floor((mouseX - rect.left) / (colWidth + margin));
  const gridY = Math.floor((mouseY - rect.top) / (rowHeight + margin));
  
  // 限制在有效范围内
  const clampedX = Math.max(0, Math.min(gridX, cols - 1));
  const clampedY = Math.max(0, gridY);
  
  // 排除被拖拽的容器
  const otherContainers = layout.filter(item => item.i !== draggedContainerId);
  
  console.log('🎯 检测插入位置:', {
    鼠标网格坐标: `(${clampedX}, ${clampedY})`,
    容器总数: otherContainers.length
  });
  
  // 🆕 优先检测空白区域
  const emptySpaceDetection = detectEmptySpaceAt(otherContainers, clampedX, clampedY, cols);
  if (emptySpaceDetection) {
    console.log('✅ 检测到空白区域:', emptySpaceDetection);
    return {
      insertPosition: { x: emptySpaceDetection.x, y: emptySpaceDetection.y },
      targetRowContainers: [],
      insertType: 'emptySpace',
      emptySpaceSize: { w: emptySpaceDetection.w, h: emptySpaceDetection.h }
    };
  }
  
  // 检测同行容器（用于between插入）
  const targetRow = clampedY;
  const rowContainers = otherContainers.filter(item => 
    item.y <= targetRow && item.y + item.h > targetRow
  ).sort((a, b) => a.x - b.x);
  
  if (rowContainers.length === 0) {
    // 空行 - 新行插入
    return {
      insertPosition: { x: 0, y: clampedY },
      targetRowContainers: [],
      insertType: 'newRow'
    };
  }
  
  // 检测容器间插入位置
  for (let i = 0; i <= rowContainers.length; i++) {
    let insertX: number;
    
    if (i === 0) {
      // 行首插入
      insertX = 0;
      if (clampedX < rowContainers[0].x) {
        return {
          insertPosition: { x: insertX, y: targetRow },
          targetRowContainers: rowContainers,
          insertType: 'between'
        };
      }
    } else if (i === rowContainers.length) {
      // 行尾插入
      const lastContainer = rowContainers[rowContainers.length - 1];
      insertX = lastContainer.x + lastContainer.w;
      if (clampedX >= insertX) {
        return {
          insertPosition: { x: insertX, y: targetRow },
          targetRowContainers: rowContainers,
          insertType: 'between'
        };
      }
    } else {
      // 容器间插入
      const leftContainer = rowContainers[i - 1];
      const rightContainer = rowContainers[i];
      const leftEdge = leftContainer.x + leftContainer.w;
      const rightEdge = rightContainer.x;
      
      if (clampedX >= leftEdge && clampedX < rightEdge) {
        return {
          insertPosition: { x: leftEdge, y: targetRow },
          targetRowContainers: rowContainers,
          insertType: 'between'
        };
      }
    }
  }
  
  return null;
};

// 🆕 检测指定位置的空白区域
const detectEmptySpaceAt = (
  layout: Layout[], 
  targetX: number, 
  targetY: number, 
  cols: number = 12
): { x: number, y: number, w: number, h: number } | null => {
  // 检查目标位置是否被占用
  const isOccupied = layout.some(item => 
    targetX >= item.x && 
    targetX < item.x + item.w && 
    targetY >= item.y && 
    targetY < item.y + item.h
  );
  
  if (isOccupied) {
    return null; // 位置被占用，不是空白区域
  }
  
  // 寻找这个空白区域的边界
  let spaceX = targetX;
  let spaceY = targetY;
  let spaceW = 1;
  let spaceH = 1;
  
  // 🔍 向左扩展，找到空白区域的左边界
  while (spaceX > 0) {
    const testX = spaceX - 1;
    const hasContainer = layout.some(item => 
      testX >= item.x && 
      testX < item.x + item.w && 
      targetY >= item.y && 
      targetY < item.y + item.h
    );
    
    if (hasContainer) break;
    spaceX = testX;
    spaceW++;
  }
  
  // 🔍 向右扩展，找到空白区域的右边界
  let rightBoundary = spaceX + spaceW;
  while (rightBoundary < cols) {
    const hasContainer = layout.some(item => 
      rightBoundary >= item.x && 
      rightBoundary < item.x + item.w && 
      targetY >= item.y && 
      targetY < item.y + item.h
    );
    
    if (hasContainer) break;
    rightBoundary++;
  }
  spaceW = rightBoundary - spaceX;
  
  // 🔍 向上扩展，找到空白区域的上边界
  while (spaceY > 0) {
    const testY = spaceY - 1;
    let rowHasContainer = false;
    
    // 检查这一行在我们的宽度范围内是否有容器
    for (let x = spaceX; x < spaceX + spaceW; x++) {
      const hasContainer = layout.some(item => 
        x >= item.x && 
        x < item.x + item.w && 
        testY >= item.y && 
        testY < item.y + item.h
      );
      
      if (hasContainer) {
        rowHasContainer = true;
        break;
      }
    }
    
    if (rowHasContainer) break;
    spaceY = testY;
    spaceH++;
  }
  
  // 🔍 向下扩展，找到空白区域的下边界
  let bottomBoundary = spaceY + spaceH;
  const maxY = Math.max(0, ...layout.map(item => item.y + item.h));
  
  while (bottomBoundary <= maxY + 2) { // 允许向下扩展到布局外
    let rowHasContainer = false;
    
    // 检查这一行在我们的宽度范围内是否有容器
    for (let x = spaceX; x < spaceX + spaceW; x++) {
      const hasContainer = layout.some(item => 
        x >= item.x && 
        x < item.x + item.w && 
        bottomBoundary >= item.y && 
        bottomBoundary < item.y + item.h
      );
      
      if (hasContainer) {
        rowHasContainer = true;
        break;
      }
    }
    
    if (rowHasContainer) break;
    bottomBoundary++;
  }
  spaceH = bottomBoundary - spaceY;
  
  // 🎯 优化空白区域尺寸
  // 确保宽度合理（最小2格，最大占用可用宽度）
  spaceW = Math.max(2, Math.min(spaceW, cols - spaceX));
  // 确保高度合理（最小2格，最大8格）
  spaceH = Math.max(2, Math.min(spaceH, 8));
  
  console.log('🔍 空白区域分析:', {
    目标位置: `(${targetX}, ${targetY})`,
    检测区域: `(${spaceX}, ${spaceY}) ${spaceW}x${spaceH}`,
    布局最大Y: maxY
  });
  
  return {
    x: spaceX,
    y: spaceY,
    w: spaceW,
    h: spaceH
  };
};

// 🆕 空白区域智能放置算法
const smartPlaceInEmptySpace = (
  layout: Layout[], 
  containerId: string, 
  position: { x: number, y: number }, 
  size: { w: number, h: number }
): Layout[] => {
  console.log('🎯 执行空白区域智能放置:', {
    容器: containerId,
    目标位置: `(${position.x}, ${position.y})`,
    目标尺寸: `${size.w}x${size.h}`
  });
  
  const updatedLayout = [...layout];
  
  // 找到要移动的容器
  const containerIndex = updatedLayout.findIndex(item => item.i === containerId);
  if (containerIndex === -1) {
    console.error(`容器 ${containerId} 未找到`);
    return layout;
  }
  
  const originalContainer = updatedLayout[containerIndex];
  console.log(`📦 原始容器信息:`, {
    位置: `(${originalContainer.x}, ${originalContainer.y})`,
    尺寸: `${originalContainer.w}x${originalContainer.h}`
  });
  
  // 🎯 记录原始位置，用于后续空间填充
  const originalBounds = {
    x: originalContainer.x,
    y: originalContainer.y,
    w: originalContainer.w,
    h: originalContainer.h
  };
  
  // 🚀 更新容器到新位置和新尺寸
  updatedLayout[containerIndex] = {
    ...originalContainer,
    x: position.x,
    y: position.y,
    w: size.w,
    h: size.h
  };
  
  console.log(`✅ 容器已放置到空白区域:`, {
    新位置: `(${position.x}, ${position.y})`,
    新尺寸: `${size.w}x${size.h}`
  });
  
  // 🔧 对原始位置进行智能空间填充
  let finalLayout = intelligentSpaceFill(updatedLayout, originalBounds);
  
  // 🎯 应用最终的布局优化
  finalLayout = smartCompactLayout(finalLayout);
  
  console.log('✅ 空白区域放置完成');
  
  return finalLayout;
};
