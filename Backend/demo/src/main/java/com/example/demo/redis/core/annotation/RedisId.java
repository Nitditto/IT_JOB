package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker cho field ID của Redis entity — mang tính khai báo/đọc code là chính, việc đọc/ghi ID
 * thật đi qua {@code BaseRedisEntity#getId()/setId()} (bắt buộc override ở mọi entity con).
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisId {
}
