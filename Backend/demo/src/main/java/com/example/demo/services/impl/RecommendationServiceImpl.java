package com.example.demo.services.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import com.example.demo.dto.response.JobRecommendationItemDto;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.redis.repository.RecommendationRedisRepository;
import com.example.demo.services.JobCandidateProvider;
import com.example.demo.services.JobRecommender;
import com.example.demo.services.RecommendationHydrator;
import com.example.demo.services.RecommendationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationServiceImpl implements RecommendationService {

    private final RecommendationRedisRepository recommendationRedisRepository;
    private final RedissonClient redissonClient;
    private final JobCandidateProvider candidateProvider;
    private final JobRecommender jobRecommender;
    private final RecommendationHydrator hydrator;

    @Override
    public List<JobRecommendationResponse> getRecommendations(Account user) {
        if (user == null || user.getId() == null) {
            return new ArrayList<>();
        }

        Long userId = user.getId();

        // 1. First Cache Lookup
        var cached = recommendationRedisRepository.getRecommendations(userId);
        if (cached.isPresent()) {
            log.debug("recommendation.cache.hit userId={}", userId);
            return hydrator.hydrateRecommendations(cached.get());
        }

        log.debug("recommendation.cache.miss userId={}", userId);

        // 2. Acquire Distributed Lock with Redisson
        String lockKey = "lock:recommendation:user:" + userId;
        RLock lock = redissonClient.getLock(lockKey);
        boolean isLocked = false;

        try {
            // Wait up to 500ms to acquire lock. Uses Redisson Watchdog for lease renewal.
            isLocked = lock.tryLock(500, TimeUnit.MILLISECONDS);
            if (isLocked) {
                log.debug("recommendation.lock.acquired userId={}", userId);

                // Double-Check Cache after acquiring lock
                cached = recommendationRedisRepository.getRecommendations(userId);
                if (cached.isPresent()) {
                    log.debug("recommendation.cache.hit.double_check userId={}", userId);
                    return hydrator.hydrateRecommendations(cached.get());
                }

                // Compute recommendations using Candidate Generation
                List<Job> candidates = candidateProvider.findCandidates(user, 100);
                List<JobRecommendationResponse> recommendations = jobRecommender.recommendJobs(user, candidates, 10);

                List<JobRecommendationItemDto> compactItems = recommendations.stream()
                        .map(r -> new JobRecommendationItemDto(r.getJob().getId(), r.getMatchPercentage()))
                        .collect(Collectors.toList());

                // Save to Redis (handles normal vs negative empty cache TTL automatically)
                recommendationRedisRepository.saveRecommendations(userId, compactItems);
                return recommendations;
            } else {
                log.warn("recommendation.lock.timeout userId={}", userId);
                return fallbackOnLockUnavailable(user);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Interrupted while acquiring recommendation lock for userId={}", userId, e);
            return fallbackOnLockUnavailable(user);
        } finally {
            if (isLocked && lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("recommendation.lock.released userId={}", userId);
            }
        }
    }

    private List<JobRecommendationResponse> fallbackOnLockUnavailable(Account user) {
        var stale = recommendationRedisRepository.getRecommendations(user.getId());
        if (stale.isPresent()) {
            log.debug("recommendation.fallback.stale_cache userId={}", user.getId());
            return hydrator.hydrateRecommendations(stale.get());
        }

        log.debug("recommendation.fallback.uncached userId={}", user.getId());
        List<Job> fallbackCandidates = candidateProvider.findCandidates(user, 10);
        return jobRecommender.recommendJobs(user, fallbackCandidates, 10);
    }
}
