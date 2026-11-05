export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

export function homePathFor(isPlatformAdmin: boolean): string {
  return isPlatformAdmin ? '/admin' : '/dashboard';
}
