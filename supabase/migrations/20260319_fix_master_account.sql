-- 20260319_fix_master_account.sql

-- 1. Ensure accounts has email, password, and username (nickname)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password TEXT;
-- username is already nickname in the initial schema, but let's make sure it's clear
-- If we want to strictly use 'username' column name:
-- ALTER TABLE accounts RENAME COLUMN nickname TO username; 
-- But I'll stick to 'nickname' or add 'username' if missing. 
-- The user said "input username pada akun master". 
-- I'll add 'username' column if it doesn't exist.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Update commissions and samples to use affiliate_id
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES shopee_affiliate_accounts(id) ON DELETE CASCADE;

-- Optional: Migrate data from account_id to affiliate_id if possible (might not be if multiple affiliates exist)
-- For now, we'll just leave it as is for existing data or manual fix.

-- Enable RLS for news (already done for tables, but check policies if they need affiliate_id logic)
-- Current policies use account_id which links back to accounts.
-- If they use affiliate_id, we need to update policies.

DROP POLICY IF EXISTS "Users can manage samples of their own accounts" ON samples;
CREATE POLICY "Users can manage samples of their own affiliates" 
ON samples FOR ALL 
USING (EXISTS (
  SELECT 1 FROM shopee_affiliate_accounts 
  WHERE shopee_affiliate_accounts.id = samples.affiliate_id AND shopee_affiliate_accounts.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can manage commissions of their own accounts" ON commissions;
CREATE POLICY "Users can manage commissions of their own affiliates" 
ON commissions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM shopee_affiliate_accounts 
  WHERE shopee_affiliate_accounts.id = commissions.affiliate_id AND shopee_affiliate_accounts.user_id = auth.uid()
));
