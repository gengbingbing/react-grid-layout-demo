# GridLayoutDrag - 网格拖拽布局系统

一个功能强大的网格拖拽布局系统，类似 pump.fun 的高级面板布局管理。支持插件拖拽、标签容器、布局持久化等功能。

## 🌟 核心功能

### 1. 标签容器 (TabContainer)
- **多插件管理**: 每个容器可包含多个插件，以标签页形式切换
- **跨容器拖拽**: 插件可在不同标签容器间自由拖拽
- **容器调整**: 可通过拖拽边缘自由调整容器大小（保留最小尺寸限制）
- **智能合并**: 将插件拖拽到另一个容器时自动合并
- **独立分离**: 将插件拖拽到空白区域时独立显示

### 2. 布局持久化
- **本地存储**: 使用 localStorage 实现持久化存储
- **多套布局**: 支持保存/加载/切换多套布局配置
- **状态管理**: 基于 Zustand 的全局状态管理

### 3. 插件通信
- **统一接口**: 所有插件接收统一的 PluginProps
- **数据联动**: 支持跨插件的数据通信和状态同步
- **主题支持**: 支持明/暗主题切换
- **国际化**: 支持多语言

## 🚀 快速开始

### 基础使用

```tsx
import React from 'react';
import { GridLayoutDrag, useGridLayout } from 'components/GridLayoutDrag';

export const MyLayoutPage: React.FC = () => {
  const {
    layout,
    containers,
    activePlugins,
    pluginProps,
    updateLayout,
    updateContainers,
  } = useGridLayout();

  return (
    <div className="h-screen">
      <GridLayoutDrag
        layout={layout}
        containers={containers}
        activePlugins={activePlugins}
        pluginProps={pluginProps}
        onLayoutChange={updateLayout}
        onContainerChange={updateContainers}
        cols={12}
        rowHeight={30}
        margin={[8, 8]}
      />
    </div>
  );
};
```

### 自定义插件

```tsx
// 创建自定义插件
const MyCustomPlugin: React.FC<PluginProps> = ({ 
  token, 
  theme, 
  locale, 
  onTokenChange 
}) => {
  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <h3>自定义插件</h3>
      <p>当前 Token: {token?.symbol}</p>
      <button onClick={() => onTokenChange?.('NEW_TOKEN')}>
        切换 Token
      </button>
    </div>
  );
};
```

## 📋 API 参考

### GridLayoutDrag Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `layout` | `Layout[]` | - | 网格布局配置 |
| `containers` | `TabContainer[]` | - | 标签容器列表 |
| `activePlugins` | `string[]` | - | 活跃插件ID列表 |
| `pluginProps` | `PluginProps` | - | 插件通用属性 |
| `cols` | `number` | `12` | 网格列数 |
| `rowHeight` | `number` | `40` | 行高 |
| `margin` | `[number, number]` | `[8, 8]` | 网格间距 |
| `isDraggable` | `boolean` | `true` | 是否可拖拽 |
| `isResizable` | `boolean` | `true` | 是否可调整大小 |
| `onLayoutChange` | `(layout: Layout[]) => void` | - | 布局变化回调 |
| `onContainerChange` | `(containers: TabContainer[]) => void` | - | 容器变化回调 |
| `onPluginMove` | `(pluginId: string, from?: string, to?: string) => void` | - | 插件移动回调 |

### PluginProps

```tsx
interface PluginProps {
  token: any;                          // 当前选中的token
  theme: 'light' | 'dark';            // 主题
  locale: string;                     // 语言代码
  onTokenChange?: (token: string) => void; // 跨插件通信
}
```

### TabContainer

```tsx
interface TabContainer {
  id: string;         // 容器ID
  plugins: string[];  // 包含的插件ID列表
  activeTab: string;  // 当前激活的标签
  layout?: Layout;    // 容器在网格中的布局信息
}
```

## 🎮 交互功能

### 拖拽操作

1. **插件拖拽**
   - 拖拽插件到空白区域：创建独立插件
   - 拖拽插件到容器：合并到容器中
   - 拖拽插件到另一个插件：创建新的标签容器

2. **容器拖拽**
   - 拖拽容器手柄：移动整个容器
   - 拖拽容器到另一个容器：合并容器

