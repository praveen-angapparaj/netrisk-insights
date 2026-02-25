
-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'savings',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  total_inward_amount NUMERIC NOT NULL DEFAULT 0,
  total_outward_amount NUMERIC NOT NULL DEFAULT 0,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  dormant_flag BOOLEAN NOT NULL DEFAULT false
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_account UUID NOT NULL REFERENCES public.accounts(id),
  to_account UUID NOT NULL REFERENCES public.accounts(id),
  amount NUMERIC NOT NULL,
  channel TEXT NOT NULL,
  device_id TEXT,
  geo_location TEXT,
  transaction_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Since this is an internal admin tool with no user auth, allow public read/write
-- In production, this would be locked down with proper auth
CREATE POLICY "Allow public read accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update accounts" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete accounts" ON public.accounts FOR DELETE USING (true);

CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE USING (true);

CREATE POLICY "Allow public read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update alerts" ON public.alerts FOR UPDATE USING (true);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;

-- Create indexes
CREATE INDEX idx_transactions_from ON public.transactions(from_account);
CREATE INDEX idx_transactions_to ON public.transactions(to_account);
CREATE INDEX idx_transactions_time ON public.transactions(transaction_time);
CREATE INDEX idx_alerts_account ON public.alerts(account_id);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_accounts_risk ON public.accounts(risk_score);
CREATE INDEX idx_accounts_flagged ON public.accounts(is_flagged);
