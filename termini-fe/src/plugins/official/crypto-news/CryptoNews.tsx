import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface CryptoNewsProps {
  config: {
    sources: string[];
    refreshInterval: number;
    categories: string[];
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  isAlpha: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
}

// 生成模拟新闻数据
const generateNewsItems = (sources: string[], categories: string[]): NewsItem[] => {
  const newsTemplates = [
    '币圈巨鲸在交易所转移价值$VALUE百万美元的$COIN',
    '$PROJECT宣布与$PARTNER达成合作，将共同开发$TECH技术',
    '$PERSON表示$COIN可能在下一轮牛市中达到$PRICE美元',
    '$EXCHANGE交易所宣布上线$COIN代币',
    '分析师：$COIN的价格走势表明即将$TREND',
    '$PROJECT即将进行重大协议升级，关注$FEATURE新功能',
    '美国SEC对$PROJECT发起新一轮监管调查',
    '$COUNTRY政府公布加密货币新监管框架',
    '$VC宣布成立$VALUE亿美元的Web3基金',
    '$COIN测试网上线，$FEATURE功能备受期待',
    '$PROJECT代币价格在24小时内飙升$PERCENT%'
  ];
  
  const coins = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT'];
  const projects = ['以太坊', '索拉纳', 'Polygon', 'Uniswap', 'Aave', 'Compound', 'Arbitrum', 'Optimism', 'Lido', 'Curve'];
  const persons = ['Vitalik Buterin', 'SBF', 'CZ', '赵长鹏', 'Gary Gensler', 'Michael Saylor', 'Arthur Hayes', '孙宇晨'];
  const exchanges = ['币安', 'Coinbase', 'OKX', 'Bybit', 'Kraken', 'KuCoin', 'Huobi', 'Gate.io'];
  const trends = ['大幅上涨', '突破阻力位', '开始新一轮积累', '形成看涨模式', '继续下跌', '触底反弹'];
  const features = ['零知识证明', '跨链互操作性', 'Layer2扩展', '质押奖励', 'DAO治理', 'MEV保护'];
  const partners = ['微软', '谷歌', 'JPMorgan', '万事达卡', '高盛', 'PayPal', '特斯拉', '三星'];
  const techs = ['Web3', '区块链', 'DeFi', '元宇宙', 'NFT', 'ZK技术', '人工智能'];
  const countries = ['美国', '欧盟', '新加坡', '日本', '迪拜', '韩国', '英国', '瑞士'];
  const vcs = ['a16z', 'Paradigm', 'Sequoia', 'Pantera Capital', 'Galaxy Digital', '三箭资本', 'Polychain'];
  
  const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
  const getRandomDate = () => {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 在过去一周内
    return past.toISOString();
  };
  
  // 生成30条新闻
  return Array(30).fill(null).map((_, i) => {
    const source = getRandomElement(sources);
    const category = getRandomElement(categories);
    const template = getRandomElement(newsTemplates);
    
    let title = template
      .replace('$COIN', getRandomElement(coins))
      .replace('$PROJECT', getRandomElement(projects))
      .replace('$PERSON', getRandomElement(persons))
      .replace('$EXCHANGE', getRandomElement(exchanges))
      .replace('$TREND', getRandomElement(trends))
      .replace('$FEATURE', getRandomElement(features))
      .replace('$PARTNER', getRandomElement(partners))
      .replace('$TECH', getRandomElement(techs))
      .replace('$COUNTRY', getRandomElement(countries))
      .replace('$VC', getRandomElement(vcs))
      .replace('$VALUE', getRandomNumber(1, 500).toString())
      .replace('$PRICE', (getRandomNumber(1000, 100000) / 100).toString())
      .replace('$PERCENT', getRandomNumber(5, 75).toString());
    
    // 生成一个简短摘要
    const summary = `${title}。该消息可能对市场产生${Math.random() > 0.5 ? '积极' : '负面'}影响，投资者应密切关注后续发展。`;
    
    // 随机分配情绪
    const sentiments: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];
    const sentiment = getRandomElement(sentiments) as 'positive' | 'neutral' | 'negative';
    
    // 是否为Alpha
    const isAlpha = Math.random() > 0.7;
    
    // 生成随机标签
    const allTags = [...coins, ...projects, category, 'Crypto', 'Blockchain', '市场', '投资'];
    const tags = Array(getRandomNumber(2, 5)).fill(null).map(() => getRandomElement(allTags));
    
    // 确保标签是唯一的
    const uniqueTags = Array.from(new Set(tags));
    
    return {
      id: `news-${i}-${Date.now()}`,
      title,
      summary,
      source,
      url: `https://example.com/news/${i}`,
      publishedAt: getRandomDate(),
      category,
      isAlpha,
      sentiment,
      tags: uniqueTags
    };
  });
};

