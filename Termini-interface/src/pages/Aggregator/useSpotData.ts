import { MINATO_TESTNET } from "config/chains";
import { getChainData } from 'config/constants'
import { getSubgraphUrl } from "config/subgraph";
import graphqlFetcher from "lib/graphqlFetcher";
import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

const aggregatorTradeHistoryQuery = (address: string) => {
  const res = `
    query historyQuery {
      swapUsers (
        where: {
          id: "${address.toLowerCase()}"
        }
      ) {
        id 
        count
        swap (
          first: 100
          skip: 0
          orderBy: swapUserIndex
          orderDirection: desc
        ) {
          id
          swapUserIndex 
          timestamp
          recipient
          tokenIn {
            id 
            name
            symbol
            decimals
          }
          tokenOut {
            id
            name
            symbol
            decimals
          }
          amountIn 
          amountOut 
          fee       
          slippageFeeCollectorAmount 
          slippageUserAmount 
        }
      }
    }
  `;
  return res;
};
export async function getSpotTradeHistory(chainId: any, address: any) {
  const subgraphUrl = getSubgraphUrl(chainId, "aggregatorSwap");
  if (!subgraphUrl) return undefined;
  const results = await graphqlFetcher(subgraphUrl, aggregatorTradeHistoryQuery(address));

  return results
}

export function useSpotTradeHistory(chainId: any, address: any) {
  const [loading, setLoading] = useState<boolean>(false)
  const { data } = useSWR(["useSpotTradeHistory", chainId, address], {
    fetcher: async () => {
      try {
        setLoading(true)
        const result: any = await getSpotTradeHistory(chainId, address);
        return result?.swapUsers;
      } catch (error) {
        setLoading(false)
      } finally {
        setLoading(false)
      }
    },
    refreshInterval: 1000 * 10
  });

  const [result, setResult] = useState<any>({
    count: 0,
    swap: [],
  });
  useEffect(() => {
    if (!data || !data.length) {
      setResult({
        count: 0,
        swap: [],
      });
      return;
    };
    setResult({
      count: data[0].count,
      swap: data[0].swap,
    });
  }, [data]);

  return { data: result, loading };
}

export function useFetchTokenData(chainId) {
  const [data, setData] = useState<any[]>([]);
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/token/list_raw`;
  const fetcher = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const jsonData = await response.json();
      return jsonData as any
    } catch (error) {
      console.error('error===>', error);
      return null;
    }
  };

  const result = useSWR([url], fetcher, { refreshInterval: 60 * 1000 })

  useEffect(() => {
    if (result?.data?.data) {
      setData(result?.data?.data)
    }
  }, [result])
  return {
    data: {
      tokens: data || []
    }
  };
}

let abortController: any = null;
export function useSpotOutInfo(chainId, params) {
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/solver/quote`;
  const [debouncedParams, setDebouncedParams] = useState(null);
  const fetchData = async (params) => {
    if (
      params &&
      params?.fromToken?.address &&
      Number(params?.amountIn) > 0 &&
      params?.toToken?.address &&
      params?.toToken?.address !== params?.fromToken?.address
    ) {
      abortController = new AbortController();
      try {
        const response = await fetch(url, {
          signal: abortController.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenIn: params?.fromToken?.address,
            tokenOut: params?.toToken?.address,
            amountIn: params?.amountIn,
            // amountOut: "",
            exactIn: true,
          }),
        });
        const jsonData = await response.json();
        return jsonData;
      } catch (error) {
        console.error('Failed to fetch aggregator out info:', error);
        return null;
      } finally {
        abortController.abort();
      }
    } else {
      return null;
    }
  };

  // 防抖处理：延迟更新 debouncedParams
  const debouncedSetParams = useMemo(
    () =>
      debounce((params) => {
        setDebouncedParams(params);
      }, 500),
    []
  );

  // 当 params 变化时，触发防抖函数
  useEffect(() => {
    debouncedSetParams(params);
  }, [params, debouncedSetParams,chainId]);

  // 使用 useSWR 发起请求
  const { data, error, isValidating} = useSWR(
    ["useSpotOutInfo", url, debouncedParams],
    () => fetchData(debouncedParams),
    { 
      refreshInterval: 1000 * 30,
      revalidateOnFocus: false,
    }
  );

  // 组件卸载时取消防抖
  useEffect(() => {
    return () => {
      debouncedSetParams.cancel();
    };
  }, [debouncedSetParams]);

  return {
    data,
    error,
    loading: isValidating,
  };
}

