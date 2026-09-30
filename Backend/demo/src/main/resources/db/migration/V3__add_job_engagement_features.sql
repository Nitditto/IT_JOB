CREATE SEQUENCE IF NOT EXISTS saved_jobs_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS company_follows_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS job_alerts_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS job_views_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS saved_jobs (
    id BIGINT NOT NULL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_saved_jobs_account_job UNIQUE (account_id, job_id)
);

CREATE TABLE IF NOT EXISTS company_follows (
    id BIGINT NOT NULL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_company_follows_account_company UNIQUE (account_id, company_id)
);

CREATE TABLE IF NOT EXISTS job_alerts (
    id BIGINT NOT NULL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(255),
    query VARCHAR(255),
    location VARCHAR(255),
    category VARCHAR(255),
    industry VARCHAR(255),
    min_salary BIGINT,
    max_salary BIGINT,
    position VARCHAR(50),
    workstyle VARCHAR(50),
    employment_type VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS job_alert_tags (
    job_alert_id BIGINT NOT NULL REFERENCES job_alerts(id) ON DELETE CASCADE,
    tag VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS job_views (
    id BIGINT NOT NULL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_account ON saved_jobs(account_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_account ON company_follows(account_id);
CREATE INDEX IF NOT EXISTS idx_company_follows_company ON company_follows(company_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_account ON job_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_account ON job_views(account_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);
