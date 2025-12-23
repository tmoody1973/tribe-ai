/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai_embeddings from "../ai/embeddings.js";
import type * as ai_pipeline from "../ai/pipeline.js";
import type * as ai_refresh from "../ai/refresh.js";
import type * as ai_research from "../ai/research.js";
import type * as ai_search from "../ai/search.js";
import type * as ai_searchActions from "../ai/searchActions.js";
import type * as ai_synthesis from "../ai/synthesis.js";
import type * as cache from "../cache.js";
import type * as chat from "../chat.js";
import type * as corridorData from "../corridorData.js";
import type * as corridors from "../corridors.js";
import type * as crons from "../crons.js";
import type * as health from "../health.js";
import type * as ingestedContent from "../ingestedContent.js";
import type * as integrations_costOfLiving from "../integrations/costOfLiving.js";
import type * as integrations_countries from "../integrations/countries.js";
import type * as integrations_visa from "../integrations/visa.js";
import type * as maintenance from "../maintenance.js";
import type * as metrics from "../metrics.js";
import type * as passportIndex from "../passportIndex.js";
import type * as progress from "../progress.js";
import type * as protocols from "../protocols.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "ai/embeddings": typeof ai_embeddings;
  "ai/pipeline": typeof ai_pipeline;
  "ai/refresh": typeof ai_refresh;
  "ai/research": typeof ai_research;
  "ai/search": typeof ai_search;
  "ai/searchActions": typeof ai_searchActions;
  "ai/synthesis": typeof ai_synthesis;
  cache: typeof cache;
  chat: typeof chat;
  corridorData: typeof corridorData;
  corridors: typeof corridors;
  crons: typeof crons;
  health: typeof health;
  ingestedContent: typeof ingestedContent;
  "integrations/costOfLiving": typeof integrations_costOfLiving;
  "integrations/countries": typeof integrations_countries;
  "integrations/visa": typeof integrations_visa;
  maintenance: typeof maintenance;
  metrics: typeof metrics;
  passportIndex: typeof passportIndex;
  progress: typeof progress;
  protocols: typeof protocols;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
