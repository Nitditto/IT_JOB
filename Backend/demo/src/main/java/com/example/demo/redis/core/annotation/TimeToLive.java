package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Dự trữ cho TTL override theo từng instance (khác TTL cố định ở {@code @RedisEntity}).
 * Khai báo sẵn cho đầy đủ annotation set; {@code AbstractRedisRepository} hiện luôn dùng
 * TTL từ {@code @RedisEntity.timeToLive()} — field đánh dấu bằng annotation này chưa được
 * đọc, cần bổ sung logic trong {@code AbstractRedisRepository.save()} nếu muốn dùng thật.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TimeToLive {
}
