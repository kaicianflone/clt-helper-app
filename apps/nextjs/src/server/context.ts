/**
 * Web-layer tRPC context extensions.
 *
 * Provides submit-flow injections (rate-limit, GitHub bot, diff, content-filter)
 * to the shared API. These are only initialized at request-time — never at module
 * top-level — so they don't block the Next.js build when env vars are absent.
 */

import { env } from "~/env";

// Lazy singletons — initialized on first request, never at import-time.
// This ensures env vars are only accessed at request time (not build time).

interface OctokitLike {
  rest: {
    repos: {
      getContent: (args: {
        owner: string;
        repo: string;
        path: string;
        ref?: string;
      }) => Promise<{ data: { sha: string; content?: string; encoding?: string } }>;
    };
  };
}

interface RateLimitMod {
  buildRedis: () => unknown;
  checkRateLimit: (deviceId: string, redis: unknown) => Promise<{ ok: boolean; remaining: number }>;
}

interface GithubBotMod {
  buildOctokit: () => OctokitLike;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openCommunityPR: (oc: OctokitLike, opts: any) => Promise<any>;
}

interface DiffMod {
  renderDiff: (b: Record<string, unknown>, a: Record<string, unknown>) => string;
  isVerifyOnlyChange: (b: Record<string, unknown>, a: Record<string, unknown>) => boolean;
}

interface ContentFilterMod {
  containsObjectionableContent: (input: {
    displayName: string;
    note: string;
    patch: Record<string, unknown>;
  }) => { violation: boolean; reason?: string };
}

let _redis: unknown = null;
let _octokit: OctokitLike | null = null;

const getRedis = (): unknown => {
  if (!_redis) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@clt/api/server/rate-limit") as RateLimitMod;
    _redis = mod.buildRedis();
  }
  return _redis;
};

const getOctokit = (): OctokitLike => {
  if (!_octokit) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@clt/api/server/github-bot") as GithubBotMod;
    _octokit = mod.buildOctokit();
  }
  return _octokit;
};

export interface SubmitContextExtensions {
  baseUrl?: string;
  checkRateLimit: (deviceId: string) => Promise<{ ok: boolean; remaining: number }>;
  fetchFileFromRepo: (path: string) => Promise<Record<string, unknown>>;
  renderDiff: (before: Record<string, unknown>, after: Record<string, unknown>) => string;
  isVerifyOnlyChange: (before: Record<string, unknown>, after: Record<string, unknown>) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openCommunityPR: (opts: any) => Promise<any>;
  containsObjectionableContent: (input: {
    displayName: string;
    note: string;
    patch: Record<string, unknown>;
  }) => { violation: boolean; reason?: string };
}

/**
 * Build the submit-flow context injections for a tRPC request.
 * Returns a partial Context with all server-only services populated.
 */
export function buildSubmitContext(): SubmitContextExtensions {
  return {
    baseUrl: env.R2_PUBLIC_BASE_URL,

    checkRateLimit: (deviceId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@clt/api/server/rate-limit") as RateLimitMod;
      return mod.checkRateLimit(deviceId, getRedis());
    },

    fetchFileFromRepo: async (filePath: string) => {
      try {
        const octokit = getOctokit();
        const { data } = await octokit.rest.repos.getContent({
          owner: env.GH_REPO_OWNER ?? "",
          repo: env.GH_REPO_NAME ?? "",
          path: filePath,
        });
        if (!data.content || !data.encoding) {
          // Submodules or symlinks may not include content; treat as absent
          return {};
        }
        const decoded = Buffer.from(
          data.content,
          data.encoding as BufferEncoding,
        ).toString("utf8");
        return JSON.parse(decoded) as Record<string, unknown>;
      } catch (e: unknown) {
        const err = e as { status?: number };
        if (err.status === 404) return {};
        throw e;
      }
    },

    renderDiff: (
      before: Record<string, unknown>,
      after: Record<string, unknown>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@clt/api/server/diff") as DiffMod;
      return mod.renderDiff(before, after);
    },

    isVerifyOnlyChange: (
      before: Record<string, unknown>,
      after: Record<string, unknown>,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@clt/api/server/diff") as DiffMod;
      return mod.isVerifyOnlyChange(before, after);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openCommunityPR: (opts: any) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@clt/api/server/github-bot") as GithubBotMod;
      return mod.openCommunityPR(getOctokit(), opts);
    },

    containsObjectionableContent: (input: {
      displayName: string;
      note: string;
      patch: Record<string, unknown>;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@clt/api/server/content-filter") as ContentFilterMod;
      return mod.containsObjectionableContent(input);
    },
  };
}
