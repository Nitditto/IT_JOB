package com.example.demo.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.example.demo.constants.RateLimitConstants;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

public class InMemoryRateLimiter implements RateLimiter {

    private final Map<String, TrackedBucket> cache = new ConcurrentHashMap<>();

    private static final class TrackedBucket {
        private final Bucket bucket;
        private volatile long lastAccessNanos = System.nanoTime();

        private TrackedBucket(final Bucket bucket) {
            this.bucket = bucket;
        }
    }

    @Override
    public boolean tryAcquire(final String clientKey, final String limitType) {
        this.evictIdleBucketsIfFull();
        final TrackedBucket tracked = this.cache.computeIfAbsent(
                clientKey + ":" + limitType, key -> new TrackedBucket(this.createNewBucket(limitType)));
        tracked.lastAccessNanos = System.nanoTime();
        return tracked.bucket.tryConsume(1);
    }

    private void evictIdleBucketsIfFull() {
        if (this.cache.size() < RateLimitConstants.MAX_TRACKED_CLIENTS) {
            return;
        }
        final long now = System.nanoTime();
        this.cache.values().removeIf(tracked -> now - tracked.lastAccessNanos > RateLimitConstants.BUCKET_IDLE_NANOS);
    }

    private Bucket createNewBucket(final String limitType) {
        final int capacity = RateLimitConstants.capacityFor(limitType);
        return Bucket.builder()
                .addLimit(Bandwidth.classic(capacity, Refill.intervally(capacity, Duration.ofMinutes(1))))
                .build();
    }
}
