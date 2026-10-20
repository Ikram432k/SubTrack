ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;

UPDATE subscriptions
  SET current_period_start = started_at
  WHERE current_period_start IS NULL;

ALTER TABLE subscriptions
  ALTER COLUMN current_period_start SET DEFAULT now(),
  ALTER COLUMN current_period_start SET NOT NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS description TEXT;