UPDATE accounts SET status = UPPER(status) WHERE status IS NOT NULL AND status <> UPPER(status);
