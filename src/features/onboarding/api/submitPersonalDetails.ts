import type { PersonalDetails } from "../schemas/personalDetailsSchema";
import type { SubmitResult } from "../types";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** Never rejects. A 400 returns the server's message, any other failure a generic one. */
export async function submitPersonalDetails(
  details: PersonalDetails,
): Promise<SubmitResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile-details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    // A successful response is a plain-text "OK", so the body isn't read.
    if (response.ok) return { ok: true };

    if (response.status === 400) {
      const { message } = await response.json();
      if (message) return { ok: false, message };
    }
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }
}
