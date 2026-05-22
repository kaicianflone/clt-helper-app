import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@clt/api";

import { env } from "~/env";
import { buildSubmitContext } from "~/server/context";

/**
 * CORS origin allowlist.
 *
 * - Always includes the production web origins.
 * - Picks up additional origins (comma-separated) from CORS_ALLOWED_ORIGINS at
 *   runtime, enabling local-dev overrides without code changes.
 * - Expo native clients do NOT go through the browser security model, so they
 *   don't need CORS; only browser callers require it.
 */
const PRODUCTION_ORIGINS = new Set([
  "https://clt-app.com",
  "https://www.clt-app.com",
]);

const getAllowedOrigins = (): Set<string> => {
  const extra = env.CORS_ALLOWED_ORIGINS;
  if (!extra) return PRODUCTION_ORIGINS;
  const extras = extra
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return new Set([...PRODUCTION_ORIGINS, ...extras]);
};

/**
 * Returns the value for Access-Control-Allow-Origin if the request origin is
 * in the allowlist, otherwise returns null (which causes the header to be
 * omitted, blocking the cross-origin request).
 */
const getAllowedOrigin = (req: NextRequest): string | null => {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  return allowed.has(origin) ? origin : null;
};

const setCorsHeaders = (res: Response, allowedOrigin: string | null) => {
  if (allowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-trpc-source",
  );
};

export const OPTIONS = (req: NextRequest) => {
  const allowedOrigin = getAllowedOrigin(req);
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response, allowedOrigin);
  return response;
};

const handler = async (req: NextRequest) => {
  const allowedOrigin = getAllowedOrigin(req);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => ({
      ...createTRPCContext({ headers: req.headers }),
      ...buildSubmitContext(),
    }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response, allowedOrigin);
  return response;
};

export { handler as GET, handler as POST };
