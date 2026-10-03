package com.example.demo.redis.core.sync;

/**
 * Callback báo cho {@code AbstractRedisRepository} biết khi nào 1 tác vụ đồng bộ DB
 * (chạy async qua {@code DbSyncService}) hoàn tất, để cập nhật cờ {@code synced} trên
 * Redis entity tương ứng.
 */
@FunctionalInterface
public interface SyncCallback {
    void onSyncComplete(Object entityId, boolean success, String error);
}
