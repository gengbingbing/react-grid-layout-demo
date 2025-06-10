import sample from "lodash/sample";
import random from "lodash/random";
import { MINATO_MAINNET, MINATO_TESTNET } from "./chains";

const ORACLE_KEEPER_URLS = {

  [MINATO_MAINNET]: ["https://dapp.sonefi.xyz", "https://dapp.sonefi.xyz"],

  [MINATO_TESTNET]: ["https://testdev.sonefi.xyz"],
};

export function getOracleKeeperUrl(chainId: number, index: number) {
  const urls = ORACLE_KEEPER_URLS[chainId];

  if (!urls.length) {
    throw new Error(`No oracle keeper urls for chain ${chainId}`);
  }

  return urls[index] || urls[0];
}

export function getOracleKeeperNextIndex(chainId: number, currentIndex: number) {
  const urls = ORACLE_KEEPER_URLS[chainId];

  if (!urls.length) {
    throw new Error(`No oracle keeper urls for chain ${chainId}`);
  }

  return urls[currentIndex + 1] ? currentIndex + 1 : 0;
}

export function getOracleKeeperRandomIndex(chainId: number, bannedIndexes?: number[]): number {
  const urls = ORACLE_KEEPER_URLS[chainId];

  if (bannedIndexes?.length) {
    const filteredUrls = urls.filter((url, i) => !bannedIndexes.includes(i));

    if (filteredUrls.length) {
      const url = sample(filteredUrls);
      return urls.indexOf(url);
    }
  }

  return random(0, urls.length - 1);
}
