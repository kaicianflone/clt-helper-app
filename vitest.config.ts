import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: {
      "@clt/data-schema": path.resolve("packages/data-schema/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/nextjs/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
