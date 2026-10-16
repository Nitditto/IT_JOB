package com.example.demo.ratelimit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.example.demo.constants.RateLimitConstants;

class RateLimiterTest {

    @Test
    void inMemoryBlocksAfterCapacity() {
        final RateLimiter limiter = new InMemoryRateLimiter();
        for (int i = 0; i < RateLimitConstants.AUTH_CAPACITY_PER_MINUTE; i++) {
            assertTrue(limiter.tryAcquire("1.1.1.1", RateLimitConstants.AUTH_LIMIT_TYPE));
        }
        assertFalse(limiter.tryAcquire("1.1.1.1", RateLimitConstants.AUTH_LIMIT_TYPE));
        assertTrue(limiter.tryAcquire("2.2.2.2", RateLimitConstants.AUTH_LIMIT_TYPE));
    }

    @Test
    @SuppressWarnings("unchecked")
    void redisBlocksWhenCounterExceedsCapacity() {
        final StringRedisTemplate template = mock(StringRedisTemplate.class);
        final ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(template.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenReturn(1L, (long) RateLimitConstants.AUTH_CAPACITY_PER_MINUTE + 1);
        final RateLimiter limiter = new RedisRateLimiter(template, new InMemoryRateLimiter());

        assertTrue(limiter.tryAcquire("ip", RateLimitConstants.AUTH_LIMIT_TYPE));
        assertFalse(limiter.tryAcquire("ip", RateLimitConstants.AUTH_LIMIT_TYPE));
    }

    @Test
    void redisFailureFallsBackToInMemory() {
        final StringRedisTemplate template = mock(StringRedisTemplate.class);
        when(template.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));
        final RateLimiter limiter = new RedisRateLimiter(template, new InMemoryRateLimiter());

        for (int i = 0; i < RateLimitConstants.AUTH_CAPACITY_PER_MINUTE; i++) {
            assertTrue(limiter.tryAcquire("ip", RateLimitConstants.AUTH_LIMIT_TYPE));
        }
        assertFalse(limiter.tryAcquire("ip", RateLimitConstants.AUTH_LIMIT_TYPE));
    }
}
