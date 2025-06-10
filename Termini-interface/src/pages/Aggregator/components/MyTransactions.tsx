import { useChainId } from "lib/chains";
import { useSpotTradeHistory } from "../useSpotData"
import useWallet from "lib/wallets/useWallet";
import "./index.scss"
import LinkIcon from "../images/link.svg"
import Pagination from "components/Pagination/Pagination";
import usePagination from "components/Referrals/usePagination";
import { formatAmount } from "lib/numbers";
import { formatDecimalWithSubscript, formatNumberKM, getCreateTimeText } from "../utils";
import DefaultIcon from "../images/default.svg";
import ETHIcon from "../images/eth.svg";
import { ethers } from "ethers";
import { getExplorerUrl, getHashExplorerUrl } from "config/chains";

interface TokenInfo {
  id: string;
  symbol?: string;
  decimals: string;
  logoURI?: string;
}

interface TradeHistoryItem {
  id: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
}

interface TokenMap {
  [key: string]: TokenInfo;
}

interface TradeHistoryProps {
  tokenMap: TokenMap;
}

const TokenImage = ({ src, className }: { src?: string; className: string }) => {
  return (
    <img
      onError={(e) => {
        e.currentTarget.setAttribute('src', DefaultIcon);
      }}
      className={className}
      src={src || DefaultIcon}
      alt="TokenIcon"
    />
  );
};

const getTokenDetails = (token: TokenInfo, tokenMap: TokenMap) => {
  const isEth = token.id.toLowerCase() === ethers.ZeroAddress.toLowerCase();
  const tokenMapInfo = tokenMap[token.id.toLowerCase()];
  
  return {
    symbol: isEth ? 'ETH' : token.symbol || tokenMapInfo?.symbol || '-',
    decimals: isEth ? '18' : token.decimals || tokenMapInfo?.decimals || '18',
    logo: isEth ? ETHIcon : tokenMapInfo?.logoURI || DefaultIcon
  };
};

export default function TradeHistory({ tokenMap }: TradeHistoryProps) {
  const { chainId } = useChainId();
  const { account } = useWallet();
  const { data: tradeHistoryData } = useSpotTradeHistory(chainId, account);

  const { currentPage, setCurrentPage, getCurrentData, pageCount } = usePagination(
    account || '',
    tradeHistoryData?.swap || [],
    10
  );

  const currentPageData = getCurrentData();

  const getMsg = (item: TradeHistoryItem) => {
    const tokenInDetails = getTokenDetails(item.tokenIn, tokenMap);
    const tokenOutDetails = getTokenDetails(item.tokenOut, tokenMap);

    return `Swap ${formatAmount(item.amountIn, parseInt(tokenInDetails.decimals), 4, true)} ${tokenInDetails.symbol} for ${formatAmount(item.amountOut, parseInt(tokenOutDetails.decimals), 4, true)} ${tokenOutDetails.symbol}`;
  };

  const getTokenRate = (item: TradeHistoryItem) => {
    const tokenInDetails = getTokenDetails(item.tokenIn, tokenMap);
    const tokenOutDetails = getTokenDetails(item.tokenOut, tokenMap);

    const rate = Number(formatAmount(item.amountOut, parseInt(tokenOutDetails.decimals), 8, false)) / 
                Number(formatAmount(item.amountIn, parseInt(tokenInDetails.decimals), 8, false));
    const rateText = rate < 0.0001 ? formatDecimalWithSubscript(rate) : formatNumberKM(rate);
    
    return `1 ${tokenInDetails.symbol} ≈ ${rateText} ${tokenOutDetails.symbol}`;
  };

  const handleExplorerClick = (txId: string) => {
    const url: string = getHashExplorerUrl(chainId, txId);
    window.open(url, '_blank');
  };
  
  return (
    <div className="w-full pt-[8px] pb-[10px] trade-history">
      {currentPageData?.length ? (
        currentPageData.map((item: unknown) => {
          const typedItem = item as TradeHistoryItem;
          const tokenInDetails = getTokenDetails(typedItem.tokenIn, tokenMap);
          const tokenOutDetails = getTokenDetails(typedItem.tokenOut, tokenMap);

          return (
            <div className="flex justify-between trade-history-item" key={typedItem.id}>
              <div className="flex flex-col gap-[6px]">
                <div 
                  className="flex items-center gap-[6px] homePop400" 
                  style={{ 
                    fontSize: 'var(--fontSize-sm)' 
                  }}
                >
                  <div className="text-[var(--color-text-secondary)] flex">
                    <TokenImage src={tokenInDetails.logo} className="w-[18px] h-[18px] rounded-full" />
                    <TokenImage src={tokenOutDetails.logo} className="w-[18px] h-[18px] ml-[-8px] rounded-full" />
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{getMsg(typedItem)}</div>
                </div>
                <div 
                  className="homePop400" 
                  style={{ 
                    color: 'var(--color-text-disable)', 
                    fontSize: 'var(--fontSize-sm)' 
                  }}
                >
                  {getTokenRate(typedItem)}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <img 
                  className="w-[28px] cursor-pointer hover:opacity-80" 
                  src={LinkIcon} 
                  alt="LinkIcon" 
                  onClick={() => handleExplorerClick(typedItem.id)}
                />
                <div 
                  className="text-right homePop400"
                  style={{
                    color: 'var(--color-text-disable)',
                    fontSize: 'var(--fontSize-xs)'
                  }}
                >
                  {getCreateTimeText(typedItem.timestamp)}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex justify-center items-center trade-history-item text-[var(--color-text-tertiary)]">
          No history yet.
        </div>
      )}

      {tradeHistoryData && pageCount > 1 && (
        <Pagination 
          page={currentPage} 
          pageCount={pageCount} 
          onPageChange={setCurrentPage} 
        />
      )}
    </div>
  );
}