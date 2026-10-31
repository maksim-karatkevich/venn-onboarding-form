import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./src/test/server";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  // Testing Library only cleans up automatically when test globals are enabled.
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
