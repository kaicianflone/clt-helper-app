import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

const REMOVED_PATHS = [
  "/greenways/:path*",
  "/deals/:path*",
  "/map",
  "/parking/:path*",
  "/today",
  "/contribute/:path*",
  "/onboarding",
];

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@clt/ui"],

  async redirects() {
    return REMOVED_PATHS.map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
  },
};

export default config;
