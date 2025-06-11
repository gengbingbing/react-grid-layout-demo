import { lazy } from 'react';
import type { Plugin } from '../../types';

const TwitterSentimentComponent = lazy(() => import('./TwitterSentiment'));

const twitterSentimentPlugin: Plugin = {
  metadata: {
    id: 'official-twitter-sentiment',
    name: '推特舆情监控',
    description: '实时监控加密货币相关的Twitter舆情和热点话题',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      keywords: ['BTC', 'ETH', 'Crypto'],
      refreshInterval: 60,
      sentimentThreshold: 0.5
    }
  },
  component: TwitterSentimentComponent
};

export default twitterSentimentPlugin; 