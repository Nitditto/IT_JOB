package com.example.demo.redis.core.entity;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

/**
 * Base class cho mọi Redis entity. Entity con implement {@link #getId()}/{@link #setId(Object)}
 * và thêm field domain riêng — không cần annotation JPA gì, serialize bằng Jackson thuần
 * (xem {@code RedisCoreConfig.redisObjectMapper}), không dùng object mapping của Spring Data Redis.
 */
@Getter
@Setter
public abstract class BaseRedisEntity<ID> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Instant redisCreatedAt;
    private Instant redisUpdatedAt;
    private boolean synced = false;
    private Long version = 0L;

    public abstract ID getId();

    public abstract void setId(ID id);

    /** Gọi trước mỗi lần lưu vào Redis — cập nhật timestamp, đánh dấu chưa đồng bộ, tăng version. */
    public void prePersist() {
        if (redisCreatedAt == null) {
            redisCreatedAt = Instant.now();
        }
        redisUpdatedAt = Instant.now();
        synced = false;
        version = (version == null ? 0L : version) + 1;
    }
}
