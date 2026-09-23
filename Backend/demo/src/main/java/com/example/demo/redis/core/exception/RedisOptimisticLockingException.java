package com.example.demo.redis.core.exception;

/**
 * Dự trữ cho CAS (compare-and-set) theo {@code BaseRedisEntity.version} — hiện field version
 * chỉ tăng dần, chưa có nơi nào check version cũ trước khi ghi (chưa enforce optimistic lock
 * thật). Thêm exception này sẵn để dùng khi implement CAS, tránh phải sửa lại chỗ gọi sau.
 */
public class RedisOptimisticLockingException extends RuntimeException {

    public RedisOptimisticLockingException(String message) {
        super(message);
    }

    public RedisOptimisticLockingException(Class<?> entityClass, Object id) {
        super("%s with id %s was modified by another transaction".formatted(entityClass.getSimpleName(), id));
    }
}
