import { Trans } from "@lingui/macro";
import { formatAmount, formatNumberWithCommas, formatNumberKM } from "lib/numbers";
import { ethers } from "ethers";
import { formatDecimalWithSubscript, formatTimestamp } from "pages/Aggregator/utils";
import { useMemo } from "react";

interface DcaOverViewProps {
  order: {
    tokenIn: { symbol: string; decimals: number };
    tokenOut: { symbol: string; decimals: number };
    amountIn: string;
    orderFee: string;
    executedIntervals: number;
    intervals: number;
    filledAmountOut: string;
    intervalDuration: number;
    createTimestamp: number;
    nextExecuteTime: number;
    estimatedEndTime: number;
    status: string;
  };
  totalDeposited: bigint;
}

const InfoRow = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="flex justify-between items-center leading-[20px] text-[var(--fontSize-sm)]">
    <div className="text-[var(--color-text-disable)]">{label}</div>
    <div className="text-[var(--color-text-primary)]">{value}</div>
  </div>
);

export default function DcaOverView({ order, totalDeposited }: DcaOverViewProps) {
  const {
    tokenIn,
    tokenOut,
    executedIntervals,
    intervals,
    filledAmountOut,
    intervalDuration,
    createTimestamp,
    nextExecuteTime,
    estimatedEndTime,
    status,
  } = order;

  const calculatedValues = useMemo(() => {
    const eachOrderSize = totalDeposited && 
      totalDeposited / BigInt(intervals) ?
      formatAmount(totalDeposited / BigInt(intervals), parseInt(tokenIn.decimals as any), 4, false) : "0";
    
    const executedAmount = totalDeposited && (totalDeposited / BigInt(intervals)) * BigInt(executedIntervals);
    const executedAmountVal = formatAmount(executedAmount, parseInt(tokenIn.decimals as any), 18, false);
    
    const filledAmountOutBigInt = filledAmountOut ? BigInt(filledAmountOut) : 0n;
    const toAmountVal = formatAmount(filledAmountOutBigInt, parseInt(tokenOut.decimals as any), 18, false);
    
    const price = Number(toAmountVal) > 0 ? Number(executedAmountVal) / Number(toAmountVal) : 0;
    const averagePrice = price === 0 
      ? '--' 
      : price < 0.0001 
        ? formatDecimalWithSubscript(Number(price)) 
        : price.toFixed(4);
    
    const remainingOrders = Number(intervals || 0) - Number(executedIntervals || 0);
    
    const intervalMinutes = (intervalDuration / 60).toFixed(0);
    
    return {
      eachOrderSize,
      averagePrice,
      remainingOrders,
      intervalMinutes
    };
  }, [
    totalDeposited, 
    intervals, 
    executedIntervals, 
    tokenIn.decimals, 
    filledAmountOut, 
    tokenOut.decimals,
    intervalDuration
  ]);
  
  const { eachOrderSize, averagePrice, remainingOrders, intervalMinutes } = calculatedValues;

  const payTokenBalance = useMemo(() => {
    if (!totalDeposited) return "0";
    const eachOrderSizeBig = totalDeposited / BigInt(intervals);
    const remainingBalance = totalDeposited - (BigInt(executedIntervals) * eachOrderSizeBig);
    return formatAmount(remainingBalance, parseInt(tokenIn.decimals as any), 4, false);
  }, [totalDeposited, tokenIn.decimals, executedIntervals, intervals]);
  
  return (
    <div className="overView-card flex justify-between gap-[58px] my-[22px] px-[22px] homePop400">
      <div className="flex flex-col flex-1 gap-[10px]">
        <InfoRow 
          label={<Trans>DCA {tokenIn.symbol} Balance</Trans>} 
          value={`${payTokenBalance} ${tokenIn.symbol}`} 
        />
        <InfoRow 
          label={<Trans>{tokenOut.symbol} Withdrawn</Trans>} 
          value={`${formatAmount(filledAmountOut ? BigInt(filledAmountOut) : 0n, parseInt(tokenOut.decimals as any), 4, false)} ${tokenOut.symbol}`} 
        />
        <InfoRow 
          label={<Trans>Every</Trans>} 
          value={`${intervalMinutes} minute(s)`} 
        />
        <InfoRow 
          label={<Trans>Each Order Size</Trans>} 
          value={`${eachOrderSize} ${tokenIn.symbol}`} 
        />
        <InfoRow 
          label={<Trans>Created At</Trans>} 
          value={formatTimestamp(createTimestamp)} 
        />
      </div>
      <div className="flex flex-col flex-1 gap-[10px]">
        <InfoRow 
          label={<Trans>Orders</Trans>} 
          value={intervals} 
        />
        <InfoRow 
          label={<Trans>Orders Remaining</Trans>} 
          value={`${remainingOrders} Order(s)`} 
        />
        <InfoRow 
          label={<Trans>Average Price</Trans>} 
          value={
            averagePrice === '--' 
              ? averagePrice 
              : <div>{averagePrice} {tokenIn.symbol} per {tokenOut.symbol}</div>
          } 
        />
        <InfoRow 
          label={<Trans>Next Order At</Trans>} 
          value={(remainingOrders === 0 || status === "cancelled") ? "--" : formatTimestamp(nextExecuteTime)} 
        />
        <InfoRow 
          label={<Trans>Estimated End Date</Trans>} 
          value={formatTimestamp(estimatedEndTime)} 
        />
      </div>
    </div>
  );
} 