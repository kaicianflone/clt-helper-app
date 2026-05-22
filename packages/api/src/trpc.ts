/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { ContentCheckResult } from "./server/content-filter";
import type { OpenPROptions, OpenPRResult } from "./server/github-bot";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export interface Context {
  headers?: Headers;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  // Submit-flow injections (only used by submit router; routes can leave undefined)
  checkRateLimit?: (
    deviceId: string,
  ) => Promise<{ ok: boolean; remaining: number }>;
  fetchFileFromRepo?: (path: string) => Promise<Record<string, unknown>>;
  renderDiff?: (
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) => string;
  isVerifyOnlyChange?: (
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) => boolean;
  openCommunityPR?: (opts: OpenPROptions) => Promise<OpenPRResult>;
  containsObjectionableContent?: (input: {
    displayName: string;
    note: string;
    patch: Record<string, unknown>;
  }) => ContentCheckResult;
}

export const createTRPCContext = (opts: { headers: Headers }): Context => {
  return {
    headers: opts.headers,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause;
    // ZodError: surface a user-friendly field message
    if (cause instanceof ZodError) {
      const first = cause.issues[0];
      const path = first?.path.join(".") ?? "";
      const msg = first?.message ?? "invalid";
      return {
        ...shape,
        message: `Form data invalid: ${path ? `${path} — ` : ""}${msg}`,
        data: {
          ...shape.data,
          zodError: z.flattenError(cause as ZodError<Record<string, unknown>>),
        },
      };
    }
    // Octokit-shaped errors (have numeric .status)
    const causeUnknown = cause as unknown;
    if (
      causeUnknown &&
      typeof (causeUnknown as { status?: unknown }).status === "number"
    ) {
      const status = (causeUnknown as { status: number }).status;
      if (status === 403) {
        return {
          ...shape,
          message:
            "Submissions are temporarily unavailable. Try again in an hour.",
          data: { ...shape.data, zodError: null },
        };
      }
      if (status === 422) {
        return {
          ...shape,
          message:
            "Another submission for this entry is in progress. Please try again in a minute.",
          data: { ...shape.data, zodError: null },
        };
      }
    }
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);
