export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.";

export function validatePasswordPolicy(password: string) {
  const value = String(password || "");
  const valid =
    value.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  return {
    valid,
    message: valid ? null : PASSWORD_POLICY_MESSAGE,
  };
}
