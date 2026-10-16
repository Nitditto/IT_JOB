ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64);
UPDATE refresh_tokens SET token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex') WHERE token_hash IS NULL;
ALTER TABLE refresh_tokens ALTER COLUMN token_hash SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_refresh_tokens_token_hash ON refresh_tokens (token_hash);
ALTER TABLE refresh_tokens DROP COLUMN token;
