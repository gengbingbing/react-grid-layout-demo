import { lazy } from 'react';
import type { Plugin } from '../../types';

const OrderBookComponent = lazy(() => import('./OrderBook'));

const orderBookPlugin: Plugin = {
  metadata: {
    id: 'official-order-book',
    name: '订单簿',
    description: '显示交易对的买卖订单深度',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      symbol: 'BTCUSDT',
      depth: 10
    }
  },
  component: OrderBookComponent
};

export default orderBookPlugin; 