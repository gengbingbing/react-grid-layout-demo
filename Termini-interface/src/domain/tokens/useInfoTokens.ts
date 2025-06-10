import { Signer } from "ethers";
import useSWR from "swr";

import { getServerUrl } from "config/backend";
import { getContract } from "config/contracts";
import { BASIS_POINTS_DIVISOR_BIGINT } from "config/factors";
import { getV1Tokens, getWhitelistedV1Tokens } from "config/tokens";
import { bigMath } from "utils/bigmath";
import { contractFetcher } from "lib/contracts";
import { DEFAULT_MAX_USDG_AMOUNT, MAX_PRICE_DEVIATION_BASIS_POINTS, USDG_ADDRESS } from "lib/legacy";
import { USD_DECIMALS } from "config/factors";
import { expandDecimals } from "lib/numbers";
import { PRICES_UPDATE_INTERVAL } from "lib/timeConstants";

import { InfoTokens, Token, TokenInfo } from "config/static/tokens";
import { getSpread } from "./utils";


