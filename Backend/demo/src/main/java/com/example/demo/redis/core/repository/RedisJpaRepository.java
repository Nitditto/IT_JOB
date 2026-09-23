package com.example.demo.redis.core.repository;

import java.util.List;

/**
 * Mở rộng {@link RedisCrudRepository} với các operation liên quan tới đồng bộ DB và
 * secondary index — dùng bởi entity có {@code @LinkedJpaEntity}.
 */
public interface RedisJpaRepository<T, ID> extends RedisCrudRepository<T, ID> {

    void syncToDb(ID id);

    void syncToDbAsync(ID id);

    int syncAllToDb();

    List<T> saveAllAndSync(List<T> entities);

    List<T> findByIndexedField(String fieldName, Object value);
}
