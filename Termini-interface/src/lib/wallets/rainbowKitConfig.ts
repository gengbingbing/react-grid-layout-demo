import { getDefaultConfig, WalletList } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  coreWallet,
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  safeWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { isDevelopment } from "config/env";
import once from "lodash/once";
import { http } from "viem";
import { soneium, soneiumMinato } from "viem/chains";

import binanceWallet from "./connecters/binanceW3W/binanceWallet";

const WALLET_CONNECT_PROJECT_ID = "b57e42572e0de416bafd4ebf1650858d";
const APP_NAME = "Termini";

const popularWalletList: WalletList = [
  {
    // Group name with standard name is localized by rainbow kit
    groupName: "Popular",
    wallets: [
      metaMaskWallet,
      okxWallet,
      rabbyWallet,
      walletConnectWallet,
      // This wallet will automatically hide itself from the list when the fallback is not necessary or if there is no injected wallet available.
      injectedWallet,
      // The Safe option will only appear in the Safe Wallet browser environment.
      safeWallet,
    ],
  },
];

const othersWalletList: WalletList = [
  {
    groupName: "Others",
    wallets: [binanceWallet, coinbaseWallet, trustWallet, coreWallet],
  },
];

export const getRainbowKitConfig = once(() =>
  getDefaultConfig({
    appName: APP_NAME,
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains: [soneium, ...(isDevelopment() ? [soneiumMinato] : [])],
    transports: {
      [soneium.id]: http(),
      [soneiumMinato.id]: http(),
    },
    wallets: [...popularWalletList, ...othersWalletList],
  })
);
