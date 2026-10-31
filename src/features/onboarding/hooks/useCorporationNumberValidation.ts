import { useRef, useState } from "react";
import { checkCorporationNumber } from "../api/checkCorporationNumber";
import { personalDetailsSchema } from "../schemas/personalDetailsSchema";
import {
  CORPORATION_NUMBER_STATUS,
  PERSONAL_DETAILS_FIELD,
  type CorporationNumberCheck,
  type CorporationNumberCheckStatus,
  type CorporationNumberStatus,
} from "../types";

const ERROR_MESSAGES: Partial<Record<CorporationNumberCheckStatus, string>> = {
  [CORPORATION_NUMBER_STATUS.INVALID]: "Invalid Corporation Number",
  [CORPORATION_NUMBER_STATUS.UNAVAILABLE]:
    "We couldn't verify this number right now. Please click Submit to try again.",
};

export function useCorporationNumberValidation() {
  // One entry per number: a running check and a finished one are the same
  // promise, so callers reuse it either way.
  const checks = useRef(new Map<string, Promise<CorporationNumberStatus>>());
  const [check, setCheck] = useState<CorporationNumberCheck | null>(null);

  function validateCorporationNumber(number: string) {
    const existingCheck = checks.current.get(number);
    if (existingCheck) return existingCheck;

    const newCheck = checkCorporationNumber(number).then((status) => {
      // Failures aren't saved, so the next attempt calls the API again.
      if (status === CORPORATION_NUMBER_STATUS.UNAVAILABLE) {
        checks.current.delete(number);
      }
      return status;
    });
    checks.current.set(number, newCheck);
    return newCheck;
  }

  async function runCheck(number: string) {
    setCheck({ number, status: CORPORATION_NUMBER_STATUS.CHECKING });
    const status = await validateCorporationNumber(number);
    // Requests aren't cancelled: a late result is still correct for its own
    // number, so it stays saved but only updates the field if it's still current.
    setCheck((current) =>
      current?.number === number ? { number, status } : current,
    );
  }

  function handleBlur(value: string) {
    const parsed =
      personalDetailsSchema.shape[
        PERSONAL_DETAILS_FIELD.CORPORATION_NUMBER
      ].safeParse(value);
    if (parsed.success) runCheck(parsed.data);
  }

  function reset() {
    setCheck(null);
  }

  return {
    isChecking: check?.status === CORPORATION_NUMBER_STATUS.CHECKING,
    error: check ? ERROR_MESSAGES[check.status] : undefined,
    handleBlur,
    reset,
  };
}
