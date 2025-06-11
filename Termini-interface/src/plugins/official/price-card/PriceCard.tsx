import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useLayoutStore } from 'store/layoutStore';

interface PriceCardProps {
  config: {
    token: string;
    address: string;
    timeframe: string;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

// 可用代币列表
const availableTokens = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' },
  { symbol: 'BTC', name: 'Bitcoin', address: '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35' },
  { symbol: 'SOL', name: 'Solana', address: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2' },
  { symbol: 'XRP', name: 'Ripple', address: '0x0f35946a0aaca92d09e59aabbf04574a56eba8f8' },
  { symbol: 'DOGE', name: 'Dogecoin', address: '0x8fbb5a97e45fcc257c8c24a5099a925dc8c4b82c' },
  { symbol: 'TRUMP', name: 'Trump', address: '9d9mb8kooffad3sctgztkxqypkshx6ezhbkio89ixyy2' },
];

// 模拟市场数据
const generateMarketData = (token: string) => {
  const basePrice = token === 'ETH' ? 2344.27 :
                   token === 'BTC' ? 47251.38 :
                   token === 'SOL' ? 143.76 :
                   token === 'XRP' ? 0.52 :
                   token === 'DOGE' ? 0.12 : 100;
                   
  const changePercent = Math.random() * 50 - 25;
  const isPositive = changePercent > 0;
  const volume = Math.random() * 10 + 1;
  
  return {
    price: basePrice,
    changePercent: changePercent.toFixed(2),
    isPositive,
    marketCap: (basePrice * (Math.random() * 10 + 100)).toFixed(2) + 'M',
    volume: volume.toFixed(2) + 'M',
    holders: Math.floor(Math.random() * 5000) + 1000,
    buys: {
      count: Math.floor(Math.random() * 500),
      amount: (Math.random() * 500).toFixed(2) + 'k'
    },
    sells: {
      count: Math.floor(Math.random() * 500),
      amount: (Math.random() * 500).toFixed(2) + 'k'
    },
    topHolders: {
      percent100: Math.floor(Math.random() * 50) + '%',
      percent10: Math.floor(Math.random() * 40) + '%'
    },
    liquidity: volume.toFixed(2) + 'M',
    add: Math.floor(Math.random() * 50) + '/' + (Math.random() * 500).toFixed(2) + 'k',
    remove: Math.floor(Math.random() * 50) + '/' + (Math.random() * 500).toFixed(2) + 'k',
  };
};

const PriceCard: FC<PriceCardProps> = ({ config, onConfigChange }) => {
  const { token, address, timeframe } = config;
  const [marketData, setMarketData] = useState<any>(null);
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  
  // 获取全局布局状态的token更新方法
  const updateAllPluginsToken = useLayoutStore(state => state.updateAllPluginsToken);

  useEffect(() => {
    // 模拟加载市场数据
    setMarketData(generateMarketData(token));
    
    // 模拟实时数据更新
    const timer = setInterval(() => {
      setMarketData(generateMarketData(token));
    }, 10000);
    
    return () => clearInterval(timer);
  }, [token]);

  const handleTokenChange = (newToken: string, newAddress: string) => {
    // 更新本插件配置
    onConfigChange({
      ...config,
      token: newToken,
      address: newAddress
    });
    
    // 向所有插件广播新的token信息
    updateAllPluginsToken(newToken, newAddress);
    
    setShowTokenSelect(false);
  };
  
  const handleTimeframeChange = (newTimeframe: string) => {
    onConfigChange({
      ...config,
      timeframe: newTimeframe
    });
  };

  if (!marketData) {
    return <div className="flex items-center justify-center h-full">加载中...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-3">
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setShowTokenSelect(!showTokenSelect)}
          >
            <div className="bg-white rounded-full h-8 w-8 flex items-center justify-center mr-2">
              {token === 'ETH' && (
                <img src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628" alt="ETH" className="h-6 w-6" />
              )}
              {token === 'BTC' && (
                <img src="https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400" alt="BTC" className="h-6 w-6" />
              )}
              {token === 'SOL' && (
                <img src="https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756" alt="SOL" className="h-6 w-6" />
              )}
              {token === 'XRP' && (
                <img src="https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png?1696501442" alt="XRP" className="h-6 w-6" />
              )}
              {token === 'DOGE' && (
                <img src="https://assets.coingecko.com/coins/images/5/standard/dogecoin.png?1696501409" alt="DOGE" className="h-6 w-6" />
              )}
            </div>
            <div>
              <span className="font-bold">{token}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {showTokenSelect && (
            <div className="absolute top-10 left-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 w-48">
              {availableTokens.map((t) => (
                <div 
                  key={t.symbol}
                  className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleTokenChange(t.symbol, t.address)}
                >
                  {/* <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center mr-2">
                    <img 
                      src={`https://cryptologos.cc/logos/${t.name.toLowerCase()}-${t.symbol.toLowerCase()}-logo.png`} 
                      alt={t.symbol} 
                      className="h-5 w-5" 
                    />
                  </div> */}
                  <span>{t.symbol}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold">${marketData.price}</div>
          <div className={marketData.isPositive ? "text-green-500" : "text-red-500"}>
            {marketData.isPositive ? "+" : ""}{marketData.changePercent}% ({timeframe})
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-1">{address}</div>
      
      <div className="flex space-x-2 mb-4">
        <button 
          className={`px-2 py-1 text-xs rounded ${timeframe === '4H' ? 'bg-teal-700 text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => handleTimeframeChange('4H')}
        >
          4H
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded ${timeframe === '1D' ? 'bg-teal-700 text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => handleTimeframeChange('1D')}
        >
          1D
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded ${timeframe === '7D' ? 'bg-teal-700 text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => handleTimeframeChange('7D')}
        >
          7D
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded ${timeframe === '30D' ? 'bg-teal-700 text-white' : 'bg-gray-800 text-gray-400'}`}
          onClick={() => handleTimeframeChange('30D')}
        >
          30D
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Price Range</div>
          <div className="text-sm">$${marketData.price}-$${marketData.price}</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Market Cap</div>
          <div className="text-sm">${marketData.marketCap}</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Volume</div>
          <div className="text-sm">${marketData.volume}</div>
          <div className={`text-xs ${marketData.isPositive ? "text-green-500" : "text-red-500"}`}>
            ▲ {Math.abs(parseInt(marketData.changePercent))}%
          </div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Buys</div>
          <div className="text-sm">{marketData.buys.count}/{marketData.buys.amount}</div>
          <div className="text-xs text-green-500">▲ {Math.abs(parseInt(marketData.changePercent))}%</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Sells</div>
          <div className="text-sm">{marketData.sells.count}/{marketData.sells.amount}</div>
          <div className="text-xs text-red-500">▼ {Math.abs(parseInt(marketData.changePercent))}%</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Holders</div>
          <div className="text-sm">{marketData.holders}</div>
          <div className={`text-xs ${marketData.isPositive ? "text-green-500" : "text-red-500"}`}>
            ▲ {Math.abs(parseInt(marketData.changePercent))}%
          </div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Top 100%</div>
          <div className="text-sm">{marketData.topHolders.percent100}</div>
          <div className={`text-xs ${marketData.isPositive ? "text-green-500" : "text-red-500"}`}>
            ▲ {Math.abs(parseInt(marketData.changePercent))}%
          </div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Top 10%</div>
          <div className="text-sm">{marketData.topHolders.percent10}</div>
          <div className="text-xs text-red-500">▼ {Math.abs(parseInt(marketData.changePercent))}%</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Liquidity</div>
          <div className="text-sm">${marketData.liquidity}</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Add</div>
          <div className="text-sm">{marketData.add}</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-400">Remove</div>
          <div className="text-sm">{marketData.remove}</div>
        </div>
      </div>
    </div>
  );
};

export default PriceCard; 