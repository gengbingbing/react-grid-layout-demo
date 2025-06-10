import { lazy } from 'react';
import type { Plugin } from '../../types';

const MarketSignalsComponent = lazy(() => import('./MarketSignals'));

const marketSignalsPlugin: Plugin = {
  metadata: {
    id: 'official-market-signals',
    name: '市场信号雷达',
    description: '监控和分析市场技术指标，提供交易信号',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'],
      timeframe: '1h',
      signalThreshold: 70
    }
  },
  component: MarketSignalsComponent
};

export default marketSignalsPlugin; 