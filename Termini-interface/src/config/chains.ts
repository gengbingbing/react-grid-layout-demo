import { ethers } from "ethers";
import type { NetworkMetadata } from "lib/wallets";
import sample from "lodash/sample";
import { MINATO_MAINNET, MINATO_TESTNET } from "./static/chains";
import {
  SUPPORTED_CHAIN_IDS as SDK_SUPPORTED_CHAIN_IDS,
  SUPPORTED_CHAIN_IDS_DEV as SDK_SUPPORTED_CHAIN_IDS_DEV,
} from "config/static/chains";
import { isDevelopment } from "./env";

export * from "./static/chains";

export const SUPPORTED_CHAIN_IDS = isDevelopment() ? SDK_SUPPORTED_CHAIN_IDS_DEV : SDK_SUPPORTED_CHAIN_IDS;

const { parseEther } = ethers;

export const ENV_ARBITRUM_RPC_URLS = import.meta.env.VITE_APP_ARBITRUM_RPC_URLS;
export const ENV_AVALANCHE_RPC_URLS = import.meta.env.VITE_APP_AVALANCHE_RPC_URLS;

// TODO take it from web3
export const DEFAULT_CHAIN_ID = MINATO_MAINNET;
export const CHAIN_ID = DEFAULT_CHAIN_ID;

export const CHAIN_NAMES_MAP = {
  [MINATO_MAINNET]: "Soneium",
  [MINATO_TESTNET]: "Soneium Minato",
};

export const NETWORK_EXECUTION_TO_CREATE_FEE_FACTOR = {
  [MINATO_MAINNET]: 10n ** 29n * 35n,
  [MINATO_TESTNET]: 10n ** 29n * 2n,
} as const;

const constants = {
  [MINATO_MAINNET]: {
    nativeTokenSymbol: "ETH",
    wrappedTokenSymbol: "WETH",
    defaultCollateralSymbol: "USDC",
  },

  [MINATO_TESTNET]: {
    nativeTokenSymbol: "ETH",
    wrappedTokenSymbol: "WETH",
    defaultCollateralSymbol: "USDC",
  },
};

// 主要节点
export const RPC_PROVIDERS = {
  [MINATO_MAINNET]: [
    "https://rpc.soneium.org",
  ],
  [MINATO_TESTNET]: [
    "https://soneium-minato.rpc.scs.startale.com?apikey=r2b4UM4EFUhY3XVDGHbV11EHK0V7puIU",
  ],
};

// 备用节点
export const FALLBACK_PROVIDERS = {
  [MINATO_MAINNET]: [
    "https://rpc.soneium.org"
  ],
  [MINATO_TESTNET]: [
    "https://soneium-minato.rpc.scs.startale.com?apikey=r2b4UM4EFUhY3XVDGHbV11EHK0V7puIU",
  ],
};

export const NETWORK_METADATA: { [chainId: number]: NetworkMetadata } = {
  [MINATO_MAINNET]: {
    chainId: "0x" + MINATO_MAINNET.toString(16),
    chainName: "Soneium",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: RPC_PROVIDERS[MINATO_MAINNET],
    blockExplorerUrls: [getExplorerUrl(MINATO_MAINNET)],
  },
  [MINATO_TESTNET]: {
    chainId: "0x" + MINATO_TESTNET.toString(16),
    chainName: "Soneium Minato Testnet",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: RPC_PROVIDERS[MINATO_TESTNET],
    blockExplorerUrls: [getExplorerUrl(MINATO_TESTNET)],
  },
};

export const getConstant = (chainId: number, key: string) => {
  if (!constants[chainId]) {
    throw new Error(`Unsupported chainId ${chainId}`);
  }

  if (!(key in constants[chainId])) {
    throw new Error(`Key ${key} does not exist for chainId ${chainId}`);
  }

  return constants[chainId][key];
};

export function getChainName(chainId: number) {
  return CHAIN_NAMES_MAP[chainId];
}

export function getFallbackRpcUrl(chainId: number): string {
  return sample(FALLBACK_PROVIDERS[chainId]);
}

export function getExplorerUrl(chainId) {
  if (chainId === MINATO_MAINNET) {
    return "https://soneium.blockscout.com/";
  } else if (chainId === MINATO_TESTNET) {
    return "https://soneium-minato.blockscout.com/";
  }
  return "https://etherscan.io/";
}

export function getTokenExplorerUrl(chainId: number, tokenAddress: string) {
  return `${getExplorerUrl(chainId)}token/${tokenAddress}`;
}

export function getHashExplorerUrl(chainId: number, hash: string) {
  return `${getExplorerUrl(chainId)}tx/${hash}`;
}
