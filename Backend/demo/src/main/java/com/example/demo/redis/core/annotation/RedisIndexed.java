package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu field cần tạo secondary index (1 Redis SET chứa các ID) để query theo field này
 * không phải quét toàn bộ key — xem {@code AbstractRedisRepository.findByIndexedField}.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisIndexed {
    /** Tên index, rỗng = dùng tên field. */
    String name() default "";
}
