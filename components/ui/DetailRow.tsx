export function DetailRow({ label, value, notSetText }: { label: string; value: string | null; notSetText: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-medium text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-900">{value && value.trim() !== '' ? value : notSetText}</dd>
    </div>
  );
}
