import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface TradingChartProps {
  config: {
    symbol: string;
    interval: string;
    theme: string;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  close: number;
  low: number;
  volume: number;
}

// 生成模拟K线数据
const generateCandleData = (symbol: string, count: number): Candle[] => {
  const candles: Candle[] = [];
  let basePrice = symbol.includes('BTC') ? 30000 : 
                symbol.includes('ETH') ? 1800 : 
                symbol.includes('SOL') ? 80 : 100;
  
  // 开始时间为7天前
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 7);
  
  let lastClose = basePrice;
  const volatility = basePrice * 0.02; // 2%波动率
  
  for (let i = 0; i < count; i++) {
    // 为每根K线生成随机价格
    const open = lastClose;
    const change = (Math.random() - 0.5) * volatility;
    const close = Math.max(0, open + change);
    const high = Math.max(open, close) + Math.random() * Math.abs(open - close);
    const low = Math.min(open, close) - Math.random() * Math.abs(open - close);
    const volume = Math.random() * basePrice * 5;
    
    // 计算时间戳，每次递增1小时
    const timestamp = new Date(startTime.getTime() + i * 60 * 60 * 1000).getTime() / 1000;
    
    candles.push({
      time: timestamp,
      open,
      high,
      close,
      low,
      volume
    });
    
    lastClose = close;
  }
  
  return candles;
};

// 获取时间间隔对应的毫秒数
const getIntervalMs = (interval: string): number => {
  switch (interval) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1D': return 24 * 60 * 60 * 1000;
    case '1W': return 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
};

const TradingChart: FC<TradingChartProps> = ({ config, onConfigChange }) => {
  const { symbol, interval, theme } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [chartScale, setChartScale] = useState(1);
  const [chartOffset, setChartOffset] = useState(0);

  // 加载K线数据
  useEffect(() => {
    setIsLoading(true);
    // 模拟API加载延迟
    setTimeout(() => {
      const newCandles = generateCandleData(symbol, 168); // 一周的小时K线
      setCandles(newCandles);
      setIsLoading(false);
      setChartOffset(0);
      setChartScale(1);
    }, 500);
  }, [symbol]);

  // 处理画布尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        setChartDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 绘制图表
  useEffect(() => {
    if (!canvasRef.current || candles.length === 0 || isLoading) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = chartDimensions;
    const padding = { top: 20, right: 10, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // 计算要显示的蜡烛数量，基于缩放级别
    const visibleCandles = Math.floor(candles.length / chartScale);
    const startIdx = Math.max(0, candles.length - visibleCandles - chartOffset);
    const endIdx = Math.min(candles.length, startIdx + visibleCandles);
    const displayCandles = candles.slice(startIdx, endIdx);
    
    // 找出价格范围
    let minPrice = Math.min(...displayCandles.map(c => c.low));
    let maxPrice = Math.max(...displayCandles.map(c => c.high));
    
    // 扩大范围以便留出边距
    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 设置背景
    ctx.fillStyle = theme === 'Dark' ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制网格线和标签
    ctx.strokeStyle = theme === 'Dark' ? '#333333' : '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // 水平网格线（价格）
    const priceStep = (maxPrice - minPrice) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + priceStep * i;
      const y = padding.top + chartHeight - (price - minPrice) / (maxPrice - minPrice) * chartHeight;
      
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      
      // 价格标签
      ctx.fillStyle = theme === 'Dark' ? '#bbbbbb' : '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding.left - 5, y + 3);
    }
    
    // 垂直网格线（时间）
    const timeStep = Math.max(Math.floor(displayCandles.length / 6), 1);
    for (let i = 0; i < displayCandles.length; i += timeStep) {
      const candle = displayCandles[i];
      const x = padding.left + (i / displayCandles.length) * chartWidth;
      
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      
      // 时间标签
      const date = new Date(candle.time * 1000);
      ctx.fillStyle = theme === 'Dark' ? '#bbbbbb' : '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(date.toLocaleDateString(), x, height - padding.bottom + 15);
    }
    
    ctx.stroke();
    
    // 绘制蜡烛图
    const candleWidth = chartWidth / displayCandles.length * 0.8;
    
    displayCandles.forEach((candle, i) => {
      const x = padding.left + (i / displayCandles.length) * chartWidth;
      
      const openY = padding.top + chartHeight - (candle.open - minPrice) / (maxPrice - minPrice) * chartHeight;
      const closeY = padding.top + chartHeight - (candle.close - minPrice) / (maxPrice - minPrice) * chartHeight;
      const highY = padding.top + chartHeight - (candle.high - minPrice) / (maxPrice - minPrice) * chartHeight;
      const lowY = padding.top + chartHeight - (candle.low - minPrice) / (maxPrice - minPrice) * chartHeight;
      
      // 蜡烛线
      ctx.strokeStyle = candle.close >= candle.open ? 
        (theme === 'Dark' ? '#26a69a' : '#26a69a') : 
        (theme === 'Dark' ? '#ef5350' : '#ef5350');
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // 蜡烛实体
      const candleColor = candle.close >= candle.open ? 
        (theme === 'Dark' ? '#26a69a' : '#26a69a') : 
        (theme === 'Dark' ? '#ef5350' : '#ef5350');
      
      ctx.fillStyle = candleColor;
      ctx.fillRect(
        x - candleWidth / 2,
        Math.min(openY, closeY),
        candleWidth,
        Math.abs(closeY - openY) || 1 // 最小高度为1
      );
    });
    
    // 绘制当前价格
    const lastCandle = candles[candles.length - 1];
    const currentPrice = lastCandle.close;
    const currentPriceY = padding.top + chartHeight - (currentPrice - minPrice) / (maxPrice - minPrice) * chartHeight;
    
    ctx.strokeStyle = theme === 'Dark' ? '#2196f3' : '#2196f3';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentPriceY);
    ctx.lineTo(width - padding.right, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 绘制价格标签
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(width - padding.right, currentPriceY - 10, padding.right, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(2), width - padding.right / 2, currentPriceY + 4);

  }, [candles, chartDimensions, chartScale, chartOffset, theme, isLoading]);

  // 处理平移和缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // 缩放
      e.preventDefault();
      const newScale = Math.max(1, Math.min(10, chartScale + (e.deltaY > 0 ? 0.1 : -0.1)));
      setChartScale(newScale);
    } else {
      // 平移
      const newOffset = Math.max(0, chartOffset + (e.deltaY > 0 ? -5 : 5));
      setChartOffset(newOffset);
    }
  };
  
  const timeframeOptions = [
    { value: '1m', label: '1分钟' },
    { value: '5m', label: '5分钟' },
    { value: '15m', label: '15分钟' },
    { value: '1h', label: '1小时' },
    { value: '4h', label: '4小时' },
    { value: '1D', label: '日线' },
    { value: '1W', label: '周线' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 头部控制区域 */}
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">{symbol}</span>
          <span className="text-xs ml-2 px-2 py-0.5 bg-gray-200 rounded">
            {timeframeOptions.find(opt => opt.value === interval)?.label || interval}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={interval}
            onChange={(e) => onConfigChange({ ...config, interval: e.target.value })}
            className="text-xs border rounded px-2 py-1"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={theme}
            onChange={(e) => onConfigChange({ ...config, theme: e.target.value })}
            className="text-xs border rounded px-2 py-1"
          >
            <option value="Light">浅色</option>
            <option value="Dark">深色</option>
          </select>
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-gray-500">加载图表数据...</div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onWheel={handleWheel}
          />
        )}
      </div>
    </div>
  );
};

export default TradingChart; 