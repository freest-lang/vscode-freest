import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "test/extension/**/*.test.js",
  mocha: { ui: "tdd", timeout: 60_000 },
});
