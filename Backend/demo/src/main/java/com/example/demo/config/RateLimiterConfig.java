package com.example.demo.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.example.demo.ratelimit.InMemoryRateLimiter;
import com.example.demo.ratelimit.RateLimiter;
import com.example.demo.ratelimit.RedisRateLimiter;

@Configuration
public class RateLimiterConfig {

    @Bean
    public RateLimiter rateLimiter(
            @Value("${app.rate-limit.store:memory}") final String store,
            final ObjectProvider<StringRedisTemplate> redisTemplate) {
        final RateLimiter inMemory = new InMemoryRateLimiter();
        final StringRedisTemplate template = redisTemplate.getIfAvailable();
        if ("redis".equalsIgnoreCase(store) && template != null) {
            return new RedisRateLimiter(template, inMemory);
        }
        return inMemory;
    }
}
