import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface OrderBookProps {
  config: {
    symbol: string;
    depth: number;
    token?: string;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface OrderItem {
  price: number;
  amount: number;
  total: number;
  percent: number;
}

// 生成模拟订单数据
const generateMockOrders = (basePrice: number, depth: number, side: 'buy' | 'sell'): OrderItem[] => {
  const orders: OrderItem[] = [];
  const volatility = basePrice * 0.0005; // 每档价格波动

  for (let i = 0; i < depth; i++) {
    // 买单从基准价向下，卖单从基准价向上
    const offset = side === 'buy' ? -1 : 1;
    const price = basePrice + (offset * i * volatility * (1 + Math.random() * 0.5));
    const amount = 0.1 + Math.random() * 2; // 随机生成数量
    
    orders.push({
      price,
      amount,
      total: price * amount,
      percent: 0 // 先初始化为0，后面再计算
    });
  }

  // 计算总量用于百分比
  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
  
  // 计算每个订单的百分比
  return orders.map(order => ({
    ...order,
    percent: (order.amount / totalAmount) * 100
  }));
};

const OrderBook: FC<OrderBookProps> = ({ config, onConfigChange }) => {
  const { symbol, depth } = config;
  const [buyOrders, setBuyOrders] = useState<OrderItem[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderItem[]>([]);
  const [basePrice, setBasePrice] = useState(20000 + Math.random() * 10000);

  // 监听token变化，更新显示的币对名称
  useEffect(() => {
    if (config.token && symbol && !symbol.includes(config.token)) {
      // 当token变化时更新symbol
      onConfigChange({
        ...config,
        symbol: `${config.token}USDT`
      });
    }
  }, [config.token, symbol, onConfigChange, config]);

  useEffect(() => {
    // 初始生成订单数据
    const updateOrders = () => {
      // 不使用之前的basePrice，而是每次重新生成一个价格
      const currentPrice = basePrice + (Math.random() * 200 - 100);
      setBasePrice(currentPrice);
      
      // 生成买卖订单
      setBuyOrders(generateMockOrders(currentPrice, depth, 'buy').sort((a, b) => b.price - a.price));
      setSellOrders(generateMockOrders(currentPrice, depth, 'sell').sort((a, b) => a.price - b.price));
    };
    
    // 首次执行
    updateOrders();
    
    // 模拟实时更新
    const timer = setInterval(updateOrders, 5000);
    return () => clearInterval(timer);
  }, [depth]); // 只依赖depth，移除basePrice依赖
  
  // 格式化价格显示
  const formatPrice = (price: number) => price.toFixed(2);
  const formatAmount = (amount: number) => amount.toFixed(4);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex justify-between items-center">
        <div className="font-medium">{symbol} 订单簿</div>
        <div>
          <select
            value={depth}
            onChange={(e) => onConfigChange({ ...config, depth: Number(e.target.value) })}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="5">深度 5</option>
            <option value="10">深度 10</option>
            <option value="15">深度 15</option>
            <option value="20">深度 20</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 卖单区域 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 bg-gray-50">
                <th className="py-1 text-left pl-2">价格(USDT)</th>
                <th className="py-1 text-right">数量(BTC)</th>
                <th className="py-1 text-right pr-2">总额(USDT)</th>
              </tr>
            </thead>
            <tbody>
              {sellOrders.map((order, index) => (
                <tr key={`sell-${index}`} className="hover:bg-gray-50">
                  <td className="py-1 text-red-500 pl-2">
                    {formatPrice(order.price)}
                  </td>
                  <td className="py-1 text-right">{formatAmount(order.amount)}</td>
                  <td className="py-1 text-right pr-2 relative">
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-red-100" 
                      style={{ width: `${order.percent}%`, maxWidth: '100%', zIndex: -1 }} 
                    />
                    {order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 当前价格 */}
        <div className="py-2 text-center font-bold border-y border-gray-200">
          {formatPrice(basePrice)}
        </div>
        
        {/* 买单区域 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <tbody>
              {buyOrders.map((order, index) => (
                <tr key={`buy-${index}`} className="hover:bg-gray-50">
                  <td className="py-1 text-green-500 pl-2">
                    {formatPrice(order.price)}
                  </td>
                  <td className="py-1 text-right">{formatAmount(order.amount)}</td>
                  <td className="py-1 text-right pr-2 relative">
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-green-100" 
                      style={{ width: `${order.percent}%`, maxWidth: '100%', zIndex: -1 }} 
                    />
                    {order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook; 