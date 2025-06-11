import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';

interface OnchainDataProps {
  config: {
    networks: string[];
    minTransactionValue: number;
    refreshInterval: number;
    alertThreshold: number;
    token?: string;
  };
  onConfigChange: (newConfig: Record<string, any>) => void;
}

interface Transaction {
  id: string;
  hash: string;
  network: string;
  fromAddress: string;
  toAddress: string;
  value: number; // 美元价值
  tokenSymbol: string;
  timestamp: string;
  type: 'transfer' | 'swap' | 'contract' | 'mint' | 'burn';
  isWhale: boolean;
}

// 生成模拟钱包地址
const generateAddress = (network: string): string => {
  const chars = '0123456789abcdef';
  let prefix = '0x';
  
  if (network === 'Solana') {
    prefix = '';
  } else if (network === 'BSC') {
    prefix = '0x';
  }
  
  const length = network === 'Solana' ? 32 : 40;
  for (let i = 0; i < length; i++) {
    prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return prefix;
};

// 简化地址显示
const shortenAddress = (address: string): string => {
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// 生成模拟交易数据
const generateTransactions = (
  networks: string[],
  minValue: number,
  alertThreshold: number
): Transaction[] => {
  const tokenSymbols = {
    'Ethereum': ['ETH', 'USDT', 'USDC', 'DAI', 'UNI', 'LINK'],
    'Solana': ['SOL', 'USDC', 'RAY', 'SRM', 'MNGO'],
    'Arbitrum': ['ETH', 'ARB', 'USDC', 'GMX', 'MAGIC'],
    'Optimism': ['ETH', 'OP', 'USDC', 'SNX', 'PERP'],
    'BSC': ['BNB', 'BUSD', 'CAKE', 'XVS', 'BAKE']
  };
  
  const transactionTypes: Array<'transfer' | 'swap' | 'contract' | 'mint' | 'burn'> = [
    'transfer', 'swap', 'contract', 'mint', 'burn'
  ];
  
  // 生成15笔交易
  return Array(15).fill(null).map((_, i) => {
    // 随机选择一个网络
    const network = networks[Math.floor(Math.random() * networks.length)];
    
    // 随机选择一种Token
    const symbols = tokenSymbols[network as keyof typeof tokenSymbols] || ['UNKNOWN'];
    const tokenSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    // 生成交易金额，遵守最小值，并确保有一定比例的大额交易
    const isLarge = Math.random() > 0.7; // 30%的交易为大额
    let value: number;
    
    if (isLarge) {
      // 生成大额交易，介于最小金额和10倍警戒阈值之间
      value = minValue + Math.random() * (alertThreshold * 10 - minValue);
    } else {
      // 生成普通交易，介于最小金额和警戒阈值之间
      value = minValue + Math.random() * (alertThreshold - minValue);
    }
    
    // 生成交易类型
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    
    // 生成地址
    const fromAddress = generateAddress(network);
    const toAddress = generateAddress(network);
    
    // 生成时间戳(过去1小时内)
    const timestamp = new Date(Date.now() - Math.random() * 3600 * 1000).toISOString();
    
    // 确定是否为鲸鱼交易
    const isWhale = value >= alertThreshold;
    
    // 生成交易哈希
    const hash = `0x${Array(64).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    
    return {
      id: `tx-${network}-${i}-${Date.now()}`,
      hash,
      network,
      fromAddress,
      toAddress,
      value,
      tokenSymbol,
      timestamp,
      type,
      isWhale
    };
  });
};

// 获取网络颜色
const getNetworkColor = (network: string): string => {
  switch (network) {
    case 'Ethereum': return 'bg-blue-100 text-blue-800';
    case 'Solana': return 'bg-purple-100 text-purple-800';
    case 'Arbitrum': return 'bg-blue-100 text-blue-800';
    case 'Optimism': return 'bg-red-100 text-red-800';
    case 'BSC': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 获取交易类型图标和颜色
const getTransactionTypeInfo = (type: Transaction['type']): { icon: string, color: string } => {
  switch (type) {
    case 'transfer': return { icon: '↔️', color: 'text-blue-500' };
    case 'swap': return { icon: '🔄', color: 'text-green-500' };
    case 'contract': return { icon: '📝', color: 'text-purple-500' };
    case 'mint': return { icon: '✨', color: 'text-teal-500' };
    case 'burn': return { icon: '🔥', color: 'text-red-500' };
    default: return { icon: '📨', color: 'text-gray-500' };
  }
};

const OnchainData: FC<OnchainDataProps> = ({ config, onConfigChange }) => {
  const { networks, minTransactionValue, refreshInterval, alertThreshold, token } = config;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [showWhaleTxOnly, setShowWhaleTxOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  // 响应token变化，显示相关代币的交易
  useEffect(() => {
    if (token) {
      // 当token变化时生成新的模拟数据
      const tokenSpecificTxs = generateTransactions(networks, minTransactionValue, alertThreshold)
        .filter(tx => tx.tokenSymbol === token)
        .concat(generateTransactions(['ETH', 'SOL', 'BSC'], minTransactionValue, alertThreshold)
          .map(tx => ({...tx, tokenSymbol: token}))
          .slice(0, 5)
        );
      
      if (tokenSpecificTxs.length > 0) {
        setTransactions(tokenSpecificTxs);
      }
    }
  }, [token, networks, minTransactionValue, alertThreshold]);
  
  // 加载交易数据 - 使用useRef防止频繁触发
  const configRef = useRef({networks, minTransactionValue, refreshInterval, alertThreshold});
  
  useEffect(() => {
    // 更新ref以反映最新配置
    configRef.current = {networks, minTransactionValue, refreshInterval, alertThreshold};
  }, [networks, minTransactionValue, refreshInterval, alertThreshold]);
  
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    const loadingTimeout = setTimeout(() => {
      const txs = generateTransactions(configRef.current.networks, configRef.current.minTransactionValue, configRef.current.alertThreshold);
      setTransactions(txs);
      setIsLoading(false);
      setLastUpdateTime(Date.now());
    }, 600);
    
    // 设置定时刷新
    const interval = setInterval(() => {
      const newTxs = generateTransactions(
        configRef.current.networks, 
        configRef.current.minTransactionValue, 
        configRef.current.alertThreshold
      );
      // 将新交易添加到列表前面，保持最多50笔交易
      setTransactions(prev => [...newTxs, ...prev].slice(0, 50));
      setLastUpdateTime(Date.now());
    }, refreshInterval * 1000);
    
    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(interval);
    };
  }, [lastUpdateTime, refreshInterval]); // 依赖lastUpdateTime确保数据刷新
  
  // 筛选交易
  const filteredTransactions = transactions.filter(tx => {
    if (activeNetwork && tx.network !== activeNetwork) return false;
    if (showWhaleTxOnly && !tx.isWhale) return false;
    return true;
  });
  
  // 格式化金额
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };
  
  // 格式化时间
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}秒前`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}分钟前`;
    } else {
      return `${Math.floor(diffSeconds / 3600)}小时前`;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* 控制面板 */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">链上大额交易监控</div>
          <div>
            <label className="flex items-center text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={showWhaleTxOnly} 
                onChange={() => setShowWhaleTxOnly(!showWhaleTxOnly)} 
                className="mr-1 h-3 w-3"
              />
              仅显示鲸鱼交易 (≥${alertThreshold.toLocaleString()})
            </label>
          </div>
        </div>
        
        {/* 网络筛选 */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            className={`px-2 py-0.5 rounded-full ${
              activeNetwork === null ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setActiveNetwork(null)}
          >
            全部网络
          </button>
          {networks.map(network => (
            <button
              key={network}
              className={`px-2 py-0.5 rounded-full ${
                activeNetwork === network ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setActiveNetwork(network === activeNetwork ? null : network)}
            >
              {network}
            </button>
          ))}
        </div>
        
        {/* 交易值筛选 */}
        <div className="flex items-center text-xs">
          <span className="mr-2">最小交易额:</span>
          <input 
            type="range" 
            min={10000} 
            max={1000000} 
            step={10000}
            value={minTransactionValue}
            onChange={e => onConfigChange({ ...config, minTransactionValue: Number(e.target.value) })}
            className="w-24 h-1.5 mr-2"
          />
          <span>${minTransactionValue.toLocaleString()}</span>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            加载交易数据...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            没有符合筛选条件的交易
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(tx => {
              const typeInfo = getTransactionTypeInfo(tx.type);
              return (
                <div key={tx.id} className="p-3 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getNetworkColor(tx.network)}`}>
                        {tx.network}
                      </span>
                      <span className={`text-xs ${typeInfo.color}`}>
                        {typeInfo.icon} {tx.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(tx.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-600 overflow-hidden">
                      <div className="truncate">
                        <span className="font-medium">From:</span> {shortenAddress(tx.fromAddress)}
                      </div>
                      <div className="truncate">
                        <span className="font-medium">To:</span> {shortenAddress(tx.toAddress)}
                      </div>
                    </div>
                    <div className={`text-right ${tx.isWhale ? 'text-red-600 font-bold' : ''}`}>
                      <div className="text-sm">{formatValue(tx.value)}</div>
                      <div className="text-xs">{tx.tokenSymbol}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate">
                    <span className="font-medium">Tx:</span> {tx.hash}
                  </div>
                  
                  {tx.isWhale && (
                    <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded-sm text-xs text-red-600 flex items-center">
                      <span className="mr-1">🐋</span>
                      <span>鲸鱼活动警报: 大额交易</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnchainData; 