import { formatAmount } from "lib/numbers";
import MarketsIcon from "../images/markets.svg";
import ToggleIcon from "../images/toggle.svg";
import { formatDecimalWithSubscript, formatNumberKM } from "../utils";
import Tooltip from "components/Tooltip/Tooltip";
import { useMemo } from "react";
import { MarketsSvg } from 'components/AppSvg'
import { Trans } from "@lingui/macro";
export default function SwapInfo(props: any) {
  const { feeRate, minimumReceived, networkFee, routerData, savedSlippageAmount, fromInfo, toInfo, outPutData, bestVal } = props;

  const viewDex = useMemo(() => {
    if (routerData?.dexNameArrNew?.length > 3) {
      const start = routerData?.dexNameArrNew[0]
      const end = routerData?.dexNameArrNew[routerData?.dexNameArrNew.length - 1]
      return `${start} ... ${end}`;
    }
    return routerData?.dexNameArrNew?.join(" | ");
  }, [routerData?.dexNameArrNew]);

  return (
    <>
      <div className="rounded-[var(--borderRadius-sm)] aggregator-swap-info flex justify-between items-center mt-[var(--spacing-2)] mx-[var(--spacing-3)] px-[var(--spacing-3)] bg-[var(--color-bg-sub-10)] h-[41px] max-md:flex-col max-md:gap-[6px] max-md:h-[60px] max-md:justify-center max-md:items-start">
        <div className="flex gap-[5px] justify-start items-center h-[16px]">
          <img className="h-[14px]" src={ToggleIcon} alt="Toggle Icon" />
          <div className="text-[var(--color-web3-yellow)] homePop500 text-[1.2rem] h-[16px]"><Trans>Best Price</Trans>:</div>
          <div className="flex items-center homePop500">
            {1} {fromInfo.symbol} = {bestVal && bestVal < 0.0001 ? formatDecimalWithSubscript(bestVal) : bestVal.toFixed(4) || '-'} {toInfo.symbol}
          </div>
        </div>
      </div>
      <div className="rounded-[var(--borderRadius-sm)] aggregator-swap-info flex justify-center items-center mt-[var(--spacing-3)] mx-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] bg-[var(--color-bg-sub)] flex-col text-[var(--color-text-tertiary)] text-[var(--fontSize-sm)] gap-[6px]">
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Minimum received</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {minimumReceived && `${formatAmount(minimumReceived, toInfo?.decimals, 4, true)} ${toInfo.symbol}`}
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Fee</Trans></div>
          <div className="swap-info-item-value text-[var(--color-primary)] homePop500">{feeRate}</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Network Fee</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">
            {(networkFee && formatAmount(networkFee, 18, 4, true)) || "-"} ETH
          </div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Slippage tolerance</Trans></div>
          <div className="swap-info-item-value text-[var(--color-text-secondary)] homePop500">{savedSlippageAmount / 100}%</div>
        </div>
        <div className="w-full swap-info-item flex justify-between items-center leading-[2rem]">
          <div className="homePop400"><Trans>Route</Trans></div>
          <div className="swap-info-item-value flex items-center text-[var(--color-text-secondary)] homePop500 gap-[6px]">
            <div className="markets-btn homePop400">
              <MarketsSvg size={11} color="var(--color-primary)" />
              {/* <img className="w-[11px] mt-[-1px]" src={MarketsIcon} alt="markets" /> */}
              <div className="text-[var(--color-primary)] mt-[2px] homePop400 ml-[var(--spacing-1)]">{routerData?.dexIdArrNew?.length} Markets</div>
            </div>
            <Tooltip
              position="bottom"
              className="text-[var(--color-text-secondary)]"
              handle={<div>{routerData?.dexNameArrNew && `Via ${viewDex}`}</div>}
              // handle={<div className="flex gap-[5px]">{MarketsView()}</div>}
              renderContent={() => {
                return (
                  <div className="text-[var(--color-text-secondary)]">
                    {
                      routerData?.dexNameArrNew.map((item, index) => {
                        return (
                          <div key={index} className="text-[var(--color-text-secondary)] leading-[2.2rem]">
                            {item}
                          </div>
                        )
                      })
                    }
                  </div>
                )
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
