-- 20260319_revise_hierarchy.sql
-- Revision for Dataset Structure and Hierarchy

-- Create shopee_affiliate_accounts table
CREATE TABLE IF NOT EXISTS shopee_affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shopee_pay_accounts table
CREATE TABLE IF NOT EXISTS shopee_pay_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ktp TEXT NOT NULL,
  nik TEXT NOT NULL,
  ktp_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update identities table to link to shopee_affiliate_accounts
ALTER TABLE identities ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE;
ALTER TABLE identities ADD COLUMN IF NOT EXISTS bank_acc_image_url TEXT;

-- Update sims table to link to either affiliate or pay
ALTER TABLE sims ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE;
ALTER TABLE sims ADD COLUMN IF NOT EXISTS pay_id UUID REFERENCES shopee_pay_accounts(id) ON DELETE CASCADE;

-- Enable RLS for new tables
ALTER TABLE shopee_affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopee_pay_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for shopee_affiliate_accounts
CREATE POLICY "Users can manage their own affiliate accounts" 
ON shopee_affiliate_accounts FOR ALL 
USING (auth.uid() = user_id);

-- Policies for shopee_pay_accounts
CREATE POLICY "Users can manage their own pay accounts" 
ON shopee_pay_accounts FOR ALL 
USING (auth.uid() = user_id);
