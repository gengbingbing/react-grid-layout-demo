import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { BasePluginConfig } from '../../types';
import { useLayoutStore } from 'store/layoutStore';

// 使用Record<string, any>类型，确保与Plugin类型定义兼容
interface PriceChartProps {
  config: Record<string, any> & BasePluginConfig;
  onConfigChange: (newConfig: Record<string, any>) => void;
}

const PriceChart: FC<PriceChartProps> = ({ config, onConfigChange }) => {
  const { 
    name = 'ETH/USDC', 
    symbol = 'ETH', 
    chain = 'bsc',
    address = '0x62fcb3c1794fb95bd8b1a97f6ad5d8a7e4943a1e',
    pairAddress = '0x62fcb3c1794fb95bd8b1a97f6ad5d8a7e4943a1e',
    // 从Token选择组件接收的token信息
    token,
    tokenAddress,
    // 额外从Token选择组件接收的交易对信息
    tokenPair,
    tokenChain,
    tokenPairAddress
  } = config;
  
  // 获取全局token更新时间戳，用于检测token变化
  const tokenUpdateTimestamp = useLayoutStore(state => state._lastTokenUpdate);
  
  // 默认的DexScreener URL或使用配置的交易对信息
  const [chartUrl, setChartUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | undefined>(token);
  
  // 监听来自全局状态的token更新
  useEffect(() => {
    if (tokenUpdateTimestamp) {
      // 获取全局配置中的token信息
      const globalToken = token;
      const globalTokenAddress = tokenAddress;
      
      console.log('检测到全局Token更新:', globalToken, globalTokenAddress);
      
      // 如果token发生变化，更新组件配置
      if (globalToken && globalToken !== currentToken) {
        setCurrentToken(globalToken);
        
        // 获取chain和交易对信息，优先使用与token关联的特定数据
        // 这里可以根据token查询合适的链和交易对地址
        const tokenInfo = getTokenInfo(globalToken, globalTokenAddress);
        
        onConfigChange({
          ...config,
          token: globalToken,
          tokenAddress: globalTokenAddress,
          // 设置交易对显示名称
          name: `${globalToken}/USDC`,
          // 使用token本身作为符号
          symbol: globalToken,
          // 设置链名称（可根据token自动选择）
          chain: tokenInfo.chain,
          // 设置特定的交易对地址
          pairAddress: tokenInfo.pairAddress || globalTokenAddress
        });
      }
    }
  }, [tokenUpdateTimestamp, token, tokenAddress, currentToken, config, onConfigChange]);
  
  // 根据当前配置更新图表URL
  useEffect(() => {
    // 使用当前最新的配置构建URL
    const currentChain = tokenChain || chain;
    const currentPairAddress = tokenPairAddress || pairAddress;
    
    let url = '';
    
    // DexScreener嵌入URL格式
    if (currentPairAddress && currentChain) {
      // 使用正确的嵌入格式，可以是：1. 直接交易对页面 2. 嵌入式iframe URL
      url = `https://dexscreener.com/${currentChain}/${currentPairAddress}?embed=1&theme=dark&trades=0&info=0`;
    } else if (token) {
      // 使用token符号搜索
      url = `https://dexscreener.com/search?q=${token}&embed=1&theme=dark&trades=0&info=0`;
    }
    
    console.log('更新图表URL:', url);
    setChartUrl(url);
    setIsLoading(false);
  }, [chain, pairAddress, token, tokenChain, tokenPairAddress]);
  
  // 根据token获取推荐的链和交易对信息
  const getTokenInfo = (tokenSymbol: string, tokenAddr: string | undefined) => {
    // 这个函数会根据token符号返回推荐的链和交易对地址
    // 实际项目中可以从API获取，或者维护一个更全面的映射表
    
    // 返回结构
    return {
      chain: getRecommendedChain(tokenSymbol),
      pairAddress: getRecommendedPair(tokenSymbol, tokenAddr)
    };
  };
  
  // 根据token获取推荐的链
  const getRecommendedChain = (tokenSymbol: string) => {
    // 常见代币的默认链
    switch(tokenSymbol.toUpperCase()) {
      case 'ETH':
      case 'WETH':
        return 'ethereum';
      case 'BTC':
      case 'WBTC':  
        return 'ethereum'; // WBTC在以太坊上
      case 'BNB':
      case 'CAKE':
        return 'bsc';
      case 'SOL':
        return 'solana';
      case 'MATIC':
        return 'polygon';
      case 'AVAX':
        return 'avalanche';
      case 'FTM':
        return 'fantom';
      case 'TRUMP':
        return 'meteora';
      default:
        // 默认使用以太坊
        return 'ethereum';
    }
  };
  
  // 根据token获取推荐的交易对地址
  const getRecommendedPair = (tokenSymbol: string, tokenAddr: string | undefined) => {
    // 如果有提供特定的token地址，优先使用
    if (tokenAddr && tokenAddr.startsWith('0x')) {
      return tokenAddr;
    }
    
    // 真实的DexScreener交易对地址
    switch(tokenSymbol.toUpperCase()) {
      case 'ETH':
      case 'WETH':
        // ETH/USDC在Uniswap V3上的交易对
        return '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';
      case 'BTC':
      case 'WBTC':
        // WBTC/USDC在Uniswap V3上的交易对
        return '0x99ac8ca7087fa4a2a1fb6357269965a2014abc35';
      case 'SOL':
        // SOL/USDC在Raydium上的交易对
        return '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2';
      case 'BNB':
        // BNB/USDC在PancakeSwap V3上的交易对
        return '0x28f2308d89446de4037b68347c2b52111ce9ae17';
      case 'XRP':
        // XRP/USDC在Uniswap V3上的交易对
        return '0x0f35946a0aaca92d09e59aabbf04574a56eba8f8';
      case 'DOGE':
        // DOGE/USDC在PancakeSwap V3上的交易对
        return '0x8fbb5a97e45fcc257c8c24a5099a925dc8c4b82c';
      case 'MATIC':
        // MATIC/USDC在QuickSwap上的交易对
        return '0x6e7a5fafcec6bb1e78bae2a1f0b612012bf14827';
      case 'TRUMP':
        return '0x446bc0ffb0827ffedc08f5f2fdcdfb68d9664fc1';
      default:
        return '';
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-gray-900 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">加载价格数据...</p>
          </div>
        ) : (
          <iframe 
            src={chartUrl}
            title="DexScreener Chart"
            className="w-full h-full border-0 mb-[-36px]"
            style={{ backgroundColor: '#13141c' }}
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};

export default PriceChart; 