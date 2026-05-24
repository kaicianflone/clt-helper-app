import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@clt/eslint-config/base";
import { nextjsConfig } from "@clt/eslint-config/nextjs";
import { reactConfig } from "@clt/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess
);
