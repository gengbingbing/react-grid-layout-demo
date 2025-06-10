import { t } from "@lingui/macro";
import cx from "classnames";
import Button from "components/Button/Button";
import Modal from "components/Modal/Modal";
import { escapeSpecialRegExpChars, inputRegex } from "components/NumberInput/NumberInput";
import { ethers } from "ethers";
import { useChainId } from "lib/chains";
import { callContract } from "lib/contracts";
import { formatAmount, parseValue } from "lib/numbers";
import LimitOrderBook from "pages/Aggregator/abi/LimitOrderBook.json";
import { CONTRACTS_ADDRESS } from "pages/Aggregator/config";
import React, { useState, useMemo, useEffect } from "react";
import { useMedia } from "react-use";

// 定义接口增强类型安全
interface TokenInfo {
  symbol: string;
  decimals: number;
}

interface Order {
  index: number;
  amountInValue: string;
  triggerPrice: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
}

interface OrderEditorProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  order: Order | null;
  signer: ethers.Signer | null;
  setPendingTxns: (txns: any) => void;
  currentTokenPrice: string | null;
  hasNewOrder: number;
  setHasNewOrder: (value: number) => void;
}

export default function OrderEditor(props: OrderEditorProps) {
  const {
    isVisible,
    setIsVisible,
    order,
    signer,
    setPendingTxns,
    currentTokenPrice: marketSwapRate,
    hasNewOrder, 
    setHasNewOrder
  } = props;
  
  const { chainId } = useChainId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapRate, setSwapRate] = useState("");

  // 使用 useMemo 优化合约实例创建
  const contract = useMemo(() => {
    if (!signer) return null;
    return new ethers.Contract(
      CONTRACTS_ADDRESS(chainId).LimitOrderBook,
      LimitOrderBook.abi,
      signer
    );
  }, [signer]);

  // 优化 swapRateChange 计算
  const swapRateChange = useMemo(() => {
    if (!swapRate || !marketSwapRate) {
      return { val: 0, str: '0%' };
    }

    const val = ((Number(swapRate) - Number(marketSwapRate)) / Number(marketSwapRate)) * 100;
    return {
      val,
      str: val > 10000 ? '>10000%' : 
           val < 0.01 && val > 0 ? '<0.01%' : 
           `${val.toFixed(2)}%`
    };
  }, [swapRate, marketSwapRate]);

  useEffect(() => {
    if (order?.triggerPrice) {
      setSwapRate(Number(order.triggerPrice).toFixed(10));
    }
  }, [order]);

  const onClickPrimary = async () => {
    if (!contract || !order?.tokenOut?.decimals) {
      console.error('Contract or token decimals not initialized');
      return;
    }

    try {
      setIsSubmitting(true);
      const toValue = Number(order.amountInValue) / Number(swapRate);
      const params = [
        order.index,
        parseValue(String(toValue), order.tokenOut.decimals),
      ];

      const tx = await callContract(chainId, contract, "updateLimitOrderAmountOut", params, {
        value: 0n, // 使用 BigInt 替代 bigNumberify
        successMsg: t`Order updated!`,
        failMsg: t`Order update failed.`,
        sentMsg: t`Order update submitted!`,
        setPendingTxns,
      });

      await tx.wait();
      
      // 成功后更新状态
      setHasNewOrder(hasNewOrder + 1);
      setIsVisible(false);
      setSwapRate("");
    } catch (error) {
      console.error('Update order error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPrimaryEnabled = () => {
    if (isSubmitting || !order || !swapRate) {
      return false;
    }

    try {
      const currentPrice = Number(order.triggerPrice).toFixed(10);
      if (swapRate === currentPrice) {
        return false;
      }

      return swapRateChange.val <= 0;
    } catch (error) {
      console.error('Error in isPrimaryEnabled:', error);
      return false;
    }
  };

  const getPrimaryText = () => {
    if (isSubmitting) {
      return t`Updating Order...`;
    }

    try {
      const currentPrice = Number(order?.triggerPrice).toFixed(8);
      if (swapRate === currentPrice) {
        return t`Enter new Price`;
      }

      if (swapRateChange.val > 0) {
        return t`Limit price is higher than market price`;
      }
      
      return t`Update Order`;
    } catch (error) {
      return t`Enter new Price`;
    }
  };

  const handleSwapRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/,/g, ".");
    if (newValue === ".") {
      newValue = "0.";
    }

    if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
      setSwapRate(newValue);
    }
  };

  const isSmall = useMedia("(max-width: 800px)");

  return (
    <Modal
      isVisible={isVisible}
      className="order-edit-modal"
      setIsVisible={() => setIsVisible(false)}
      label={t`Edit order`}
    >
      <div className="order-swap-button-container w-[36rem]">
        <div className="text-[var(--color-text-secondary)] homePop400 mt-[12px] mb-[6px]">
          When <span className="text-[var(--color-text-primary)]">{" "}1{" "}</span> 
          {order?.tokenOut?.symbol || '--'} is worth 
          <span className="text-[var(--color-text-primary)]">{" "}{(Number(swapRate).toFixed(6))}{" "}</span> 
          {order?.tokenIn?.symbol}
        </div>

        <div className="h-[101px] bg-[var(--color-bg-sub)] spot-token-input flex-1 !rounded-[var(--borderRadius-md)] flex justify-between">
          <div className="flex-1 pl-[var(--spacing-3)]">
            <div className="balance-val text-[var(--color-text-tertiary)] homePop400 mt-[var(--spacing-3)] flex gap-[var(--spacing-1)]">
              <div>{ isSmall ? 'Rate' : 'Current Rate' }</div>
              {swapRateChange.val !== 0 && (
                <div className={cx("pl-[var(--spacing-1)]", {
                  "text-[var(--color-web3-red)]": swapRateChange.val > 0,
                  "text-[var(--color-web3-green)]": swapRateChange.val < 0
                })}>
                  {swapRateChange.val > 0.01 && swapRateChange.val < 10000 ? '+' : ''}
                  {swapRateChange.str}
                </div>
              )}
            </div>
            <div className="h-[52px]">
              <input
                value={swapRate}
                type="text"
                onChange={handleSwapRateChange}
                className="p-[0px] h-[52px] text-[var(--fontSize-lg)] w-full"
                autoFocus
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="symbol flex flex-col items-end justify-center text-[var(--color-text-secondary)] homePop500 pr-[var(--spacing-3)]">
            <div className="bg-[var(--color-primary)] px-[6px] pb-[2px] pt-[3px] !rounded-[4px] text-[var(--color-black)] text-[10px] homePop400 cursor-pointer" 
              onClick={() => marketSwapRate && setSwapRate(Number(marketSwapRate).toFixed(10))}
            >{ isSmall ? 'Market' : 'Use market rate' }</div>
            <div className="text-[var(--color-text-primary)] homePop600 h-[52px] flex items-center">
              {order?.tokenIn?.symbol}
            </div>
          </div>
        </div>
        <Button 
          variant="primary-action" 
          type="primary"
          className="!w-full mt-[var(--spacing-3)]" 
          onClick={onClickPrimary} 
          disabled={!isPrimaryEnabled()}
        >
          {getPrimaryText()}
        </Button>
        {swapRateChange.val > 0 && (
          <div className="w-full flex justify-center items-center rounded-[var(--borderRadius-md)] mt-[var(--spacing-2)] px-[var(--spacing-3)] py-[var(--spacing-2)] text-[var(--color-warning)] homePop400 bg-[var(--color-warning-light)]">
            Trigger price is {swapRateChange.str} higher than market, you are buying at a much higher rate. We recommend that you use market price to swap.
          </div>
        )}
      </div>
    </Modal>
  );
}
