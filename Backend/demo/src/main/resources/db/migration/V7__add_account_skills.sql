CREATE TABLE IF NOT EXISTS account_skills (
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    skill VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_skills_account ON account_skills(account_id);
CREATE INDEX IF NOT EXISTS idx_account_skills_skill ON account_skills(skill);
