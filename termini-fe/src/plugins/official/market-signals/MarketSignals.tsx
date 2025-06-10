import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface MarketSignalsProps {
  config: {
    symbols: string[];
    timeframe: string;
    signalThreshold: number;
    token?: string; // 支持token配置
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface Signal {
  symbol: string;
  indicator: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  timestamp: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  signals: Signal[];
  overallSignal: 'buy' | 'sell' | 'neutral';
  overallStrength: number;
}

// 技术指标名称
const indicators = ['RSI', 'MACD', 'MA交叉', 'Bollinger带', '成交量', '动量', '趋势强度', 'ADX'];

// 生成模拟市场数据
const generateMarketData = (symbols: string[], threshold: number): MarketData[] => {
  return symbols.map(symbol => {
    // 随机价格和24小时变化
    const price = symbol.includes('BTC') ? 30000 + Math.random() * 5000 :
                  symbol.includes('ETH') ? 1800 + Math.random() * 300 :
                  symbol.includes('SOL') ? 80 + Math.random() * 20 :
                  symbol.includes('BNB') ? 300 + Math.random() * 50 : 
                  1 + Math.random() * 10;
    
    const change24h = -5 + Math.random() * 10;
    
    // 为每个指标生成信号
    const signals = indicators.map(indicator => {
      const strength = Math.floor(Math.random() * 100);
      let signal: 'buy' | 'sell' | 'neutral';
      
      if (strength > threshold) {
        signal = 'buy';
      } else if (strength < (100 - threshold)) {
        signal = 'sell';
      } else {
        signal = 'neutral';
      }
      
      return {
        symbol,
        indicator,
        value: Math.random() * 100,
        signal,
        strength,
        timestamp: new Date().toISOString()
      };
    });
    
    // 计算综合信号
    const buySignals = signals.filter(s => s.signal === 'buy').length;
    const sellSignals = signals.filter(s => s.signal === 'sell').length;
    const neutralSignals = signals.filter(s => s.signal === 'neutral').length;
    
    let overallSignal: 'buy' | 'sell' | 'neutral';
    if (buySignals > sellSignals && buySignals > neutralSignals) {
      overallSignal = 'buy';
    } else if (sellSignals > buySignals && sellSignals > neutralSignals) {
      overallSignal = 'sell';
    } else {
      overallSignal = 'neutral';
    }
    
    // 计算综合强度
    const overallStrength = signals.reduce((sum, s) => {
      if (s.signal === 'buy') return sum + s.strength;
      if (s.signal === 'sell') return sum - s.strength;
      return sum;
    }, 0) / signals.length;
    
    return {
      symbol,
      price,
      change24h,
      signals,
      overallSignal,
      overallStrength: Math.abs(overallStrength)
    };
  });
};

const MarketSignals: FC<MarketSignalsProps> = ({ config, onConfigChange }) => {
  const { symbols, timeframe, signalThreshold, token } = config;
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  // 处理token变更
  useEffect(() => {
    // 如果有token配置，并且当前symbols中没有这个token的交易对
    if (token && !symbols.some(s => s.includes(token))) {
      // 添加token的交易对
      const newSymbol = `${token}USDT`;
      const newSymbols = [...symbols.filter(s => !s.includes(selectedSymbol || '')), newSymbol];
      
      // 更新配置
      onConfigChange({
        ...config,
        symbols: newSymbols
      });
      
      // 设置为当前选中的symbol
      setSelectedSymbol(newSymbol);
    }
  }, [token, symbols, config, onConfigChange, selectedSymbol]);
  
  // 初始化并定期更新数据
  useEffect(() => {
    // 避免频繁更新
    const now = Date.now();
    if (now - lastUpdateTime < 5000) {
      return;
    }
    
    const updateData = () => {
      const newData = generateMarketData(symbols, signalThreshold);
      setMarketData(newData);
      setLastUpdateTime(Date.now());
      
      // 如果没有选中任何币种，或者选中的币种不在列表中，则选择第一个
      if ((!selectedSymbol && newData.length > 0) || 
          (selectedSymbol && !newData.some(d => d.symbol === selectedSymbol))) {
        setSelectedSymbol(newData[0].symbol);
      }
    };
    
    // 立即更新一次
    updateData();
    
    // 设置定时更新
    const interval = setInterval(updateData, 30000);
    
    return () => clearInterval(interval);
  }, [symbols, signalThreshold, selectedSymbol, lastUpdateTime]);
  
  // 获取当前选中的币种数据
  const selectedData = selectedSymbol
    ? marketData.find(d => d.symbol === selectedSymbol)
    : marketData[0];

  // 获取信号颜色
  const getSignalColor = (signal: 'buy' | 'sell' | 'neutral') => {
    if (signal === 'buy') return 'text-green-500';
    if (signal === 'sell') return 'text-red-500';
    return 'text-gray-500';
  };

  // 获取信号背景色
  const getSignalBgColor = (signal: 'buy' | 'sell' | 'neutral') => {
    if (signal === 'buy') return 'bg-green-100';
    if (signal === 'sell') return 'bg-red-100';
    return 'bg-gray-100';
  };

  // 获取强度条的宽度和颜色
  const getStrengthBarStyle = (strength: number, signal: 'buy' | 'sell' | 'neutral') => {
    const width = `${strength}%`;
    let bgColor = 'bg-gray-300';
    if (signal === 'buy') bgColor = 'bg-green-500';
    if (signal === 'sell') bgColor = 'bg-red-500';
    
    return { width, backgroundColor: bgColor };
  };
  
  if (marketData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        加载市场数据...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部控制区 */}
      <div className="mb-3 flex justify-between items-center">
        <div className="font-medium">市场信号 ({timeframe})</div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedSymbol || ''}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {marketData.map(data => (
              <option key={data.symbol} value={data.symbol}>{data.symbol}</option>
            ))}
          </select>
          <select
            value={timeframe}
            onChange={(e) => onConfigChange({ ...config, timeframe: e.target.value })}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="15m">15分钟</option>
            <option value="1h">1小时</option>
            <option value="4h">4小时</option>
            <option value="1d">日线</option>
          </select>
        </div>
      </div>

      {selectedData && (
        <>
          {/* 价格和整体信号 */}
          <div className="mb-4 p-3 rounded border flex justify-between items-center">
            <div>
              <div className="text-xl font-bold">${selectedData.price.toFixed(2)}</div>
              <div className={`text-sm ${selectedData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {selectedData.change24h >= 0 ? '+' : ''}{selectedData.change24h.toFixed(2)}%
              </div>
            </div>
            <div className={`text-center p-2 rounded ${getSignalBgColor(selectedData.overallSignal)}`}>
              <div className={`text-lg font-bold ${getSignalColor(selectedData.overallSignal)}`}>
                {selectedData.overallSignal === 'buy' ? '买入' : 
                 selectedData.overallSignal === 'sell' ? '卖出' : '中性'}
              </div>
              <div className="text-xs mt-1">
                信号强度: {selectedData.overallStrength.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* 指标信号列表 */}
          <div className="flex-1 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 text-left pl-3">指标</th>
                  <th className="py-2 text-center">信号</th>
                  <th className="py-2 text-right pr-3">强度</th>
                </tr>
              </thead>
              <tbody>
                {selectedData.signals.map((signal, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 pl-3">{signal.indicator}</td>
                    <td className={`py-2 text-center ${getSignalColor(signal.signal)}`}>
                      {signal.signal === 'buy' ? '买入' : 
                       signal.signal === 'sell' ? '卖出' : '中性'}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center justify-end">
                        <div className="mr-2">{signal.strength}%</div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={getStrengthBarStyle(signal.strength, signal.signal)}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketSignals; 