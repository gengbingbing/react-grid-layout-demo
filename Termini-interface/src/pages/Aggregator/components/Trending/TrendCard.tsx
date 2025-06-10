import "./index.scss"
import copyIcon from '../../images/copy.svg'
import { shortenAddressOrEns } from "lib/wallets";
import { useCopyToClipboard } from "react-use";
import { helperToast } from "lib/helperToast";
import Tooltip from "components/Tooltip/Tooltip";
import { Trans } from "@lingui/macro";

export default function TrendCard(props) {
  const { item: { logoURI: logo, symbol, address, saveRate, priceUSD, changeRate }, handleCurrencySelect } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  return (
    <div className="trend-card bg-[var(--color-bg-sub)] hover:bg-[var(--color-hover)] px-[var(--spacing-4)] py-[var(--spacing-4)] cursor-pointer w-[calc(50%-4px)] max-md:w-full" onClick={() => handleCurrencySelect(props.item, 'to')}>
      <div className="flex justify-between">
        <div className="token-base-info flex items-center gap-[var(--spacing-4)]">
          <img className="w-[30px] h-[30px]" src={logo} alt="logo" />
          <div className="flex flex-col justify-between gap-[var(--spacing-2)]">
            <div className="text-[var(--color-text-primary)] homePop500">{symbol}</div>
            <div className="flex items-center text-[var(--color-text-tertiary)] homePop400">
              <span>{shortenAddressOrEns(address, 10)}</span>
              <img className="w-[var(--spacing-3)] h-[var(--spacing-3)] cursor-pointer" src={copyIcon} alt="Copy" onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(address as string);
                helperToast.success(`${symbol} address copied to clipboard.`);
              }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[var(--spacing-2)] justify-between text-[var(--color-text-secondary)] homePop400">
          {
            Number(saveRate) <= 0 ? (
              <div className='text-[var(--color-text-secondary)] homePop500 align-right'><Trans>Market Price</Trans></div>
            ) :  (
              <Tooltip
                handle={
                  <div className="text-[var(--color-text-secondary)] homePop500 align-right"><Trans>Max Save</Trans>: (+{Number(saveRate).toFixed(2)}%)</div>
                }
                className="text-none align-right"
                position="bottom"
                renderContent={() => (
                  <div className="text-[#A3A3A3]">
                    <Trans>The best route offers the maximum theoretical save.</Trans>
                  </div>
                )}
              />
            )
          }
          
          <div className="flex items-center align-right">
            <div className='text-[var(--color-text-secondary)] homePop400'>${priceUSD}</div>
            <div className='flex items-center text-[var(--color-text-secondary)]'>
              {
                Number(changeRate) === 0 ? (
                  <div className="text-[var(--color-text-secondary)]">(--)</div>
                ) : Number(changeRate) > 0 ? (
                  <div className='text-[var(--color-web3-green)] homePop400'>(+{changeRate}%)</div>
                ) : (
                  <div className='text-[var(--color-web3-red)] homePop400'>({changeRate}%)</div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}