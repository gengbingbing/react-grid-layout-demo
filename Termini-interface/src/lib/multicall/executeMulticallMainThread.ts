import { MAX_TIMEOUT, Multicall } from "./Multicall";
import type { MulticallRequestConfig } from "./types";
import { getAbFlags } from "config/ab";
import { getCurrentRpcUrls } from "lib/rpc/bestRpcTracker";

export async function executeMulticallMainThread(chainId: number, request: MulticallRequestConfig<any>) {
  const multicall = await Multicall.getInstance(chainId, getAbFlags());
  const providerUrls = getCurrentRpcUrls(chainId);
  const isLargeAccount = false;

  try {
    return multicall?.call(providerUrls, request, MAX_TIMEOUT, isLargeAccount);
    
  } catch (error) {
    return Promise.reject(error);
  }
}
