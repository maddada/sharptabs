/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as geminiProxy from "../geminiProxy.js";
import type * as http from "../http.js";
import type * as logGroupedTabs from "../logGroupedTabs.js";
import type * as rateLimit from "../rateLimit.js";
import type * as sharedTypes from "../sharedTypes.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  geminiProxy: typeof geminiProxy;
  http: typeof http;
  logGroupedTabs: typeof logGroupedTabs;
  rateLimit: typeof rateLimit;
  sharedTypes: typeof sharedTypes;
  stripe: typeof stripe;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
