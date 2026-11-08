/*
# Farm finance transactions

1. New table
- `farm_transactions`: one income or expense entry for a farm.
  - `farm_id`: the farm the entry belongs to.
  - `kind`: `income` or `expense`.
  - `category`: fixed category list (sales, feed, veterinary, ...).
  - `transaction_date`: day of the payment or sale.
  - `amount`: positive amount, up to 999 999 999.99.
  - `description`: short label (1 to 120 characters).
  - `counterparty`: buyer or supplier, optional.
  - `notes`: optional comment.
  - `created_at`, `updated_at`: audit fields.

2. Security
- Row level security is enabled.
- Members of a farm can read its transactions; super administrators can read all of them.
- Creating, editing and deleting entries requires the farm.manage permission.

3. Important notes
- The category must match the kind (income categories for income, expense categories for expenses).
- Each policy is dropped first if it already exists, so this migration can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.farm_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  category text NOT NULL,
  transaction_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0 AND amount < 1000000000),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 120),
  counterparty text CHECK (counterparty IS NULL OR char_length(counterparty) <= 120),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT farm_transactions_category_matches_kind CHECK (
    (kind = 'income' AND category IN ('milk_sales', 'livestock_sales', 'crop_sales', 'subsidy', 'other_income'))
    OR (kind = 'expense' AND category IN ('feed', 'veterinary', 'seeds', 'fertilizer', 'fuel', 'equipment', 'labour', 'rent', 'utilities', 'other_expense'))
  )
);

CREATE INDEX IF NOT EXISTS farm_transactions_farm_date_idx ON public.farm_transactions (farm_id, transaction_date);

ALTER TABLE public.farm_transactions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.farm_transactions FROM anon, authenticated;
GRANT SELECT ON public.farm_transactions TO authenticated;
GRANT INSERT (farm_id, kind, category, transaction_date, amount, description, counterparty, notes) ON public.farm_transactions TO authenticated;
GRANT UPDATE (kind, category, transaction_date, amount, description, counterparty, notes, updated_at) ON public.farm_transactions TO authenticated;
GRANT DELETE ON public.farm_transactions TO authenticated;

DROP POLICY IF EXISTS farm_transactions_select ON public.farm_transactions;
CREATE POLICY farm_transactions_select ON public.farm_transactions FOR SELECT
  TO authenticated
  USING (public.is_farm_member(farm_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS farm_transactions_insert ON public.farm_transactions;
CREATE POLICY farm_transactions_insert ON public.farm_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS farm_transactions_update ON public.farm_transactions;
CREATE POLICY farm_transactions_update ON public.farm_transactions FOR UPDATE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'))
  WITH CHECK (public.has_farm_permission(farm_id, 'farm.manage'));

DROP POLICY IF EXISTS farm_transactions_delete ON public.farm_transactions;
CREATE POLICY farm_transactions_delete ON public.farm_transactions FOR DELETE
  TO authenticated
  USING (public.has_farm_permission(farm_id, 'farm.manage'));
