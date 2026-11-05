const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^[+0-9 ()./-]{6,30}$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function isValidPhone(value: string): boolean {
  return value.trim() === '' || PHONE_PATTERN.test(value.trim());
}
