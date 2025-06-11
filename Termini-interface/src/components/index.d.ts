/**
 * @file 组件类型定义和文档
 * 这个文件为 Cursor 提供了组件的类型信息和文档说明，帮助开发者更好地使用组件
 */

declare module '@/components/Button' {
  /**
   * 主按钮组件
   * 用于触发操作的交互式按钮
   */
  export default function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }): JSX.Element;

  /**
   * 链接样式按钮
   * 看起来像链接但行为像按钮的组件
   */
  export function ButtonLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: 'primary' | 'secondary' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    disabled?: boolean;
  }): JSX.Element;

  /**
   * 按钮组容器
   * 用于将多个按钮组合在一起的容器组件
   */
  export function ButtonGroup(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
}

declare module '@/components/Modal/Modal' {
  /**
   * 基础模态框组件
   * 用于显示需要用户注意的内容的覆盖层
   */
  export default function Modal(props: React.PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    className?: string;
    showCloseButton?: boolean;
  }>): JSX.Element;
}

declare module '@/components/Modal/ModalWithPortal' {
  /**
   * 使用 Portal 的模态框
   * 将模态框内容渲染到 DOM 树的不同部分，避免 z-index 和样式冲突
   */
  export default function ModalWithPortal(props: React.PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    className?: string;
    showCloseButton?: boolean;
  }>): JSX.Element;
}

declare module '@/components/Modal/SlideModal' {
  /**
   * 滑动效果模态框
   * 从屏幕边缘滑入的模态框组件
   */
  export function SlideModal(props: React.PropsWithChildren<{
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    position?: 'left' | 'right';
    width?: string | number;
  }>): JSX.Element;
}

declare module '@/components/TableScrollFade/TableScrollFade' {
  /**
   * 表格滚动渐变容器
   * 为表格提供水平滚动时左右两侧的渐变效果，并支持左右滚动按钮
   */
  export function TableScrollFadeContainer(props: React.PropsWithChildren<{}>): JSX.Element;
  
  /**
   * 普通内容滚动渐变容器
   * 为一般内容提供水平滚动时左右两侧的渐变效果，并支持左右滚动按钮
   */
  export function BodyScrollFadeContainer(props: React.PropsWithChildren<{
    className?: string;
  }>): JSX.Element;
  
  /**
   * 按钮行滚动渐变容器
   * 为按钮行提供水平滚动时左右两侧的渐变效果，会自动滚动到选中的按钮
   */
  export function ButtonRowScrollFadeContainer(props: React.PropsWithChildren<{}>): JSX.Element;
}

declare module '@/components/Table/Table' {
  /**
   * 表格组件
   * 用于展示结构化数据的表格
   */
  export function Table(props: React.PropsWithChildren<React.HTMLProps<HTMLTableElement>>): JSX.Element;
  
  /**
   * 表格头单元格
   * 用于表格的列标题
   */
  export function TableTh(props: React.PropsWithChildren<React.HTMLProps<HTMLTableCellElement> & {
    padding?: 'all' | 'compact' | 'compact-one-column';
  }>): JSX.Element;
  
  /**
   * 表格行
   * 表格中的数据行
   */
  export function TableTr(props: React.PropsWithChildren<React.HTMLProps<HTMLTableRowElement> & {
    hoverable?: boolean;
    bordered?: boolean;
  }>): JSX.Element;
  
  /**
   * 表格单元格
   * 表格中的数据单元格
   */
  export function TableTd(props: React.PropsWithChildren<React.HTMLProps<HTMLTableCellElement> & {
    padding?: 'all' | 'compact' | 'compact-one-column';
  }>): JSX.Element;
  
  /**
   * 表格头行
   * 表格头部的行
   */
  export function TableTheadTr(props: React.PropsWithChildren<React.HTMLProps<HTMLTableRowElement> & {
    bordered?: boolean;
  }>): JSX.Element;
}

declare module '@/components/Tooltip/Tooltip' {
  /**
   * 工具提示组件
   * 当用户悬停在元素上时显示额外信息
   */
  export default function Tooltip(props: React.PropsWithChildren<{
    content: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
  }>): JSX.Element;
}

declare module '@/context/ThemeContext' {
  /**
   * 主题上下文
   * 提供应用主题管理
   */
  export const ThemeContext: React.Context<{
    theme: 'light' | 'dark';
    toggleTheme: () => void;
  }>;
  
  /**
   * 主题提供者组件
   * 在应用顶层提供主题状态
   */
  export function ThemeProvider(props: React.PropsWithChildren<{}>): JSX.Element;
  
  /**
   * 主题使用钩子
   * 用于在组件中访问和修改主题
   */
  export function useTheme(): {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
  };
}

declare module '@/utils/tokens' {
  /**
   * 获取代币信息
   * 根据代币地址或符号获取详细信息
   */
  export function getTokenInfo(addressOrSymbol: string): {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  } | undefined;
  
  /**
   * 获取代币列表
   * 返回所有支持的代币列表
   */
  export function getTokensList(): Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }>;
} 