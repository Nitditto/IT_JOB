-- Optimistic locking cho transition trạng thái CV (REST/Telegram có thể đổi đồng thời).
ALTER TABLE cv ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
