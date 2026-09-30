package com.example.demo.redis.repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.dto.response.JobRecommendationItemDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Repository quản lý Cache gợi ý công việc (Recommendation) cho ứng viên trong Redis
 * theo kiến trúc Large-Scale.
 *
 * <p>Nguyên tắc thiết kế:
 * <ul>
 *   <li>Lưu dạng compact payload: {@code List<JobRecommendationItemDto>} (chỉ chứa {@code jobId} + {@code score}).</li>
 *   <li>Key format: {@code recommendation:user:{userId}}</li>
 *   <li>TTL có Jitter: 3600s + random(0-600s) giúp phân tán thời điểm hết hạn cache.</li>
 *   <li>Selective Eviction: Chỉ xóa cache của đúng user khi user edit profile; KHÔNG xóa toàn bộ cache khi Job thay đổi (tránh Cache Stampede storm).</li>
 * </ul>
 */
@Repository
@Slf4j
public class RecommendationRedisRepository {

    public static final String KEY_PREFIX = "recommendation:user:";
    public static final long BASE_TTL_SECONDS = 3600; // 1h
    public static final long MAX_JITTER_SECONDS = 600; // 10m
    public static final long EMPTY_BASE_TTL_SECONDS = 300; // 5m negative cache TTL
    public static final long EMPTY_MAX_JITTER_SECONDS = 60; // 1m jitter for empty cache

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper redisObjectMapper;

    public RecommendationRedisRepository(
            RedisTemplate<String, Object> redisTemplate,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
        this.redisTemplate = redisTemplate;
        this.redisObjectMapper = redisObjectMapper;
    }

    /**
     * Đọc danh sách gợi ý compact (jobId + score) đã cache từ Redis.
     */
    public Optional<List<JobRecommendationItemDto>> getRecommendations(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        String key = getKey(userId);
        try {
            Object raw = redisTemplate.opsForValue().get(key);
            if (raw == null) {
                return Optional.empty();
            }
            List<JobRecommendationItemDto> result = redisObjectMapper.convertValue(
                    raw, new TypeReference<List<JobRecommendationItemDto>>() {});
            return Optional.ofNullable(result);
        } catch (Exception e) {
            log.error("Failed to read recommendation cache from Redis for userId={}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Ghi danh sách gợi ý compact vào Redis với TTL Jitter ngẫu nhiên.
     * Sử dụng TTL ngắn (300s + jitter) cho kết quả rỗng (negative caching).
     */
    public void saveRecommendations(Long userId, List<JobRecommendationItemDto> items) {
        if (userId == null || items == null) {
            return;
        }
        long ttlWithJitter;
        if (items.isEmpty()) {
            ttlWithJitter = EMPTY_BASE_TTL_SECONDS + ThreadLocalRandom.current().nextLong(EMPTY_MAX_JITTER_SECONDS);
        } else {
            ttlWithJitter = BASE_TTL_SECONDS + ThreadLocalRandom.current().nextLong(MAX_JITTER_SECONDS);
        }
        saveRecommendations(userId, items, ttlWithJitter);
    }

    /**
     * Ghi danh sách gợi ý compact vào Redis với TTL chỉ định.
     */
    public void saveRecommendations(Long userId, List<JobRecommendationItemDto> items, long ttlSeconds) {
        if (userId == null || items == null) {
            return;
        }
        String key = getKey(userId);
        try {
            redisTemplate.opsForValue().set(key, items, ttlSeconds, TimeUnit.SECONDS);
            log.debug("Saved compact job recommendations to Redis for userId={} with TTL={}s", userId, ttlSeconds);
        } catch (Exception e) {
            log.error("Failed to save recommendation cache to Redis for userId={}: {}", userId, e.getMessage());
        }
    }

    /**
     * Xóa cache gợi ý của 1 ứng viên cụ thể (gọi khi user edit profile).
     */
    public void evictUserRecommendations(Long userId) {
        if (userId == null) {
            return;
        }
        String key = getKey(userId);
        try {
            redisTemplate.delete(key);
            log.info("Evicted recommendation cache for userId={}", userId);
        } catch (Exception e) {
            log.error("Failed to evict recommendation cache for userId={}: {}", userId, e.getMessage());
        }
    }

    private String getKey(Long userId) {
        return KEY_PREFIX + userId;
    }
}
