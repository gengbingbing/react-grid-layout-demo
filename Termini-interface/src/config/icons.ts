import { MINATO_MAINNET, MINATO_TESTNET } from "config/chains";

type ChainIcons = {
  network?: string;
};
import networkIcon from "img/icon/ic_network.svg";
import soeIcon from "img/icon/ic_soe.svg";
import slpIcon from "img/icon/ic_slp.svg";
import splIcon from "img/icon/ic_spl.svg";
import hplIcon from "img/icon/ic_hpl.svg";
const ICONS = {
  [MINATO_TESTNET]: {
    network: networkIcon,
    slp: slpIcon,
    spl: splIcon,
    hpl: hplIcon,
    soe: soeIcon,
  },
  [MINATO_MAINNET]: {
    network: networkIcon,
    slp: slpIcon,
    spl: splIcon,
    hpl: hplIcon,
    soe: soeIcon,
  },
  common: {
    network: networkIcon,
    slp: slpIcon,
    soe: soeIcon,
  },
};

export function getIcon(chainId: number | "common", label: keyof ChainIcons) {
  if (!chainId || !(chainId in ICONS)) {
    throw new Error(`No icons found for chain: ${chainId}`);
  }

  return ICONS[chainId][label];
}
export function getIcons(chainId: number | "common") {
  if (!chainId || !(chainId in ICONS)) {
    throw new Error(`No icons found for chain: ${chainId}`);
  }

  return ICONS[chainId];
}
