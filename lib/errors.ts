export type ErrorKey =
  | 'generic'
  | 'network'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'weakPassword'
  | 'notAuthorized'
  | 'invitationInvalid'
  | 'duplicate'
  | 'invalidInput';

export function toErrorKey(error: unknown): ErrorKey {
  if (error instanceof TypeError) return 'network';
  if (typeof error !== 'object' || error === null) return 'generic';

  const { code, message } = error as { code?: unknown; message?: unknown };
  const text = typeof message === 'string' ? message.toLowerCase() : '';

  if (code === 'invalid_credentials' || text.includes('invalid login credentials')) return 'invalidCredentials';
  if (code === 'email_not_confirmed' || text.includes('email not confirmed')) return 'emailNotConfirmed';
  if (code === 'user_already_exists' || text.includes('already registered')) return 'userExists';
  if (code === 'weak_password' || text.includes('at least')) return 'weakPassword';

  switch (code) {
    case '42501':
      return 'notAuthorized';
    case 'P0001':
      return 'invitationInvalid';
    case '23505':
      return 'duplicate';
    case '22023':
      return 'invalidInput';
    default:
      return 'generic';
  }
}