3. **标签操作**
   - 点击标签：切换激活插件
   - 关闭标签：从容器中移除插件
   - 拖拽标签：在容器间移动插件

### 调整大小

- **容器边缘拖拽**: 鼠标悬停到容器边缘显示调整手柄
- **最小尺寸限制**: 防止容器被调整得过小
- **实时反馈**: 调整过程中实时显示尺寸变化

## 🔧 状态管理

### useGridLayout Hook

```tsx
const {
  // 基础状态
  layout,
  containers,
  activePlugins,
  
  // 主题和设置
  theme,
  locale,
  currentToken,
  
  // 布局操作
  updateLayout,
  updateContainers,
  addPlugin,
  removePlugin,
  movePlugin,
  
  // 容器操作
  createTabContainer,
  mergeContainers,
  splitContainer,
  
  // 布局持久化
  saveLayout,
  loadLayout,
  deleteLayout,
  savedLayouts,
  
  // 插件属性
  pluginProps,
} = useGridLayout();
```

### Zustand Store

状态自动持久化到 localStorage，支持以下功能：
- 布局配置持久化
- 容器状态保存
- 主题设置记忆
- 多套布局方案

## 🎨 样式定制

### CSS 类名

| 类名 | 描述 |
|------|------|
| `.grid-layout-drag-container` | 主容器 |
| `.grid-item-container` | 标签容器项目 |
| `.grid-item-plugin` | 独立插件项目 |
| `.drag-overlay-container` | 拖拽覆盖层容器 |
| `.drag-overlay-plugin` | 拖拽覆盖层插件 |

### 主题支持

组件支持明/暗主题，通过 `theme` 属性控制：

```tsx
// 明亮主题
<GridLayoutDrag theme="light" />

// 暗黑主题  
<GridLayoutDrag theme="dark" />
```

## 🔌 插件开发

### 插件注册

```tsx
// 在 PluginWrapper.tsx 中注册新插件
const PLUGIN_REGISTRY: Record<string, React.ComponentType<any>> = {
  'my-custom-plugin': React.lazy(() => import('./MyCustomPlugin')),
  // ... 其他插件
};
```

### 插件规范

每个插件应该：
1. 接收 `PluginProps` 作为属性
2. 支持明/暗主题
3. 处理加载和错误状态
4. 响应式设计，适应不同尺寸

## 📱 响应式设计

组件支持响应式布局，在不同屏幕尺寸下自动调整：

- **大屏 (≥1200px)**: 12列网格
- **中屏 (≥996px)**: 10列网格  
- **小屏 (≥768px)**: 6列网格
- **超小屏 (≥480px)**: 4列网格
- **极小屏 (<480px)**: 2列网格

## 🐛 故障排除

### 常见问题

1. **插件无法加载**
   - 检查插件是否正确注册在 `PLUGIN_REGISTRY` 中
   - 确认插件文件路径正确

2. **拖拽不生效**
   - 检查 `isDraggable` 属性是否为 `true`
   - 确认 DndContext 正确包装组件

3. **布局保存失败**
   - 检查 localStorage 是否可用
   - 确认浏览器存储空间充足

4. **样式问题**
   - 确保导入了必要的 CSS 文件
   - 检查 Tailwind CSS 配置

## 🛠️ 开发和贡献

### 技术栈

- **React 18.2.0** - 基础框架
- **TypeScript** - 类型安全
- **@dnd-kit** - 拖拽功能
- **react-grid-layout** - 网格布局
- **Framer Motion** - 动画效果
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式框架

### 项目结构

```
GridLayoutDrag/
├── types.ts                 # 类型定义
├── GridLayoutDrag.tsx       # 主组件
├── TabContainer.tsx         # 标签容器组件
├── PluginWrapper.tsx        # 插件包装器
├── hooks/
│   ├── useDragDrop.ts       # 拖拽逻辑
│   └── useGridLayoutStore.ts # 状态管理
├── GridLayoutExample.tsx    # 使用示例
├── index.ts                 # 导出文件
└── README.md               # 文档
```

## 📄 许可证

MIT License - 详见项目根目录 LICENSE 文件。 