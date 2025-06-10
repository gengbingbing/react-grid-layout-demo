# 插件市场目录

这是第三方开发者上传的插件存放的目录。每个插件应该：

1. 有自己的子目录
2. 包含一个入口文件 index.ts 实现 Plugin 接口
3. 实现所需的UI组件
4. 包含完整的类型定义和文档

## 插件开发指南

插件必须实现 `Plugin` 接口：

```typescript
export interface Plugin {
  metadata: PluginMetadata;
  component: React.ComponentType<{
    config: Record<string, any>;
    onConfigChange: (newConfig: Record<string, any>) => void;
  }>;
} 