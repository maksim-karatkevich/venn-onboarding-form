export const PERSONAL_DETAILS_FIELD = {
  FIRST_NAME: "firstName",
  LAST_NAME: "lastName",
  PHONE: "phone",
  CORPORATION_NUMBER: "corporationNumber",
} as const;

export type OnboardingStep = (typeof STEP_ORDER)[number];

export const ONBOARDING_STEPS = {
  PERSONAL: "personal",
  PHONE: "phone",
  CORP_NUMBER: "corpNumber",
  REVIEW: "review",
} as const;

export const STEP_FIELDS = {
  [ONBOARDING_STEPS.PERSONAL]: [
    PERSONAL_DETAILS_FIELD.FIRST_NAME,
    PERSONAL_DETAILS_FIELD.LAST_NAME,
  ],
  [ONBOARDING_STEPS.PHONE]: [PERSONAL_DETAILS_FIELD.PHONE],
  [ONBOARDING_STEPS.CORP_NUMBER]: [PERSONAL_DETAILS_FIELD.CORPORATION_NUMBER],
  [ONBOARDING_STEPS.REVIEW]: [],
};

export const STEP_ORDER = [
  ONBOARDING_STEPS.PERSONAL,
  ONBOARDING_STEPS.PHONE,
  ONBOARDING_STEPS.CORP_NUMBER,
  ONBOARDING_STEPS.REVIEW,
] as const;

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
