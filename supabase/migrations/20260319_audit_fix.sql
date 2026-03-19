-- 20260319_audit_fix.sql
-- Comprehensive audit and fix for all tables and RLS policies

-- 1. Master Accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Shopee Affiliate Accounts
CREATE TABLE IF NOT EXISTS shopee_affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure username is GONE if it was added
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shopee_affiliate_accounts' AND column_name='username') THEN
    ALTER TABLE shopee_affiliate_accounts DROP COLUMN username;
  END IF;
END $$;

-- 3. Shopee Pay Accounts
CREATE TABLE IF NOT EXISTS shopee_pay_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ktp TEXT NOT NULL,
  nik TEXT NOT NULL,
  ktp_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Identities (KYC)
CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE,
  nik TEXT NOT NULL,
  name_ktp TEXT NOT NULL,
  npwp TEXT,
  bank_name TEXT,
  bank_acc TEXT,
  bank_acc_image_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SIM Connectivity
CREATE TABLE IF NOT EXISTS sims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE,
  pay_id UUID REFERENCES shopee_pay_accounts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  has_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Samples
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  shop_name TEXT,
  brand_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for ALL tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopee_affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopee_pay_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sims ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid duplicates
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
  END LOOP;
END $$;

-- Standardized RLS Policies (User ID based)
CREATE POLICY "manage_own_accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_affiliates" ON shopee_affiliate_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_pay" ON shopee_pay_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_identities" ON identities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_sims" ON sims FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_commissions" ON commissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_samples" ON samples FOR ALL USING (auth.uid() = user_id);
