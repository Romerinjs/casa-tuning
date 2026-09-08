const path = require("node:path");
const { defineConfig } = require("vitest/config");

const rootDir = __dirname;

module.exports = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
