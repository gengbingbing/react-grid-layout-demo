import { USD_DECIMALS } from "config/factors";
import { ErrorLike } from "lib/parseError";
import { bigintToNumber, formatPercentage, formatRatePercentage, roundToOrder } from "lib/numbers";
import { metrics, OrderErrorContext, SubmittedOrderEvent } from ".";
import { parseError } from "../parseError";
import {
  IncreaseOrderMetricData,
  OrderCancelledEvent,
  OrderCreatedEvent,
  OrderExecutedEvent,
  OrderMetricData,
  OrderMetricId,
  OrderSentEvent,
  OrderSimulatedEvent,
  OrderStage,
  OrderTxnFailedEvent,
  OrderTxnSubmittedEvent,
  ShiftGmMetricData,
  SwapGLVMetricData,
  SwapGmMetricData,
  SwapMetricData,
} from "./types";

export function getGMSwapMetricId(p: {
  marketAddress: string | undefined;
  executionFee: bigint | undefined;
}): SwapGmMetricData["metricId"] {
  return `gm:${[p.marketAddress || "marketTokenAddress", p.executionFee?.toString || "marketTokenAmount"].join(":")}`;
}

export function getGLVSwapMetricId(p: {
  glvAddress: string | undefined;
  executionFee: bigint | undefined;
}): SwapGLVMetricData["metricId"] {
  return `glv:${[p.glvAddress || "glvAddress", p.executionFee?.toString() || "executionFee"].join(":")}`;
}

export function getShiftGMMetricId(p: {
  fromMarketAddress: string | undefined;
  toMarketAddress: string | undefined;
  executionFee: bigint | undefined;
}): ShiftGmMetricData["metricId"] {
  return `shift:${[p.fromMarketAddress || "fromMarketAddress", p.toMarketAddress || "toMarketAddress", p.executionFee?.toString() || "marketTokenAmount"].join(":")}`;
}

export function getSwapOrderMetricId(p: {
  initialCollateralTokenAddress: string | undefined;
  swapPath: string[] | undefined;
  orderType: OrderType | undefined;
  initialCollateralDeltaAmount: bigint | undefined;
  executionFee: bigint | undefined;
}): SwapMetricData["metricId"] {
  return `swap:${[
    p.initialCollateralTokenAddress || "initialColltateralTokenAddress",
    p.swapPath?.join("-") || "swapPath",
    p.orderType || "orderType",
    p.initialCollateralDeltaAmount?.toString() || "initialCollateralDeltaAmount",
    p.executionFee?.toString() || "executionFee",
  ].join(":")}`;
}

export function getPositionOrderMetricId(p: {
  marketAddress: string | undefined;
  initialCollateralTokenAddress: string | undefined;
  swapPath: string[] | undefined;
  isLong: boolean | undefined;
  orderType: OrderType | undefined;
  sizeDeltaUsd: bigint | undefined;
  initialCollateralDeltaAmount: bigint | undefined;
}): IncreaseOrderMetricData["metricId"] {
  return `position:${[
    p.marketAddress || "marketAddress",
    p.initialCollateralTokenAddress || "initialCollateralTokenAddress",
    p.swapPath?.join("-") || "swapPath",
    p.isLong || "isLong",
    p.orderType || "orderType",
    p.sizeDeltaUsd?.toString() || "sizeDeltaUsd",
    p.initialCollateralDeltaAmount?.toString() || "initialCollateralDeltaAmount",
  ].join(":")}`;
}

export function sendOrderSubmittedMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderSubmittedMetric");
    return;
  }

  metrics.pushEvent<SubmittedOrderEvent>({
    event: `${metricData?.metricType}.submitted`,
    isError: false,
    data: metricData,
  });

  metrics.startTimer(metricId);
}

export function sendOrderSimulatedMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderSimulatedMetric");
    return;
  }

  metrics.pushEvent<OrderSimulatedEvent>({
    event: `${metricData.metricType}.simulated`,
    isError: false,
    time: metrics.getTime(metricId)!,
    data: metricData,
  });
}

export function sendOrderTxnSubmittedMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderTxnSubmittedMetric");
    return;
  }

  metrics.pushEvent<OrderTxnSubmittedEvent>({
    event: `${metricData.metricType}.txnSubmitted`,
    isError: false,
    time: metrics.getTime(metricId)!,
    data: metricData,
  });
}

export function makeTxnSentMetricsHandler(metricId: OrderMetricId) {
  return () => {
    const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

    if (!metricData) {
      metrics.pushError("Order metric data not found", "makeTxnSentMetricsHandler");
      return;
    }

    metrics.startTimer(metricId);

    metrics.pushEvent<OrderSentEvent>({
      event: `${metricData.metricType}.sent`,
      isError: false,
      time: metrics.getTime(metricId)!,
      data: metricData,
    });

    return Promise.resolve();
  };
}

export function sendTxnValidationErrorMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendTxnValidationErrorMetric");
    return;
  }

  metrics.pushEvent({
    event: `${metricData.metricType}.failed`,
    isError: true,
    data: {
      errorContext: "submit",
      errorMessage: "Error submitting order, missed data",
      ...metricData,
    },
  });
}

export function sendTxnErrorMetric(
  metricId: OrderMetricId,
  error: ErrorLike | undefined,
  errorContext: OrderErrorContext
) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendTxnErrorMetric");
    return;
  }

  const errorData = parseError(error);

  metrics.pushEvent<OrderTxnFailedEvent>({
    event: `${metricData.metricType}.${errorData?.isUserRejectedError ? OrderStage.Rejected : OrderStage.Failed}`,
    isError: true,
    data: {
      errorContext,
      ...(errorData || {}),
      ...metricData,
    },
  });
}

export function makeTxnErrorMetricsHandler(metricId: OrderMetricId) {
  return (error: ErrorLike) => {
    sendTxnErrorMetric(metricId, error, "sending");
    throw error;
  };
}

export function sendOrderCreatedMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderCreatedMetric");
    return;
  }

  metrics.pushEvent<OrderCreatedEvent>({
    event: `${metricData.metricType}.created`,
    isError: false,
    time: metrics.getTime(metricId),
    data: metricData,
  });
}

export function sendOrderExecutedMetric(metricId: OrderMetricId) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderExecutedMetric");
    return;
  }

  metrics.pushEvent<OrderExecutedEvent>({
    event: `${metricData.metricType}.executed`,
    isError: false,
    time: metrics.getTime(metricId, true),
    data: metricData,
  });
}

export function sendOrderCancelledMetric(metricId: OrderMetricId, eventData: EventLogData) {
  const metricData = metrics.getCachedMetricData<OrderMetricData>(metricId);

  if (!metricData) {
    metrics.pushError("Order metric data not found", "sendOrderCancelledMetric");
    return;
  }

  metrics.pushEvent<OrderCancelledEvent>({
    event: `${metricData.metricType}.failed`,
    isError: true,
    time: metrics.getTime(metricId, true),
    data: {
      ...(metricData || {}),
      errorMessage: `${metricData.metricType} cancelled`,
      reason: eventData.stringItems.items.reason,
      errorContext: "execution",
    },
  });
}

export function formatAmountForMetrics(
  amount?: bigint,
  decimals = USD_DECIMALS,
  round: "toOrder" | "toSecondOrderInt" | false = "toOrder"
): number | undefined {
  if (amount === undefined) {
    return undefined;
  }

  if (round === "toOrder") {
    return bigintToNumber(roundToOrder(amount), decimals);
  } else if (round === "toSecondOrderInt") {
    return Math.round(bigintToNumber(roundToOrder(amount, 2), decimals));
  }

  return bigintToNumber(amount, decimals);
}

export function formatPercentageForMetrics(percentage?: bigint, roundToDecimals = 2) {
  if (percentage === undefined) {
    return undefined;
  }

  const rounded = roundToOrder(percentage, roundToDecimals);
  const formatted = formatPercentage(rounded, { bps: false, displayDecimals: roundToDecimals });

  if (!formatted) {
    return undefined;
  }

  return parseFloat(formatted);
}

export function getRequestId() {
  return `${Date.now()}_${Math.round(Math.random() * 10000000)}`;
}
