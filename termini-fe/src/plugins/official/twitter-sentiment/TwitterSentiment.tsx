import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface TwitterSentimentProps {
  config: {
    keywords: string[];
    refreshInterval: number;
    sentimentThreshold: number;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface Tweet {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  sentiment: number; // -1 to 1, where -1 is negative, 0 is neutral, 1 is positive
  likes: number;
  retweets: number;
}

// 生成模拟的推特数据
const generateMockTweets = (keywords: string[]): Tweet[] => {
  const sentiments = [-0.8, -0.5, -0.2, 0, 0.2, 0.5, 0.8];
  const authors = ['CryptoWhale', 'BTCanalyst', 'ETHdev', 'TraderMax', 'CoinDesk', 'CoinBureau', 'Binance'];
  const templates = [
    '我认为 $KEYWORD 将会在接下来的几周内 $DIRECTION',
    '刚刚看到 $KEYWORD 的价格图表，看起来非常 $SENTIMENT',
    '$KEYWORD 的最新发展令人 $SENTIMENT，关注这一领域',
    '看来 $KEYWORD 市场正在形成 $SENTIMENT 的趋势',
    '新闻: $KEYWORD 项目宣布重大进展，社区反应 $SENTIMENT',
    '分析师预测 $KEYWORD 将会 $DIRECTION，这很 $SENTIMENT',
  ];

  return Array(10).fill(null).map((_, i) => {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    let template = templates[Math.floor(Math.random() * templates.length)];
    
    // 替换模板中的关键词
    template = template.replace('$KEYWORD', keyword);
    template = template.replace('$DIRECTION', sentiment > 0 ? '上涨' : '下跌');
    template = template.replace('$SENTIMENT', 
      sentiment > 0.5 ? '非常乐观' : 
      sentiment > 0 ? '乐观' : 
      sentiment > -0.5 ? '担忧' : '非常担忧'
    );
    
    const now = new Date();
    const timestamp = new Date(now.getTime() - Math.random() * 3600000).toISOString();
    
    return {
      id: `tweet-${i}-${Date.now()}`,
      author,
      text: template,
      timestamp,
      sentiment,
      likes: Math.floor(Math.random() * 1000),
      retweets: Math.floor(Math.random() * 200)
    };
  });
};

const TwitterSentiment: FC<TwitterSentimentProps> = ({ config, onConfigChange }) => {
  const { keywords, refreshInterval, sentimentThreshold } = config;
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [overallSentiment, setOverallSentiment] = useState(0);
  const [filteredKeyword, setFilteredKeyword] = useState<string | null>(null);

  // 加载初始数据并设置定时刷新
  useEffect(() => {
    const loadTweets = () => {
      const newTweets = generateMockTweets(keywords);
      setTweets(newTweets);
      
      // 计算平均情绪
      const avgSentiment = newTweets.reduce((sum, tweet) => sum + tweet.sentiment, 0) / newTweets.length;
      setOverallSentiment(avgSentiment);
    };
    
    loadTweets();
    const interval = setInterval(loadTweets, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [keywords, refreshInterval]);

  // 获取显示的推文
  const displayTweets = filteredKeyword 
    ? tweets.filter(tweet => tweet.text.includes(filteredKeyword))
    : tweets;

  // 格式化时间
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 获取情绪的颜色
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'bg-green-500';
    if (sentiment > 0) return 'bg-green-300';
    if (sentiment > -0.5) return 'bg-red-300';
    return 'bg-red-500';
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部区域 */}
      <div className="mb-3 flex justify-between items-center">
        <div className="font-medium">实时推特舆情</div>
        <div className="flex items-center space-x-2">
          <select 
            value={filteredKeyword || ''}
            onChange={(e) => setFilteredKeyword(e.target.value || null)}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="">所有关键词</option>
            {keywords.map((keyword) => (
              <option key={keyword} value={keyword}>{keyword}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 总体情绪指标 */}
      <div className="mb-3 flex items-center">
        <div className="text-sm mr-2">市场情绪:</div>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`rounded-full h-2 ${
              overallSentiment > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(overallSentiment) * 100}%`, marginLeft: overallSentiment < 0 ? 'auto' : 0 }}
          ></div>
        </div>
        <div className="ml-2 text-sm font-medium">
          {overallSentiment > 0.5 ? '非常乐观' : 
           overallSentiment > 0 ? '乐观' :
           overallSentiment > -0.5 ? '担忧' : '非常担忧'}
        </div>
      </div>

      {/* 推文列表 */}
      <div className="flex-1 overflow-auto">
        {displayTweets.length === 0 ? (
          <div className="text-center text-gray-500 p-4">无匹配推文</div>
        ) : (
          <div className="space-y-2">
            {displayTweets.map((tweet) => (
              <div key={tweet.id} className="p-2 border rounded hover:bg-gray-50">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">@{tweet.author}</div>
                  <div className="text-xs text-gray-500">{formatTime(tweet.timestamp)}</div>
                </div>
                <p className="text-sm mb-1">{tweet.text}</p>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center"><span className="mr-1">❤</span>{tweet.likes}</span>
                    <span className="flex items-center"><span className="mr-1">↺</span>{tweet.retweets}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-white text-xs ${getSentimentColor(tweet.sentiment)}`}>
                    {tweet.sentiment > 0 ? '+' : ''}{tweet.sentiment.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitterSentiment; 