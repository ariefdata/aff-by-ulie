-- 20260319_fix_master_account.sql

-- Add email and password to accounts table if they don't exist
-- We'll keep nickname for now but use email/password for the Master details as requested

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS password TEXT;

-- If we want to migrate existing usernames to email:
UPDATE accounts SET email = nickname WHERE email IS NULL AND nickname IS NOT NULL;
