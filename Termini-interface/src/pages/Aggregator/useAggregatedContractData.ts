import { useMulticall } from "lib/multicall";
import LimitOrderBook from "./abi/LimitOrderBook.json";
import DCAOrderBook from "./abi/DCAOrderBook.json";
import { CONTRACTS_ADDRESS } from "./config";
import { ethers } from "ethers";

// 定义完整的配置信息接口
interface OrderConfigInfo {
  minExecuteFee: bigint;
  orderFeeRate: bigint;
  currentNumberOfOrders: bigint;
  maximumNumberOfOrders: bigint;
  currentNumberOfOrdersDCA: bigint;
  maximumNumberOfOrdersDCA: bigint;
  minExecuteFeePerIntervalDCA: bigint;
  orderFeeRateDCA: bigint;
  feeToDCA: bigint;
  minIntervalsDCA: bigint;
  maxIntervalsDCA: bigint;
  minIntervalDurationDCA: bigint;
  maxIntervalDurationDCA: bigint;
  timeWindowToleranceDCA: bigint;
}

interface MultiCallResponse {
  data: {
    orderLimitConfigInfo: {
      minExecuteFee: { returnValues: [string] };
      orderFeeRate: { returnValues: [string] };
      currentNumberOfOrders: { returnValues: [string] };
      maximumNumberOfOrders: { returnValues: [string] };
    };
    orderDCAConfigInfo: {
      config: { returnValues: [string, string, string, string, string, string, string, string, string, string] };
    };
  };
}

export function useAggregatedContractData(chainId: number, account: string | null | any): {
  data: OrderConfigInfo;
} {
  const LimitOrderBookAddress = CONTRACTS_ADDRESS(chainId).LimitOrderBook;
  const DCAOrderBookAddress = CONTRACTS_ADDRESS(chainId).DCAOrderBook;

  const { data } = useMulticall(chainId, "useAggregatedContractData", {
    key: account ? [account] : null,
    request: () => ({
      orderLimitConfigInfo: {
        contractAddress: LimitOrderBookAddress,
        abi: LimitOrderBook.abi,
        calls: {
          minExecuteFee: {
            methodName: "minExecuteFee",
            params: [],
          },
          orderFeeRate: {
            methodName: "orderFeeRate",
            params: [],
          },
          currentNumberOfOrders: {
            methodName: "currentNumberOfOrders",
            params: [],
          },
          maximumNumberOfOrders: {
            methodName: "maximumNumberOfOrders",
            params: [],
          },
        },
      },
      orderDCAConfigInfo: {
        contractAddress: DCAOrderBookAddress,
        abi: DCAOrderBook.abi,
        calls: {
          config: {
            methodName: "config",
            params: [],
          },
        },
      },
    }),
    parseResponse: (res: MultiCallResponse | any) => {
      try {
        return {
          minExecuteFee: BigInt(res.data.orderLimitConfigInfo.minExecuteFee.returnValues[0]),
          orderFeeRate: BigInt(res.data.orderLimitConfigInfo.orderFeeRate.returnValues[0]),
          currentNumberOfOrders: BigInt(res.data.orderLimitConfigInfo.currentNumberOfOrders.returnValues[0]),
          maximumNumberOfOrders: BigInt(res.data.orderLimitConfigInfo.maximumNumberOfOrders.returnValues[0]),
          currentNumberOfOrdersDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[0]),
          maximumNumberOfOrdersDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[1]),
          minExecuteFeePerIntervalDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[2]),
          orderFeeRateDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[3]),
          feeToDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[4]),
          minIntervalsDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[5]),
          maxIntervalsDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[6]),
          minIntervalDurationDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[7]),
          maxIntervalDurationDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[8]),
          timeWindowToleranceDCA: BigInt(res.data.orderDCAConfigInfo.config.returnValues[9]),
        };
      } catch (error) {
        console.error('Error parsing multicall response:', error);
        return {
          minExecuteFee: 0n,
          orderFeeRate: 0n,
          currentNumberOfOrders: 0n,
          maximumNumberOfOrders: 0n,
          currentNumberOfOrdersDCA: 0n,
          maximumNumberOfOrdersDCA: 0n,
          minExecuteFeePerIntervalDCA: 0n,
          orderFeeRateDCA: 0n,
          feeToDCA: 0n,
          minIntervalsDCA: 0n,
          maxIntervalsDCA: 0n,
          minIntervalDurationDCA: 0n,
          maxIntervalDurationDCA: 0n,
          timeWindowToleranceDCA: 0n,
        };
      }
    },
  });

  // 返回数据，如果 data 为空则返回默认值
  return {
    data: data || {
      minExecuteFee: 0n,
      orderFeeRate: 0n,
      currentNumberOfOrders: 0n,
      maximumNumberOfOrders: 0n,
      currentNumberOfOrdersDCA: 0n,
      maximumNumberOfOrdersDCA: 0n,
      minExecuteFeePerIntervalDCA: 0n,
      orderFeeRateDCA: 0n,
      feeToDCA: 0n,
      minIntervalsDCA: 0n,
      maxIntervalsDCA: 0n,
      minIntervalDurationDCA: 0n,
      maxIntervalDurationDCA: 0n,
      timeWindowToleranceDCA: 0n,
    },
  };
}