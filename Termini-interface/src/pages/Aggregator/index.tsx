import cx from "classnames";
import "./index.scss"
import SwapBox from "./components/SwapBox";
import MyTransactions from "./components/MyTransactions";
import { useFetchTokenData, useSpotSwapOpenOrders, useDcaOpenOrders } from "./useSpotData";
import { formatAmount } from "lib/numbers";
import useSWR from "swr";
import useWallet from "lib/wallets/useWallet";
import { useEffect, useState } from "react";
import TrendingList from "./components/Trending";
import { KLineIcon, ListIcon } from "./components/icon";
import DexscreenerKline from "./components/DexscreenerFrameKline";
import TokenListTable from "./components/TokenListTable.tsx";
import { useChainId } from "lib/chains";
import { DEFAULT_FROM_TOKEN_INFO, DEFAULT_TO_TOKEN_INFO } from "./config";
import { useHistory, useParams } from 'react-router-dom';
import { MARKET, SWAP } from "./components/SwapTab";
import OrderList from "./components/orders";
import { useLocalStorageByChainId, useLocalStorageSerializeKey } from "lib/localStorage";
import { SLIPPAGE_SWAP_KEY } from "config/localStorage";
import { DEFAULT_SLIPPAGE_AMOUNT } from "config/factors";
import { usePendingTxns } from "context/PendingTxnsContext/PendingTxnsContext";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { Trans } from "@lingui/macro";
import { AggregatorSettingsModal } from "components/SettingsModal/AggregatorSettingsModal";


