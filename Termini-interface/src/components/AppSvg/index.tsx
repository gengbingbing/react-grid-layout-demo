import React from "react";
import "./index.scss"
// 导入所有原始 SVG 文件
import AddSvgRaw from "pages/Aggregator/images/add.svg?react";
import AstrSvgRaw from "pages/Aggregator/images/astr.svg?react";
import BestPriceSvgRaw from "pages/Aggregator/images/best-price.svg?react";
import BetaSvgRaw from "pages/Aggregator/images/beta.svg?react";
import BotSvgRaw from "pages/Aggregator/images/bot.svg?react";
import DefaultSvgRaw from "pages/Aggregator/images/default.svg?react";
import CopySvgRaw from "pages/Aggregator/images/copy.svg?react";
import DownSvgRaw from "pages/Aggregator/images/down.svg?react";
import EthSvgRaw from "pages/Aggregator/images/eth.svg?react";
import LinkSvgRaw from "pages/Aggregator/images/link.svg?react";
import MarketsSvgRaw from "pages/Aggregator/images/markets.svg?react";
import PriceDownSvgRaw from "pages/Aggregator/images/price-down.svg?react";
import PriceUpSvgRaw from "pages/Aggregator/images/price-up.svg?react";
import QuickSvgRaw from "pages/Aggregator/images/quick.svg?react";
import RouterSvgRaw from "pages/Aggregator/images/router.svg?react";
import SettingSvgRaw from "pages/Aggregator/images/setting.svg?react";
import SwapTokenSvgRaw from "pages/Aggregator/images/swap-token.svg?react";
import SwapTokenLightSvgRaw from "pages/Aggregator/images/swap-token-light.svg?react";
import SwapSvgRaw from "pages/Aggregator/images/swap.svg?react";
import ToggleSvgRaw from "pages/Aggregator/images/toggle.svg?react";
import UsdcSvgRaw from "pages/Aggregator/images/usdc.svg?react";

type SvgProps = {
  className?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
  onClick?: () => void;
};

// 创建高阶组件来处理通用逻辑
const createSvgComponent = (SvgComponent: React.ComponentType<any>) => {
  return ({ className, size, width, height, color, onClick, ...props }: SvgProps) => {
    // 处理尺寸逻辑
    const finalWidth = width || (size !== undefined ? size : undefined);
    const finalHeight = height || (size !== undefined ? size : undefined);
    
    // 创建样式对象
    const style: React.CSSProperties = {};
    
    // 只有当提供了颜色时，才添加颜色相关的类名
    const colorClass = color ? 'svg-with-color' : '';
    const svgClassName = `svg-icon ${colorClass} ${className || ''}`;
    
    // 如果提供了颜色，添加到样式中
    if (color) {
      style['--svg-color'] = color;
    }
    
    return (
      <span className={svgClassName} style={style}>
        <SvgComponent 
          width={finalWidth}
          height={finalHeight}
          onClick={onClick}
          className="svg-content"
          {...props}
        />
      </span>
    );
  };
};

// 为每个 SVG 创建组件
export const AddSvg = createSvgComponent(AddSvgRaw);
export const AstrSvg = createSvgComponent(AstrSvgRaw);
export const BestPriceSvg = createSvgComponent(BestPriceSvgRaw);
export const BetaSvg = createSvgComponent(BetaSvgRaw);
export const BotSvg = createSvgComponent(BotSvgRaw);
export const DefaultSvg = createSvgComponent(DefaultSvgRaw);
export const CopySvg = createSvgComponent(CopySvgRaw);
export const DownSvg = createSvgComponent(DownSvgRaw);
export const EthSvg = createSvgComponent(EthSvgRaw);
export const LinkSvg = createSvgComponent(LinkSvgRaw);
export const MarketsSvg = createSvgComponent(MarketsSvgRaw);
export const PriceDownSvg = createSvgComponent(PriceDownSvgRaw);
export const PriceUpSvg = createSvgComponent(PriceUpSvgRaw);
export const QuickSvg = createSvgComponent(QuickSvgRaw);
export const RouterSvg = createSvgComponent(RouterSvgRaw);
export const SettingSvg = createSvgComponent(SettingSvgRaw);
export const SwapTokenSvg = createSvgComponent(SwapTokenSvgRaw);
export const SwapTokenLightSvg = createSvgComponent(SwapTokenLightSvgRaw);
export const SwapSvg = createSvgComponent(SwapSvgRaw);
export const ToggleSvg = createSvgComponent(ToggleSvgRaw);
export const UsdcSvg = createSvgComponent(UsdcSvgRaw);

// 导出所有 SVG 组件的集合
const AppSvg = {
  AddSvg,
  AstrSvg,
  BestPriceSvg,
  BetaSvg,
  BotSvg,
  DefaultSvg,
  CopySvg,
  DownSvg,
  EthSvg,
  LinkSvg,
  MarketsSvg,
  PriceDownSvg,
  PriceUpSvg,
  QuickSvg,
  RouterSvg,
  SettingSvg,
  SwapTokenSvg,
  SwapTokenLightSvg,
  SwapSvg,
  ToggleSvg,
  UsdcSvg
};

export default AppSvg;