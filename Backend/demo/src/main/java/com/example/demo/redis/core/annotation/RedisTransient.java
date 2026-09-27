package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu field KHÔNG lưu vào Redis (ví dụ field tính toán runtime). Khai báo sẵn cho
 * consistency với annotation set của framework — chưa có repository nào đọc annotation này
 * (mọi field không phải static/transient Java hiện đều được serialize); dùng khi cần loại
 * field cụ thể khỏi JSON lưu Redis.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisTransient {
}
