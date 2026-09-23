package com.example.demo.redis.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.example.demo.constants.SyncStrategy;

/**
 * Đánh dấu 1 class là Redis entity — {@code AbstractRedisRepository} đọc annotation này
 * (qua reflection, lúc khởi tạo repository) để biết key prefix, TTL và cách đồng bộ DB.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RedisEntity {
    /** Prefix cho Redis key, ví dụ "job" → key thật là "job:123". Rỗng = dùng tên class viết thường. */
    String value() default "";

    /** TTL tính bằng giây. -1 = không hết hạn. */
    long timeToLive() default -1;

    /** Có tự động đồng bộ về DB theo {@link #syncStrategy()} khi save/delete không. */
    boolean autoSync() default true;

    SyncStrategy syncStrategy() default SyncStrategy.WRITE_BEHIND;
}