export function useLimitMarketPriceInfo(chainId, params) {
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/solver/market_price`;
  const fetchData = async (params) => {
    if (
      params &&
      params?.fromToken &&
      params?.toToken &&
      params?.toToken !== params?.fromToken
    ) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenIn: params?.fromToken,
            tokenOut: params?.toToken,
          }),
        });
        const jsonData = await response.json();
        return jsonData;
      } catch (error) {
        console.error('Failed to fetch spot out info:', error);
        return null;
      }
    } else {
      return null;
    }
  };

  // 使用 useSWR 发起请求
  const { data, error, isValidating} = useSWR(
    ["useLimitMarketPriceInfo", url, params],
    () => fetchData(params),
    { 
      refreshInterval: 1000 * 30,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data?.data || {
      amountIn: 0n,
      amountOut: 0n,
    },
    error,
    loading: isValidating,
  };
}

export const getLimitMarketPrice = async (chainId, params) => {
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/solver/market_price`;
  if (
    params &&
    params?.fromToken &&
    params?.toToken &&
    params?.toToken !== params?.fromToken
  ) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenIn: params?.fromToken,
          tokenOut: params?.toToken,
        }),
      });
      const jsonData = await response.json();
      return jsonData;
    } catch (error) {
      console.error('Failed to fetch spot out info:', error);
      return null;
    }
  } else {
    return null;
  }
}

