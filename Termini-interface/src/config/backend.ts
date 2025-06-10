import { MINATO_MAINNET } from "./chains";
import { APP_CONFIG } from "config/constants";

export function getServerBaseUrl(chainId: number) {
  if (!chainId) {
    throw new Error("chainId is not provided");
  }

  if (document.location.hostname.includes("deploy-preview")) {
    const fromLocalStorage = localStorage.getItem("SERVER_BASE_URL");
    if (fromLocalStorage) {
      return fromLocalStorage;
    }
  }

  return chainId? APP_CONFIG[chainId].REACT_APP_RPC_URL_BACK : APP_CONFIG[MINATO_MAINNET].REACT_APP_RPC_URL_BACK
}

export function getServerUrl(chainId: number, path: string) {
  return `${getServerBaseUrl(chainId)}${path}`;
}
