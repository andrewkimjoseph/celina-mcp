import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 90_000,
    hookTimeout: 90_000,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/unit/**"],
  },
});
