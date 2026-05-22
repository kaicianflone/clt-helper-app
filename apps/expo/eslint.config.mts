import { defineConfig } from "eslint/config";

import { baseConfig } from "@clt/eslint-config/base";
import { reactConfig } from "@clt/eslint-config/react";

export default defineConfig(
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  baseConfig,
  reactConfig,
);
