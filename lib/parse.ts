export type Row = Record<string, unknown>;

export function asRecords(data: unknown): Row[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Row => typeof item === 'object' && item !== null);
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
