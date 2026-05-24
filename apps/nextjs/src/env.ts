import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    REVALIDATION_SECRET: z.string().optional(),
    MAPTILER_KEY: z.string().optional(),
    DATA_BASE_URL: z.string().url().optional(),
    // Back-compat alias for DATA_BASE_URL; deployments carrying the legacy
    // name should keep working until they migrate.
    R2_PUBLIC_BASE_URL: z.string().url().optional(),
    GH_REPO_OWNER: z.string().optional(),
    GH_REPO_NAME: z.string().optional(),
    GH_APP_ID: z.string().optional(),
    GH_APP_INSTALLATION_ID: z.string().optional(),
    GH_APP_PRIVATE_KEY: z.string().optional(),
    CORS_ALLOWED_ORIGINS: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    // MapTiler keys are URL-safe alphanumerics. Reject keys with spaces,
    // newlines, or characters that would break the query string and leak the
    // raw value into network logs / Sentry / referer headers.
    NEXT_PUBLIC_MAPTILER_KEY: z
      .string()
      .min(20)
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "MapTiler keys must be URL-safe alphanumerics",
      ),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  },
  skipValidation:
    !!process.env.CI ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.VITEST,
});
