import "../index.scss";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cx from "classnames";
import { FaChevronDown } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";

import QuickIcon from "../images/quick.svg";
import { SettingSvg, SwapTokenLightSvg, SwapTokenSvg } from "components/AppSvg"
import { t, Trans } from "@lingui/macro";
import { escapeSpecialRegExpChars, inputRegex } from "components/NumberInput/NumberInput";
import { formatAmount, parseValue } from "lib/numbers";
import Button from "components/Button/Button";
import { useChainId } from "lib/chains";
import useWallet from "lib/wallets/useWallet";
import { isSupportedChain } from "config/chains";
import { ethers } from "ethers";
import { CONTRACTS_ADDRESS, NATIVE_TOKEN } from "../config";
import useSWR from "swr";
import { callContract, contractFetcher, getGasLimit } from "lib/contracts";
import Spot from "../abi/Aggregator.json";
import LimitOrderBook from "../abi/LimitOrderBook.json";
import DCAOrderBook from "../abi/DCAOrderBook.json";
import { approveTokens } from "domain/tokens";
import { useLimitMarketPriceInfo, useSpotOutInfo } from "../useSpotData";
import { useTokenBalances } from "../useTokenBalances";
import { BASIS_POINTS_DIVISOR } from "config/factors";
import Token from "abis/Token.json";
import WETH from "abis/WETH.json";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatNumberKM, convertToSeconds } from "../utils";
import SwapMarketInfo from "./SwapMarketInfo";
import SwapTab, { DCA, LIMIT, MARKET, SWAP } from "./SwapTab";
import TokenSelectModal from "./TokenSelectModal";
import SkeletonStructureItem from "./Skeleton/SkeletonStructureItem";
import { Dropdown } from "components/Dropdown/Dropdown";
import SwapLimitInfo from "./SwapLimitInfo";
import SwapDCAInfo from "./SwapDCAInfo";
import { bigMath } from "utils/bigmath";
import { useAggregatedContractData } from "../useAggregatedContractData";
import { useMedia } from "react-use";
import { useTheme } from "context/ThemeContext";
import Tooltip from "components/Tooltip/Tooltip";
import { InfoIcon } from "./icon";

const expiryOptions = [
  // { label: "Never", value: "0" },
  { label: "1 Hour", value: "3600" },
  { label: "1 Day", value: "86400" },
  { label: "3 Days", value: "259200" },
  { label: "1 Week", value: "604800" },
]

const everyOptions = [
  { label: "Minute", value: "60" },
  { label: "Hour", value: "3600" },
  { label: "Day", value: "86400" },
]

