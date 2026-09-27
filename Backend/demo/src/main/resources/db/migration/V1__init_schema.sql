-- Flyway Migration: V1__init_schema.sql (PostgreSQL)

CREATE SEQUENCE IF NOT EXISTS accounts_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS jobs_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS hibernate_sequence START WITH 1 INCREMENT BY 50;

-- 1. Location Table
CREATE TABLE IF NOT EXISTS location (
    abbreviation VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    avatar TEXT,
    phone VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    lookingfor VARCHAR(255),
    address VARCHAR(255),
    location_abbreviation VARCHAR(255) REFERENCES location(abbreviation),
    model VARCHAR(50),
    scale VARCHAR(50),
    start_work BIGINT,
    end_work BIGINT,
    has_overtime BOOLEAN
);

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT NOT NULL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE,
    companyid BIGINT,
    name VARCHAR(255),
    min_salary BIGINT,
    max_salary BIGINT,
    position VARCHAR(50),
    workstyle VARCHAR(50),
    location_abbreviation VARCHAR(255) REFERENCES location(abbreviation),
    address VARCHAR(255),
    description TEXT,
    applied_count INTEGER DEFAULT 0,
    version BIGINT
);

-- 4. Job Tags Table
CREATE TABLE IF NOT EXISTS job_tags (
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    tag VARCHAR(255)
);

-- 5. Job Images Table
CREATE TABLE IF NOT EXISTS job_images (
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    images TEXT
);

-- 6. CV Table
CREATE TABLE IF NOT EXISTS cv (
    accounts_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    jobs_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    cv_file TEXT,
    referral TEXT,
    status VARCHAR(50),
    PRIMARY KEY (accounts_id, jobs_id)
);

-- 7. Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL,
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);
