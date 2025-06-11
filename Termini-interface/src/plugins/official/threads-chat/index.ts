import { lazy } from 'react';
import type { Plugin } from '../../types';

const ThreadsChatComponent = lazy(() => import('./ThreadsChat'));

const threadsChatPlugin: Plugin = {
  metadata: {
    id: 'official-threads-chat',
    name: 'Threads 聊天',
    description: '连接社区和交易者的实时聊天系统，讨论市场动态和交易策略',
    version: '1.0.0',
    author: '官方',
    defaultConfig: {
      username: '匿名用户',
      defaultChannels: ['general', 'btc', 'eth', 'defi', 'nft'],
      notifications: true
    }
  },
  component: ThreadsChatComponent
};

export default threadsChatPlugin; 