import { lazy } from 'react';
import type { Plugin } from '../../types';

const PriceChartComponent = lazy(() => import('./PriceChart'));

const priceChartPlugin: Plugin = {
  metadata: {
    id: 'official-price-chart',
    name: 'DexScreener K线',
    description: '显示交易对的K线图表，使用DexScreener嵌入图表，支持与Token选择组件联动',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      name: 'ETH/USDC', 
      symbol: 'ETH', 
      chain: 'ethereum',
      pairAddress: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8',
      address: '',
      tokenAddress: '',
      token: 'ETH',
      tokenPair: '',
      tokenChain: '',
      tokenPairAddress: ''
    }
  },
  component: PriceChartComponent
};

export default priceChartPlugin;
