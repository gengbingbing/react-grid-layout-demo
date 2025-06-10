import { lazy } from 'react';
import type { Plugin } from '../../types';

const PriceCardComponent = lazy(() => import('./PriceCard'));

const priceCardPlugin: Plugin = {
  metadata: {
    id: 'official-price-card',
    name: 'Token选择',
    description: '显示代币的基本信息和相关市场数据',
    version: '1.0.0',
    author: '官方',
    isFixed: true,
    defaultConfig: {
      token: 'ETH',
      address: '0x...32def',
      timeframe: '24h'
    }
  },
  component: PriceCardComponent
};

export default priceCardPlugin; 