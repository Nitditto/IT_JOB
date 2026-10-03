package com.example.demo.redis.core.repository;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Contract CRUD cơ bản cho Redis repository — song song với Spring Data's {@code CrudRepository},
 * cộng thêm vài operation đặc thù Redis (TTL).
 */
public interface RedisCrudRepository<T, ID> extends RedisRepository<T, ID> {

    T save(T entity);

    List<T> saveAllBatch(List<T> entities);

    Optional<T> findById(ID id);

    List<T> findAllById(List<ID> ids);

    List<T> findAllByIdsBatch(List<ID> ids);

    List<T> findAll();

    boolean existsById(ID id);

    long count();

    void deleteById(ID id);

    void delete(T entity);

    void deleteAllById(List<ID> ids);

    void deleteAll();

    T refresh(ID id);

    void expire(ID id, Duration ttl);

    Duration getTimeToLive(ID id);
}
