import { lazy } from 'react';
import type { Plugin } from '../../types';

const CryptoNewsComponent = lazy(() => import('./CryptoNews'));

const cryptoNewsPlugin: Plugin = {
  metadata: {
    id: 'official-crypto-news',
    name: '加密新闻 / Alpha源',
    description: '聚合各大加密媒体的最新新闻和Alpha信息源',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      sources: ['CoinDesk', 'Cointelegraph', 'The Block', 'Decrypt', 'CoinMarketCap'],
      refreshInterval: 300,
      categories: ['新闻', 'Alpha', 'DeFi', 'NFT', 'Layer2']
    }
  },
  component: CryptoNewsComponent
};

export default cryptoNewsPlugin; 