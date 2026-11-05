import type { ModuleId } from '@/i18n/dictionaries';

const ICON_PATHS: Record<ModuleId, string> = {
  farm: 'M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16',
  ai: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 16l.9 2.1 2.1.9-2.1.9L19 22l-.9-2.1-2.1-.9 2.1-.9z',
  livestock: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z',
  commerce: 'M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8zM9 8V6a3 3 0 0 1 6 0v2',
  finance: 'M4 20h16M7 16v-4M12 16V8M17 16v-6',
  education: 'M3 6l9-3 9 3-9 3-9-3zM7 8v5c0 1.5 2.2 3 5 3s5-1.5 5-3V8M21 6v5',
};

export function ModuleIcon({ id, className }: { id: ModuleId; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={ICON_PATHS[id]} />
    </svg>
  );
}
