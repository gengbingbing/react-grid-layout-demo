import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface ThreadsChatProps {
  config: {
    username: string;
    defaultChannels: string[];
    notifications: boolean;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
  channel: string;
  isBot: boolean;
  reactions: {
    emoji: string;
    count: number;
    reacted: boolean;
  }[];
}

// 生成随机头像URL
const generateAvatar = (seed: string): string => {
  // 使用seed生成不同的头像，这里模拟不同的头像
  return `https://i.pravatar.cc/150?u=${seed}`;
};

// 生成模拟用户名
const generateUsername = (): string => {
  const prefixes = ['Crypto', 'Bitcoin', 'Eth', 'Trader', 'DeFi', 'Moon', 'Hodl', 'Whale', 'Diamond', 'Chain'];
  const suffixes = ['Guru', 'Master', 'Wizard', 'Hunter', 'Pro', 'King', 'Hand', 'Shark', 'Ninja', 'Rocket'];
  const numbers = ['', '', '', '', '', '007', '21', '42', '99', '888'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const number = numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${prefix}${suffix}${number}`;
};

// 为不同的频道生成模拟消息
const generateChannelMessages = (channel: string, count: number = 20): ChatMessage[] => {
  // 每个频道的对话主题
  const channelTopics: Record<string, string[]> = {
    general: [
      '今天市场整体走势如何？',
      '有人在用什么交易策略吗？',
      '最近哪个项目比较有潜力？',
      '大家对下一轮牛市有什么预测？',
      '如何进行风险管理？',
      '有没有推荐的加密货币书籍或教程？',
      '我刚开始进入加密货币行业，有什么建议吗？'
    ],
    btc: [
      'BTC即将突破历史新高？',
      '比特币减半事件会对价格产生什么影响？',
      '闪电网络最近有什么进展？',
      '比特币挖矿难度又增加了',
      '机构投资者对BTC的态度如何？',
      'BTC现在是买入的好时机吗？'
    ],
    eth: [
      'ETH 2.0质押回报率怎么样？',
      '以太坊的gas费最近太高了',
      '以太坊扩容方案比较',
      '有人在用哪个L2解决方案？',
      '以太坊的dApp生态系统正在蓬勃发展',
      'EIP-1559对以太坊有什么影响？'
    ],
    defi: [
      '哪个DeFi协议的收益率最高？',
      '如何避免DeFi中的无常损失？',
      '最近有什么新的借贷平台吗？',
      'DeFi中的风险管理策略',
      '流动性挖矿还值得参与吗？',
      '有没有人用过这个新的DEX？'
    ],
    nft: [
      '最近有什么热门NFT项目？',
      'NFT市场正在复苏吗？',
      '有人收集什么类型的NFT？',
      'NFT交易平台手续费比较',
      '如何开始创建自己的NFT？',
      '元宇宙土地价格怎么样了？'
    ]
  };
  
  const botResponses: Record<string, string[]> = {
    general: [
      '根据技术分析，市场可能会在短期内横盘整理',
      '风险管理是交易成功的关键，记得设置止损',
      '分散投资是减少风险的好方法',
      '建议新手从小仓位开始，逐步学习'
    ],
    btc: [
      '比特币网络的哈希率正在创历史新高',
      '机构持仓数据显示比特币流入正在增加',
      '比特币目前的支撑位在$XX,XXX左右',
      '链上数据显示长期持有者数量在增加'
    ],
    eth: [
      'ETH燃烧机制自实施以来已销毁超过X百万ETH',
      'ETH2.0质押合约中锁定了超过X百万枚ETH',
      '以太坊开发者活动保持在历史高位',
      '以太坊L2解决方案的总锁仓价值突破X十亿美元'
    ],
    defi: [
      '请注意DeFi协议的智能合约风险',
      '当前DeFi总锁仓价值(TVL)为$XX十亿',
      '去中心化稳定币市值增长了XX%',
      '跨链DeFi解决方案正在快速发展'
    ],
    nft: [
      'NFT交易量环比上月增长/下降了XX%',
      '游戏NFT领域正在吸引主流玩家的关注',
      'NFT市场正在向实用型应用转变',
      '艺术NFT的平均价格在过去3个月下降了XX%'
    ]
  };
  
  // 生成指定数量的消息
  const messages: ChatMessage[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const isBot = Math.random() < 0.2; // 20%概率是机器人消息
    const username = isBot ? 'CryptoBot' : generateUsername();
    
    // 从相应频道的主题中随机选择一条
    const topics = channelTopics[channel] || channelTopics.general;
    const botAnswers = botResponses[channel] || botResponses.general;
    
    let content;
    if (isBot) {
      content = botAnswers[Math.floor(Math.random() * botAnswers.length)];
    } else {
      content = topics[Math.floor(Math.random() * topics.length)];
    }
    
    // 生成过去24小时内的随机时间
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    // 生成随机表情反应
    const emojis = ['👍', '❤️', '🚀', '👀', '🔥', '💯', '🤔', '😂'];
    const reactions = [];
    
    // 30%概率有反应
    if (Math.random() < 0.3) {
      const reactionCount = Math.floor(Math.random() * 3) + 1;
      const usedEmojis = new Set();
      
      for (let j = 0; j < reactionCount; j++) {
        let emoji;
        do {
          emoji = emojis[Math.floor(Math.random() * emojis.length)];
        } while (usedEmojis.has(emoji));
        
        usedEmojis.add(emoji);
        reactions.push({
          emoji,
          count: Math.floor(Math.random() * 5) + 1,
          reacted: Math.random() < 0.2 // 20%概率用户已经做出反应
        });
      }
    }
    
    messages.push({
      id: `msg-${channel}-${i}-${Date.now()}`,
      username,
      avatar: generateAvatar(username),
      content,
      timestamp,
      channel,
      isBot,
      reactions
    });
  }
  
  // 按时间排序
  return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const ThreadsChat: FC<ThreadsChatProps> = ({ config, onConfigChange }) => {
  const { username, defaultChannels, notifications } = config;
  const [channels, setChannels] = useState<string[]>(defaultChannels);
  const [activeChannel, setActiveChannel] = useState<string>(defaultChannels[0] || 'general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 加载频道消息
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const channelMessages = generateChannelMessages(activeChannel);
      setMessages(channelMessages);
      setIsLoading(false);
      scrollToBottom();
    }, 800);
  }, [activeChannel]);
  
  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // 发送新消息
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // 创建新消息
    const newMsg: ChatMessage = {
      id: `msg-${activeChannel}-${Date.now()}`,
      username,
      avatar: generateAvatar(username),
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      channel: activeChannel,
      isBot: false,
      reactions: []
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    scrollToBottom();
    
    // 模拟机器人回复
    if (Math.random() < 0.3) { // 30%概率收到回复
      setTimeout(() => {
        const botAnswers = {
          general: [
            '谢谢分享你的观点！这是个有趣的话题。',
            '我也注意到了这个趋势，非常有意思。',
            '这是个好问题，有人能详细解释一下吗？',
            '建议关注一下最新的市场报告，那里有更多相关信息。'
          ],
          btc: [
            '比特币目前处于关键技术位置，突破后可能会有更大行情。',
            '最近的链上数据显示长期持有者仍在增加。',
            '机构资金流入似乎正在加速，值得关注。',
            '比特币的波动率最近有所下降，这通常是大行情前的征兆。'
          ],
          eth: [
            '以太坊近期的网络升级将显著提高交易处理速度。',
            'ETH的质押率继续上升，目前接近全部供应量的20%。',
            '开发者活动指标显示以太坊生态系统保持强劲增长。',
            '以太坊L2解决方案的使用量在过去一个月增长了40%。'
          ],
          defi: [
            'DeFi协议的创新速度令人印象深刻，但请记住关注安全性。',
            '今年DeFi用户增长了150%，但仍有巨大的增长空间。',
            '跨链DeFi正在成为趋势，解决了流动性分散的问题。',
            '请确保了解智能合约风险，只投资经过审计的协议。'
          ],
          nft: [
            'NFT实用性项目正在获得更多关注，而不仅仅是艺术品。',
            '游戏NFT领域正在爆发，特别是与元宇宙相关的项目。',
            '品牌进入NFT空间的趋势在加速，这是主流采用的好兆头。',
            'NFT版税模式正在演变，为创作者提供更好的长期收益。'
          ]
        };
        
        const answers = botAnswers[activeChannel as keyof typeof botAnswers] || botAnswers.general;
        const botResponse = answers[Math.floor(Math.random() * answers.length)];
        
        const botMsg: ChatMessage = {
          id: `bot-${activeChannel}-${Date.now()}`,
          username: 'CryptoBot',
          avatar: generateAvatar('CryptoBot'),
          content: botResponse,
          timestamp: new Date().toISOString(),
          channel: activeChannel,
          isBot: true,
          reactions: []
        };
        
        setMessages(prev => [...prev, botMsg]);
        scrollToBottom();
      }, 1500);
    }
  };
  
  // 添加表情反应
  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId) {
          // 查找现有的反应
          const existingReaction = msg.reactions.find(r => r.emoji === emoji);
          
          if (existingReaction) {
            // 已经存在这个表情，切换状态
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.emoji === emoji 
                  ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } 
                  : r
              )
            };
          } else {
            // 添加新的表情反应
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, count: 1, reacted: true }]
            };
          }
        }
        return msg;
      })
    );
  };
  
  // 格式化时间显示
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 频道列表 */}
      <div className="mb-3 flex space-x-1 overflow-x-auto pb-1">
        {channels.map(channel => (
          <button
            key={channel}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              activeChannel === channel 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveChannel(channel)}
          >
            # {channel}
          </button>
        ))}
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto border rounded mb-3 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            加载聊天记录...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            还没有消息，开始聊天吧！
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.username === username ? 'justify-end' : ''}`}
              >
                <div className={`max-w-[85%] flex ${message.username === username ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    <img 
                      src={message.avatar} 
                      alt={message.username} 
                      className={`w-8 h-8 rounded-full ${message.isBot ? 'border-2 border-blue-400' : ''}`}
                    />
                  </div>
                  
                  {/* 消息内容 */}
                  <div 
                    className={`mx-2 ${
                      message.username === username 
                        ? 'bg-blue-500 text-white rounded-l-lg rounded-br-lg' 
                        : message.isBot 
                          ? 'bg-gray-100 border-l-4 border-blue-400 rounded-r-lg rounded-bl-lg' 
                          : 'bg-gray-100 rounded-r-lg rounded-bl-lg'
                    } px-3 py-2 relative group`}
                  >
                    {/* 用户名和时间 */}
                    <div className="flex justify-between text-xs mb-1">
                      <div className={`font-medium ${message.username === username ? 'text-blue-100' : 'text-gray-600'}`}>
                        {message.isBot ? `🤖 ${message.username}` : message.username}
                      </div>
                      <div className={`ml-2 ${message.username === username ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {/* 消息文本 */}
                    <div className="text-sm">{message.content}</div>
                    
                    {/* 表情反应 */}
                    {message.reactions.length > 0 && (
                      <div className="flex mt-1 flex-wrap gap-1">
                        {message.reactions.map((reaction, idx) => (
                          <button
                            key={idx}
                            className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full ${
                              reaction.reacted 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-50 text-gray-600'
                            } hover:bg-opacity-80`}
                            onClick={() => handleAddReaction(message.id, reaction.emoji)}
                          >
                            <span className="mr-1">{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* 表情菜单(悬停时显示) */}
                    <div className="absolute -bottom-8 left-0 hidden group-hover:flex bg-white shadow rounded-full border p-1 space-x-1">
                      {['👍', '❤️', '🚀', '🔥'].map(emoji => (
                        <button
                          key={emoji}
                          className="hover:bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          onClick={() => handleAddReaction(message.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={`在 #${activeChannel} 中发送消息...`}
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-blue-300"
        >
          发送
        </button>
      </div>
      
      {/* 用户设置 */}
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          <span className="mr-2">以"{username}"身份聊天</span>
          <button 
            className="text-blue-500 hover:text-blue-600"
            onClick={() => {
              const newName = prompt('请输入你的用户名:', username);
              if (newName && newName.trim()) {
                onConfigChange({ ...config, username: newName.trim() });
              }
            }}
          >
            更改
          </button>
        </div>
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={notifications}
            onChange={() => onConfigChange({ ...config, notifications: !notifications })}
            className="mr-1 h-3 w-3"
          />
          通知
        </label>
      </div>
    </div>
  );
};

export default ThreadsChat; 