const CryptoNews: FC<CryptoNewsProps> = ({ config, onConfigChange }) => {
  const { sources, refreshInterval, categories } = config;
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [showAlphaOnly, setShowAlphaOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 加载新闻数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const news = generateNewsItems(sources, categories);
      setNewsItems(news);
      setIsLoading(false);
    }, 800);
    
    // 设置定时刷新
    const interval = setInterval(() => {
      const news = generateNewsItems(sources, categories);
      setNewsItems(prev => [...news, ...prev].slice(0, 50)); // 保持最多50条新闻
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [sources, categories, refreshInterval]);
  
  // 筛选新闻
  const filteredNews = newsItems.filter(news => {
    if (activeCategory && news.category !== activeCategory) return false;
    if (activeSource && news.source !== activeSource) return false;
    if (showAlphaOnly && !news.isAlpha) return false;
    return true;
  });
  
  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取情绪颜色
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentiment === 'positive') return 'text-green-500';
    if (sentiment === 'negative') return 'text-red-500';
    return 'text-gray-500';
  };
  
  // 获取来源图标
  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'CoinDesk': return '📰';
      case 'Cointelegraph': return '📊';
      case 'The Block': return '🧩';
      case 'Decrypt': return '🔍';
      case 'CoinMarketCap': return '📈';
      default: return '📄';
    }
  };
  
  // 模拟打开新闻链接
  const openNewsLink = (url: string) => {
    // 在实际应用中，可以使用window.open或路由导航
    console.log(`Opening news URL: ${url}`);
    // window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 过滤器区域 */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">加密新闻与Alpha源</div>
          <div>
            <label className="flex items-center text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={showAlphaOnly} 
                onChange={() => setShowAlphaOnly(!showAlphaOnly)} 
                className="mr-1 h-3 w-3"
              />
              仅显示Alpha
            </label>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            className={`px-2 py-0.5 rounded-full ${activeCategory === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory(null)}
          >
            全部分类
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                activeCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setActiveCategory(category === activeCategory ? null : category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 来源筛选 */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            className={`px-2 py-0.5 rounded-full ${activeSource === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveSource(null)}
          >
            全部来源
          </button>
          {sources.map(source => (
            <button
              key={source}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                activeSource === source ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setActiveSource(source === activeSource ? null : source)}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* 新闻列表 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            加载新闻中...
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            没有符合筛选条件的新闻
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNews.map(news => (
              <div 
                key={news.id} 
                className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => openNewsLink(news.url)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center">
                    <span className="mr-1 text-lg">{getSourceIcon(news.source)}</span>
                    <span className="text-xs text-gray-500">{news.source}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">{formatDate(news.publishedAt)}</span>
                    {news.isAlpha && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-800 rounded-full font-medium">
                        ALPHA
                      </span>
                    )}
                  </div>
                </div>

                <h3 className={`font-medium text-sm mb-1 ${getSentimentColor(news.sentiment)}`}>
                  {news.title}
                </h3>

                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {news.summary}
                </p>

                <div className="flex flex-wrap gap-1">
                  {news.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoNews; 