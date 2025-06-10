import "./index.scss";
import cx from "classnames";
import { t, Trans } from "@lingui/macro";
import { formatDecimalWithSubscript, formatNumberKM, formatTimestamp } from "pages/Aggregator/utils";
import Pagination from "components/Pagination/Pagination";
import { useChainId } from "lib/chains";
import { formatNumberWithCommas } from "lib/numbers";
import { LinkIcon } from "../icon";
import Tooltip from "components/Tooltip/Tooltip";
import { useSpotSwapOrderHistory } from "pages/Aggregator/useSpotData";
import useWallet from "lib/wallets/useWallet";
import usePagination from "components/Referrals/usePagination";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { getExplorerUrl, getHashExplorerUrl } from "config/chains";
import { shortenAddressOrEns } from "lib/wallets";
import { ethers } from "ethers";
import ETHIcon from "../../images/eth.svg";

// 定义接口增强类型安全
interface TokenInfo {
  id: string;
  symbol: string;
  logoURI?: string;
}

interface Execution {
  id: string;
  timestamp: number;
}

interface Order {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountInValue: number;
  amountOutValue: number;
  amountInConsumedValue: number;
  createTimestamp: number;
  triggerPrice: number;
  execution?: Execution[];
  status: 'cancelled' | 'expired' | 'empty' | 'completed';
  closeHash?: string;
  createHash?: string;
}

interface OrderHistoryProps {
  tokenMap: Record<string, TokenInfo>;
  tradeTranTypeTab: string;
}

