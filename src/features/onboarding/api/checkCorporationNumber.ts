import {
  CORPORATION_NUMBER_STATUS,
  type CorporationNumberStatus,
} from "../types";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config";

/**
 * Never rejects. "unavailable" means the API gave no answer about this number
 * (network failure, timeout or an unexpected response), which is different
 * from the number being invalid.
 */
export async function checkCorporationNumber(
  number: string,
): Promise<CorporationNumberStatus> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/corporation-number/${encodeURIComponent(number)}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    // The API reports an invalid number with a 404, which the spec doesn't mention.
    if (response.status === 404) return CORPORATION_NUMBER_STATUS.INVALID;
    if (!response.ok) return CORPORATION_NUMBER_STATUS.UNAVAILABLE;

    const { valid } = await response.json();
    if (valid === true) return CORPORATION_NUMBER_STATUS.VALID;
    if (valid === false) return CORPORATION_NUMBER_STATUS.INVALID;
    return CORPORATION_NUMBER_STATUS.UNAVAILABLE;
  } catch {
    return CORPORATION_NUMBER_STATUS.UNAVAILABLE;
  }
}
