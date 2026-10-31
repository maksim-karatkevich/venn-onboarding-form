import { setupServer } from "msw/node";

// Tests add their own handlers. A request nothing handles fails the test.
export const server = setupServer();
