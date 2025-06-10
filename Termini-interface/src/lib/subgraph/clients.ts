import { createClient } from "./utils";
import { MINATO_MAINNET, MINATO_TESTNET } from "config/chains";

export const chainlinkClient = createClient(MINATO_MAINNET, "chainLink");

export const soneiumGraphClient = createClient(MINATO_MAINNET, "stats");
export const soneiumReferralsGraphClient = createClient(MINATO_MAINNET, "referrals");
export const soneiumMinatoReferralsGraphClient = createClient(MINATO_TESTNET, "referrals");

export const soneiumSyntheticsStatsClient = createClient(MINATO_MAINNET, "syntheticsStats");
export const soneiumMinatoSyntheticsStatsClient = createClient(MINATO_TESTNET, "syntheticsStats");

export const soneiumSubsquidClient = createClient(MINATO_MAINNET, "subsquid");
export const soneiumMinatoSubsquidClient = createClient(MINATO_TESTNET, "subsquid");

// export function getReferralsGraphClient(chainId) {
//   if (chainId === MINATO_MAINNET) {
//     return soneiumReferralsGraphClient;
//   } else if (chainId === MINATO_TESTNET) {
//     return soneiumMinatoReferralsGraphClient;
//   }
//   throw new Error(`Unsupported chain ${chainId}`);
// }