export default function SwapPage(props: any) {
  const { themeMode } = useTheme();
  const { openConnectModal } = useConnectModal();
  const {
    saveDeadline,
    savedSlippageAmount,
    setPendingTxns,
    tokenListData,
    mainNetTokenInfo,
    tokenBalance,
    fromInfo,
    setFromInfo,
    toInfo,
    setToInfo,
    activeTabTrade,
    setActiveTabTrade,
    activeSubTabTrade,
    setActiveSubTabTrade,
    currentSelectType,
    setCurrentSelectType,
    currencyModalOpen,
    setCurrencyModalOpen,
    handleCurrencySelect,
    setIsAggregatorSettingsVisible
  } = props;
  const { chainId } = useChainId();
  const { active, signer, account } = useWallet();

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [swapRate, setSwapRate] = useState("");
  const [expiry, setExpiry] = useState(expiryOptions[0]);
  const [init, setInit] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [networkFee, setNetworkFee] = useState<bigint>(0n);
  const fromInputRef = useRef<any>(null);
  const [everyUnit, setEveryUnit] = useState(everyOptions[0]);
  const [dcaOrderValue, setDcaOrderValue] = useState("2");
  const [dcaEveryValue, setDcaEveryValue] = useState("1");

  const isSwapMarket = activeSubTabTrade === MARKET;
  const isSwapLimit = activeSubTabTrade === LIMIT;
  const isSwapDCA = activeSubTabTrade === DCA;

  const contract = new ethers.Contract(CONTRACTS_ADDRESS(chainId).aggregatorAddress, Spot.abi, signer);
  const contractLimit = new ethers.Contract(CONTRACTS_ADDRESS(chainId).LimitOrderBook, LimitOrderBook.abi, signer);
  const contractDCA = new ethers.Contract(CONTRACTS_ADDRESS(chainId).DCAOrderBook, DCAOrderBook.abi, signer);
  const contractWETH = new ethers.Contract(NATIVE_TOKEN, WETH.abi, signer);
  const deadlineFromNow = Math.ceil(Date.now() / 1000) + saveDeadline;

  const { data: { 
    minExecuteFee,
    orderFeeRate,
    currentNumberOfOrders,
    maximumNumberOfOrders,
    currentNumberOfOrdersDCA,
    maximumNumberOfOrdersDCA,
    minExecuteFeePerIntervalDCA,
    orderFeeRateDCA,
    maxIntervalsDCA,
    minIntervalDurationDCA,
  } } = useAggregatedContractData(chainId, account);

  const payAmount: any = parseValue(fromValue, fromInfo && fromInfo?.decimals);

  const tokensAddress = useMemo(() => {
    return tokenListData?.tokens?.map((item: any) => {
      return item.address.toLowerCase();
    });
  }, [tokenListData]);

  const { balancesData } = useTokenBalances(chainId, tokensAddress);

  const { balanceAllData, tokenViewData } = useMemo(() => {
    const balanceAllData = tokenListData?.tokens?.reduce(
      (acc, item) => {
        const balanceBig = balancesData?.[item.address.toLowerCase()] || 0n;
        acc[item.address.toLowerCase()] = balanceBig;
        return acc;
      },
      {
        [mainNetTokenInfo[0].address]: tokenBalance,
      }
    );

    const updatedTokenList = tokenListData?.tokens?.map((item) => {
      const balanceBig = balancesData?.[item.address.toLowerCase()] || 0n;
      return {
        ...item,
        balanceBig,
        balance: formatAmount(balanceBig, item?.decimals, 4, true),
      };
    });

    let filteredData = updatedTokenList || [];
    if (searchKeyword) {
      filteredData =
        updatedTokenList?.filter((item) => item.symbol.toLowerCase().includes(searchKeyword.toLowerCase())) || [];
    }

    const sortedData = filteredData.sort((a, b) => {
      const balanceA = BigInt(a.balanceBig || 0n);
      const balanceB = BigInt(b.balanceBig || 0n);
      return balanceB > balanceA ? 1 : balanceB < balanceA ? -1 : 0;
    });
    const tokenViewData = [...mainNetTokenInfo, ...sortedData];

    return { balanceAllData, tokenViewData };
  }, [tokenListData, tokenBalance, searchKeyword, balancesData]);

  const getAddress = (address) => {
    return address === ethers.ZeroAddress ? NATIVE_TOKEN : address;
  };
  const fromAddress = useMemo(() => getAddress(fromInfo.address), [fromInfo.address]);
  const toAddress = useMemo(() => getAddress(toInfo.address), [toInfo.address]);

  const updateTokenBalances = useCallback(() => {
    if (!active || !balanceAllData) return;

    const toBalance = toAddress ? balanceAllData[toInfo.address] || 0n : 0n;
    const fromBalance = fromAddress ? balanceAllData[fromInfo.address] || 0n : 0n;

    // 使用函数式更新，并比较新旧值是否相同
    setToInfo(prev => {
      if (prev.balance === toBalance) return prev;
      return { ...prev, balance: toBalance };
    });

    setFromInfo(prev => {
      if (prev.balance === fromBalance) return prev;
      return { ...prev, balance: fromBalance };
    });
  }, [active, balanceAllData, toAddress, fromAddress]);

  useEffect(() => {
    updateTokenBalances();
  }, [updateTokenBalances]);
  useEffect(() => {
    fromInputRef.current?.focus();
  }, [toAddress, fromAddress]);

  useEffect(() => {
    setIsWaitingForApproval(false);
  }, [fromInfo.address, active, account]);

  const onClickMax = () => {
    const val = formatAmount(fromInfo.balance, fromInfo?.decimals, 8);
    if (val.includes("<")) {
      setFromValue("");
      return;
    }
    setFromValue(formatAmount(fromInfo.balance, fromInfo?.decimals, 8));
  };

  const quoteParams = useMemo(() => {
    if (isSwapMarket) {
      return {
        fromToken: { address: fromAddress },
        toToken: { address: toAddress },
        amountIn: payAmount?.toString(),
      };
    } else if (isSwapLimit && toInfo) {
      return {
        fromToken: { address: toAddress },
        toToken: { address: fromAddress },
        amountIn: parseValue("1", toInfo && toInfo?.decimals)?.toString(),
      };
    }
  }, [chainId, fromAddress, toAddress, payAmount, activeTabTrade, activeSubTabTrade]);

  const { data: outInfo, loading } = useSpotOutInfo(chainId, quoteParams);
  const outPutData = outInfo?.data;

  const { data: limitMarketPrice } = useLimitMarketPriceInfo(chainId, {
    fromToken: toAddress,
    toToken: fromAddress,
  });


  const marketSwapRate = outPutData && formatAmount(outPutData?.originAmountOut, fromInfo && fromInfo?.decimals, 8)
  const amountOut: any = formatAmount(limitMarketPrice?.amountOut, fromInfo?.decimals, 8, false) || 0;
  const amountIn: any = formatAmount(limitMarketPrice?.amountIn, toInfo?.decimals, 8, false) || 0;
  const marketPrice = (Number(amountOut) / Number(amountIn)) || 0;
  const limitToValue = Number(fromValue) > 0 && Number(swapRate) > 0 && (Number(fromValue) / Number(swapRate)).toFixed(8);

  const swapRateChange = useMemo(() => {
    let val = 0;
    if (swapRate && marketSwapRate) {
      val = (Number(swapRate) - Number(marketPrice.toFixed(10))) / Number(marketPrice.toFixed(10)) * 100;
    }
    return {
      val: val,
      str: val > 10000 ? '>10000%' : (val < 0.01 && val > 0) ? '<0.01%' : val.toFixed(2) + '%'
    };
  }, [swapRate, marketPrice]);

  const routerData = useMemo(() => {
    const routerParams: any = {
      contractQuoteParams: [],
      contractSwapParams: [],
      dexIdArrNew: [],
      dexNameArrNew: [],
    };

    if (!isSwapMarket) {
      return undefined;
    }

    if (isSwapMarket && outPutData) {
      const quoteRouteArr = outPutData.routes?.map((item: any) => {
        const amountOutBN = BigInt(item.amountOut || 0);
        const minOut = amountOutBN ? bigMath.mulDiv(amountOutBN, BigInt(BASIS_POINTS_DIVISOR - savedSlippageAmount), BigInt(BASIS_POINTS_DIVISOR)) : 0n;
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();

        const extraData = (() => {
          switch (item.contractType) {
            case 1:
              return abiCoder.encode([], []);
            case 2:
              return abiCoder.encode(["uint24", "uint160"], item.extraData);
            case 3:
              return abiCoder.encode(["int24", "uint160"], item.extraData);
            default:
              return null;
          }
        })();

        return {
          dexId: item.dexID,
          dexName: item.dexName,
          poolIndex: item.poolIndex,
          tokenIn: item.tokenIn,
          tokenOut: item.tokenOut,
          amount: BigInt(item.amountIn || 0),
          extraData,
        };
      });

      const swapRouteArr = quoteRouteArr.map((quoteObj) => ({
        dexId: quoteObj.dexId,
        tokenIn: quoteObj.tokenIn,
        tokenOut: quoteObj.tokenOut,
        amountIn: quoteObj.amount,
        amountOutMin: 0n,
        extraData: quoteObj.extraData,
      }));

      const dexIdArrNew = [...new Set(quoteRouteArr.map((item) => item.dexId))];
      const dexNameArrNew = [...new Set(quoteRouteArr.map((item) => item.dexName))];

      routerParams.contractQuoteParams = quoteRouteArr;
      routerParams.contractSwapParams = swapRouteArr;
      routerParams.dexIdArrNew = dexIdArrNew;
      routerParams.dexNameArrNew = dexNameArrNew;
    }

    return routerParams;
  }, [outPutData]);


  const { minimumReceived, bestVal, feeRate } = useMemo(() => {
    if (!outPutData?.amountOut) {
      return {
        minimumReceived: 0n,
        bestVal: 0,
        feeRate: 0
      };
    }

    const amountOutBN = BigInt(outPutData.amountOut);
    if (!amountOutBN) {
      return {
        minimumReceived: 0n,
        bestVal: 0,
        feeRate: 0
      };
    }

    const minimumReceivedBigInt = amountOutBN *
      BigInt(BASIS_POINTS_DIVISOR - savedSlippageAmount) /
      BigInt(BASIS_POINTS_DIVISOR);

    const bestVal = Number(formatAmount(amountOutBN, toInfo?.decimals, 8, false)) /
      Number(formatAmount(outPutData.amountIn, fromInfo?.decimals, 8, false));

    return {
      minimumReceived: minimumReceivedBigInt,
      bestVal,
      feeRate: 0
    };
  }, [outPutData, savedSlippageAmount, toInfo?.decimals, fromInfo?.decimals]);

  useEffect(() => {
    setSwapRate("");
    setDcaOrderValue("2");
    setDcaEveryValue("1");
  }, [fromInfo?.address, toInfo?.address]);

  useEffect(() => {
    if (isSwapMarket) {
      if (outPutData) {
        setToValue(formatAmount(BigInt(outPutData?.amountOut || 0), toInfo?.decimals, 8, false));
      } else if (fromAddress === toAddress) {
        setToValue(fromValue);
      } else {
        setToValue("0.0");
      }
    } else if (isSwapLimit) {
      limitToValue && setToValue(limitToValue);
      !limitToValue && setToValue("");
    }
  }, [outInfo, fromValue, limitToValue]);

  useEffect(() => {
    setInit(true)
  }, [fromValue, fromInfo?.address]);

  // is Approve token
  let tokenAllowanceAddress = isSwapMarket ? CONTRACTS_ADDRESS(chainId).aggregatorAddress : CONTRACTS_ADDRESS(chainId).LimitOrderBook;
  if (isSwapDCA) {
    tokenAllowanceAddress = CONTRACTS_ADDRESS(chainId).DCAOrderBook;
  }
  const { data: tokenAllowance } = useSWR(
    active && fromInfo && fromInfo.address !== ethers.ZeroAddress
      ? [active, chainId, fromInfo.address, "allowance", account, tokenAllowanceAddress]
      : null,
    {
      fetcher: contractFetcher(signer, Token),
    }
  );

  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nativeTokenAddress = ethers.ZeroAddress;
  const allowanceBigInt = BigInt(tokenAllowance || "0");
  const requiredAmount = ethers.parseUnits(fromValue || "0", fromInfo?.decimals || 18);
  const needApproval = Boolean(
    fromInfo.address !== nativeTokenAddress &&
    fromValue &&
    allowanceBigInt <= requiredAmount
  );

  const isWrap = fromInfo.address === nativeTokenAddress && toInfo.address === NATIVE_TOKEN;
  const isUnWrap = fromInfo.address === NATIVE_TOKEN && toInfo.address === nativeTokenAddress;
  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    if (loading && init && isSwapMarket) {
      return false;
    }

    if (isSwapLimit && (maximumNumberOfOrders !== 0n && currentNumberOfOrders >= maximumNumberOfOrders)) {
      return false;
    }

    if (isSwapDCA && (maximumNumberOfOrdersDCA !== 0n && currentNumberOfOrdersDCA >= maximumNumberOfOrdersDCA)) {
      return false;
    }
    
    if (isSwapDCA && everySeconds < minIntervalDurationDCA) {
      return false;
    }
    
    if (isSwapDCA && Number(dcaOrderValue) < 2) {
      return false;
    }
    
    if (isSwapDCA && maxIntervalsDCA && maxIntervalsDCA !== 0n && BigInt(dcaOrderValue) > maxIntervalsDCA) {
      return false;
    }

    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }

    if (isSwapLimit && swapRateChange?.val > 0) {
      return false;
    }

    if (isSubmitting) {
      return false;
    }
    if (fromValue && fromInfo.balance < payAmount) {
      return false;
    }
    if (payAmount === 0 || (!toValue && !isSwapDCA)) {
      return false;
    }
    if (!isSwapDCA && !outPutData && fromAddress !== toAddress && !needApproval) {
      return false;
    }

    return true;
  };
  const getPrimaryText = () => {
    if (!active) {
      return t`Connect Wallet`;
    }
    if (!isSupportedChain(chainId, true)) {
      return t`Incorrect Network`;
    }
    if (loading && init && isSwapMarket) {
      return t`loading...`;
    }

    if (fromValue && fromInfo.balance < payAmount) {
      return t`Insufficient ${fromInfo.symbol} balance`;
    }

    if (isSwapLimit && (maximumNumberOfOrders !== 0n && currentNumberOfOrders >= maximumNumberOfOrders)) {
      return t`Orders Full`;
    }
    
    if (isSwapDCA && (maximumNumberOfOrdersDCA !== 0n && currentNumberOfOrdersDCA >= maximumNumberOfOrdersDCA)) {
      return t`Orders Full`;
    }

    if (needApproval && isWaitingForApproval) {
      return t`Waiting for Approval`;
    }
    if (isApproving) {
      return t`Approving ${fromInfo.symbol}...`;
    }
    if (needApproval) {
      return t`Approve ${fromInfo.symbol}`;
    }

    if (isSwapLimit && swapRateChange?.val > 0) {
      return t`Trigger price is higher than market price`;
    }

    if (!payAmount || payAmount === 0n || (!toValue && !isSwapDCA)) {
      return t`Enter the amount`;
    }
    
    if (isSwapDCA && isSubmitting && !isWrap && !isUnWrap) {
      return t`Create DCA Order...`;
    }
    
    if (isSwapDCA && !isWrap && !isUnWrap) {
      return t`Create DCA Order`;
    }

    if (isSubmitting && isWrap) {
      return t`Wrap ${fromInfo.symbol}...`;
    }

    if (isWrap) {
      return t`Wrap`;
    }

    if (isSubmitting && isUnWrap) {
      return t`Unwrap ${fromInfo.symbol}...`;
    }

    if (isUnWrap) {
      return t`Unwrap`;
    }

    if (isSwapLimit && isSubmitting) {
      return t`Create Limit Order...`;
    }

    if (isSwapLimit) {
      return t`Create Limit Order`;
    }

    if (isSubmitting && isSwapMarket) {
      return t`Swap ${fromInfo.symbol}...`;
    }

    if (!outPutData && fromAddress !== toAddress && payAmount === 0n) {
      return t`Insufficient liquidity`;
    }

    return t`Swap`;
  };
  function renderPrimaryButton() {
    const primaryTextMessage = getPrimaryText();
    return (
      <Button
        type="primary"
        variant="primary-action"
        size="large"
        className="w-full mt-[10px] !opacity-100 !font-semibold"
        onClick={onClickPrimary}
        disabled={!isPrimaryEnabled()}
      >
        {primaryTextMessage}
      </Button>
    );
  }

  const approveFromToken = (approveContractAddress: string) => {
    try {
      approveTokens({
        setIsApproving,
        signer,
        tokenAddress: fromInfo.address,
        spender: approveContractAddress,
        chainId: chainId,
        onApproveSubmitted: () => {
          setIsWaitingForApproval(true);
          setIsApproving(true);

          setTimeout(() => {
            if (isWaitingForApproval) {
              setIsWaitingForApproval(false);
              setIsApproving(false);
            }
          }, 15000);
        },
      });
    } catch (error) {
      setIsWaitingForApproval(false);
    }
  };

  const getSwapParams = () => {
    if ((!routerData || !outPutData) && isSwapMarket) return undefined;

    if (isSwapLimit) {
      const deadline = expiry.label === "Never" ? 0 : Math.ceil(new Date().getTime() / 1000) + Number(expiry.value);
      return [
        fromInfo.address,
        toInfo.address,
        payAmount,
        parseValue(toValue, toInfo && toInfo?.decimals),
        deadline,
      ];
    }
    
    // DCA 参数处理
    if (isSwapDCA) {
      return [
        fromInfo.address,
        toInfo.address,
        payAmount,
        BigInt(dcaOrderValue),
        BigInt(everySeconds),
      ];
    }

    const minimumReceived = bigMath.mulDiv(
      BigInt(outPutData.amountOut) || 0n,
      BigInt(BASIS_POINTS_DIVISOR - savedSlippageAmount),
      BigInt(BASIS_POINTS_DIVISOR)
    );

    // 使用ETH交换Token
    if (fromInfo.address === nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
      return [
        routerData.contractSwapParams,
        toAddress,
        minimumReceived,
        BigInt(outPutData.amountOut),
        account,
        deadlineFromNow,
      ];
    }
    // 使用TOKEN交换ETH
    if (fromInfo.address !== nativeTokenAddress && toInfo.address === nativeTokenAddress) {
      return [
        routerData.contractSwapParams,
        fromAddress,
        minimumReceived,
        BigInt(outPutData.amountOut),
        account,
        deadlineFromNow,
      ];
    }
    // 使用TOKEN交换Token
    if (fromInfo.address !== nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
      return [
        routerData.contractSwapParams,
        fromAddress,
        toAddress,
        minimumReceived,
        BigInt(outPutData.amountOut),
        account,
        deadlineFromNow,
      ];
    }

    return undefined;
  };
  const createSwapFunction = (contract, method, params, value = 0n, type = 'Swap') => {
    setIsSubmitting(true)
    const favToken = JSON.parse(localStorage.getItem(`aggregator-swap-fav-token-${chainId}`) || '[]')
    localStorage.setItem(`aggregator-swap-fav-token-${chainId}`, JSON.stringify([...new Set([...favToken, toAddress.toLowerCase()])]))

    let sentMsg = t`Swap ${fromInfo.symbol} to ${toInfo.symbol} submitted!`;
    let successMsg = t`Swap ${fromInfo.symbol} to ${toInfo.symbol} successful.`;
    let failMsg = t`Swap ${fromInfo.symbol} to ${toInfo.symbol} failed.`;
    if (type === 'Limit Order') {
      sentMsg = t`Limit order submitted!`;
      successMsg = t`Created limit order successful.`;
      failMsg = t`Create limit order failed.`;
    }
    if (type === 'DCA') {
      sentMsg = t`DCA order submitted!`;
      successMsg = t`Created DCA order successful.`;
      failMsg = t`Create DCA order failed.`;
    }

    return callContract(chainId, contract, method, params, {
      value,
      sentMsg,
      successMsg,
      failMsg,
      setPendingTxns,
    }).then(async (tx) => {
      await tx.wait();
      setIsSubmitting(false);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };
  const onClickPrimary = () => {
    if (!active) {
      openConnectModal && openConnectModal();
      return;
    }

    if (needApproval) {
      let spender = CONTRACTS_ADDRESS(chainId).aggregatorAddress;
      if (isSwapLimit) {
        spender = CONTRACTS_ADDRESS(chainId).LimitOrderBook;
      }
      if (isSwapDCA) {
        spender = CONTRACTS_ADDRESS(chainId).DCAOrderBook;
      }
      approveFromToken(spender);
      return;
    }

    if (isSwapLimit && !needApproval) {
      createSwapFunction(contractLimit, "addLimitOrder", getSwapParams(), fromInfo.address === nativeTokenAddress ? BigInt(payAmount) + minExecuteFee : minExecuteFee, 'Limit Order');
      return;
    }
    
    // DCA订单处理
    if (isSwapDCA && !needApproval && !isWrap && !isUnWrap) {
      const minDcaExecuteFeeForOrder = minExecuteFeePerIntervalDCA * BigInt(dcaOrderValue);
      createSwapFunction(contractDCA, "addDCAOrder", getSwapParams(), fromInfo.address === nativeTokenAddress ? payAmount + minDcaExecuteFeeForOrder : minDcaExecuteFeeForOrder, 'DCA');
      return;
    }

    // 使用ETH交换WETH
    if (isWrap && (isSwapLimit || isSwapMarket || isSwapDCA)) {
      createSwapFunction(contractWETH, "deposit", [], payAmount);
      return;
    }
    // 使用WETH交换ETH
    if (isUnWrap && (isSwapLimit || isSwapMarket || isSwapDCA)) {
      createSwapFunction(contractWETH, "withdraw", [payAmount]);
      return;
    }
    // 使用ETH交换Token
    if (isSwapMarket && fromInfo.address === nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
      createSwapFunction(contract, "swapExactETHForTokens", getSwapParams(), BigInt(outPutData.amountIn));
      return;
    }
    // 使用TOKEN交换ETH
    if (isSwapMarket && fromInfo.address !== nativeTokenAddress && toInfo.address === nativeTokenAddress) {
      createSwapFunction(contract, "swapExactTokensForETH", getSwapParams());
      return;
    }
    // 使用TOKEN交换Token
    if (isSwapMarket && fromInfo.address !== nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
      createSwapFunction(contract, "swapExactTokensForTokens", getSwapParams());
      return;
    }
  };

  // swap market get network fees(gas limit * gasPrice)
  useEffect(() => {
    const fetchData = async () => {
      let limit = 0n;
      const provider = signer?.provider || contract?.provider as unknown as ethers.Provider;
      const gasPrice = await provider?.getFeeData().then(data => data.gasPrice || 0n);
      // 使用ETH交换Token
      if (fromInfo.address === nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
        limit = await getGasLimit(contract, "swapExactETHForTokens", getSwapParams(), BigInt(outPutData?.amountIn || 0));
      }
      // 使用TOKEN交换ETH
      if (fromInfo.address !== nativeTokenAddress && toInfo.address === nativeTokenAddress) {
        limit = await getGasLimit(contract, "swapExactTokensForETH", getSwapParams());
      }
      // 使用TOKEN交换Token
      if (fromInfo.address !== nativeTokenAddress && toInfo.address !== nativeTokenAddress) {
        limit = await getGasLimit(contract, "swapExactTokensForTokens", getSwapParams());
      }
      if (limit && gasPrice) {
        const limitBN = BigInt(limit.toString());
        const gasPriceBN = BigInt(gasPrice.toString());
        if (limitBN && gasPriceBN) {
          const networkFeeValue = bigMath.mulDiv(limitBN, gasPriceBN, 1n);
          setNetworkFee(networkFeeValue);
        }
      }
    };

    if (routerData && outPutData && account && isSwapMarket) {
      fetchData();
      setInit(false)
    }
  }, [routerData, outPutData, account]);

  const clickSwap = () => {
    setIsWaitingForApproval(false);
    const newInfo = fromInfo;
    setFromInfo(toInfo);
    setToInfo(newInfo);
    fromInputRef.current?.focus();
  };

  const isSmall = useMedia("(max-width: 800px)");

  const everySeconds = useMemo(() => {
    return convertToSeconds(Number(dcaEveryValue), everyUnit.label);
  }, [dcaEveryValue, everyUnit.label]);

  const quickMarket = (val) => {
    const newMarketPrice = marketPrice && Number(marketPrice || 0) * (1 - val / 100);
    setSwapRate(newMarketPrice && Number(newMarketPrice || 0)?.toFixed(10) || "0.0");
  }

  return (
    <div className="flex justify-start items-center flex-col bg-[var(--color-bg-main)] w-[503px] aggregator-swap-page max-md:w-full">
      <SwapTab
        activeTabTrade={activeTabTrade}
        setActiveTabTrade={setActiveTabTrade}
        activeSubTabTrade={activeSubTabTrade}
        setActiveSubTabTrade={setActiveSubTabTrade}
      />

      <div className="mt-[14px] px-[14px] w-full">
        <div className="h-[101px] aggregator-token-input flex justify-between">
          <div className="flex-1 pl-[15px]">
            <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 mt-[14px]">
              {isSwapDCA ? <Trans>Pay</Trans> : <Trans>From</Trans>}
            </div>
            <div className="h-[52px]">
              <input
                ref={fromInputRef}
                value={fromValue}
                type="text"
                onChange={(e) => {
                  let newValue = e.target.value.replace(/,/g, ".");
                  if (newValue === ".") {
                    newValue = "0.";
                  }

                  if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
                    e.target.value = newValue;
                    setFromValue(newValue);
                  }
                }}
                className="p-[0px] h-[52px] text-[18px] w-full"
                autoFocus
                placeholder="0.0"
              />
            </div>
          </div>
          <div className="symbol flex flex-col items-end justify-center gap-[10px] text-[var(--color-text-primary)] text-[14px] homePop500 pr-[15px]">
            <div className="flex items-center gap-[var(--spacing-2)] cursor-pointer" onClick={() => {
              setCurrencyModalOpen(true);
              setCurrentSelectType("from");
            }}>
              <img className="w-[30px] h-[30px] rounded-[50%] mr-[3px]" src={fromInfo.icon} alt="" />
              {fromInfo.symbol}{" "}
              <FaChevronDown size={13} className="cursor-pointer" color="var(--color-text-primary)" />
            </div>

            <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 justify-between flex items-center gap-[10px]">
              {(fromInfo.balance && formatAmount(fromInfo.balance, fromInfo?.decimals, 4, true)) || "0.00"}{" "}
              {fromInfo.balance && (
                <div className="max-input" onClick={() => onClickMax()}>
                  <Trans>MAX</Trans>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="swap-icon">
        
          {
            themeMode === "dark" ? (
              <SwapTokenSvg className="w-[30px] swap-icon-img" onClick={() => clickSwap()} />
            ) : (
              <SwapTokenLightSvg className="w-[30px] swap-icon-img" onClick={() => clickSwap()} />
            )
          }
        </div>
        <div className={cx("h-[101px] aggregator-token-view flex justify-between", {
          "!h-[64px]": isSwapDCA && !isWrap && !isUnWrap,
          "cursor-pointer": isSwapDCA
        })} onClick={() => {
          if(isSwapDCA) {
            setCurrencyModalOpen(true);
            setCurrentSelectType("to");
          }
        }}>
          <div className="flex-1 pl-[15px]">
            {
              isSwapDCA && !isWrap && !isUnWrap && (
                <div className="flex h-full items-center text-[var(--color-text-disable)] text-[12px] homePop400"><Trans>Receive</Trans></div>
              )
            }
            {
              (!isSwapDCA || (isSwapDCA && (isWrap || isUnWrap))) && (
                <>
                  <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 mt-[14px]"><Trans>To</Trans></div>
                  {
                    loading && isSwapMarket && init ? (
                      <SkeletonStructureItem />
                    ) : (
                      <>
                        <div className="h-[40px]">
                          <div className={cx("p-[0px] h-[40px] text-[18px] w-full flex items-center homePop500", {
                            "text-[var(--color-text-primary)]": toValue && toValue !== "0.0",
                            "text-[#474747]": !toValue || toValue === "0.0"
                          })}>{toValue || 0.0}</div>
                        </div>
                        {
                          isSwapMarket && outPutData && (
                            <div className="flex gap-[2px] justify-start items-center text-[var(--color-web3-yellow)] homePop400 text-[12px]">
                              <div>Save: </div>
                              <div>
                                {
                                  outPutData && Number(outPutData?.savedAmountOut || 0) > 0 ? (
                                    <>
                                      +{formatNumberKM(Number(formatAmount(outPutData?.savedAmountOut, toInfo?.decimals, 4, false)).toFixed(4))} {toInfo.symbol} (
                                      +{outPutData &&
                                        ((Number(outPutData?.savedAmountOut || 0) / Number(outPutData?.amountOut)) * 100).toFixed(2)}
                                      %)
                                    </>
                                  ) : `0 ${toInfo.symbol} (0%)`
                                }

                              </div>
                            </div>
                          )
                        }
                      </>
                    )
                  }
                </>
              )
            }
          </div>
          <div className="symbol flex flex-col items-end justify-center gap-[10px] text-[var(--color-text-primary)] text-[14px] homePop500 pr-[15px]">
            <div className="flex items-center gap-[var(--spacing-2)] cursor-pointer" onClick={() => {
              setCurrencyModalOpen(true);
              setCurrentSelectType("to");
            }}>
              <img className="w-[30px] h-[30px] rounded-[50%] mr-[3px]" src={toInfo.icon} alt="" />
              {toInfo.symbol}{" "}
              <FaChevronDown size={13} className="cursor-pointer" color="var(--color-text-primary)" />
            </div>

            {
              (!isSwapDCA || isWrap || isUnWrap) && (
                <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 flex justify-between items-center gap-[2px]">
                  <Trans>Balance</Trans>:<span className="text-[var(--color-text-tertiary)]">{(toInfo.balance && formatAmount(toInfo.balance, toInfo?.decimals, 4, true)) || "0.00"}{" "}</span>
                </div>
              )
            }
          </div>
        </div>

        {
          isSwapLimit && !isWrap && !isUnWrap && (
            <>
              <div className="flex justify-between mt-[6px] gap-[6px] flex-col">
                <div className="aggregator-token-input pl-[15px] flex-col !rounded-[4px] flex justify-between pr-[15px]">
                  <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 mt-[14px] flex gap-[3px]">
                    <div className="text-[#A9B1B2] text-[12px] homePop400 flex">
                      <div>
                        When <span className="text-[var(--color-text-primary)]">{" "}1{" "}</span> 
                        {toInfo?.symbol || '--'} is worth 
                        <span className="text-[var(--color-text-primary)]">{" "}{(Number(swapRate).toFixed(6))}{" "}</span> 
                        {fromInfo?.symbol} 
                      </div>
                      {
                        swapRateChange?.val !== 0 ? (
                          <div className={cx("pl-[3px]", {
                            "text-[#D07C8A]": swapRateChange?.val > 0,
                            "text-[#4FA480]": swapRateChange?.val < 0
                          })}>({swapRateChange?.val > 0.01 && swapRateChange?.val < 10000 ? '+' : ''}{swapRateChange?.str || ''})</div>
                        ) : ""
                      }
                    </div>
                  </div>
                  <div className="h-[52px] flex justify-between items-center">
                    <input
                      value={swapRate}
                      type="text"
                      onChange={(e) => {
                        let newValue = e.target.value.replace(/,/g, ".");
                        if (newValue === ".") {
                          newValue = "0.";
                        }

                        if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
                          e.target.value = newValue;
                          setSwapRate(newValue);
                        }
                      }}
                      className="p-[0px] h-[52px] text-[18px] w-full"
                      autoFocus={false}
                      placeholder="0.0"
                    />

                    <div className="symbol flex gap-[5px] items-center justify-center text-[#BEBEBE] text-[14px] homePop500 pr-[15px] w-[10rem]">
                      <img className="w-[30px] h-[30px] rounded-[50%] mr-[5px]" src={fromInfo.icon} alt="" />
                      <div className="text-[var(--color-text-disable)] text-[14px] homePop600 h-[52px] flex items-center">{fromInfo.symbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-[6px] mb-[14px]">
                    <div className="bg-[var(--color-primary)] px-[6px] pb-[2px] pt-[3px] !rounded-[4px] text-[var(--color-black)] text-[10px] homePop400 cursor-pointer" onClick={() => {
                      setSwapRate(marketPrice && Number(marketPrice || 0)?.toFixed(10) || "0.0");
                    }}>Use market rate</div>
                    <div className="market-quick-btn" onClick={() => quickMarket(1)}>-1%</div>
                    <div className="market-quick-btn" onClick={() => quickMarket(5)}>-5%</div>
                    <div className="market-quick-btn" onClick={() => quickMarket(10)}>-10%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-[16px]">
                  <div>
                    <Tooltip
                      position="bottom"
                      className="text-[var(--color-text-primary)] text-[12px] homePop400"
                      handle={"Expiry"}
                      renderContent={() => 
                        <div>
                          <Trans>
                            This is the time period during which the order wilbe active. Please note that orders may becompleted earlier than this time, or remainunfilled based on the specified parameters.
                          </Trans>
                        </div>
                      }
                    />
                  </div>
                  <div className="flex gap-[6px]">
                    {
                      expiryOptions?.map((item, index) => {
                        return (
                          <div key={index} className={cx("flex items-center justify-center expiry-btn", {
                            "expiry-btn-active": item.label === expiry.label
                          })} onClick={() => {
                            setExpiry(item)
                          }}>
                            {item.label}
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            </>
          )
        }
        
        {
          isSwapDCA && !isWrap && !isUnWrap && (
            <>
              <div className="h-[101px] flex justify-between mt-[6px] gap-[6px]">
                <div className="aggregator-token-input w-[24rem] pl-[15px] flex-1 !rounded-[4px] flex justify-between">
                  <div className="w-full">
                    <div className="balance-val text-[var(--color-text-disable)] text-[12px] homePop400 mt-[14px] flex gap-[3px]"><Trans>Orders</Trans></div>
                    <div className="h-[52px]">
                      <input
                        value={dcaOrderValue}
                        type="text"
                        onChange={(e) => {
                          let newValue = e.target.value.replace(/,/g, ".");

                          if (newValue.includes(".")) {
                            newValue = newValue.split(".")[0];
                          }

                          if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
                            e.target.value = newValue;
                            setDcaOrderValue(newValue);
                          }
                        }}
                        className="p-[0px] h-[52px] text-[18px] w-full"
                        autoFocus={false}
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>
                <div className="h-[101px] w-[24rem] max-md:w-[12rem] aggregator-token-view !rounded-[4px] !mt-[0px]">
                  <div className="flex items-center gap-[4px] text-[var(--color-text-disable)] text-[12px] homePop400 pt-[14px] pl-[15px]">
                    <Trans>Order Execution Interval</Trans>
                    <Tooltip
                      position="bottom"
                      className="text-[var(--color-text-disable)] w-[15px] h-[15px]"
                      handle={<InfoIcon />}
                      renderContent={() => 
                        <div className="text-[var(--color-text-tertiary)]">
                          <Trans>
                            To minimise the predictability of your DCA strategy, orders are filled within a randomised padding of +/- 30 seconds.
                          </Trans>
                        </div>
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center h-[52px] px-[15px]">
                    <input
                      value={dcaEveryValue}
                      type="text"
                      onChange={(e) => {
                        let newValue = e.target.value.replace(/,/g, ".");

                        if (newValue.includes(".")) {
                          newValue = newValue.split(".")[0];
                        }

                        if (newValue === "" || inputRegex.test(escapeSpecialRegExpChars(newValue))) {
                          e.target.value = newValue;
                          setDcaEveryValue(newValue);
                        }
                      }}
                      className="p-[0px] h-[52px] text-[18px] w-full"
                      autoFocus={false}
                      placeholder="1"
                    />
                    <Dropdown 
                      className="w-full every-dropdown justify-end"
                      options={everyOptions} 
                      selectedOption={everyUnit}
                      onSelect={(option) => {
                        setEveryUnit(option)
                      }} 
                    />
                  </div>
                </div>
              </div>
              {
                fromValue && Number(dcaOrderValue) > 0 && (
                  <div className="flex flex-wrap items-start mt-[15px] gap-[4px] text-[var(--color-text-secondary)] text-[12px] homePop400">
                    {[
                      <Trans>Split</Trans>,
                      `${fromValue && Number(fromValue).toFixed(4)}`,
                      <img className="w-[16px] h-[16px] rounded-[50%]" src={fromInfo.icon} alt="" />,
                      `${fromInfo.symbol}`,
                      <Trans>into</Trans>,
                      `${dcaOrderValue}`,
                      <Trans>orders to buy</Trans>,
                      <img className="w-[16px] h-[16px] rounded-[50%]" src={toInfo.icon} alt="" />,
                      `${toInfo.symbol}, `,
                      <Trans>execute</Trans>,
                      `1`,
                      <Trans>order</Trans>,
                      `(`,
                      fromValue && Number(dcaOrderValue) > 0 
                        ? (Number(fromValue) / Number(dcaOrderValue)) < 0.0001 
                          ? '<0.0001' 
                          : (Number(fromValue) / Number(dcaOrderValue)).toFixed(4)
                        : '0.0',
                      `${fromInfo.symbol}) `,
                      <Trans>every</Trans>,
                      ` ${dcaEveryValue} ${everyUnit.label?.toLocaleLowerCase()}(s)`
                    ].map((item, index) => (
                      <span key={index} className="inline-flex items-center">
                        {item}
                      </span>
                    ))}
                  </div>
                )
              }
              {
                Number(fromValue) > 0 && (Number(fromValue) / Number(dcaOrderValue)) < 0.0001 && (
                  <div className="w-full mt-[6px] text-[var(--color-web3-red)] text-[12px] homePop400 flex items-center gap-[4px]">
                    <InfoIcon color="var(--color-web3-red)" />
                    <Trans>Increase your payment to at least 0.0001 tokens per order.</Trans>
                  </div>
                )
              }
              {
                Number(dcaOrderValue) < 2 && (
                  <div className="w-full mt-[6px] text-[var(--color-web3-red)] text-[12px] homePop400 flex items-center gap-[4px]">
                    <InfoIcon color="var(--color-web3-red)" />
                    <Trans>Number of Orders cannot be lower than 2.</Trans>
                  </div>
                )
              }
              {
                maxIntervalsDCA && maxIntervalsDCA !== 0n && BigInt(dcaOrderValue) > maxIntervalsDCA && (
                  <div className="w-full mt-[6px] text-[var(--color-web3-red)] text-[12px] homePop400 flex items-center gap-[4px]">
                    <InfoIcon color="var(--color-web3-red)" />
                    <Trans>Number of Orders cannot be higher than {maxIntervalsDCA.toString()}.</Trans>
                  </div>
                )
              }
              {
                everySeconds < minIntervalDurationDCA && (
                  <div className="w-full mt-[6px] text-[var(--color-web3-red)] text-[12px] homePop400 flex items-center gap-[4px]">
                    <InfoIcon color="var(--color-web3-red)" />
                    <Trans>Please enter an interval above 0.</Trans>
                  </div>
                )
              }
            </>
          )
        }
      </div>

      {
        isSwapMarket ? (
          <div className="w-full flex justify-between items-center mt-[14px] px-[14px]">
            <div className="flex items-center gap-[5px]">
              <div className="inputTag"><Trans>Best Price</Trans></div>
              <div className="inputTag"><Trans>Smart Route</Trans></div>
              <img className="h-[17px] ml-[6px]" src={QuickIcon} alt="" />
            </div>
            <SettingSvg size={22} color="var(--color-primary)" onClick={() => { setIsAggregatorSettingsVisible(true) }} className="cursor-pointer" />
          </div>
        ) : ""
      }

      <div className="w-full flex justify-center mt-[6px] px-[14px]">{renderPrimaryButton()}</div>
      {
        (isSwapLimit && swapRateChange?.val > 0) ? (
          <div className="w-[calc(100%-28px)] flex justify-center items-center mx-[14px] rounded-[4px] mt-[8px] px-[14px] py-[10px] text-[#D3B136] text-[12px] homePop400 bg-[#FFD43D1A]">
            Trigger price is {swapRateChange?.str || '--'} higher than market, you are buying at a much higher rate. We recommend that you use market price to swap.
          </div>
        ) : ""
      }

      {isSwapMarket && outPutData ? (
        <SwapMarketInfo
          feeRate={feeRate}
          minimumReceived={minimumReceived}
          networkFee={networkFee}
          routerData={routerData}
          savedSlippageAmount={savedSlippageAmount}
          toInfo={toInfo}
          fromInfo={fromInfo}
          outPutData={outPutData}
          bestVal={bestVal}
        />
      ) : ""}
      {isSwapLimit && toInfo && fromInfo && orderFeeRate && fromValue && toValue ? (
        <SwapLimitInfo
          feeRate={orderFeeRate}
          expiry={expiry}
          toInfo={toInfo}
          fromInfo={fromInfo}
          swapRate={swapRate}
          fromVal={fromValue}
          toVal={toValue}
          executionFees={minExecuteFee || BigInt(0)}
          currentNumberOfOrders={currentNumberOfOrders}
          maximumNumberOfOrders={maximumNumberOfOrders}
        />
      ) : ""}
      {isSwapDCA && toInfo && fromInfo && orderFeeRateDCA && fromValue ? (
        <SwapDCAInfo 
          fromInfo={fromInfo}
          toInfo={toInfo}
          fromVal={fromValue}
          everyValue={dcaEveryValue}
          everyUnit={everyUnit}
          orders={dcaOrderValue}
          executionFees={minExecuteFeePerIntervalDCA || BigInt(0)}
          platformFree={orderFeeRateDCA}
          currentNumberOfOrders={currentNumberOfOrdersDCA}
          maximumNumberOfOrders={maximumNumberOfOrdersDCA}
        />
      ) : ""}

      <TokenSelectModal
        currencyModalOpen={currencyModalOpen}
        currentSelectType={currentSelectType}
        fromInfo={fromInfo}
        toInfo={toInfo}
        tokenViewData={tokenViewData}
        searchKeyword={searchKeyword}
        setCurrencyModalOpen={setCurrencyModalOpen}
        setSearchKeyword={setSearchKeyword}
        handleCurrencySelect={handleCurrencySelect}
      />
    </div>
  );
}
