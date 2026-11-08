import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { mockRouter } from "./src/test/nextNavigationMock";
import { server } from "./src/test/server";

vi.mock("next/navigation", () => import("./src/test/nextNavigationMock"));

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  // Testing Library only cleans up automatically when test globals are enabled.
  cleanup();
  server.resetHandlers();
  mockRouter.reset();
});

afterAll(() => server.close());
