'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, fieldClassName } from '@/components/ui/FormField';
import { Notice } from '@/components/ui/Notice';
import { useAppText } from '@/i18n/useAppText';
import { toErrorKey } from '@/lib/errors';
import {
  MAX_AMOUNT,
  TRANSACTION_KINDS,
  categoriesFor,
  createTransaction,
  updateTransaction,
  type Transaction,
  type TransactionCategory,
  type TransactionInput,
  type TransactionKind,
} from '@/lib/finance/finance';
import { localDay } from '@/lib/milk/milk';

type TransactionFormDialogProps = {
  farmId: string;
  transaction: Transaction | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function TransactionFormDialog({ farmId, transaction, defaultDate, onClose, onSaved }: TransactionFormDialogProps) {
  const t = useAppText();
  const [kind, setKind] = useState<TransactionKind>(transaction?.kind ?? 'expense');
  const [category, setCategory] = useState<TransactionCategory | ''>(transaction?.category ?? '');
  const [date, setDate] = useState(transaction?.transaction_date ?? defaultDate);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [counterparty, setCounterparty] = useState(transaction?.counterparty ?? '');
  const [notes, setNotes] = useState(transaction?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categories = categoriesFor(kind);

  const changeKind = (next: TransactionKind) => {
    setKind(next);
    if (category && !categoriesFor(next).includes(category)) setCategory('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const value = Number(amount.trim().replace(/\s/g, '').replace(',', '.'));
    const amountValid = amount.trim() !== '' && Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT;
    const next = {
      category: category ? null : t.common.required,
      date: date ? null : t.common.required,
      amount: amountValid ? null : t.finance.amountInvalid,
      description: description.trim() ? null : t.common.required,
    };
    setErrors(next);
    if (!category || Object.values(next).some(Boolean)) return;

    const input: TransactionInput = {
      kind,
      category,
      transaction_date: date,
      amount: Math.round(value * 100) / 100,
      description: description.trim(),
      counterparty: optional(counterparty),
      notes: optional(notes),
    };

    setPending(true);
    try {
      if (transaction) await updateTransaction(transaction.id, input);
      else await createTransaction(farmId, input);
      await onSaved();
    } catch (cause) {
      setError(t.common.error[toErrorKey(cause)]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest-900/50 px-6" role="dialog" aria-modal="true">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-brand-forest-900">{transaction ? t.finance.formEdit : t.finance.formNew}</h2>
          <p className="text-sm text-stone-600">{t.finance.formSubtitle}</p>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-brand-forest-900">{t.finance.kind}</legend>
          <div className="grid grid-cols-2 gap-3">
            {TRANSACTION_KINDS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeKind(option)}
                disabled={pending}
                aria-pressed={kind === option}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                  kind === option
                    ? option === 'income'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-red-600 bg-red-50 text-red-800'
                    : 'border-brand-forest-200 bg-white text-stone-700 hover:bg-brand-forest-50'
                }`}
              >
                {t.finance.kinds[option]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="finance-category" className="text-sm font-medium text-brand-forest-900">
            {t.finance.category}
          </label>
          <select
            id="finance-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            disabled={pending}
            aria-invalid={Boolean(errors.category)}
            className={`${fieldClassName} ${errors.category ? 'border-red-400' : 'border-brand-forest-200'}`}
          >
            <option value="" disabled>
              —
            </option>
            {categories.map((option) => (
              <option key={option} value={option}>
                {t.finance.categories[option]}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-700">{errors.category}</p>}
        </div>

        <FormField
          id="finance-description"
          label={t.finance.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          error={errors.description}
          disabled={pending}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="finance-date"
            type="date"
            label={t.finance.date}
            value={date}
            max={localDay(new Date(new Date().getFullYear() + 1, 11, 31))}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            disabled={pending}
          />
          <FormField
            id="finance-amount"
            inputMode="decimal"
            label={t.finance.amount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            disabled={pending}
          />
        </div>

        <FormField
          id="finance-counterparty"
          label={t.finance.counterparty}
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
          maxLength={120}
          disabled={pending}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="finance-notes" className="text-sm font-medium text-brand-forest-900">
            {t.finance.notes}
          </label>
          <textarea
            id="finance-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            disabled={pending}
            className={`${fieldClassName} resize-y border-brand-forest-200`}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t.finance.saving : t.finance.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
