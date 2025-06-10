import "./index.scss";
import cx from "classnames";
import { t, Trans } from "@lingui/macro";
import { formatDecimalWithSubscript, formatNumberKM, formatTimestamp } from "pages/Aggregator/utils";
import { useEffect, useState, useMemo } from "react";
import { useChainId } from "lib/chains";
import { formatAmount, formatNumberWithCommas } from "lib/numbers";
import Tooltip from "components/Tooltip/Tooltip";
import OrderEditor from "./OrderEditor";
import { getLimitMarketPrice } from "pages/Aggregator/useSpotData";
import { callContract } from "lib/contracts";
import { ethers } from "ethers";
import useWallet from "lib/wallets/useWallet";
import { CONTRACTS_ADDRESS, NATIVE_TOKEN } from "pages/Aggregator/config";
import LimitOrderBook from "pages/Aggregator/abi/LimitOrderBook.json";
import ETHIcon from "../../images/eth.svg";

export default function OpenOrder(props) {
  const { tokenMap, tradeTranTypeTab, setTradeTranTypeTab, setPendingTxns, orders, loading, hasNewOrder, setHasNewOrder } = props;
  const { chainId } = useChainId();
  const { active, signer, account } = useWallet();
  const [isVisible, setIsVisible] = useState(false);
  const [currentEditOrder, setCurrentEditOrder] = useState(null);
  const [currentTokenPrice, setCurrentTokenPrice] = useState<any>(null);
  
  const getAddress = (address) => {
    return address === ethers.ZeroAddress ? NATIVE_TOKEN : address;
  };

  const contract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(
      CONTRACTS_ADDRESS(chainId).LimitOrderBook,
      LimitOrderBook.abi,
      signer
    );
  }, [signer]);

  const handleEditClick = async (order: any) => {
    try {
      setCurrentEditOrder(order);
      setIsVisible(true);
      
      const { data } = await getLimitMarketPrice(chainId, {
        fromToken: getAddress(order?.tokenOut?.id),
        toToken: getAddress(order?.tokenIn?.id),
      });
      
      const amountOut = formatAmount(data?.amountOut, order?.tokenIn?.decimals, 8, false) || '0';
      const amountIn = formatAmount(data?.amountIn, order?.tokenOut?.decimals, 8, false) || '0';
      const marketPrice = (Number(amountOut) / Number(amountIn)) || 0;
      
      if (marketPrice) {
        setCurrentTokenPrice(marketPrice.toFixed(8));
      }
    } catch (error) {
      console.error('Error fetching market price:', error);
    }
  };

  const handleCancelClick = async (index: any) => {
    if (!contract) {
      console.error('Contract not initialized');
      return;
    }

    try {
      const tx = await callContract(chainId, contract, "cancelLimitOrder", [index], {
        value: 0n,
        successMsg: t`Order cancel successfully!`,
        failMsg: t`Order cancel failed!`,
        sentMsg: t`Order cancel submitted!`,
        setPendingTxns,
      });

      await tx.wait();
      setHasNewOrder(prev => prev + 1);
    } catch (error) {
      console.error('Cancel order error:', error);
    }
  };
  
  const renderActionButton = (order: any) => {
    if (tradeTranTypeTab === "openOrders") {
      return (
        <div className="flex items-center gap-[var(--spacing-3)] text-[var(--color-primary)] cursor-pointer">
          <div onClick={() => handleCancelClick(order.index)}><Trans>Cancel</Trans></div>
          {
            Number(order?.amountInConsumedValue) > 0 ? (
              <Tooltip
                position="bottom"
                className="text-[var(--color-primary)] cursor-no-drop"
                handle={<Trans>Edit</Trans>}
                renderContent={() => {
                  return (
                    <div className="text-[var(--color-text-tertiary)]">
                        Orders with Total filled greater than 0 cannot be edited.
                      </div>
                    );
                  }}
                />
              ) : (
              <div onClick={() => handleEditClick(order)}><Trans>Edit</Trans></div>
            )
          }
        </div>
      );
    }
  }
  
  const renderOrderRow = (order: any) => {
    const { 
      tokenIn,
      tokenOut,
      amountInValue,
      amountOutValue,
      amountInConsumedValue,
      triggerPrice,
      id,
      deadline
    } = order;

    const fromInfo = tokenMap?.[tokenIn.id?.toLowerCase()];
    const toInfo = tokenMap?.[tokenOut.id?.toLowerCase()];
    const filledRate = amountInConsumedValue && amountInValue ? 
      (amountInConsumedValue / amountInValue * 100) : 0;

    const tokenInSymbol = tokenIn.id === ethers.ZeroAddress ? 'ETH' : tokenIn?.symbol;
    const tokenOutSymbol = tokenOut.id === ethers.ZeroAddress ? 'ETH' : tokenOut?.symbol;
    const tokenInLogo = tokenIn.id === ethers.ZeroAddress ? ETHIcon : fromInfo?.logoURI;
    const tokenOutLogo = tokenOut.id === ethers.ZeroAddress ? ETHIcon : toInfo?.logoURI;

    const fromValText = amountInValue < 0.0001 ? 
      formatDecimalWithSubscript(Number(amountInValue)) : 
      amountInValue > 1000 ? 
        formatNumberKM(amountInValue, true, 2) : 
        formatNumberWithCommas(amountInValue, 4);

    const toValText = amountOutValue < 0.0001 ? 
      formatDecimalWithSubscript(Number(amountOutValue)) : 
      amountOutValue > 1000 ? 
        formatNumberKM(amountOutValue, true, 2) : 
        formatNumberWithCommas(amountOutValue, 4);

    const triggerPriceText = triggerPrice < 0.001 ? 
      formatDecimalWithSubscript(Number(triggerPrice)) : 
      formatNumberWithCommas(triggerPrice, 2);

    return (
      <tr className="cursor-pointer text-[var(--color-text-secondary)]" key={id}>
        <td className="text-[var(--color-text-secondary)]" data-label="From/To">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col text-[var(--color-text-secondary)] max-md:w-[15rem]">
            <div className="flex gap-[var(--spacing-1)] items-center">
              <img src={tokenInLogo} alt="from" className="w-[20px] h-[20px] rounded-full" />
              <div className="flex gap-[var(--spacing-1)] ml-2">
                <span className="text-[var(--color-web3-red)]">{fromValText}</span>
                {tokenInSymbol}
              </div>
            </div>
            <div className="flex gap-[var(--spacing-1)] items-center">
              <img src={tokenOutLogo} alt="to" className="w-[20px] h-[20px] rounded-full" />
              <div className="flex gap-[var(--spacing-1)] ml-2">
                <span className="text-[var(--color-web3-green)]">{toValText}</span>
                {tokenOutSymbol}
              </div>
            </div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Trigger Price">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col max-md:w-[13rem]">
            <div className="text-[var(--color-text-primary)]">{triggerPriceText}</div>
            <div className="text-[var(--color-text-tertiary)]">{tokenInSymbol} per {tokenOutSymbol}</div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Expiry">
          <div className="flex items-center text-[var(--color-text-tertiary)]">
            {deadline !== 0 ? formatTimestamp(deadline) : "Never"}
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="Total Filled">
          <div className="flex items-start gap-[var(--spacing-1)] flex-col max-md:w-[16rem]">
            <div className="text-[var(--color-text-primary)]">({filledRate?.toFixed(2) || "0"}%)</div>
            <div className="text-[var(--color-text-tertiary)]">
              {formatNumberKM(amountInConsumedValue, true, 2)}/
              {formatNumberKM(amountInValue, true, 2)} {tokenInSymbol}
            </div>
          </div>
        </td>
        <td className="text-[var(--color-text-secondary)]" data-label="action">
          {active && renderActionButton(order)}
        </td>
      </tr>
    );
  };

  return (
    <div className="order-list-table">
      <div className={cx("table-wrapper relative px-[var(--spacing-3)]")}>
        <table className="token--table">
          <thead>
            <tr>
              <th className="table-head w-[13rem]" scope="col">
                <Trans>From/To</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Tooltip
                  position="bottom"
                  className="text-[var(--color-text-disable)] cursor-no-drop"
                  handle={<Trans>Trigger Price</Trans>}
                  renderContent={() => {
                    return (
                      <div className="text-[#A3A3A3]">
                        <Trans>Your order will only execute if the price reaches a level where your desired token amount can be fully swapped. This may differ from the displayed market price due to liquidity conditions. </Trans>
                      </div>
                    );
                  }}
                />
              </th>
              <th className="table-head w-[8rem]" scope="col">
                <Trans>Expiry</Trans>
              </th>
              <th className="table-head w-[13rem]" scope="col">
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
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'><Trans>loading...</Trans></div>
        }
        {!orders?.orderLimit?.length && !loading &&
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'>{t`No order data here.`}</div>
        }
      </div>
      <OrderEditor
        signer={signer as any}
        isVisible={isVisible}
        setIsVisible={setIsVisible}
        order={currentEditOrder}
        currentTokenPrice={currentTokenPrice}
        setPendingTxns={setPendingTxns}
        hasNewOrder={hasNewOrder}
        setHasNewOrder={setHasNewOrder}
      />
    </div>
  );
}
