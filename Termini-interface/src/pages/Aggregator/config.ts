import AstrIcon from "./images/astr.svg";
import UsdcIcon from "./images/usdc.svg";
import ETHIcon from "./images/eth.svg"
import { ethers } from "ethers";
import { isDev } from "config/constants";

export const NATIVE_TOKEN = isDev(null) ? "0x4200000000000000000000000000000000000006" : "0x4200000000000000000000000000000000000006";
export const DEFAULT_FROM_TOKEN_INFO = isDev(null) ? {
  address: ethers.ZeroAddress,
  symbol: 'ETH',
  decimals: 18,
  logoURI: ETHIcon,
} : {
  address: ethers.ZeroAddress,
  symbol: 'ETH',
  decimals: 18,
  logoURI: ETHIcon,
}
export const DEFAULT_TO_TOKEN_INFO = (chainId: number) => {
  return isDev(chainId) ? {
    address: '0x26e6f7c7047252dde3dcbf26aa492e6a264db655',
    symbol: 'ASTR',
    decimals: 18,
    logoURI: AstrIcon,
  } : {
    address: '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
    symbol: 'USDC.e',
    decimals: 6,
    logoURI: UsdcIcon,
  }
}

export const CONTRACTS_ADDRESS  = (chainId: number) => {
  return {
    aggregatorAddress: isDev(chainId) ? '0xDBd89E690d00D17E99108f7665A7EE4b07FF1D38' : '0x99067E1C68f3a474f72cedF885f9f1fF7F0AAF5e',
    LimitOrderBook: isDev(chainId) ? '0xBF73E1DE4Bd59eD1Edd2FbAB41018654C6c7a391' : '0xAFCf20f66404651873ce9Be3761f4119200245d9',
    DCAOrderBook: isDev(chainId) ? '0xEC22f655377181cf236919C11287B9d58f82ac7A' : '0x692f5f8b4A5D0652c9067ce9dc447932aaE04CC3',
  }
}