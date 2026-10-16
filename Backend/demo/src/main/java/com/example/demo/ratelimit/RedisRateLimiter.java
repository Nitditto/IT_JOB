package com.example.demo.ratelimit;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;

import com.example.demo.constants.RateLimitConstants;

import lombok.extern.slf4j.Slf4j;

/**
 * Fixed-window counter dùng chung giữa các instance. Redis lỗi thì rơi về limiter in-memory
 * (chỉ giới hạn theo từng instance) thay vì chặn hoặc bỏ giới hạn toàn bộ.
 */
@Slf4j
public class RedisRateLimiter implements RateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final StringRedisTemplate redisTemplate;
    private final RateLimiter fallback;

    public RedisRateLimiter(final StringRedisTemplate redisTemplate, final RateLimiter fallback) {
        this.redisTemplate = redisTemplate;
        this.fallback = fallback;
    }

    @Override
    public boolean tryAcquire(final String clientKey, final String limitType) {
        try {
            final String key = RateLimitConstants.REDIS_KEY_PREFIX + limitType + ":" + clientKey;
            final Long count = this.redisTemplate.opsForValue().increment(key);
            if (count == null) {
                return this.fallback.tryAcquire(clientKey, limitType);
            }
            if (count == 1L) {
                this.redisTemplate.expire(key, WINDOW);
            }
            return count <= RateLimitConstants.capacityFor(limitType);
        } catch (RuntimeException exception) {
            log.warn("Redis rate limiter unavailable, falling back to in-memory: {}", exception.getMessage());
            return this.fallback.tryAcquire(clientKey, limitType);
        }
    }
}
