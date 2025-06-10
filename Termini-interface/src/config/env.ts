import { SUPPORTED_CHAIN_IDS } from "./chains";

export const UI_VERSION = "1.4";

export const IS_TOUCH = typeof window !== 'undefined' && 'ontouchstart' in window;
export const isWebWorker = Boolean(self.WorkerGlobalScope);
// TODO:
export const PERP_VERSION = "V0.0.2";
export const REACT_APP_HOST_URL = import.meta.env.VITE_APP_HOST_URL
export const REACT_APP_NETWORK_TYPE = import.meta.env.VITE_APP_NETWORK_TYPE

export function isLocal() {
  return window.location.host?.includes("localhost");
}


export function isDevelopment() {
  return REACT_APP_NETWORK_TYPE === 'dev'  // typeof window !== 'undefined' && (window.location.host?.includes("localhost") || window.location.host?.includes("test"));
}
