import Token from "abis/Token.json";
import { useMulticall } from "lib/multicall";
import useWallet from "lib/wallets/useWallet";

export function useTokenBalances(chainId: number, tokensAddress: string[]): any {
  const { account } = useWallet();

  const { data, error } = useMulticall(chainId, "useTokenBalances", {
    key: account && tokensAddress?.length > 0 ? [account] : null,
    request: () => {
      if (!tokensAddress || !account) return {};
      
      return tokensAddress
        .filter(Boolean)
        .reduce((acc, address) => {
          const normalizedAddress = address.toLowerCase();
          acc[normalizedAddress] = {
            contractAddress: address,
            abi: Token.abi,
            calls: {
              balance: {
                methodName: "balanceOf",
                params: [account],
              },
            },
          };
          return acc;
        }, {});
    },
    parseResponse: (res) => {
      if (!res?.data) return {};
      
      return Object.keys(res.data).reduce((tokenBalances: { [key: string]: bigint }, tokenAddress) => {
        try {
          const balance = res.data[tokenAddress]?.balance?.returnValues?.[0];
          tokenBalances[tokenAddress.toLowerCase()] = balance ? BigInt(balance) : 0n;
        } catch (error) {
          console.error(`Error parsing balance for ${tokenAddress}:`, error);
          tokenBalances[tokenAddress.toLowerCase()] = 0n;
        }
        return tokenBalances;
      }, {});
    },
  });

  if (error) {
    console.error("Token balances error:", error);
  }

  return {
    balancesData: data || {},
  };
}