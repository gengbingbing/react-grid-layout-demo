# GridLayoutDrag 使用指南

## 快速开始

### 1. 测试页面

直接使用测试页面验证功能：

```tsx
import { GridLayoutTest } from 'components/GridLayoutDrag';

export const MyPage = () => {
  return <GridLayoutTest />;
};
```

### 2. 基本使用

```tsx
import React, { useState } from 'react';
import { GridLayoutDrag, useGridLayout } from 'components/GridLayoutDrag';

export const MyGridLayout = () => {
  const {
    layout,
    containers,
    activePlugins,
    pluginProps,
    updateLayout,
    updateContainers,
    movePlugin,
  } = useGridLayout();

  return (
    <div className="h-screen p-4">
      <GridLayoutDrag
        layout={layout}
        containers={containers}
        activePlugins={activePlugins}
        pluginProps={pluginProps}
        onLayoutChange={updateLayout}
        onContainerChange={updateContainers}
        onPluginMove={movePlugin}
        cols={12}
        rowHeight={30}
        margin={[8, 8]}
      />
    </div>
  );
};
```

## 功能说明

### ✅ 已实现的功能

1. **拖拽位置改变** - 可以拖拽网格项目改变位置
2. **拖拽合并** - 可以将插件拖拽到容器中进行合并
3. **标签显示** - 显示插件名称标签，支持切换和删除
4. **容器管理** - 支持多标签容器，类似浏览器标签页
5. **实时反馈** - 拖拽过程中的视觉反馈和状态提示

### 🎮 交互说明

#### 拖拽操作
- **独立插件拖拽**: 拖拽插件头部区域可以移动位置
- **标签页拖拽**: 拖拽标签可以在容器间移动插件
- **容器拖拽**: 拖拽容器手柄（⋮⋮图标）可以移动整个容器

#### 标签管理
- **切换标签**: 点击标签切换活跃插件
- **关闭标签**: 点击标签上的 × 按钮删除插件
- **删除容器**: 当容器只有一个插件时，悬停显示删除按钮

#### 合并操作
- **插件合并**: 将独立插件拖拽到容器中
- **容器合并**: 将一个容器拖拽到另一个容器
- **分离操作**: 将标签拖拽到空白区域创建独立插件

## 调试功能

在开发模式下，组件提供以下调试信息：

### 网格布局调试
- 右下角显示状态信息（容器数量、活跃插件等）
- 拖拽时显示当前操作提示

### 容器调试
- 每个容器右上角显示容器ID和插件信息
- 控制台输出详细的操作日志

### 查看调试信息
打开浏览器开发者工具，在Console中可以看到：
- 拖拽开始/结束事件
- 插件移动操作
- 容器合并/分离操作
- 布局变化记录

## 常见问题

### Q1: 无法拖拽改变位置
**解决方案**:
- 确保拖拽手柄元素有正确的类名 `react-grid-dragHandleExample`
- 检查 `isDraggable` 属性是否设置为 `true`
- 确认没有其他CSS样式阻止拖拽事件

### Q2: 标签不显示或无法删除
**解决方案**:
- 检查 `containers` 数组是否正确配置
- 确认每个容器的 `plugins` 数组不为空
- 检查 `onTabClose` 回调函数是否正确实现

### Q3: 拖拽合并不生效
**解决方案**:
- 确认 `onPluginMove` 回调函数已正确实现
- 检查拖拽传感器配置（距离阈值为8px）
- 确保目标容器在 `containers` 数组中存在

### Q4: 布局状态不持久化
**解决方案**:
- 使用 `useGridLayoutStore` hook进行状态管理
- 调用 `saveLayout` 方法保存当前布局
- 检查 localStorage 是否可用

## 性能优化

### 1. 减少重新渲染
```tsx
const memoizedPluginProps = useMemo(() => ({
  token: currentToken,
  theme,
  locale,
  onTokenChange: handleTokenChange,
}), [currentToken, theme, locale, handleTokenChange]);
```

### 2. 延迟加载插件
```tsx
const LazyPlugin = React.lazy(() => import('./MyPlugin'));
```

### 3. 防抖布局更新
```tsx
const debouncedLayoutChange = useCallback(
  debounce((newLayout) => {
    onLayoutChange(newLayout);
  }, 300),
  [onLayoutChange]
);
```

## 自定义配置

### 网格设置
```tsx
<GridLayoutDrag
  cols={12}              // 列数
  rowHeight={30}         // 行高
  margin={[8, 8]}        // 间距
  isDraggable={true}     // 可拖拽
  isResizable={true}     // 可调整大小
  allowOverlap={false}   // 是否允许重叠
/>
```

### 响应式配置
组件自动支持响应式布局：
- 大屏 (≥1200px): 12列
- 中屏 (≥996px): 10列  
- 小屏 (≥768px): 6列
- 超小屏 (≥480px): 4列
- 极小屏 (<480px): 2列

## 扩展开发

### 添加新插件
1. 在 `PluginWrapper` 的 `PLUGIN_REGISTRY` 中注册
2. 实现 `PluginProps` 接口
3. 添加到插件显示名称映射

### 自定义主题
```tsx
const customPluginProps = {
  ...pluginProps,
  theme: 'custom',
  customColors: {
    primary: '#your-color',
    secondary: '#your-color',
  }
};
```

### 扩展容器功能
继承 `TabContainer` 组件并添加自定义功能：
```tsx
const CustomTabContainer = (props) => {
  // 自定义逻辑
  return <TabContainer {...props} />;
};
``` 