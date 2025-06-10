import "./index.scss"
import copyIcon from '../../images/copy.svg'
import priceUpIcon from '../../images/price-up.svg'
import priceDownIcon from '../../images/price-down.svg'
import PriceLineChart from '../PriceLineChart';
import { shortenAddress } from "lib/legacy";
import { shortenAddressOrEns } from "lib/wallets";
import { useCopyToClipboard } from "react-use";
import { helperToast } from "lib/helperToast";

export default function TrendCard(props) {
  const { item: { logoURI: logo, symbol, address, save, price, change24H, priceType, chartData }, handleCurrencySelect } = props;
  const [, copyToClipboard] = useCopyToClipboard();
  return (
    <div className="trend-card bg-[var(--color-bg-sub)] hover:bg-[var(--color-hover)] pl-[2rem] pr-[12px] py-[14px] cursor-pointer w-[calc(50%-4px)] max-md:w-full" onClick={() => handleCurrencySelect(props.item)}>
      <div className="flex justify-between">
        <div className="token-base-info flex items-center gap-[6px]">
          <img className="w-[3rem] h-[3rem]" src={logo} alt="logo" />
          <div className="flex flex-col justify-between">
            <div className="text-[var(--color-text-secondary)] text-[12px] homePop500">{symbol}</div>
            <div className="flex items-center text-[var(--color-text-tertiary)] text-[12px] homePop400">
              <span>{shortenAddressOrEns(address, 13)}</span>
              <img className="w-[14px] h-[14px] cursor-pointer" src={copyIcon} alt="Copy" onClick={(event) => {
                event.stopPropagation();
                copyToClipboard(address as string);
                helperToast.success(`Address copied to clipboard.`);
              }} />
            </div>
          </div>
        </div>
        <div className="text-[var(--color-text-primary)] text-[12px] homePop400">Save:({save}%)</div>
      </div>
      <div className='mt-[2rem] flex justify-between'>
        <div className='text-[var(--color-text-secondary)] text-[12px] homePop500'>${price}</div>
        <div className='flex items-center gap-[3px]'>
          {
            priceType === 'up' ? (
              <img className='w-[12px] h-[12px]' src={priceUpIcon} alt="priceUp" />
            ) : (
              <img className='w-[12px] h-[12px]' src={priceDownIcon} alt="priceDown" />
            )
          }
          {
            priceType === 'up' ? (
              <div className='text-[var(--color-web3-green)] text-[12px] homePop500'>+{change24H}%</div>
            ) : (
              <div className='text-[var(--color-web3-red)] text-[12px] homePop500'>-{change24H}%</div>
            )
          }
          <div className='text-[var(--color-text-disable)] text-[12px] homePop500'>(24H)</div>
        </div>
      </div>
      <div className='mt-[15px]'>
        <PriceLineChart list={chartData || []} id={"price-chart"+symbol} lineColor={priceType === 'up' ? "#60AC7E": "#C36666"} />
      </div>
    </div>
  )
}