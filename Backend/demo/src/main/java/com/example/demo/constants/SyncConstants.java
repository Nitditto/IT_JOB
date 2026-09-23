package com.example.demo.constants;

import java.util.Set;

public final class SyncConstants {

    private SyncConstants() {
    }

    public static final int MAX_RETRY_COUNT = 3;
    public static final int BATCH_SIZE = 100;

    public static final int SCHEDULER_THREAD_POOL_SIZE = 1;
    public static final int SCHEDULER_INITIAL_DELAY_SECONDS = 1;
    public static final int SCHEDULER_PERIOD_SECONDS = 1;

    public static final int SYNC_THREAD_POOL_SIZE = 4;
    public static final int SHUTDOWN_TIMEOUT_SECONDS = 10;

    public static final long RECOVERY_STARTUP_DELAY_MS = 5000L;
    public static final String RECOVERY_THREAD_NAME = "sync-recovery";

    /** Field của BaseRedisEntity không map sang cột DB nào — bỏ qua khi build UPSERT. */
    public static final Set<String> SKIP_SYNC_FIELDS = Set.of(
            "redisCreatedAt", "redisUpdatedAt", "synced", "version");
}
