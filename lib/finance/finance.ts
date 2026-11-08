import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { asRecords, asString, type Row } from '@/lib/parse';

export const TRANSACTION_KINDS = ['income', 'expense'] as const;
export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export const INCOME_CATEGORIES = ['milk_sales', 'livestock_sales', 'crop_sales', 'subsidy', 'other_income'] as const;
export const EXPENSE_CATEGORIES = [
  'feed',
  'veterinary',
  'seeds',
  'fertilizer',
  'fuel',
  'equipment',
  'labour',
  'rent',
  'utilities',
  'other_expense',
] as const;
export type TransactionCategory = (typeof INCOME_CATEGORIES)[number] | (typeof EXPENSE_CATEGORIES)[number];

export const MAX_AMOUNT = 999_999_999.99;

export function categoriesFor(kind: TransactionKind): readonly TransactionCategory[] {
  return kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export type Transaction = {
  id: string;
  farm_id: string;
  kind: TransactionKind;
  category: TransactionCategory;
  transaction_date: string;
  amount: number;
  description: string;
  counterparty: string | null;
  notes: string | null;
};

export type TransactionInput = Omit<Transaction, 'id' | 'farm_id'>;

const COLUMNS = 'id, farm_id, kind, category, transaction_date, amount, description, counterparty, notes';

function parseTransaction(row: Row): Transaction | null {
  const id = asString(row.id);
  const farmId = asString(row.farm_id);
  const kind = asString(row.kind) as TransactionKind | null;
  const category = asString(row.category) as TransactionCategory | null;
  const date = asString(row.transaction_date);
  const description = asString(row.description);
  const amount = typeof row.amount === 'number' ? row.amount : Number(row.amount);
  if (!id || !farmId || !kind || !category || !date || !description || !Number.isFinite(amount)) return null;
  if (!TRANSACTION_KINDS.includes(kind) || !categoriesFor(kind).includes(category)) return null;
  return {
    id,
    farm_id: farmId,
    kind,
    category,
    transaction_date: date,
    amount,
    description,
    counterparty: asString(row.counterparty),
    notes: asString(row.notes),
  };
}

export async function fetchTransactions(farmId: string, fromDay: string, toDay: string): Promise<Transaction[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from('farm_transactions')
    .select(COLUMNS)
    .eq('farm_id', farmId)
    .gte('transaction_date', fromDay)
    .lte('transaction_date', toDay)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return asRecords(data).flatMap((row) => {
    const item = parseTransaction(row);
    return item ? [item] : [];
  });
}

export async function createTransaction(farmId: string, input: TransactionInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('farm_transactions')
    .insert({ ...input, farm_id: farmId });
  if (error) throw error;
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('farm_transactions')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from('farm_transactions').delete().eq('id', id);
  if (error) throw error;
}

/** Month key in the form YYYY-MM. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
}

export function monthBounds(key: string): { from: string; to: string } {
  const [year, month] = key.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${String(lastDay).padStart(2, '0')}` };
}
