import { useMedia } from "react-use";
import cx from "classnames";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { getChainData } from "config/constants";
import { useChainId } from "lib/chains";
import twitter from "img/media/ic_x.svg";
import discord from "img/media/ic_discord.svg";
type Props = {
  showRedirectModal?: (to: string) => void;
  redirectPopupTimestamp?: number;
  isMobileTradePage?: boolean;
};

export default function Footer({ showRedirectModal, redirectPopupTimestamp, isMobileTradePage }: Props) {
  const { chainId } = useChainId();
  const isMobile = useMedia("(max-width: 1024px)");
  // const listTokenFromUrl = getChainData(chainId);
  const chainData = getChainData(chainId);
  return (
    <>
      <div className={cx(
        "absolute bottom-0 left-0 w-full px-32 pt-22",
        isMobileTradePage ? "pb-40" : "pb-12",
        {
          "flex flex-col gap-20": isMobile,
        }
      )}>
        <div 
          className='md:left-[26px] md:top-0 text-[13px] homePop500 flex items-center justify-center'
          style={{ color: "var(--color-text-primary)" }}
        >
          © 2025 Termini. All rights reserved.

          <div className="flex items-center">
            <ExternalLink newTab={true} href={chainData?.Twitter}>
              <img src={twitter} alt="twitter" className="h-[10px] ml-[var(--spacing-4)]" />
            </ExternalLink>
            <ExternalLink newTab={true} href={chainData?.Discord} className="h-[10px] ml-[var(--spacing-2)]">
              <img src={discord} alt="discord" />
            </ExternalLink>
          </div>
          {/* <ExternalLink className="ml-[10px] text-[#D9D9D9]" newTab={true} href={listTokenFromUrl?.ListToken}>
            List Your Token
          </ExternalLink> */}
        </div>
      </div>
    </>
  );
}
