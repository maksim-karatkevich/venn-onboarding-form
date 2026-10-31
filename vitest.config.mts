import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Requests never leave the tests: MSW answers them at this placeholder URL.
    env: { NEXT_PUBLIC_API_BASE_URL: "https://api.test" },
    setupFiles: ["./vitest.setup.ts"],
  },
});
