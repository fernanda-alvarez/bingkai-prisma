import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.{test,spec}.js", "tests/**/*.{test,spec}.ts"],
    environment: "jsdom"
  }
});
