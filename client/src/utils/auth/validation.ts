import { i18n } from "../../services/i18n";

export function validateRegistration(username: string, email: string, password: string): string | null {
  if (!username || !email || !password) return i18n.t('fill_all_fields');
  if (username.length < 3) return i18n.t('username_too_short');
  if (username.length > 20) return i18n.t('username_too_long');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return i18n.t('username_invalid_chars');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return i18n.t('invalid_email');
  if (password.length < 8) return i18n.t('password_too_short');
  if (password.length > 64) return i18n.t('password_too_long');
  if (!/[0-9]/.test(password)) return i18n.t('password_needs_number');
  if (!/[A-Z]/.test(password)) return i18n.t('password_needs_uppercase');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return i18n.t('password_needs_special');
  return null;
}
