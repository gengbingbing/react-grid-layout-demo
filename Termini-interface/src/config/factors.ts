import { expandDecimals } from "utils/numbers";


export const FACTOR_TO_PERCENT_MULTIPLIER_BIGINT = 100n;
export const BASIS_POINTS_DIVISOR = 10000;
export const DEFAULT_DEADLINE = 3600; // 0.3%
export const AGGREGATOR_DEFAULT_DEADLINE = 3600; // 0.3%

/**
 * @deprecated for v2: calculate leverage based on marketInfo.minCollateralFactor
 */
export const MAX_LEVERAGE = 100 * BASIS_POINTS_DIVISOR;
/**
 * @deprecated for v2: calculate leverage based on marketInfo.minCollateralFactor
 */
export const MAX_ALLOWED_LEVERAGE = 50 * BASIS_POINTS_DIVISOR;

export const COLLATERAL_SPREAD_SHOW_AFTER_INITIAL_ZERO_THRESHOLD = 5; // 0.05%

export const DEFAULT_AGGREGATOR_SLIPPAGE_AMOUNT = 100; // 1%
export const DEFAULT_SLIPPAGE_AMOUNT = 100; // 1%
export const DEFAULT_HIGHER_SLIPPAGE_AMOUNT = 100; // 1%
export const EXCESSIVE_SLIPPAGE_AMOUNT = 2 * 100; // 2%

export const BASIS_POINTS_DIVISOR_BIGINT = 10000n;
export const MAX_ALLOWED_LEVERAGE_100 = 100 * BASIS_POINTS_DIVISOR;
export const HIGH_SPREAD_THRESHOLD = expandDecimals(1, 30) / 100n; // 1%

export const DEFAULT_ACCEPABLE_PRICE_IMPACT_BUFFER = 30; // 0.3%
export const USD_DECIMALS = 30;



