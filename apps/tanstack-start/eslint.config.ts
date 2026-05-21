import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@clt/eslint-config/base";
import { reactConfig } from "@clt/eslint-config/react";

export default defineConfig(
  {
    ignores: [".nitro/**", ".output/**", ".tanstack/**"],
  },
  baseConfig,
  reactConfig,
  restrictEnvAccess,
);