export function useSpotTokenList(type, chainId, { tag="all", orderType, sortType, pageSize = 100, pageNum = 1, keyword = "" }) {
  const [loading, setLoading] = useState<boolean>(false)
  const [init, setInit] = useState(false)
  const params = useMemo(() => {
    const orderBy = orderType
    const orderDesc = sortType === 'asc' ? false : true
    return {
      tag,
      pageNum,
      pageSize,
      orderBy,
      orderDesc,
      keyword
    }
  }, [tag, orderType, pageSize, pageNum, sortType, keyword])
  const buildQueryParams = (params: any) => {
    const query = new URLSearchParams({
      tag: params.tag,
      pageNum: params.pageNum,
      pageSize: params.pageSize,
      orderBy: params.orderBy,
      orderDesc: params.orderDesc,
      keyword: params.keyword
    });

    return query.toString();
  };
  const queryParams = buildQueryParams(params);
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/token/list?${queryParams}`;
  const { data: tokenList } = useSWR(
    ["useSpotTokenList", params,chainId],
    async () => {
      try {
        setLoading(true)
        const results = await fetch(url)
        return results.json();
      } catch (error) {
        return null
      } finally {
        setLoading(false)
        if (!init) {
          setInit(true)
        }
      }
    },
    {
      refreshInterval: 30 * 1000,
    }
  );
  const [pageList, setPageList] = useState<any>([]);

  useEffect(() => {
    if (!tokenList?.data?.list) {
      return;
    }
    setPageList(tokenList?.data?.list || [])
  }, [tokenList])

  return {
    init,
    loading,
    count: tokenList?.data?.count || 0,
    data: pageList
  };
}

export function useSpotTrendsTokenList(chainId) {
  const [loading, setLoading] = useState<boolean>(false)
  const [init, setInit] = useState(false)
  const hostUrl = getChainData(chainId)?.REACT_APP_HOST_URL
  const url = `${hostUrl}/api/Aggregator/${chainId}/trends/list`;
  const { data: tokenList } = useSWR(
    ["useSpotTrendsTokenList", url],
    async () => {
      try {
        setLoading(true)
        const results = await fetch(url)
        return results.json();
      } catch (error) {
        return null
      } finally {
        setLoading(false)
        if (!init) {
          setInit(true)
        }
      }
    },
    {
      refreshInterval: 30 * 1000,
    }
  );
  const [pageList, setPageList] = useState<any>([]);

  useEffect(() => {
    if (!tokenList?.data) {
      return;
    }
    setPageList(tokenList?.data || [])
  }, [tokenList])

  return {
    init,
    loading,
    data: pageList
  };
}

// orders: open/history
const spotSwapOrderQuery = (address: string, type: string) => {
  const whereCondition = type === 'no_status' ? '{status_not: running}' : '{status: running}';
  const orderBy = type === 'no_status' ? 'closeTimestamp' : 'createTimestamp';
  const res = `
    query openOrdersQuery {
      orderLimitUsers (
        where: {
          id: "${address.toLowerCase()}"
        }
      ) {
        id 
        countOpen
        countHistory
        orderLimit (
          first: 500
          orderBy: ${orderBy}
          skip: 0
          orderDirection: desc
          where: ${whereCondition}
        ) {
          index
          id
          amountInValue
          amountInConsumedValue
          amountOutValue
          triggerPrice
          status 
          deadline
          createHash
          createTimestamp
          closeHash
          closeTimestamp
          execution (
            orderBy: timestamp
            orderDirection: asc
          ) {
            id
            timestamp
          }
          tokenIn {
            id
            symbol
            decimals
          }
          tokenOut {
            id
            symbol
            decimals
          }
        }
      }
    }
  `;
  return res;
};

export async function getSpotSwapOrders(chainId, address: any, type: string) {
  const subgraphUrl = getSubgraphUrl(chainId, "aggregatorLimitOrder");
  if (!subgraphUrl) return undefined;
  const results = await graphqlFetcher(subgraphUrl, spotSwapOrderQuery(address, type));

  return results
}

export function useSpotSwapOpenOrders(chainId: any, address: any, hasNewOrder: number) {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  
  const { data } = useSWR(address ? ["useSpotSwapOpenOrders", chainId, address, hasNewOrder] : null, {
    fetcher: async () => {
      if (!address) return { orderLimit: [] }; 
      try {
        // 只在初次加载或有新订单时显示 loading
        if (!initialLoadComplete || hasNewOrder > 0) {
          setLoading(true);
        }
        
        const result: any = await getSpotSwapOrders(chainId, address, 'status');
        return result?.orderLimitUsers;
      } catch (error) {
        console.error("Error fetching spot swap orders:", error);
        return null;
      } finally {
        setLoading(false);
        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      }
    },
    refreshInterval: 1000 * 5,
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
    keepPreviousData: true
  });

  const [result, setResult] = useState<any>({
    orderLimit: [],
  });
  
  useEffect(() => {
    if (address && data && data[0]?.orderLimit) {
      setResult({
        orderLimit: data[0].orderLimit || [],
      });
    } else {
      setResult({
        orderLimit: [],
      });
    }
  }, [address, data]);

  return { 
    data: result, 
    loading,
    initialLoadComplete 
  };
}
export function useSpotSwapOrderHistory(chainId: any, address: any) {
  const [loading, setLoading] = useState<boolean>(false)
  const { data } = useSWR(address ? ["useSpotSwapOrderHistory", chainId, address] : null, {
    fetcher: async () => {
      if (!address) return { orderLimit: [] };
      try {
        setLoading(true)
        const result: any = await getSpotSwapOrders(chainId, address, 'no_status');
        return result?.orderLimitUsers;
      } catch (error) {
        setLoading(false)
      } finally {
        setLoading(false)
      }
    },
    refreshInterval: 1000 * 30
  });

  const [result, setResult] = useState<any>({
    orderLimit: [],
  });
  useEffect(() => {
    setResult({
      orderLimit: data && data[0]?.orderLimit || [],
    });
  }, [address]);
  useEffect(() => {
    if (!data || !data.length) {
      return;
    };
    setResult({
      orderLimit: data[0].orderLimit,
    });
  }, [data]);

  return { data: result, loading };
}

// DCA orders: open/history
const DcaOrderQuery = (address: string, type: string) => {
  const whereCondition = type === 'no_status' ? '{status_not: running}' : '{status: running}';
  const orderBy = type === 'no_status' ? 'closeTimestamp' : 'createTimestamp';
  const res = `
    query openOrdersQuery {
      orderDCAUsers (
        where: {
          id: "${address.toLowerCase()}"
        }
      ) {
        id
        countOpen
        countHistory
        
        orderDCA (
          where: ${whereCondition}
          first: 500
          skip: 0
          orderBy: ${orderBy}
          orderDirection: desc
        ) {
          index
          id
          tokenIn {
            id
            symbol
            decimals
          }
          tokenOut {
            id
            symbol
            decimals
          }
          amountIn
          orderFee
          intervals
          intervalDuration
          remainingAmountIn
          remainingOrderFee
          filledAmountOut
          nextExecuteTime
          executedIntervals
          nextExecuteAmountIn
          nextExecuteOrderFee
          estimatedEndTime
          status
          createHash
          createTimestamp
          closeHash
          closeTimestamp
          execution (
            orderBy: timestamp
            orderDirection: desc
          ) {
          id
            timestamp
            amountIn
            orderFee
            amountOut
            type
          }
        }
      }
    }
  `;
  return res;
};

export async function getDcaOrders(chainId: any, address: any, type: string) {
  const subgraphUrl = getSubgraphUrl(chainId, "aggregatorDcaOrder");
  if (!subgraphUrl) return undefined;
  const results = await graphqlFetcher(subgraphUrl, DcaOrderQuery(address, type));

  return results
}

export function useDcaOpenOrders(chainId: any, address: any, hasNewOrder: number) {
  const [loading, setLoading] = useState<boolean>(false);
  
  const { data } = useSWR(address ? ["useDcaOpenOrders", chainId, address, hasNewOrder] : null, {
    fetcher: async () => {
      try {
        setLoading(true);
        const result: any = await getDcaOrders(chainId, address, 'status');
        return result?.orderDCAUsers;
      } catch (error) {
        console.error("Error fetching DCA open orders:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    },
    refreshInterval: 1000 * 5,
    dedupingInterval: 1000, // 避免短时间内重复请求
  });

  const [result, setResult] = useState<any>({
    orderLimit: [],
  });
  
  useEffect(() => {
    if (!data || !data.length) {
      setResult({
        orderLimit: [],
      });
      return;
    }
    
    
    setResult({
      orderLimit: data[0].orderDCA || [],
    });
  }, [data]);

  return { data: result, loading };
}

export function useDcaOrderHistory(chainId: any, address: any) {
  const [loading, setLoading] = useState<boolean>(false);
  
  const { data } = useSWR(address ? ["useDcaOrderHistory", chainId, address] : null, {
    fetcher: async () => {
      try {
        setLoading(true);
        const result: any = await getDcaOrders(chainId, address, 'no_status');
        return result?.orderDCAUsers;
      } catch (error) {
        console.error("Error fetching DCA order history:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    },
    refreshInterval: 1000 * 5,
    dedupingInterval: 1000, // 避免短时间内重复请求
  });

  const [result, setResult] = useState<any>({
    orderLimit: [],
  });
  
  useEffect(() => {
    if (!data || !data.length) {
      setResult({
        orderLimit: [],
      });
      return;
    }
    
    setResult({
      orderLimit: data[0].orderDCA || [],
    });
  }, [data]);

  return { data: result, loading };
}

