import "./index.scss";
import cx from "classnames";
import { t, Trans } from "@lingui/macro";
import { formatNumberKM } from "pages/Aggregator/utils";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useChainId } from "lib/chains";
import { formatAmount } from "lib/numbers";
import { callContract } from "lib/contracts";
import { ethers } from "ethers";
import useWallet from "lib/wallets/useWallet";
import { CONTRACTS_ADDRESS } from "pages/Aggregator/config";
import DCAOrderBook from "pages/Aggregator/abi/DCAOrderBook.json";
import ETHIcon from "../../images/eth.svg";
import { FiChevronRight, FiChevronDown, FiArrowRight } from "react-icons/fi";
import DcaOverView from "./DcaOverView";
import DcaTransactions from "./DcaTransactions";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { getExplorerUrl } from "config/chains";
import { LinkIcon } from "../icon";
import { useDcaOrderHistory } from "pages/Aggregator/useSpotData";
import React from "react";

export default function OpenDcaOrder(props) {
  const { tokenMap, tradeTranTypeTab, setTradeTranTypeTab, setPendingTxns, orders: openOrders, loading, hasNewOrder, setHasNewOrder } = props;
  const { chainId } = useChainId();
  const { active, signer, account } = useWallet();
  const [orders, setOrders] = useState<any>(openOrders);

  const { data: orderDcaHistoryData } = useDcaOrderHistory(chainId, account);
  
  useEffect(() => {
    if(tradeTranTypeTab === "orderHistory") {
      setOrders(orderDcaHistoryData);
    } else {
      setOrders(openOrders);
    }
  }, [tradeTranTypeTab, openOrders, orderDcaHistoryData])

  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean | string>>({});

  useEffect(() => {
    if (!orders?.orderLimit) return;
    
    const currentOrderIds = Object.values(orders.orderLimit).map((item: any) => item.id);
    
    const newExpandedInfo = { ...expandedInfo };
    let hasNewOrders = false;
    
    currentOrderIds.forEach((id: string) => {
      if (newExpandedInfo[id] === undefined) {
        newExpandedInfo[id] = false;
        newExpandedInfo[`${id}-activeTab`] = 'OverView';
        hasNewOrders = true;
      }
    });
    
    if (hasNewOrders) {
      setExpandedInfo(newExpandedInfo);
    }
  }, [orders?.orderLimit]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedInfo(prev => {
      const newState = { ...prev };
      
      Object.keys(newState).forEach(key => {
        if (!key.includes('-activeTab')) {
          newState[key] = false;
        }
      });
      
      newState[id] = !prev[id];
      
      return newState;
    });
  }, []);

  const handleChangeTab = useCallback((id: string, tab: string) => {
    setExpandedInfo(prev => ({
      ...prev,
      [`${id}-activeTab`]: tab
    }));
  }, []);

  const contract = useMemo(() => 
    new ethers.Contract(CONTRACTS_ADDRESS(chainId).DCAOrderBook, DCAOrderBook.abi, signer),
  [signer, chainId]);
  
  const handleStopAndWithdrawClick = useCallback((index: any) => {
    return callContract(chainId, contract, "cancelDCAOrder", [index], {
      value: 0n,
      successMsg: t`Order stop successfully!`,
      failMsg: t`Order stop failed!`,
      sentMsg: t`Order stop submitted!`,
      setPendingTxns,
    }).then(async (tx) => {
      await tx.wait();
    }).finally(() => {  
      setHasNewOrder(prev => prev + 1);
    });
  }, [chainId, contract, setPendingTxns, setHasNewOrder]);

  const renderActionButton = useCallback((order: any) => {
    if (tradeTranTypeTab === "openOrders") {
      return (
        <div className="flex items-center justify-between text-[var(--color-primary)] text-[var(--fontSize-sm)] cursor-pointer">
          <div onClick={(event) => { 
            event.stopPropagation(); 
            handleStopAndWithdrawClick(order.index);
          }}><Trans>Stop and Withdraw</Trans></div>
          <div 
            onClick={(event) => {
              event.stopPropagation();
              handleToggleExpand(order.id);
            }}
            className="flex items-center justify-center"
          >
            {expandedInfo[order.id] ? <FiChevronDown color="var(--color-text-tertiary)" size={20} /> : <FiChevronRight color="var(--color-text-tertiary)" size={20} />}
          </div>
        </div>
      );
    } else {
      const txUrl = getExplorerUrl(chainId) + "tx/" + order?.closeHash;
      return (
        <div className="flex items-center justify-between text-[var(--color-primary)] text-[var(--fontSize-sm)] cursor-pointer">
          {
            order.status !== "cancelled" ? (
              <div className="w-[10rem] flex justify-center items-center gap-[3px] text-[var(--color-primary)] link-btn-border !border-[var(--color-primary)]">
                {order.status === "completed" && <Trans>Completed</Trans>}
                {order.status === "empty" && <Trans>Empty</Trans>}
              </div>
            ): (
              <ExternalLink className="no-underline cursor-pointer" href={txUrl}>
                <div className={cx("w-[10rem] flex justify-center items-center gap-[3px] text-[var(--color-text-tertiary)] link-btn-border")}>
                  <div><Trans>Stopped</Trans></div>
                  { order.status === "cancelled" && <LinkIcon /> }
                </div>
              </ExternalLink>
            )
          }
          <div 
            onClick={(event) => {
              event.stopPropagation();
              handleToggleExpand(order.id);
            }}
            className="flex items-center justify-center"
          >
            {expandedInfo[order.id] ? <FiChevronDown color="var(--color-text-tertiary)" size={20} /> : <FiChevronRight color="var(--color-text-tertiary)" size={20} />}
          </div>
        </div>
      );
    } 
  }, [tradeTranTypeTab, chainId, expandedInfo, handleToggleExpand, handleStopAndWithdrawClick]);
  
  const renderOrderRow = useCallback((order: any, index: number) => {
    const { 
      tokenIn,
      tokenOut,
      id,
      amountIn,
      orderFee,
      executedIntervals,
      intervals,
    } = order;
    
    const fromInfo = tokenMap && tokenIn && tokenMap[tokenIn.id?.toLowerCase()];
    const toInfo = tokenMap && tokenOut && tokenMap[tokenOut.id?.toLowerCase()];

    const tokenInSymbol = tokenIn.id === ethers.ZeroAddress ? 'ETH' : tokenIn?.symbol;
    const tokenOutSymbol = tokenOut.id === ethers.ZeroAddress ? 'ETH' : tokenOut?.symbol;

    const tokenInLogo = tokenIn.id === ethers.ZeroAddress ? ETHIcon : fromInfo?.logoURI;
    const tokenOutLogo = tokenOut.id === ethers.ZeroAddress ? ETHIcon : toInfo?.logoURI;

    const bigAmountIn = amountIn && BigInt(amountIn);
    const bigOrderFee = orderFee && BigInt(orderFee);
    const fromTokenVal = bigAmountIn && bigOrderFee && (bigAmountIn + bigOrderFee);
    const totalDeposited = formatNumberKM(Number(formatAmount(fromTokenVal, parseInt(tokenIn.decimals), 4, false)));

    return (
      <React.Fragment key={`order-${id}-${index}`}>
        <tr className="first-tr text-[var(--fontSize-sm)] cursor-pointer text-[var(--color-text-tertiary)]" onClick={() => handleToggleExpand(id)}>
          <td className="text-[var(--color-text-tertiary)]" data-label="From/To">
            <div className="flex items-start gap-[3px] flex-col text-[var(--color-text-primary)] text-[var(--fontSize-sm)] max-md:w-[15rem]">
              <div className="flex items-center gap-[8px] ">
                <div className="flex items-center">
                  <img src={tokenInLogo} alt="from" className="w-[20px] h-[20px] rounded-full" />
                  <img src={tokenOutLogo} alt="to" className="w-[20px] h-[20px] rounded-full ml-[-5px]" />
                </div>
                <div>{tokenInSymbol}</div>
                <FiArrowRight size="13" color="var(--color-text-disable)" />
                <div>{tokenOutSymbol}</div>
              </div>
            </div>
          </td>
          <td className="text-[var(--color-text-tertiary)]" data-label="Total Deposited">
            <div className="flex items-start gap-[3px] flex-col max-md:w-[13rem]">
              <div className="text-[var(--color-text-primary)] text-[var(--fontSize-sm)]">{totalDeposited} {tokenInSymbol}</div>
            </div>
          </td>
          <td className="text-[var(--color-text-tertiary)] text-[var(--fontSize-sm)]" data-label="Total Filled">
            <div className="flex items-start max-md:w-[12rem]">
              <div className="text-[var(--fontSize-sm)] text-[var(--color-text-tertiary)]">
                <span className="text-[var(--color-text-primary)]">{executedIntervals}</span>
                <span className="text-[var(--color-text-tertiary)]">/{intervals}</span>
              </div>
            </div>
          </td>
          <td className="text-[var(--color-text-tertiary)]" data-label="action">
            {active && renderActionButton(order)}
          </td>
        </tr>
        {expandedInfo[id] && (
          <tr className="w-full">
            <td colSpan={4} className="!p-[0px]">
              <div className="sub-orders-btn h-[40px] flex items-end px-[var(--spacing-2)] gap-[var(--spacing-2)] max-md:items-center">
                <div
                  className={cx(
                    "tactics-tab-btn text-[var(--color-text-disable)] text-[var(--fontSize-sm)] homePop500 flex items-center justify-center py-[22px] cursor-pointer",
                    { "active-list-tab-btn": expandedInfo[`${id}-activeTab`] === "OverView" }
                  )}
                  onClick={() => handleChangeTab(id, "OverView")}
                >
                  <Trans>OverView</Trans>
                </div>
                <div
                  className={cx(
                    "tactics-tab-btn text-[var(--color-text-disable)] text-[var(--fontSize-sm)] homePop500 flex items-center justify-center py-[22px] cursor-pointer",
                    { "active-list-tab-btn": expandedInfo[`${id}-activeTab`] === "Transactions" }
                  )}
                  onClick={() => handleChangeTab(id, "Transactions")}
                >
                  <Trans>Transactions</Trans>
                </div>
              </div>
              <div className="h-[1px] w-full bg-[var(--color-border)]"></div>
              {
                expandedInfo[`${id}-activeTab`] === "OverView" && (
                  <DcaOverView order={order} totalDeposited={fromTokenVal} />
                )
              }
              {
                expandedInfo[`${id}-activeTab`] === "Transactions" && (
                  <DcaTransactions order={order} tokenMap={tokenMap} tradeTranTypeTab={tradeTranTypeTab} />
                )
              }
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }, [active, expandedInfo, handleChangeTab, handleToggleExpand, renderActionButton, tokenMap, tradeTranTypeTab]);
  
  return (
    <div className="order-list-table pb-[10px]">
      <div className="table-wrapper relative px-[var(--spacing-3)]">
        <table className="token--table token--table-dca">
          <thead>
            <tr>
              <th className="table-head w-[13rem]" scope="col">
                <Trans>From/To</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Trans>Total Deposited</Trans>
              </th>
              <th className="table-head w-[8rem]" scope="col">
                <Trans>Total Filled</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {orders?.orderLimit?.map(renderOrderRow)}
          </tbody>
        </table>
        {!orders?.orderLimit?.length && loading &&
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-disable)] text-center w-full'><Trans>loading...</Trans></div>
        }
        {!orders?.orderLimit?.length && !loading &&
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-disable)] text-center w-full'><Trans>No order data here.</Trans></div>
        }
      </div>
    </div>
  );
} 