export default function OrderHistory({ tokenMap, tradeTranTypeTab }: OrderHistoryProps) {
  const { chainId } = useChainId();
  const { account } = useWallet();

  const { data: orderHistoryData, loading } = useSpotSwapOrderHistory(chainId, account);
  
  const { currentPage, setCurrentPage, getCurrentData, pageCount } = usePagination(
    account || '',
    orderHistoryData?.orderLimit || [],
    10
  );

  const currentPageData = getCurrentData();

  // 使用 useMemo 优化地址检查
  const getTokenSymbol = (token: TokenInfo) => {
    return token.id === ethers.ZeroAddress ? 'ETH' : token.symbol;
  };

  const getTokenLogo = (token: TokenInfo, tokenInfo?: TokenInfo) => {
    return token.id === ethers.ZeroAddress ? ETHIcon : tokenInfo?.logoURI;
  };

  const handleTxClick = (order: Order) => {
    try {
      const txId: string = order.execution?.[0]?.id || order.createHash || "";
      const url: string = getHashExplorerUrl(chainId, txId);
      window.open(url, "_blank");
    } catch (error) {
      console.error('Error opening transaction URL:', error);
    }
  };

  const renderActionButton = (order: Order) => {
    const txUrl = getExplorerUrl(chainId) + "tx/" + order.closeHash;

    if (order.status === "cancelled" || order.status === "expired" || order.status === "empty") {
      return (
        <ExternalLink className="no-underline" href={txUrl}>
          <div className="w-[10rem] flex justify-center items-center gap-[var(--spacing-1)] text-[var(--color-text-secondary)] link-btn-border">
            <div>
              {order.status === "cancelled" && "Cancelled"}
              {order.status === "expired" && "Expired"}
              {order.status === "empty" && "Empty"}
            </div>
            <LinkIcon />
          </div>
        </ExternalLink>
      );
    }

    return (
      <div 
        className="completed w-[10rem] flex justify-center items-center gap-[var(--spacing-1)] text-[var(--color-text-secondary)] link-btn-border !border-[var(--color-primary)]" 
        onClick={() => handleTxClick(order)}
      >
        <Tooltip
          position="bottom"
          className="text-[var(--color-primary)]"
          handle={<Trans>Completed</Trans>}
          renderContent={() => (
            <div className="text-[var(--color-text-tertiary)] flex flex-col gap-[var(--spacing-1)]">
              {order.execution?.map((item) => (
                <div className="flex justify-between items-center gap-[var(--spacing-4)]" key={item.id}>
                  <div>{formatTimestamp(item.timestamp)}</div>
                  <ExternalLink className="no-underline" href={`${getExplorerUrl(chainId)}tx/${item.id}`}>
                    <div className="leading-[2rem] cursor-pointer">
                      {shortenAddressOrEns(item.id, 13)}
                    </div>
                  </ExternalLink>
                </div>
              ))}
            </div>
          )}
        />
        <LinkIcon color="var(--color-primary)" />
      </div>
    );
  };

  const renderOrderRow = (order: Order) => {
    const { 
      tokenIn,
      tokenOut,
      amountInValue,
      amountOutValue,
      amountInConsumedValue,
      createTimestamp,
      triggerPrice,
      execution,
      id
    } = order;

    const fromInfo = tokenMap?.[tokenIn.id?.toLowerCase()];
    const toInfo = tokenMap?.[tokenOut.id?.toLowerCase()];
    const filledRate = amountInConsumedValue && amountInValue ? 
      (amountInConsumedValue / amountInValue * 100) : 0;

    const expiry = execution?.[0]?.timestamp || createTimestamp;

    const fromValText = amountInValue < 0.0001 ? 
      formatDecimalWithSubscript(Number(amountInValue)) : 
      amountInValue > 1000 ? 
        formatNumberKM(amountInValue, true, 2) : 
        formatNumberWithCommas(amountInValue, 4);

    const toValText = amountOutValue < 0.0001 ? 
      formatDecimalWithSubscript(Number(amountOutValue)) : 
      amountOutValue > 1000 ? 
        formatNumberKM(amountOutValue, true, 2) : 
        formatNumberWithCommas(amountOutValue, 4);

    const triggerPriceText = triggerPrice < 0.001 ? 
      formatDecimalWithSubscript(Number(triggerPrice)) : 
      formatNumberWithCommas(triggerPrice, 2);

    const tokenInSymbol = getTokenSymbol(tokenIn);
    const tokenOutSymbol = getTokenSymbol(tokenOut);
    const tokenInLogo = getTokenLogo(tokenIn, fromInfo);
    const tokenOutLogo = getTokenLogo(tokenOut, toInfo);

    return (
      <tr className="cursor-pointer text-[var(--color-text-secondary)]" key={id}>
        <td className="text-[var(--color-text-secondary)]" data-label="From/To">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col text-[var(--color-text-secondary)] max-md:w-[15rem]">
            <div className="flex gap-[var(--spacing-1)] items-center">
              <img src={tokenInLogo} alt="from" className="w-[20px] h-[20px] rounded-full" />
              <div className="flex gap-[var(--spacing-1)]">
                <span className="text-[var(--color-web3-red)]">{fromValText}</span>
                {tokenInSymbol}
              </div>
            </div>
            <div className="flex gap-[var(--spacing-1)] items-center">
              <img src={tokenOutLogo} alt="to" className="w-[20px] h-[20px] rounded-full" />
              <div className="flex gap-[var(--spacing-1)]">
                <span className="text-[var(--color-web3-green)]">≥{toValText}</span>
                {tokenOutSymbol}
              </div>
            </div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Trigger Price">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col max-md:w-[13rem]">
            <div className="text-[var(--color-text-primary)]">{triggerPriceText}</div>
            <div className="text-[var(--color-text-tertiary)]">{tokenInSymbol} per {tokenOutSymbol}</div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Expiry">
          <div className="flex items-center text-[var(--color-text-tertiary)]">
            {formatTimestamp(expiry)}
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Total Filled">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col max-md:w-[16rem]">
            <div className="text-[var(--color-text-primary)]">({filledRate.toFixed(2)}%)</div>
            <div className="text-[var(--color-text-tertiary)]">
              {formatNumberKM(amountInConsumedValue, true, 2)}/
              {formatNumberKM(amountInValue, true, 2)} {tokenInSymbol}
            </div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="action">
          {renderActionButton(order)}
        </td>
      </tr>
    );
  };

  return (
    <div className="order-list-table">
      <div className={cx("table-wrapper relative px-[var(--spacing-3)]", {
        "pb-[56px]": tradeTranTypeTab === "orderHistory"
      })}>
        <table className="token--table">
          <thead>
            <tr>
              <th className="table-head w-[13rem]" scope="col">
                <Trans>From/To</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Trans>Trigger Price</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Trans>Created/Executed</Trans>
              </th>
              <th className="table-head w-[13rem]" scope="col">
                <Trans>Total Filled</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Trans>Status</Trans>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPageData?.map((order: any) => renderOrderRow(order))}
          </tbody>
        </table>
        
        {!currentPageData?.length && loading && (
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'>
            <Trans>loading...</Trans>
          </div>
        )}
        
        {!currentPageData?.length && !loading && (
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'>
            {t`No order data here.`}
          </div>
        )}
        
        {currentPageData?.length > 0 && (
          <div className="absolute flex justify-center items-center bottom-[10px] w-full h-[5rem] order-history-pagination">
            <Pagination 
              pageCount={pageCount} 
              page={currentPage} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
