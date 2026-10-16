CREATE UNIQUE INDEX IF NOT EXISTS uk_accounts_email_lower ON accounts (lower(email));
