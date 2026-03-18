-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  device_name TEXT,
  shopee_user TEXT,
  shopee_pass TEXT,
  email_addr TEXT,
  email_pass TEXT,
  wa_number TEXT,
  sim_expiry DATE,
  sim_status TEXT DEFAULT 'ACTIVE',
  ktp_name TEXT,
  npwp_num TEXT,
  bank_name TEXT,
  bank_acc TEXT,
  doc_img_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  status TEXT DEFAULT 'REQUESTED',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  amount_gross NUMERIC DEFAULT 0,
  source_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies for accounts
CREATE POLICY "Users can manage their own accounts" 
ON accounts FOR ALL 
USING (auth.uid() = user_id);

-- Policies for samples (via accounts)
CREATE POLICY "Users can manage samples of their own accounts" 
ON samples FOR ALL 
USING (EXISTS (
  SELECT 1 FROM accounts 
  WHERE accounts.id = samples.account_id AND accounts.user_id = auth.uid()
));

-- Policies for commissions (via accounts)
CREATE POLICY "Users can manage commissions of their own accounts" 
ON commissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM accounts 
  WHERE accounts.id = commissions.account_id AND accounts.user_id = auth.uid()
));
