import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit tests (`*.test.ts`) run in plain Node. Component tests (`*.test.tsx`) put `// @vitest-environment jsdom`
// on their first line. None of them touch Firebase: server actions are mocked in each test.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true }, // the @/* alias from tsconfig.json
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    restoreMocks: true,
  },
});
