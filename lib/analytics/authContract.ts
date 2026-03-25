export const AUTH_EVENT_NAMES = [
  'gjm_auth_oauth_start',
  'gjm_auth_oauth_success',
  'gjm_auth_oauth_failure',
  'gjm_auth_email_code_requested',
  'gjm_auth_email_code_request_failed',
  'gjm_auth_email_code_verified',
  'gjm_auth_email_code_verify_failed',
  'gjm_auth_sign_out',
] as const;

export type AuthEventName = (typeof AUTH_EVENT_NAMES)[number];
