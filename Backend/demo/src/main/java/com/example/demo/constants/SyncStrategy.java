package com.example.demo.constants;

/**
 * Chiến lược đồng bộ giữa Redis (cache) và MariaDB (nguồn sự thật) cho entity gắn
 * {@code @RedisEntity}. Xem {@code redis.core.repository.AbstractRedisRepository} để biết
 * từng chiến lược được xử lý ra sao khi {@code save()}.
 */
public enum SyncStrategy {
    /** Ghi Redis trước, đồng bộ DB async qua {@code DbSyncService} (nhanh nhất, mặc định). */
    WRITE_BEHIND,
    /** Ghi Redis và DB đồng thời trong cùng request (chậm hơn, đảm bảo consistency ngay). */
    WRITE_THROUGH,
    /** Không đồng bộ DB — dùng cho entity mà DB đã là nguồn ghi chính (ví dụ cache read-through
     *  cho aggregate root có ID sinh bởi DB sequence, xem {@code JobRedis}). */
    CACHE_ONLY,
    /** Ghi DB trước, cập nhật Redis sau — dự trữ cho luồng cần DB xác nhận trước khi cache. */
    DB_FIRST
}
