# Cursor 配置文档

本文档说明了 `.cursor/config.json` 配置文件中的各项内容，帮助开发者更好地理解和使用 Cursor 编辑器的智能功能。

## projectComponents 部分

此部分定义了项目中的主要代码目录结构，帮助 Cursor 在分析代码时理解项目架构。

```json
"projectComponents": {
  "ui": "src/components/*",        // UI 组件目录
  "utils": "src/utils/*",          // 工具函数目录
  "context": "src/context/*",      // React 上下文目录
  "pages": "src/pages/*",          // 页面组件目录
  "config": "src/config/*",        // 配置文件目录
  "lib": "src/lib/*",              // 通用库目录
  "types": "src/types/*",          // TypeScript 类型定义目录
  "constants": "src/constants/*",  // 常量定义目录
  "domain": "src/domain/*",        // 领域模型目录
  "abis": "src/abis/*",            // 以太坊 ABI 定义目录
  "hooks": "src/hooks/*",          // React Hooks 目录
  "store": "src/store/*",          // 状态管理目录
  "plugins": "src/plugins/*",      // 插件目录
  "styles": "src/styles/*",        // 样式文件目录
  "typechain": "src/typechain-types/*", // TypeChain 生成的类型目录
  "locales": "src/locales/*",      // 国际化文件目录
  "img": "src/img/*",              // 图片资源目录
  "fonts": "src/fonts/*",          // 字体资源目录
  "app": "src/App/*"               // 应用主组件目录
}
```

## preferredImports 部分

此部分定义了组件和工具函数的导入路径，帮助 Cursor 在编码时自动补全和导入正确的模块。

### 按钮组件相关

```json
"Button": "from '@/components/Button'",              // 默认导出的主按钮组件
"ButtonLink": "from '@/components/Button/ButtonLink'", // 链接样式按钮
"ButtonGroup": "from '@/components/Button/ButtonGroup'", // 按钮组容器
```

### 模态框相关

```json
"Modal": "from '@/components/Modal/Modal'",           // 基础模态框
"ModalWithPortal": "from '@/components/Modal/ModalWithPortal'", // 使用 Portal 的模态框
"SlideModal": "from '@/components/Modal/SlideModal'", // 滑动效果模态框
```

### 下拉菜单相关

```json
"Dropdown": "from '@/components/Dropdown/Dropdown'",  // 下拉菜单组件
```

### 代币相关组件

```json
"TokenIcon": "from '@/components/TokenIcon/TokenIcon'", // 代币图标
"TokenWithIcon": "from '@/components/TokenIcon/TokenWithIcon'", // 带图标的代币展示
"TokenSelector": "from '@/components/TokenSelector'",   // 代币选择器
```

### 表单元素

```json
"Checkbox": "from '@/components/Checkbox'",           // 复选框
"Select": "from '@/components/Select'",               // 选择器
"Radio": "from '@/components/Radio'",                 // 单选框
"SearchInput": "from '@/components/SearchInput'",     // 搜索输入框
"NumberInput": "from '@/components/NumberInput'",     // 数字输入框
"Textarea": "from '@/components/Textarea'",           // 文本区域
"PercentageInput": "from '@/components/PercentageInput'", // 百分比输入框
```

### 提示和弹出组件

```json
"Tooltip": "from '@/components/Tooltip/Tooltip'",     // 工具提示
"TooltipWithPortal": "from '@/components/Tooltip/TooltipWithPortal'", // 使用 Portal 的工具提示
"AlertInfo": "from '@/components/AlertInfo'",         // 提示信息
```

### UI 交互组件

```json
"ToggleSwitch": "from '@/components/ToggleSwitch'",   // 开关
"Pagination": "from '@/components/Pagination'",       // 分页
"Loading": "from '@/components/Loading'",             // 加载中
"Icon": "from '@/components/Icon'",                   // 图标
"Skeleton": "from '@/components/Skeleton'",           // 骨架屏
"Progress": "from '@/components/Progress'",           // 进度条
"Sorter": "from '@/components/Sorter'",               // 排序器
```

### 布局组件

```json
"Footer": "from '@/components/Footer'",               // 页脚
"Header": "from '@/components/Header'",               // 页头
"Banner": "from '@/components/Banner'",               // 横幅
"Tab": "from '@/components/Tab'",                     // 标签页
"GridLayout": "from '@/components/GridLayout'",       // 网格布局
"PageTitle": "from '@/components/PageTitle'",         // 页面标题
```

### 表格组件

```json
"Table": "from '@/components/Table/Table'",           // 表格主组件
"TableTh": "from '@/components/Table/Table'",         // 表格头单元格
"TableTr": "from '@/components/Table/Table'",         // 表格行
"TableTd": "from '@/components/Table/Table'",         // 表格单元格
"TableTheadTr": "from '@/components/Table/Table'",    // 表格头行
"TableScrollFadeContainer": "from '@/components/TableScrollFade/TableScrollFade'", // 表格滚动渐变容器
"BodyScrollFadeContainer": "from '@/components/TableScrollFade/TableScrollFade'",  // 普通内容滚动渐变容器
"ButtonRowScrollFadeContainer": "from '@/components/TableScrollFade/TableScrollFade'", // 按钮行滚动渐变容器
```

### 地址相关组件

```json
"Avatar": "from '@/components/Avatar'",               // 头像
"ExternalLink": "from '@/components/ExternalLink'",   // 外部链接
"AddressView": "from '@/components/AddressView'",     // 地址显示
"AddressDropdown": "from '@/components/AddressDropdown'", // 地址下拉框
```

### 上下文组件

```json
"ThemeContext": "from '@/context/ThemeContext'",      // 主题上下文
"TokensBalancesContext": "from '@/context/TokensBalancesContext'", // 代币余额上下文
"SettingsContext": "from '@/context/SettingsContext'", // 设置上下文
"PendingTxnsContext": "from '@/context/PendingTxnsContext'", // 待处理交易上下文
"GlobalContext": "from '@/context/GlobalContext'",     // 全局上下文
```

### 钩子函数

```json
"useLanguageModal": "from '@/hooks/useLanguageModal'", // 语言模态框钩子
```

### 网络相关

```json
"NetworkConnector": "from '@/utils/NetworkConnector'", // 网络连接器
"getLibrary": "from '@/utils/getLibrary'",             // 获取库函数
```

### 实用工具

```json
"utils": "from '@/utils'",                            // 通用工具
"tokens": "from '@/utils/tokens'",                    // 代币工具
"numbers": "from '@/utils/numbers'",                  // 数字处理工具
"buildUrl": "from '@/utils/buildUrl'",                // URL 构建工具
"subgraph": "from '@/utils/subgraph'",                // 子图查询工具
"contracts": "from '@/utils/contracts'",              // 合约工具
"bigmath": "from '@/utils/bigmath'",                  // 大数计算工具
"LruCache": "from '@/utils/LruCache'"                 // LRU 缓存工具