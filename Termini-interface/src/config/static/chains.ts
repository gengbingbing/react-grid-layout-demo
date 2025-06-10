/* 
  This files is used to pre-build data during the build process.
  Avoid adding client-side code here, as it can break the build process.

  However, this files can be a dependency for the client code.
*/
import { soneiumMinato, Chain, soneium } from "viem/chains";
export const MINATO_TESTNET = 1946;
export const MINATO_MAINNET = 1868;

export const SUPPORTED_CHAIN_IDS = [MINATO_MAINNET];
export const SUPPORTED_CHAIN_IDS_DEV = [...SUPPORTED_CHAIN_IDS, MINATO_TESTNET];

export const HIGH_EXECUTION_FEES_MAP = {
  [MINATO_MAINNET]: 5, // 5 USD
  [MINATO_TESTNET]: 5, // 5 USD
};

// added to maxPriorityFeePerGas
// applied to EIP-1559 transactions only
// is not applied to execution fee calculation
export const MAX_FEE_PER_GAS_MAP = {
  [MINATO_MAINNET]: 200000000000n, // 200 gwei
};

// added to maxPriorityFeePerGas
// applied to EIP-1559 transactions only
// is also applied to the execution fee calculation
export const GAS_PRICE_PREMIUM_MAP = {
  [MINATO_MAINNET]: 6000000000n, // 6 gwei
};

/*
  that was a constant value in ethers v5, after ethers v6 migration we use it as a minimum for maxPriorityFeePerGas
*/
export const MAX_PRIORITY_FEE_PER_GAS_MAP: Record<number, bigint | undefined> = {
  [MINATO_MAINNET]: 1500000000n,
  [MINATO_TESTNET]: 1500000000n,
};

export const EXCESSIVE_EXECUTION_FEES_MAP = {
  [MINATO_MAINNET]: 10, // 10 USD
  [MINATO_TESTNET]: 10, // 10 USD
};

// added to gasPrice
// applied to *non* EIP-1559 transactions only
//
// it is *not* applied to the execution fee calculation, and in theory it could cause issues
// if gas price used in the execution fee calculation is lower
// than the gas price used in the transaction (e.g. create order transaction)
// then the transaction will fail with InsufficientExecutionFee error.
// it is not an issue on Arbitrum though because the passed gas price does not affect the paid gas price.
// for example if current gas price is 0.1 gwei and UI passes 0.5 gwei the transaction
// Arbitrum will still charge 0.1 gwei per gas
//
// it doesn't make much sense to set this buffer higher than the execution fee buffer
// because if the paid gas price is higher than the gas price used in the execution fee calculation
// and the transaction will still fail with InsufficientExecutionFee
//
// this buffer could also cause issues on a blockchain that uses passed gas price
// especially if execution fee buffer and lower than gas price buffer defined bellow
export const GAS_PRICE_BUFFER_MAP = {

};

const CHAIN_BY_CHAIN_ID = {
  [MINATO_TESTNET]: soneiumMinato,
  [MINATO_MAINNET]: soneium,
};

export const getChain = (chainId: number): Chain => {
  return CHAIN_BY_CHAIN_ID[chainId];
};

export function getHighExecutionFee(chainId) {
  return HIGH_EXECUTION_FEES_MAP[chainId] ?? 5;
}

export function getExcessiveExecutionFee(chainId) {
  return EXCESSIVE_EXECUTION_FEES_MAP[chainId] ?? 10;
}

export function isSupportedChain(chainId: number, dev = false) {
  return (dev ? SUPPORTED_CHAIN_IDS_DEV : SUPPORTED_CHAIN_IDS).includes(chainId);
}

export const EXECUTION_FEE_CONFIG_V2: {
  [chainId: number]: {
    shouldUseMaxPriorityFeePerGas: boolean;
    defaultBufferBps?: number;
  };
} = {
  [MINATO_MAINNET]: {
    shouldUseMaxPriorityFeePerGas: true,
    defaultBufferBps: 1000, // 10%
  },
  [MINATO_TESTNET]: {
    shouldUseMaxPriorityFeePerGas: true,
    defaultBufferBps: 1000, // 10%
  },
};

export type ChainId = typeof MINATO_MAINNET | typeof MINATO_TESTNET
