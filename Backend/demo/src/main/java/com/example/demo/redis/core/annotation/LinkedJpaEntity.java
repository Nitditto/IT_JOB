package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Liên kết Redis entity với JPA entity gốc — {@code DbSyncService} dùng để biết bảng/entity
 * nào cần UPSERT khi đồng bộ, và {@code AbstractRedisRepository} dùng khi cache-miss cần
 * fallback đọc DB (qua {@code loadFromDb} do repository con implement).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface LinkedJpaEntity {
    Class<?> value();
}
