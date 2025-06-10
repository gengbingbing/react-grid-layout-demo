import cx from "classnames";
import Modal from "components/Modal/Modal";
import SearchInput from "components/SearchInput/SearchInput";
import useWallet from "lib/wallets/useWallet";
import addIcon from "../images/add.svg"
import { ethers } from "ethers";
import { t, Trans } from "@lingui/macro";

interface TokenSelectModalProps {
  currencyModalOpen: boolean;
  setCurrencyModalOpen: (open: boolean) => void;
  currentSelectType: string;
  fromInfo: any;
  toInfo: any;
  handleCurrencySelect: (token: any, type?: string) => void;
  tokenViewData: any[];
  searchKeyword: string;
  setSearchKeyword: (value: string) => void;
}

export default function TokenSelectModal({
  currencyModalOpen,
  setCurrencyModalOpen,
  currentSelectType,
  fromInfo,
  toInfo,
  handleCurrencySelect,
  tokenViewData,
  searchKeyword,
  setSearchKeyword
}: TokenSelectModalProps) {
  const { active, connector } = useWallet();

  const defaultTokenList = tokenViewData.filter(i => i.symbol === "ASTR" || i.symbol === "ETH" || i.symbol === "USDC.e" || i.symbol === "USDT")
  
  return (
    <Modal
      isVisible={currencyModalOpen}
      setIsVisible={() => setCurrencyModalOpen(false)}
      label={t`Select a token`}
      className="aggregator-modal-token-select"
    >
      <div className="select-swap-aggregator-token min-h-[300px] w-[38rem]">
        <div className="mb-[var(--spacing-3)]">
          <SearchInput
            className="flex-1 w-full m-0 !rounded-[var(--borderRadius-sm)] !border-[var(--color-border)] miniSearch !h-[36px]"
            placeholder={t`Search`}
            value={searchKeyword}
            setValue={setSearchKeyword}
            autoFocus={false}
            size="s"
          />
        </div>
        <div className="flex gap-[6px]">
          {
            defaultTokenList.map((item: any, index: number) => {
              return (
                <div className="flex items-center gap-[7px] py-[6px] px-[var(--spacing-3)] bg-[var(--color-bg-sub)] rounded-[var(--borderRadius-sm)] cursor-pointer" key={index} onClick={() => handleCurrencySelect(item)}>
                  <img className="w-[26px]" src={item?.logoURI} alt={item?.name} />
                  <div className="homePop400 text-[var(--color-text-primary)]">{item.symbol}</div>
                </div>
              )
            })
          }
        </div>
        <div className="flex justify-between homePop400 fontSizeBase text-[var(--color-text-tertiary)] leading-[20px] mt-[17px]">
          <div><Trans>Token Name</Trans></div>
          <div><Trans>Balance</Trans></div>
        </div>
        <div className="token-list">
          {tokenViewData?.map((item: any) => {
            return (
              <div
                key={item.address}
                className={cx(
                  "flex justify-between items-center homePop500 text-[var(--fontSize-base)] text-[var(--color-text-primary)] leading-[56px] cursor-pointer hover:bg-[var(--color-hover)] px-[6px] rounded-[var(--borderRadius-sm)]",
                  {
                    "!text-[var(--color-text-secondary)]":
                      (currentSelectType === "from" && fromInfo.address === item.address) ||
                      (currentSelectType === "to" && toInfo.address === item.address),
                  }
                )}
                onClick={() => handleCurrencySelect(item)}
              >
                <div className="flex items-center gap-[6px]">
                  <img className="w-[32px] h-[32px] rounded-full" src={item?.logoURI} alt={item?.name} />
                  <div className="fontSizeBase">{item?.symbol || "-"}</div>
                  {active && connector && item.address !== ethers.ZeroAddress && (
                    <img className="w-[18px] h-[18px]" src={addIcon} alt="Add Wallet" onClick={(event) => {
                      event.stopPropagation();
                      const { address, decimals, logoURI, symbol } = item;
                      if (typeof connector.watchAsset === 'function') {
                        connector.watchAsset({
                          address: address,
                          decimals: decimals,
                          image: logoURI,
                          symbol: symbol,
                        });
                      }
                    }} />
                  )}
                </div>
                <div className="fontSizeBase">{item?.balance || "-"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
