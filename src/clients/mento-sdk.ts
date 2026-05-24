import { createRequire } from "node:module";

/**
 * @mento-protocol/mento-sdk's ESM build omits .js extensions on internal imports.
 * Load the CJS entry via createRequire until upstream fixes exports.
 */
const require = createRequire(import.meta.url);

const mentoSdk = require("@mento-protocol/mento-sdk") as typeof import("@mento-protocol/mento-sdk");

export const {
  Mento,
  ChainId,
  deadlineFromMinutes,
  RouteNotFoundError,
  FXMarketClosedError,
} = mentoSdk;

export type { CallParams } from "@mento-protocol/mento-sdk";
