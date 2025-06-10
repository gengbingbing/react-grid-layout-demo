import { MINATO_MAINNET, MINATO_TESTNET } from "./chains";
import { getSubgraphUrlKey } from "./localStorage";
import { APP_CONFIG,isDev } from './constants'
const SUBGRAPH_URLS = {
  [MINATO_MAINNET]: {
    aggregatorSwap: APP_CONFIG[MINATO_MAINNET].REACT_APP_SUBGRAPH_URL + "/termini-soneium-mainnet/v1.0.0/gn", // Aggregator Swap
    aggregatorLimitOrder: APP_CONFIG[MINATO_MAINNET].REACT_APP_SUBGRAPH_URL + "/order-limit-soneium-mainnet/v1.0.0/gn", // Aggregator Limit
    aggregatorDcaOrder: APP_CONFIG[MINATO_MAINNET].REACT_APP_SUBGRAPH_URL + "/strategy-dca-soneium-mainnet/v1.0.0/gn", // Aggregator DCA
  },

  [MINATO_TESTNET]: {
    aggregatorSwap: APP_CONFIG[MINATO_TESTNET].REACT_APP_SUBGRAPH_URL + "/termini-soneium-minato/v1.0.0/gn", // Aggregator Swap
    aggregatorLimitOrder: APP_CONFIG[MINATO_TESTNET].REACT_APP_SUBGRAPH_URL + "/order-limit-soneium-minato/v1.0.0/gn", // Aggregator Limit
    aggregatorDcaOrder: APP_CONFIG[MINATO_TESTNET].REACT_APP_SUBGRAPH_URL + "/strategy-dca-soneium-minato/v1.0.0/gn", // Aggregator DCA
  },
};

export function getSubgraphUrl(chainId: number, subgraph: string): string | undefined {
  if (isDev(chainId)) {
    const localStorageKey = getSubgraphUrlKey(chainId, subgraph);
    const url = localStorage.getItem(localStorageKey);
    if (url) {
      // eslint-disable-next-line no-console
      console.warn("%s subgraph on chain %s url is overriden: %s", subgraph, chainId, url);
      return url;
    }
  }

  return SUBGRAPH_URLS?.[chainId]?.[subgraph];
}
