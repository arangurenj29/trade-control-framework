import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
