import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/nextjs/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
