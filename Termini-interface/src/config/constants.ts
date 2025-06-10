import { USD_DECIMALS } from "config/factors";
import { expandDecimals } from "lib/numbers";
import { MINATO_MAINNET, MINATO_TESTNET } from "./chains";
import { SELECTED_NETWORK_LOCAL_STORAGE_KEY } from "./localStorage";

export const HIGH_SPREAD_THRESHOLD = expandDecimals(1, USD_DECIMALS) / 100n; // 1%;
export const HIGH_TRADE_VOLUME_FOR_FEEDBACK = expandDecimals(3_000_000, 30); // 2mx
export const HIGH_LIQUIDITY_FOR_FEEDBACK = expandDecimals(1_000_000, USD_DECIMALS); // 1m

export const DAY_OF_THE_WEEK_EPOCH_STARTS_UTC = 3;

const MINATO_MAINNET_CONFIG = {
  Twitter: "https://x.com/Termini_one",
  DOCS_URL: "http://docs.termini.xyz",
  Substack: "",
  Github: "https://github.com/TerminiLabs",
  Mirror: "https://mirror.xyz/0x36BCA57129c380A724D3E866b6809be730a2D57c",
  Telegram: "",
  Discord: "https://discord.gg/w9PPQ5aQhT",
  Media: "",
  ListToken: "",
  REACT_APP_NETWORK_TYPE: "prod",
  REACT_APP_SUBGRAPH_URL: "https://api.goldsky.com/api/public/project_cm2inuu3kpcos01vu5gn604of/subgraphs",
  REACT_APP_API_URL: "https://dapp.sonefi.xyz/api/v1",
  REACT_APP_HOST_URL: "https://dapp.sonefi.xyz",
}
export const APP_CONFIG = {
  default: MINATO_MAINNET_CONFIG,
  [MINATO_MAINNET]: MINATO_MAINNET_CONFIG,
  [MINATO_TESTNET]: {
    Twitter: "https://x.com/Termini_one",
    DOCS_URL: "http://docs.termini.xyz",
    Substack: "",
    Github: "https://github.com/TerminiLabs",
    Mirror: "https://mirror.xyz/0x36BCA57129c380A724D3E866b6809be730a2D57c",
    Telegram: "",
    Discord: "https://discord.gg/w9PPQ5aQhT",
    Media: "",
    ListToken: "",
    REACT_APP_NETWORK_TYPE: "dev",
    REACT_APP_SUBGRAPH_URL: "https://api.goldsky.com/api/public/project_cm2inuu3kpcos01vu5gn604of/subgraphs",
    REACT_APP_API_URL: "https://testdev.sonefi.xyz/api/v1",
    REACT_APP_HOST_URL: "https://testdev.sonefi.xyz",
  },
}

export function isDev(chainId) {
  if(!chainId) {
    chainId = parseInt(localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY) || "");
  }
  const type = chainId ? APP_CONFIG[chainId].REACT_APP_NETWORK_TYPE : APP_CONFIG.default.REACT_APP_NETWORK_TYPE
  return type === "dev";
}
export const getChainData = (chainId) => {
  const data = chainId ? APP_CONFIG[chainId] : APP_CONFIG.default
  return data ? data : APP_CONFIG.default
}