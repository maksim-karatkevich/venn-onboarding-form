const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// Without this, requests would go to a relative "undefined/..." path, and the
// resulting 404 would look like an invalid corporation number.
if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

export const API_BASE_URL = apiBaseUrl;
export const REQUEST_TIMEOUT_MS = 10_000;
