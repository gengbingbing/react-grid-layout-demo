import cx from "classnames";
import { useEffect, useState, useRef } from "react";
import { useFloating, offset, flip, shift, arrow } from "@floating-ui/react";
import { ethers } from "ethers";
import { RPC_PROVIDERS } from "config/chains";
import { useChainId } from "lib/chains";

const ArrowIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="6" viewBox="0 0 13 6" fill="none">
      <path d="M6.5 6L0.00480938 0L12.9952 0L6.5 6Z" fill="#1A1B1E"/>
    </svg>
  );
};

export default function NetworkState() {
  const { chainId } = useChainId();
  const [showDetails, setShowDetails] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<"Stable" | "Unstable" | "Offline">("Stable");
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(0);
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const priceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);
  const arrowRef = useRef(null);
  
  // Blockchain data state
  const [blockchainData, setBlockchainData] = useState({
    blockNumber: "",
    time: "",
    rpcLatency: "",
    gasPrice: ""
  });
  
  const { refs, floatingStyles, context } = useFloating({
    open: showDetails,
    onOpenChange: setShowDetails,
    placement: 'top-end',
    middleware: [
      offset(10),
      flip(),
      shift(),
      arrow({ element: arrowRef })
    ]
  });
  
  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible';
      
      // 当页面重新变为可见时，立即重新获取数据
      if (isPageVisibleRef.current) {
        fetchBlockchainData();
        fetchEthPrice();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 添加获取ETH价格的函数
  const fetchEthPrice = async () => {
    try {
      // 检查是否需要更新价格（每1分钟更新一次）
      const now = Date.now();
      if (now - lastPriceUpdate < 1 * 60 * 1000 && ethPrice !== null) {
        return; // 如果最近已更新则跳过
      }
      
      // 添加请求超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
      setLastPriceUpdate(now);
    } catch (error) {
      // 如果是超时错误，不要重置ETH价格
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error("ETH price fetch timed out");
      } else {
        console.error("Failed to fetch ETH price:", error);
      }
      // 不重置ethPrice以保留最后已知值
    }
  };
  
  // 提取区块链数据获取函数
  const fetchBlockchainData = async () => {
    // 如果页面不可见，不执行更新
    if (!isPageVisibleRef.current) return;
    
    try {
      const startTime = performance.now();
      
      // 创建provider - 使用RPC_PROVIDERS配置
      const rpcUrl = RPC_PROVIDERS[chainId]?.[0] ?? '';
      if (!rpcUrl) {
        throw new Error(`No RPC provider available for chainId ${chainId}`);
      }
      
      // 添加请求超时控制
      let hasTimedOut = false;
      const timeoutId = setTimeout(() => {
        hasTimedOut = true;
      }, 5000); // 5秒超时
      
      // 创建provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // 并行请求区块和费用数据
      const [block, feeData] = await Promise.all([
        provider.getBlock("latest"),
        provider.getFeeData()
      ]);
      
      // 如果在获取数据期间已超时，则放弃处理结果
      if (hasTimedOut) {
        throw new Error("RPC request timed out");
      }
      
      clearTimeout(timeoutId);
      
      // 计算RPC延迟 - 确保是合理的值
      const endTime = performance.now();
      const calculatedLatency = (endTime - startTime) / 1000;
      
      // 使用最大合理延迟值进行限制，防止异常值
      const latency = Math.min(calculatedLatency, 10).toFixed(4);
      
      // 确保数据有效
      if (!block || !feeData.gasPrice) {
        throw new Error("Invalid blockchain data received");
      }
      
      // 计算区块时间 - 使用区块的时间戳
      const blockTime = block.timestamp || 0;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = currentTime - blockTime;
      const timeAgo = timeDiff < 60 
        ? `${timeDiff}s ago` 
        : `${Math.floor(timeDiff / 60)}m ago`;
      
      const gasPrice = feeData.gasPrice || ethers.parseUnits("0", "gwei");
      const gasPriceInEth = ethers.formatEther(gasPrice);
      
      const currentEthPrice = ethPrice;
      const gasPriceInUsd = currentEthPrice 
        ? `($${(Number(gasPriceInEth) * currentEthPrice).toFixed(18)})` 
        : '';
      
      setBlockchainData({
        blockNumber: block.number?.toString() || "",
        time: timeAgo,
        rpcLatency: `${latency}s`,
        gasPrice: `${gasPriceInEth} ETH ${gasPriceInUsd}`
      });
      
      // 根据延迟设置网络状态
      if (Number(latency) < 0.5) {
        setNetworkStatus("Stable");
      } else if (Number(latency) < 10) {
        setNetworkStatus("Stable");
      } else {
        setNetworkStatus("Unstable");
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
      setNetworkStatus("Offline");
      
      // 在错误情况下保留最后的区块号和价格，但更新状态
      setBlockchainData(prev => ({
        ...prev,
        rpcLatency: "failed",
        time: "unknown"
      }));
    }
  };
  
  // Fetch ETH price separately with rate limiting
  useEffect(() => {
    // 首次加载时获取ETH价格
    fetchEthPrice();
    
    // 每1分钟更新一次价格
    priceTimerRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        fetchEthPrice();
      }
    }, 1 * 60 * 1000);
    
    return () => {
      if (priceTimerRef.current) {
        clearInterval(priceTimerRef.current);
      }
    };
  }, []);

  // Fetch blockchain data from RPC
  useEffect(() => {
    // 初始获取区块链数据
    fetchBlockchainData();
    
    // 设置定时器定期更新数据
    fetchTimerRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        fetchBlockchainData();
      }
    }, 10000); // 每10秒更新一次
    
    return () => {
      if (fetchTimerRef.current) {
        clearInterval(fetchTimerRef.current);
      }
    };
  }, [ethPrice, chainId]); // 当ethPrice或chainId更新时重新计算
  
  // Handle click event
  const handleClick = () => {
    setShowDetails(!showDetails);
  };
  
  // Set color based on network status
  const statusColor = {
    Stable: "bg-[#4FA480] text-[#4FA480]",
    Unstable: "bg-[#FFD43D] text-[#FFD43D]",
    Offline: "bg-[#FF4D4D] text-[#FF4D4D]"
  }[networkStatus];
  
  return (
    <>
      {/* Network status indicator */}
      <div 
        ref={refs.setReference}
        className={cx(
          "fixed bottom-[16px] right-[8px] z-50",
          "bg-[#1C1C1C] px-[8px] py-[4px] rounded-[4px] shadow-lg",
          "flex items-center gap-[2px] h-[27px]",
          "text-[#F7FEFD] text-[12px]",
          "cursor-pointer hover:bg-[#252525] transition-colors"
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div className={statusColor.split(' ')[1]}>Network: </div>
        <div className="flex items-center gap-[6px]">
          <div className={statusColor.split(' ')[1]}>{networkStatus}</div>
          <div className={`w-[7px] h-[7px] rounded-full ${statusColor.split(' ')[0]} mt-[-2px]`}></div>
        </div>
      </div>
      
      {/* Details popup */}
      {showDetails && blockchainData.blockNumber && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className={cx(
            "bg-[#1A1B1E] p-[16px] rounded-[4px] z-50",
            "text-[#676767] text-[12px]",
            "min-w-[300px]"
          )}
        >
          <div ref={arrowRef} className="absolute bottom-[-6px] right-[42px]">
            <ArrowIcon />
          </div>
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between gap-[56px]">
              <div className="flex items-center gap-x-2">
                <div>Block:</div>
                <div className="text-[#A9B1B2]">{blockchainData.blockNumber}</div>
              </div>
              <div className="flex items-center gap-x-2">
                <div>Time:</div>
                <div className="text-[#A9B1B2]">{blockchainData.time}</div>
              </div>
              <div className="flex items-center gap-x-2">
                <div>RPC Latency:</div>
                <div className="text-[#A9B1B2]">{blockchainData.rpcLatency}</div>
              </div>
            </div>
            <div className="h-[1px] w-full bg-[#262323] my-[10px]"></div>
            <div className="flex items-center gap-x-2">
              <div>Gas Price:</div>
              <div className="text-[#A9B1B2]">{blockchainData.gasPrice}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
