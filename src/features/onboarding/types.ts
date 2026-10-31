export const PERSONAL_DETAILS_FIELD = {
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  PHONE: "phone",
  CORPORATION_NUMBER: "corporationNumber",
} as const;

export type SubmitResult = { ok: true } | { ok: false; message: string };

export const CORPORATION_NUMBER_STATUS = {
  CHECKING: "checking",
  VALID: "valid",
  INVALID: "invalid",
  UNAVAILABLE: "unavailable",
} as const;

export type CorporationNumberCheckStatus =
  (typeof CORPORATION_NUMBER_STATUS)[keyof typeof CORPORATION_NUMBER_STATUS];

/** The outcome of a finished check. */
export type CorporationNumberStatus = Exclude<
  CorporationNumberCheckStatus,
  typeof CORPORATION_NUMBER_STATUS.CHECKING
>;

export type CorporationNumberCheck = {
  number: string;
  status: CorporationNumberCheckStatus;
};
