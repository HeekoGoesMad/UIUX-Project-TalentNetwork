export interface PasswordRequirements {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const req = checkPasswordRequirements(password);
  return (
    req.hasMinLength &&
    req.hasUppercase &&
    req.hasLowercase &&
    req.hasNumber
  );
}
