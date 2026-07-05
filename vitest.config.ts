import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@flarerail/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@flarerail/config": path.resolve(__dirname, "packages/config/src/index.ts"),
      "@flarerail/contracts": path.resolve(
        __dirname,
        "packages/contracts/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    exclude: ["node_modules", "dist", ".next", "coverage", "developer-hub"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
  },
});
