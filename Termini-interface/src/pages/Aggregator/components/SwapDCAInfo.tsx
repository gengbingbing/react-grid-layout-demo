import { useMemo, useState, useEffect } from "react";
import { formatNumberKM } from "../utils";
import Tooltip from "components/Tooltip/Tooltip";
import { formatAmount } from "lib/numbers";

export default function SwapDCAInfo(props: any) {
  const { 
    fromInfo,
    toInfo,
    fromVal,
    everyValue,
    everyUnit,
    orders: numberOfOrders,
    executionFees,
    platformFree,
    currentNumberOfOrders,
    maximumNumberOfOrders
  } = props;

  const [currentMinute, setCurrentMinute] = useState(() => Math.floor(new Date().getTime() / (1000 * 60)));

  useEffect(() => {
    const now = new Date();
    const secondsToNextMinute = 60 - now.getSeconds();
    const millisecondsToNextMinute = secondsToNextMinute * 1000 - now.getMilliseconds();
    
    const initialTimer = setTimeout(() => {
      setCurrentMinute(Math.floor(new Date().getTime() / (1000 * 60)));
      
      const minuteTimer = setInterval(() => {
        setCurrentMinute(Math.floor(new Date().getTime() / (1000 * 60)));
      }, 60000);
      
      return () => clearInterval(minuteTimer);
    }, millisecondsToNextMinute);
    
    return () => clearTimeout(initialTimer);
  }, []);

  /**
   * Order expiration time
   * Formula = Current Time + Every * (Orders - 1)
   * 
   */
  const estimatedEndDate = useMemo(() => {
    const currentTime = Math.floor((new Date().getTime()) / 1000);
    const every = everyValue * everyUnit.value;
    const val = (currentTime + (every * (numberOfOrders - 1))) * 1000;
    const estimatedTime = new Date(val);

    const month = String(estimatedTime.getMonth() + 1).padStart(2, '0'); 
    const day = String(estimatedTime.getDate()).padStart(2, '0');
    const hours = String(estimatedTime.getHours()).padStart(2, '0');
    const minutes = String(estimatedTime.getMinutes()).padStart(2, '0');

    return `${month || '--'}/${day || '--'} ${hours || '--'}:${minutes || '--'}`;
  }, [numberOfOrders, everyValue, everyUnit, currentMinute]);
  
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
          <div className="homePop400">Total payment</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {fromVal || '--'} {fromInfo.symbol}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">Pay per Order</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {fromVal && Number(numberOfOrders) > 0 && (Number(fromVal) / Number(numberOfOrders)) < 0.0001 ? '<0.0001' : Number(numberOfOrders) > 0 ?  (Number(fromVal) / Number(numberOfOrders)).toFixed(4) : '0.0'} {fromInfo?.symbol || '--'}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">To Buy</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {toInfo.symbol}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">Order Interval</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">{everyValue} {everyUnit.label}(s)</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">Estimated End Date</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">{estimatedEndDate}</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">Platform Fee</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {platformFree && (Number(platformFree || 0) / 100).toFixed(2)}%
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400">Execution Fee</div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {formatAmount(executionFees, 18, 5, true)} ETH per order
          </div>
        </div>
        {
          maximumNumberOfOrders !== undefined && maximumNumberOfOrders !== 0n && (
            <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
              <div className="homePop400">Available Orders</div>
              <div className="swap-info-item-value text-[var(--color-web3-green)] homePop500">
                <Tooltip
                  position="bottom"
                  className="text-[var(--color-text-secondary)]"
                  handle={`${String(maximumNumberOfOrders - (currentNumberOfOrders || 0n))}`}
                  renderContent={() => {
                    return (
                      <div className="w-[27rem] flex gap-[5px] text-[var(--color-text-tertiary)] text-[12px] homePop400">
                        <div className="flex justify-between leading-[2rem] gap-[3rem]">
                          <div>Maximum available Orders:</div>
                          <div className="text-[var(--color-text-primary)]">{String(maximumNumberOfOrders)}</div>
                        </div>
                        <div className="flex justify-between leading-[2rem] gap-[3rem]">
                          <div>Current Orders:</div>
                          <div className="text-[var(--color-text-primary)]">{String(currentNumberOfOrders || 0n)}</div>
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