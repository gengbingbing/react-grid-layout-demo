import { useMemo } from "react";
import { formatNumberKM } from "../utils";
import Tooltip from "components/Tooltip/Tooltip";
import { formatAmount } from "lib/numbers";
import { t, Trans } from "@lingui/macro";

export default function SwapLimitInfo(props: any) {
  const { feeRate, expiry, toInfo, fromInfo, swapRate, fromVal, toVal, executionFees, currentNumberOfOrders, maximumNumberOfOrders } = props;

  const rate = useMemo(() => {
    const val = Number(swapRate || 0)
    return val > 999 ? formatNumberKM(val) : (val < 0.0001 && val > 0) ? '<0.0001' : val.toFixed(4)
  }, [swapRate]);
  
  return (
    <>
      <div className={`
        rounded-[var(--borderRadius-md)] 
        spot-swap-info flex justify-center items-center 
        mt-[var(--spacing-2)] mx-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] 
        bg-[var(--color-bg-sub)] 
        flex-col 
        text-[var(--color-text-tertiary)] 
        gap-[var(--spacing-1)]
        w-[calc(100%-28px)]
      `}>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Sell Order</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {fromVal || '--'} {fromInfo.symbol}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>To Buy</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {formatNumberKM(toVal || 0)} {toInfo.symbol}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Buy {toInfo.symbol} at Rate</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">{rate} {fromInfo.symbol}</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Expiry</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">{expiry.label}</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Platform Fee</Trans></div>
          <div className="swap-info-item-value text-[var(--color-primary)] homePop500">
            {feeRate && (Number(feeRate || 0) / 100).toFixed(2)}%
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Execution Fee</Trans></div>
          <div className="swap-info-item-value text-[var(--color-web3-green)] homePop500">
            <Tooltip
              position="bottom"
              className="text-[var(--color-text-secondary)]"
              handle={`${formatAmount(executionFees, 18, 5, true)} ETH`}
              renderContent={() => {
                return (
                  <div className="text-[var(--color-text-secondary)]"><Trans>Execution fee covers the gas cost for our keeper to execute your order. It ensures your transaction is processed reliably and on time.</Trans></div>
                );
              }}
            />
          </div>
        </div>
        {
          BigInt(maximumNumberOfOrders) !== 0n && (
            <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
              <div className="homePop400"><Trans>Available Orders</Trans></div>
              <div className="swap-info-item-value text-[var(--color-primary)] homePop500">
                <Tooltip
                  className="text-[var(--color-text-tertiary)]"
                  handle={`${(Number(maximumNumberOfOrders)-Number(currentNumberOfOrders)).toString()}`}
                  renderContent={() => {
                    return (
                      <div className="w-[27rem] flex flex-col gap-[var(--spacing-1)] text-[var(--color-text-tertiary)] homePop400">
                        <div className="flex justify-between leading-[2rem] gap-[var(--spacing-8)]">
                          <div><Trans>Maximum available Orders:</Trans></div>
                          <div className="text-[var(--color-text-primary)]">{maximumNumberOfOrders.toString()}</div>
                        </div>
                        <div className="flex justify-between leading-[2rem] gap-[var(--spacing-8)]">
                          <div><Trans>Current Orders:</Trans></div>
                          <div className="text-[var(--color-text-primary)]">{currentNumberOfOrders.toString()}</div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          )
        }
      </div>
    </>
  );
}
