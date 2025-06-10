import { Trans } from "@lingui/macro";
import { ethers } from "ethers";
import ETHIcon from "../../images/eth.svg";
import { getExplorerUrl } from "config/chains";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { LinkIcon } from "../icon";
import cx from "classnames";
import { useEffect, useState, useMemo } from "react";
import { formatTimestamp, formatDecimalWithSubscript } from "pages/Aggregator/utils";
import { formatAmount, bigNumberify, formatNumberKM } from "lib/numbers";

// 定义类型
interface TokenInfo {
  id: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface Transaction {
  id: string;
  type: string;
  timestamp: number;
  amountIn: string;
  amountOut?: string;
  orderFee: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
}

interface DcaTransactionsProps {
  order: {
    id: string;
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    execution: Transaction[];
    nextExecuteTime: number;
    executedIntervals: number;
    intervals: number;
    nextExecuteAmountIn: string;
    nextExecuteOrderFee: string;
  };
  tokenMap: Record<string, TokenInfo>;
  tradeTranTypeTab: string;
}

// 状态按钮组件
const StatusButton = ({ transaction, txUrl }: { transaction: Transaction; txUrl?: string }) => {
  if (transaction?.type === "scheduled") {
    return (
      <div className="scheduled w-[10rem] flex justify-center items-center text-[var(--color-text-tertiary)] link-btn-border !border-[var(--color-text-tertiary)]">
        <div><Trans>Scheduled</Trans></div>
      </div>
    );
  }

  if(transaction?.type === "refund") {
    return (
      <ExternalLink className="no-underline cursor-pointer" href={txUrl || "#"}>
        <div className={cx("w-[10rem] flex justify-center items-center gap-[3px] text-[var(--color-warning)] link-btn-border !border-[var(--color-warning)]")}>
          <div><Trans>Refund</Trans></div>
          <LinkIcon color="var(--color-warning)" />
        </div>
      </ExternalLink>
    );
  }
  
  return (
    <ExternalLink className="no-underline cursor-pointer" href={txUrl || "#"}>
      <div className={cx("w-[10rem] flex justify-center items-center gap-[3px] text-[var(--color-primary)] link-btn-border !border-[var(--color-primary)]")}>
        <div><Trans>Completed</Trans></div>
        <LinkIcon color="var(--color-primary)" />
      </div>
    </ExternalLink>
  );
};

// 代币显示行组件
const TokenRow = ({ 
  amount, 
  token, 
  tokenMap, 
  colorClass 
}: { 
  amount?: bigint | string; 
  token: TokenInfo; 
  tokenMap: Record<string, TokenInfo>;
  colorClass: string;
}) => {
  const isETH = token.id === ethers.ZeroAddress;
  const tokenSymbol = isETH ? 'ETH' : token.symbol;
  const tokenInfo = tokenMap[token.id.toLowerCase()];
  const logoURI = isETH ? ETHIcon : tokenInfo?.logoURI;
  
  return (
    <div className="flex items-center gap-[7px]">
      <img src={logoURI} alt={tokenSymbol} className="w-[20px] h-[20px] rounded-full" />
      <div className="text-[var(--color-text-tertiary)] mt-[2px]">
        <span className={colorClass}>
          {amount ? formatNumberKM(formatAmount(amount, parseInt(token.decimals as any), 4, false)) : '--'}
        </span> {tokenSymbol}
      </div>
    </div>
  );
};

function DcaTransactions({ order, tokenMap, tradeTranTypeTab }: DcaTransactionsProps) {
  const { chainId } = useChainId();
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  
  const {
    id,
    tokenIn,
    tokenOut,
    execution,
    nextExecuteTime,
    executedIntervals,
    intervals,
    nextExecuteAmountIn,
    nextExecuteOrderFee,
  } = order;

  // 处理交易数据
  useEffect(() => {
    let data = [...(execution || [])];
    
    // 添加计划中的交易（如果有）
    if (tradeTranTypeTab === "openOrders" && Number(executedIntervals) < Number(intervals)) {
      const scheduledTransaction: Transaction = {
        id: id + "dca-order-id",
        type: "scheduled",
        timestamp: nextExecuteTime,
        amountIn: nextExecuteAmountIn,
        orderFee: nextExecuteOrderFee,
        tokenIn: {
          id: tokenIn.id,
          symbol: tokenIn.symbol,
          decimals: tokenIn.decimals,
        },
        tokenOut: {
          id: tokenOut.id,
          symbol: tokenOut.symbol,
          decimals: tokenOut.decimals,
        }
      };
      
      data = [scheduledTransaction, ...data];
    }
    
    setTransactionsData(data);
  }, [
    id, 
    execution, 
    tradeTranTypeTab, 
    executedIntervals, 
    intervals, 
    nextExecuteTime, 
    nextExecuteAmountIn, 
    nextExecuteOrderFee, 
    tokenIn, 
    tokenOut
  ]);

  // 渲染表格行
  const renderTableRows = useMemo(() => {
    if (!transactionsData?.length) return null;
    
    return transactionsData.map((transaction, index) => {
      const { 
        timestamp,
        amountIn,
        orderFee,
        amountOut,
      } = transaction;

      // 计算总输入金额（包括手续费）
      const fromAmount = amountIn && orderFee && 
        (BigInt(amountIn) + BigInt(orderFee));
      
      // 计算价格
      const from = formatAmount(fromAmount, parseInt(tokenIn.decimals as any), 8, false);
      const to = formatAmount(amountOut ? BigInt(amountOut) : 0n, parseInt(tokenOut.decimals as any), 8, false);
      const ratio = Number(to) > 0 ? Number(from) / Number(to) : 0;
      const price = ratio > 0 ? ratio.toFixed(4) : '--';

      // 获取代币符号
      const tokenInSymbol = tokenIn.id === ethers.ZeroAddress ? 'ETH' : tokenIn?.symbol;
      const tokenOutSymbol = tokenOut.id === ethers.ZeroAddress ? 'ETH' : tokenOut?.symbol;
      
      // 构建交易URL
      const txUrl = transaction.id.includes("dca-order-id") 
        ? undefined 
        : `${getExplorerUrl(chainId)}tx/${transaction.id}`;

      return (
        <tr key={`transaction-${order?.id}-${index}`}>
          <td>
            <div className="flex items-center text-[var(--color-text-disable)]">
              {formatTimestamp(timestamp)}
            </div>
          </td>
          <td>
            <div className="flex flex-col gap-[4px]">
              <TokenRow 
                amount={fromAmount} 
                token={tokenIn} 
                tokenMap={tokenMap} 
                colorClass="text-[var(--color-warning)]" 
              />
              <TokenRow 
                amount={amountOut} 
                token={tokenOut} 
                tokenMap={tokenMap} 
                colorClass="text-[var(--color-primary)]" 
              />
            </div>
          </td>
          <td>
            <div className="flex flex-col gap-[4px]">
              <div className="text-[var(--color-text-primary)]">{price}</div>
              <div className="text-[var(--color-text-disable)]">{tokenInSymbol} per {tokenOutSymbol}</div>
            </div>
          </td>
          <td>
            <div className="flex items-center gap-[12px] text-[var(--color-text-tertiary)] text-[var(--fontSize-sm)]">
              <StatusButton transaction={transaction} txUrl={txUrl} />
            </div>
          </td>
        </tr>
      );
    });
  }, [transactionsData, order?.id, tokenIn, tokenOut, tokenMap, chainId]);

  return (
    <>
      <table className="token--table text-[var(--fontSize-sm)] homePop400 !pl-[22px]">
        <thead>
          <tr>
            <th className="table-head w-[11rem]" scope="col">
              <Trans>Date</Trans>
            </th>
            <th className="table-head w-[11rem]" scope="col">
              <Trans>From/To</Trans>
            </th>
            <th className="table-head w-[11rem]" scope="col">
              <Trans>Execution Price</Trans>
            </th>
            <th className="table-head w-[8rem]" scope="col">
              <Trans>Status</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {renderTableRows}
          {!transactionsData?.length && (
            <tr>
              <td colSpan={4} className="text-center py-[2rem] text-[var(--color-text-disable)]">
                <Trans>No transaction data</Trans>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
} 

export default DcaTransactions;