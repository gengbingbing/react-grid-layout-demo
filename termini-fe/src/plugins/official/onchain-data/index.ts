import { lazy } from 'react';
import type { Plugin } from '../../types';

const OnchainDataComponent = lazy(() => import('./OnchainData'));

const onchainDataPlugin: Plugin = {
  metadata: {
    id: 'official-onchain-data',
    name: '链上实时数据流',
    description: '监控各大区块链的大额交易、钱包行为和智能合约活动',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      networks: ['Ethereum', 'Solana', 'Arbitrum', 'Optimism', 'BSC'],
      minTransactionValue: 100000, // 最小交易金额(USD)
      refreshInterval: 10, // 刷新间隔(秒)
      alertThreshold: 1000000 // 预警阈值(USD)
    }
  },
  component: OnchainDataComponent
};

export default onchainDataPlugin; 