import SwapIcon from "../images/swap.svg";
import BetaIcon from "../images/beta.svg";
import Tooltip from "components/Tooltip/Tooltip";
import { t, Trans } from "@lingui/macro";
import cx from "classnames";
import { BotIcon, BotsActiveIcon, BotsIcon, DcaActiveIcon, DcaIcon, LimitActiveIcon, LimitIcon, SwapActiveIcon, SwapIcon as SpotSwapIcon } from "./icon";
import { BotSvg } from 'components/AppSvg'
export const SWAP = "Swap";
export const BOT = "Bot";
export const MARKET = "Market";
export const LIMIT = "Limit";
export const TWAP = "TWAP";
export const DCA = "DCA";

export default function SwapTab(props: any) {
  const {
    activeTabTrade,
    setActiveTabTrade,
    activeSubTabTrade,
    setActiveSubTabTrade,
  } = props;

  return (
    <>
      <div className="Tab flex justify-between aggregator-tab-1 w-[503px] max-md:w-full">
        <div
          className={cx("Tab-option flex justify-center items-center flex-1", {
            "active-aggregator-tab-swap": activeTabTrade === SWAP,
          })}
          onClick={() => {
            setActiveTabTrade(SWAP)
            setActiveSubTabTrade(MARKET)
          }}
        >
          { activeTabTrade === SWAP ? <SwapActiveIcon /> : <SpotSwapIcon /> }
          <span><Trans>Swap</Trans></span>
        </div>
        <div
          className={cx("Tab-option flex justify-center items-center flex-1 relative", {
            "active-aggregator-tab-swap": activeTabTrade === LIMIT,
          })}
          onClick={() => {
            setActiveTabTrade(LIMIT)
            setActiveSubTabTrade(LIMIT)
          }}
        >
          { activeTabTrade === LIMIT ? <LimitActiveIcon /> : <LimitIcon /> }
          <span><Trans>Limit</Trans></span>
          <div className={cx("w-[31px] h-[13px] bg-[var(--color-primary)] rounded-[2px] flex justify-center items-center pt-[1px] top-[6px] right-[3px] absolute homePop400 text-[var(--color-border)] text-[10px]", {
            "!text-[var(--color-button-disable)]": activeTabTrade !== LIMIT
          })}><Trans>Beta</Trans></div>
        </div>
        <div
          className={cx("Tab-option flex justify-center items-center flex-1 relative", {
            "active-aggregator-tab-swap": activeTabTrade === DCA,
          })}
          onClick={() => {
            setActiveTabTrade(DCA)
            setActiveSubTabTrade(DCA)
          }}
        >
          { activeTabTrade === DCA ? <DcaActiveIcon /> : <DcaIcon /> }
          <span><Trans>DCA</Trans></span>
          <div className={cx("w-[31px] h-[13px] bg-[var(--color-primary)] rounded-[2px] flex justify-center items-center pt-[1px] top-[6px] right-[3px] absolute homePop400 text-[var(--color-border)] text-[10px]", {
            "!text-[var(--color-button-disable)]": activeTabTrade !== DCA
          })}><Trans>Beta</Trans></div>
        </div>
        <div className={cx("Tab-option flex justify-center items-center flex-1")}>
          { activeTabTrade === BOT ? <BotsActiveIcon /> : <BotsIcon /> }
          <Tooltip
            position="bottom"
            className="sub-menu-coming-soon-tooltip text-[var(--color-text-disable)]"
            handle={<Trans>Bots</Trans>}
            renderContent={() => <Trans>Coming Soon</Trans>}
          />
        </div>
      </div>

      {/* 保留子Tab以便将来扩展，但现在不需要显示 */}
      {/* <div className="Tab aggregator-tab-sub px-[var(--spacing-3)] justify-start flex gap-[3rem] mt-[2rem] w-[503px] text-[var(--fontSize-base)] max-md:w-full">
        <div
          className={cx("Tab-option flex justify-center items-center")}
          onClick={() => setActiveSubTabTrade(MARKET)}
        >
          <span
            className={cx({
              "active-aggregator-sub-tab": activeSubTabTrade === MARKET,
            })}
          >
            <Trans>Market</Trans>
          </span>
        </div>
        <div className={cx("Tab-option flex justify-center items-center relative")} onClick={() => setActiveSubTabTrade(LIMIT)}>
          <span className={cx({
            "active-aggregator-sub-tab": activeSubTabTrade === LIMIT
          })}>
            <Trans>Limit</Trans>
          </span>
          <div className={cx("w-[31px] h-[13px] bg-[var(--color-primary)] rounded-[2px] flex justify-center items-center pt-[1px] top-[-15px] right-[-30px] absolute homePop400 text-[var(--color-border)] text-[1rem]", {
            "!text-[var(--color-button-disable)]": activeSubTabTrade !== LIMIT
          })}><Trans>Beta</Trans></div>
        </div>
        <div className={cx("Tab-option flex justify-center items-center relative pl-[2.7rem]")} onClick={() => setActiveSubTabTrade(DCA)}>
          <span className={cx({
            "active-aggregator-sub-tab": activeSubTabTrade === DCA
          })}>
            <Trans>DCA</Trans>
          </span>
          <div className={cx("w-[31px] h-[13px] bg-[var(--color-primary)] rounded-[2px] flex justify-center items-center pt-[1px] top-[-15px] right-[-30px] absolute homePop400 text-[var(--color-border)] text-[1rem]", {
            "!text-[var(--color-button-disable)]": activeSubTabTrade !== DCA
          })}><Trans>Beta</Trans></div>
        </div>
      </div> */}
    </>
  )
}