export default function Spot({ openSettings }) {
  const { isAggregatorSettingsVisible, setIsAggregatorSettingsVisible } = useSettings();
  const { active, signer, account } = useWallet();
  const { chainId } = useChainId();
  const [savedSlippageAmount] = useLocalStorageSerializeKey([chainId, SLIPPAGE_SWAP_KEY], DEFAULT_SLIPPAGE_AMOUNT);
  const { pendingTxns, setPendingTxns } = usePendingTxns();
  const settings = useSettings();
  const saveDeadline =  settings.saveAggregatorDeadline
  const history = useHistory();
  const [hasNewOrder, setHasNewOrder] = useState(0);
  const [orderSize, setOrderSize] = useState(0);

  const [tradeTranTypeTab, setTradeTranTypeTab] = useState('openOrders');
  const [orderActiveTab, setOrderActiveTab] = useState('limit');

  const [activeTab, setActiveTab] = useLocalStorageByChainId(
    chainId,
    "Aggregator-active-tab",
    'List'
  );
  const [activeSubTab, setActiveSubTab] = useLocalStorageByChainId(
    chainId,
    "Aggregator-active-sub-tab",
    'Trends'
  );
  const [activeTabTrade, setActiveTabTrade] = useLocalStorageByChainId(
    chainId,
    "Aggregator-active-tab-trade",
    SWAP
  );
  const [activeSubTabTrade, setActiveSubTabTrade] = useLocalStorageByChainId(
    chainId,
    "Aggregator-active-sub-tab-trade",
    MARKET
  );

  const routerParams: any = useParams();
  const tokenAId = routerParams?.tokenA?.toLocaleLowerCase();
  const tokenBId = routerParams?.tokenB?.toLocaleLowerCase();

  const { data: orders, loading } = useSpotSwapOpenOrders(chainId, account, hasNewOrder);
  const { data: DcaOrders, loading: DcaLoading } = useDcaOpenOrders(chainId, account, hasNewOrder);

  // 计算订单数量
  const limitOrderLength = orders?.orderLimit?.length || 0;
  const dcaOrderLength = DcaOrders?.orderLimit?.length || 0;

  useEffect(() => {
    let len = 0;
    if (orders?.orderLimit) {
      len = orders.orderLimit.length;
    }
    if (DcaOrders?.orderLimit) {
      len += DcaOrders.orderLimit.length;
    }
    setOrderSize(len);
  }, [orders?.orderLimit, account, DcaOrders?.orderLimit]);

  
  const { data: tokenListData } = useFetchTokenData(chainId);
  const tokenMap = tokenListData?.tokens?.reduce((acc, token) => {
    acc[token.address.toLowerCase()] = token;
    return acc;
  }, {});
  
  const { data: tokenBalance } = useSWR(
    `getETHTokenBalances:${active}`,
    {
      fetcher: async () => {
        if (!signer?.provider) return 0n;
        const address = await signer.getAddress();
        return await signer.provider.getBalance(address);
      },
    }
  );

  const routerFromInfo: any = tokenMap && tokenAId && tokenMap[tokenAId];
  const routerToInfo: any = tokenMap && tokenBId && tokenMap[tokenBId];

  const MAIN_NET_TOKEN = [{
    address: DEFAULT_FROM_TOKEN_INFO.address,
    symbol: DEFAULT_FROM_TOKEN_INFO.symbol,
    decimals: DEFAULT_FROM_TOKEN_INFO.decimals,
    logoURI: DEFAULT_FROM_TOKEN_INFO.logoURI,
    balanceBig: tokenBalance || 0n,
    balance: formatAmount(tokenBalance, 18, 4, true)
  }]

  const [fromInfo, setFromInfo] = useState({
    icon: DEFAULT_FROM_TOKEN_INFO.logoURI,
    address: DEFAULT_FROM_TOKEN_INFO.address,
    symbol: DEFAULT_FROM_TOKEN_INFO.symbol,
    decimals: DEFAULT_FROM_TOKEN_INFO?.decimals,
    balance: MAIN_NET_TOKEN[0]?.balanceBig || 0n,
  });
  const [toInfo, setToInfo] = useState({
    icon: DEFAULT_TO_TOKEN_INFO(chainId).logoURI,
    address: DEFAULT_TO_TOKEN_INFO(chainId).address,
    symbol: DEFAULT_TO_TOKEN_INFO(chainId).symbol,
    decimals: DEFAULT_TO_TOKEN_INFO(chainId).decimals,
    balance: 0n,
  });

  useEffect(() => {
    routerFromInfo && setFromInfo({
      icon: routerFromInfo?.logoURI,
      address: routerFromInfo?.address,
      symbol: routerFromInfo?.symbol,
      decimals: routerFromInfo?.decimals,
      balance: 0n,
    });
    routerToInfo && setToInfo({
      icon: routerToInfo?.logoURI,
      address: routerToInfo?.address,
      symbol: routerToInfo?.symbol,
      decimals: routerToInfo?.decimals,
      balance: 0n,
    });
  }, [routerFromInfo, routerToInfo]);

  const [currentSelectType, setCurrentSelectType] = useState("from");
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const handleCurrencySelect = (currency, type = currentSelectType) => {
    if (type === "from") {
      if(currency.address === toInfo.address) {
        const newInfo = fromInfo;
        setFromInfo(toInfo);
        setToInfo(newInfo);
        setCurrencyModalOpen(false);
        return
      }
      setFromInfo({
        icon: currency.logoURI,
        address: currency.address,
        symbol: currency.symbol,
        decimals: currency?.decimals,
        balance: currency.balanceBig || 0n,
      });
      history.push(`/swap/${currency?.address?.toLocaleLowerCase()}/${toInfo?.address?.toLocaleLowerCase()}`)
    } else {
      if(currency.address === fromInfo.address) {
        const newInfo = fromInfo;
        setFromInfo(toInfo);
        setToInfo(newInfo);
        setCurrencyModalOpen(false);
        return
      }
      setToInfo({
        icon: currency.logoURI,
        address: currency.address,
        symbol: currency.symbol,
        decimals: currency?.decimals,
        balance: currency.balanceBig || 0n,
      });
      history.push(`/swap/${fromInfo?.address?.toLocaleLowerCase()}/${currency?.address?.toLocaleLowerCase()}`)
    }
    setCurrencyModalOpen(false);
  };

  const onActiveSubTabChange = (type: any) => {
    localStorage.setItem(`aggregator-active-sub-tab-${chainId}`, type);
    setActiveSubTab(type);
    setActiveTab("List");
  };
  
  const onActiveTabChange = (type: any) => {
    if (type === 'KLine') {
      setActiveSubTab("");
    } else {
      const locActiveSubTab = localStorage.getItem(`aggregator-active-sub-tab-${chainId}`);
      setActiveSubTab(locActiveSubTab || "Trends");
    }
    setActiveTab(type);
  };

  return (
    // <div className={cx("default-container page-layout mt-[3rem] md:mt-[4.5rem] mb-[4rem] items-center", {
    <div className={cx("default-container page-layout mt-[3rem] md:mt-[4.5rem] mb-[4rem] flex !flex-row max-md:!flex-col-reverse")}>
      <div className="token-list w-[calc(100%-503px)] max-md:w-full">
        <div className="flex justify-between items-center mr-[8px] max-md:mr-[0px] max-md:flex-col-reverse max-md:items-start max-md:gap-[10px]">
          <div className="flex items-center h-[50px]">
            <div 
              className={cx("homePop500 min-w-[8rem] flex items-center justify-center p-[19px] cursor-pointer", { 
                "active-tab": activeSubTab === 'Trends' 
              })} 
              style={{ 
                color: 'var(--color-text-disable)',
                fontSize:'var(--fontSize-base)'
              }}
              onClick={() => onActiveSubTabChange('Trends')}
            ><Trans>Trends</Trans></div>
            <div 
              className={cx("homePop500 min-w-[8rem] flex items-center justify-center p-[19px] cursor-pointer", { 
                "active-tab": activeSubTab === 'All' 
              })} 
              style={{ 
                color: 'var(--color-text-disable)',
                fontSize:'var(--fontSize-base)'
              }}
              onClick={() => onActiveSubTabChange('All')}
            ><Trans>All</Trans></div>
            <div 
              className={cx("homePop500 min-w-[8rem] flex items-center justify-center p-[19px] cursor-pointer", { 
                "active-tab": activeSubTab === 'Meme' 
              })} 
              style={{ 
                color: 'var(--color-text-disable)',
                fontSize:'var(--fontSize-base)'
              }}
              onClick={() => onActiveSubTabChange('Meme')}
            ><Trans>Meme</Trans></div>
            <div 
              className={cx("homePop500 min-w-[8rem] flex items-center justify-center p-[19px] cursor-pointer", { 
                "active-tab": activeSubTab === 'Favorites' 
              })} 
              style={{ 
                color: 'var(--color-text-disable)',
                fontSize:'var(--fontSize-base)'
              }}
              onClick={() => onActiveSubTabChange('Favorites')}
            ><Trans>Favorites</Trans></div>
          </div>
          <div className="flex items-center">
            <div
              className={cx("homePop500 min-w-[6rem] flex items-center justify-center py-[15px] px-[16px] cursor-pointer", { 
                "active-tab": activeTab === 'List' 
              })} 
              style={{ 
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--fontSize-sm)'
              }}
              onClick={() => onActiveTabChange('List')}
            >
              <ListIcon color={activeTab === 'List' ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
            </div>
            <div
              className={cx("homePop500 min-w-[6rem] flex items-center justify-center py-[15px] px-[16px] cursor-pointer", { 
                "active-tab": activeTab === 'KLine' 
              })} 
              style={{ 
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--fontSize-sm)'
              }}
              onClick={() => onActiveTabChange('KLine')}
            >
              <KLineIcon color={activeTab === 'KLine' ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
            </div>
          </div>
        </div>
        <div className="px-[10px] pt-[20px] pb-[10px] mr-[8px] max-md:mr-[0px] bg-[var(--color-bg-main)]">
          {
            activeTab === "List" && activeSubTab === 'Trends' && (
              <TrendingList handleCurrencySelect={handleCurrencySelect} />
            )
          }
          {
            activeTab === "List" && activeSubTab !== 'Trends' && (
              <TokenListTable type={activeSubTab} handleCurrencySelect={handleCurrencySelect} />
            )
          }
          {
            activeTab === "KLine" && (
              <div className={cx({
                "hidden": activeTab !== "KLine"
              })}>
                <DexscreenerKline address={toInfo.address} />
              </div>
            )
          }
        </div>

        <div className="flex items-center gap-[20px] mt-[10px]">
          <div 
            className={cx("homePop500 min-w-[8rem] flex items-center justify-center px-[12px] py-[16px] cursor-pointer", { 
              "active-list-tab": tradeTranTypeTab === 'openOrders' 
            })} 
            style={{ 
              color: 'var(--color-text-disable)',
              fontSize: 'var(--fontSize-sm)'
            }}
            onClick={() => setTradeTranTypeTab('openOrders')}
          ><Trans>Open Orders {orderSize ? `(${orderSize})` : ""}</Trans></div>
          <div 
            className={cx("homePop500 min-w-[8rem] flex items-center justify-center px-[12px] py-[16px] cursor-pointer", { 
              "active-list-tab": tradeTranTypeTab === 'orderHistory' 
            })} 
            style={{ 
              color: 'var(--color-text-disable)',
              fontSize: 'var(--fontSize-sm)'
            }}
            onClick={() => setTradeTranTypeTab('orderHistory')}
          ><Trans>Order History</Trans></div>
          <div 
            className={cx("homePop500 min-w-[8rem] flex items-center justify-center px-[12px] py-[16px] cursor-pointer", { 
              "active-list-tab": tradeTranTypeTab === 'myTransactions' 
            })} 
            style={{ 
              color: 'var(--color-text-disable)',
              fontSize: 'var(--fontSize-sm)'
            }}
            onClick={() => setTradeTranTypeTab('myTransactions')}
          ><Trans>My Transactions</Trans></div>
        </div>
        <div className="trade-tran-info bg-[var(--color-bg-main)] mr-[8px] max-md:mr-[0px]">
          {
            tradeTranTypeTab === "myTransactions" && (
              <MyTransactions tokenMap={tokenMap} />
            )
          }
          {
            (tradeTranTypeTab === "openOrders" || tradeTranTypeTab === "orderHistory") && (
              <OrderList 
                tokenMap={tokenMap} 
                tradeTranTypeTab={tradeTranTypeTab} 
                setTradeTranTypeTab={setTradeTranTypeTab}
                orderActiveTab={orderActiveTab} 
                setOrderActiveTab={setOrderActiveTab}
                setPendingTxns={setPendingTxns}
                loading={loading}
                orders={orders}
                setHasNewOrder={setHasNewOrder}
                hasNewOrder={hasNewOrder}
                DcaOrders={DcaOrders}
                DcaLoading={DcaLoading}
                limitOrderLength={limitOrderLength}
                dcaOrderLength={dcaOrderLength}
              />
            )
          }
        </div>
      </div>
      <div className="flex-1 max-md:w-full">
        <SwapBox
          activeTabTrade={activeTabTrade}
          setActiveTabTrade={setActiveTabTrade}
          activeSubTabTrade={activeSubTabTrade}
          setActiveSubTabTrade={setActiveSubTabTrade}
          tokenListData={tokenListData}
          saveDeadline={saveDeadline}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          savedSlippageAmount={savedSlippageAmount} 
          mainNetTokenInfo={MAIN_NET_TOKEN} 
          fromInfo={fromInfo} 
          tokenBalance={tokenBalance} 
          setFromInfo={setFromInfo} 
          toInfo={toInfo} 
          setToInfo={setToInfo} 
          currentSelectType={currentSelectType}
          setCurrentSelectType={setCurrentSelectType}
          currencyModalOpen={currencyModalOpen}
          setCurrencyModalOpen={setCurrencyModalOpen}
          handleCurrencySelect={handleCurrencySelect}
          setIsAggregatorSettingsVisible={setIsAggregatorSettingsVisible}
        />
      </div>
      <AggregatorSettingsModal isSettingsVisible={isAggregatorSettingsVisible} setIsSettingsVisible={setIsAggregatorSettingsVisible} />
    </div>
  );
}
