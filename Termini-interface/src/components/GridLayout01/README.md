# GridLayout01 组件

基于 React Grid Layout 和 DnD Kit 实现的高级布局系统，支持标签容器、拖拽合并、布局持久化等功能。

## 主要功能

### 1. 布局持久化
- 使用 zustand 和 localStorage 存储多套布局配置
- 支持保存/加载/切换布局
- 自动保存布局状态

### 2. 标签容器系统
- 每个标签容器可包含多个插件
- 支持跨容器拖拽交换插件
- 标签容器大小可通过拖拽边缘自由调整
- 支持标签页滚动和标签管理

### 3. 插件通信
- 所有插件接收统一的 props：
  - token: 当前选中的 token
  - theme: 主题 ('light' | 'dark')
  - locale: 国际化语言代码
  - onTokenChange: 跨插件通信回调

### 4. 高级交互
- 标签页拖拽合并效果
- 容器边缘拖拽调整
- 插件间的数据联动
- 丰富的动画效果和过渡

## 技术栈
- react-grid-layout: 网格布局基础
- @dnd-kit/core: 高级拖放功能
- zustand: 状态管理
- @headlessui/react: UI 组件
- tailwindcss: 样式系统

## 文件结构
- `GridLayout01.tsx`: 主组件
- `store/layoutStore01.ts`: zustand 存储
- `PluginContainer.tsx`: 插件容器组件
- `TabContainer.tsx`: 标签容器组件
- `LayoutControls.tsx`: 布局控制面板
- `hooks/useLocalStorage.ts`: localStorage 钩子
- `styles.css`: 样式文件

## 使用方法

```jsx
import GridLayout01 from 'components/GridLayout01';

function App() {
  return (
    <div className="h-screen w-full">
      <GridLayout01 />
    </div>
  );
}
```

## 如何添加新插件

1. 在插件注册表中注册插件
2. 打开布局控制面板
3. 点击"添加插件"按钮
4. 选择要添加的插件

## 布局管理

1. 打开右上角布局控制面板
2. 保存当前布局：输入名称并保存
3. 加载已保存布局：点击相应布局的加载按钮
4. 删除布局：点击删除按钮

## 主题和本地化

布局系统支持主题切换和语言本地化，可通过布局控制面板的设置选项卡进行调整。 