import { lazy } from 'react';
import type { Plugin } from '../../types';

const TradingChartComponent = lazy(() => import('./TradingChart'));

const tradingChartPlugin: Plugin = {
  metadata: {
    id: 'official-trading-chart',
    name: 'TradingView K线图',
    description: '专业的交易图表工具，支持多种技术指标和绘图工具',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      symbol: 'BTCUSDT',
      interval: '1D',
      theme: 'Light'
    }
  },
  component: TradingChartComponent
};

export default tradingChartPlugin; 