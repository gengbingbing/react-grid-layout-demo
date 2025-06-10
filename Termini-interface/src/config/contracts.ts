import { Contract, ContractRunner, ethers, InterfaceAbi } from "ethers";

const { ZeroAddress } = ethers;

import { type Address, zeroAddress } from "viem";
import { MINATO_MAINNET, MINATO_TESTNET } from "./chains";

export const CONTRACTS = {
  [MINATO_MAINNET]: {
    SOFIA: zeroAddress,
    USDG: zeroAddress,
    Timelock: zeroAddress,
    
    // Synthetics V2 Start
    DataStore: zeroAddress,
    EventEmitter: zeroAddress,
    SubaccountRouter: zeroAddress,
    ExchangeRouter: zeroAddress,
    DepositVault: zeroAddress,
    WithdrawalVault: zeroAddress,
    OrderVault: zeroAddress,
    SyntheticsReader: zeroAddress,
    SyntheticsRouter: zeroAddress,
    // Synthetics V2 End
    
    // New Contracts
    IncentivesManager:"0xF906E8c324Ea4129DFF715723D4010eBAB34d6d0", // farm
    NATIVE_TOKEN: "0x4200000000000000000000000000000000000006", // WETH
    Faucet: "0x2d30b61f3ae45b0776cb49cb223f23f0c56bD3C9",
    Airdrop: zeroAddress,
    ReferralStorage: "0x6c638234f0323CD7A50138044cA469a614e0DfB5",
    ReferralReader: "0xCB84bC94633831356874Ea265bB2281B4c8d36cc",
    Multicall: "0xfD17439ACD9A870bD8dce12eE79D276dba217E08",
    FeeHandler: "0x7155a68969147f8f25c5Fa77d118f4f915ebB368",
    // SPLP Liquidity+Perp Contracts Start
    SPLP: "0x368986EDcB1b2Ac55282752c6881c0E4A5A6b1bE",
    DataBase: "0x08Fbea523Ae0f9E8ec9dD19D6E070659ABB7bC3a",
    StableCoinReader: "0x08a5b879DEbA28CA61927b251E0AE330B5221c89",
    LiquidityManager: "0x1513B463D72eeBA1aDCcCe3d5F5CECb3d5840b24",
    StableCoinVaultReader: "0xCe5A0A5E3F7bfa5a8EeF5F3F97FE4ef5817F6316",
    StableCoinPositionRouter: "0x5ED8Ec213361d2418151320b52a0c8FB06B9625A",
    StableCoinLiquidityRouter: "0x4e26b776B5bE25F2A8454e9Bd2C1D5146e15aBCA",
    OrderBook: "0xd8adD3010766f0fff45b838efAfA1ADAF126d2D0",
    OrderBookReader: "0x805bE0cF944E26Ec4b62cFf9e2dDEa9D84A5acAB",
    PositionManager: "0xF6337F8aBAb06F4154A0325D053AfA2A2a7511a6",
    // SPL Liquidity+Perp Contracts End
    // HPLP Liquidity+Perp Contracts Start
    HPLP: "0x7a61A9ACe265FAc9f431F964100A80271D6a6eca",
    DataBaseMeme: "0xC04496593bE38a60578d924f892ad979692b623F",
    StableCoinReaderMeme: "0x9921454542f727F3E7547317e00886Ce02223c67",
    LiquidityManagerMeme: "0xBd4e7BDc66cc83D89033affEE0db9773459F8c4E",
    StableCoinVaultReaderMeme: "0x31b8E696E02a18534bfb1f441A88d318A672CCF8",
    StableCoinPositionRouterMeme: "0x644EB25f6f52ef31c93577a62f1240baC40F1b75",
    StableCoinLiquidityRouterMeme: "0xF4Ca6DdeA6eD2521f41A6Cb0fEc6666EfF765579",
    OrderBookMeme: "0x1fdF7e63884959a1A91cCb939164c615A22f8adb",
    OrderBookReaderMeme: "0x7bf34cb73Fcbf2eBF52C65041702740Bf2c05088",
    PositionManagerMeme: "0x2BeDc9D0BDd2B82657b9472d5db65044f8971434",
  },

  [MINATO_TESTNET]: {
    SOFIA: zeroAddress,
    USDG: zeroAddress,
    Timelock: zeroAddress,
  
    // Synthetics V2 Start
    DataStore: zeroAddress,
    EventEmitter: zeroAddress,
    SubaccountRouter: zeroAddress,
    ExchangeRouter: zeroAddress,
    DepositVault: zeroAddress,
    WithdrawalVault: zeroAddress,
    OrderVault: zeroAddress,
    SyntheticsReader: zeroAddress,
    SyntheticsRouter: zeroAddress,
    // Synthetics V2 End
    
    // New Contracts
    NATIVE_TOKEN: "0x4200000000000000000000000000000000000006", // WETH
    Faucet: "0x2d30b61f3ae45b0776cb49cb223f23f0c56bD3C9",
    Airdrop: "0xd3Ce3211362CFbFD241a50207EAd49038DaD1143",
    ReferralStorage: "0xebFE4f084C31a3c9643A82DEFdEb31Eaf50474F3",
    ReferralReader: "0x1fCDE51971212bE1CAf2F3DE3dCE4ABbd61e7bAA",
    IncentivesManager:"0x223f70004813C10C8fcc1e9c58FcB7dD8B1D5D18", // farm
    Multicall: "0x35AB68a3816D7b580509629D92D377C322961523",
    FeeHandler: "0xdb7bfA7Da6D07D512C8054336e8909EdC574becA",
    // SPL Liquidity+Perp Contracts Start
    SPLP: "0xD525Ad5511484944bfc622a602F56ac0C704132e",
    DataBase: "0x95F6b9798062B3b0368090638eb4B56D596fa190",
    StableCoinReader: "0xE568dbEA2494BBA1C3d929633741CfF6FfFbA00d",
    LiquidityManager: "0x79E3933A291Da7561FE9D028EF4Da236c52039E4",
    StableCoinVaultReader: "0x156dA4970F192EB1671E7Ce2B8abc19602b1e713",
    StableCoinPositionRouter: "0x84C8228b2aB96D6b2fdaEbc0C274BA4Cc33c8c2e",
    StableCoinLiquidityRouter: "0x8FDB008d7DfB5558be60EAdAC5963Ff50dBe7865",
    OrderBook: "0x69E0153DCdBad981445C12eBAEEd361fACaB2afb",
    OrderBookReader: "0xE53121CC5332EF85C745a4026F68989063DF06A1",
    PositionManager: "0x98E7ed832293db8C41D06Dca85B72B0cF9Db7486",
    // SPL Liquidity+Perp Contracts End
    // HPLP Liquidity+Perp Contracts Start
    HPLP: "0x786A5B78Df1575cE863725F7e2aD704cC995806c",
    DataBaseMeme: "0xf1Ae66985Dd71C426df2Fd58477dc343b73255b5",
    StableCoinReaderMeme: "0x322011599C89F070B95B463Fc0a09b26F07a229F",
    LiquidityManagerMeme: "0xBBdFB52344Ed979E9653f49f00aDa9D1F49b9160",
    StableCoinVaultReaderMeme: "0xf8331C7D35db5230a94b0cF7FA255d97F451628c",
    StableCoinPositionRouterMeme: "0xf3824bF59c279F25CeA32E989C37e93f4631941A",
    StableCoinLiquidityRouterMeme: "0x5b8888d69605a9ed933e07d3D2322f6f7e1679Cc",
    OrderBookMeme: "0xfdc46115B4Fc30B01a405D671f204c5047c2f26F",
    OrderBookReaderMeme: "0xd30DA3a1302b94C6333ff71FEc93691fd4fCe313",
    PositionManagerMeme: "0x0DE438F79586bFA3AdA80CE0995aFfD2f77aefa4",
    // HPLP Liquidity+Perp Contracts End
  },
};

export function getContract(chainId: number, name: string): Address {
  if (!CONTRACTS[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }

  if (!CONTRACTS[chainId][name]) {
    throw new Error(`Unknown contract "${name}" for chainId ${chainId}`);
  }

  return CONTRACTS[chainId][name];
}


function makeGetContract<T extends { abi: InterfaceAbi; connect: (address: string) => unknown }>(
  name: string,
  factory: T
) {
  return (chainId: number, provider?: ContractRunner) =>
    new Contract(getContract(chainId, name), factory.abi, provider) as unknown as ReturnType<T["connect"]>;
}

export const getZeroAddressContract = (provider?: ContractRunner) => new Contract(ZeroAddress, [], provider);

export function tryGetContract(chainId: number, name: string): string | undefined {
  return CONTRACTS[chainId]?.[name];
}
