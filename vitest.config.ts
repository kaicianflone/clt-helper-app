import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: {
      "@clt/data-schema": path.resolve("packages/data-schema/src/index.ts"),
      // Match the nextjs tsconfig path alias so route tests can `import { env } from "~/env"`.
      "~/": `${path.resolve("apps/nextjs/src")}/`,
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/nextjs/**/*.test.ts", "scripts/**/*.test.ts", "apps/expo/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
