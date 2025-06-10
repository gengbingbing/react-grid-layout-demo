import { TokenPrices, TokensData } from "config/static/tokens";
import { expandDecimals, PRECISION } from "./numbers";
import { NATIVE_TOKEN_ADDRESS } from "config/tokens";


export function convertToContractPrice(price: bigint, tokenDecimals: number) {
  return price / expandDecimals(1, tokenDecimals);
}

export function convertToTokenAmount(
  usd: bigint | undefined,
  tokenDecimals: number | undefined,
  price: bigint | undefined
) {
  if (usd === undefined || typeof tokenDecimals !== "number" || price === undefined || price <= 0) {
    return undefined;
  }

  return (usd * expandDecimals(1, tokenDecimals)) / price;
}

export function convertToUsd(
  tokenAmount: bigint | undefined,
  tokenDecimals: number | undefined,
  price: bigint | undefined
) {
  if (tokenAmount == undefined || typeof tokenDecimals !== "number" || price === undefined) {
    return undefined;
  }

  return (tokenAmount * price) / expandDecimals(1, tokenDecimals);
}

export function getMidPrice(prices: TokenPrices) {
  return (prices.minPrice + prices.maxPrice) / 2n;
}

export function getTokenData(tokensData?: TokensData, address?: string, convertTo?: "wrapped" | "native") {
  if (!address || !tokensData?.[address]) {
    return undefined;
  }

  const token = tokensData[address];

  if (convertTo === "wrapped" && token.isNative && token.wrappedAddress) {
    return tokensData[token.wrappedAddress];
  }

  if (convertTo === "native" && token.isWrapped) {
    return tokensData[NATIVE_TOKEN_ADDRESS];
  }

  return token;
}
