package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.response.JobRecommendationItemDto;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.redis.repository.RecommendationRedisRepository;
import com.example.demo.services.impl.RecommendationServiceImpl;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock
    private RecommendationRedisRepository recommendationRedisRepository;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private RLock lock;

    @Mock
    private JobCandidateProvider candidateProvider;

    @Mock
    private JobRecommender jobRecommender;

    @Mock
    private RecommendationHydrator hydrator;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private Account user;

    @BeforeEach
    void setUp() {
        user = new Account();
        user.setId(10L);
        user.setName("Test Candidate");
    }

    @Test
    void getRecommendations_CacheHit_ShouldReturnHydratedWithoutLock() {
        List<JobRecommendationItemDto> cachedItems = List.of(new JobRecommendationItemDto(100L, 90.0));
        JobCardResponse card = new JobCardResponse();
        card.setId(100L);
        List<JobRecommendationResponse> hydrated = List.of(new JobRecommendationResponse(card, 90.0));

        when(recommendationRedisRepository.getRecommendations(10L)).thenReturn(Optional.of(cachedItems));
        when(hydrator.hydrateRecommendations(cachedItems)).thenReturn(hydrated);

        List<JobRecommendationResponse> result = recommendationService.getRecommendations(user);

        assertEquals(1, result.size());
        assertEquals(100L, result.get(0).getJob().getId());
        verify(redissonClient, never()).getLock(anyString());
    }

    @Test
    void getRecommendations_CacheMiss_ShouldAcquireLockAndCompute() throws InterruptedException {
        when(recommendationRedisRepository.getRecommendations(10L)).thenReturn(Optional.empty());
        when(redissonClient.getLock("lock:recommendation:user:10")).thenReturn(lock);
        when(lock.tryLock(500, TimeUnit.MILLISECONDS)).thenReturn(true);
        when(lock.isHeldByCurrentThread()).thenReturn(true);

        Job candidateJob = new Job();
        candidateJob.setId(100L);
        when(candidateProvider.findCandidates(user, 100)).thenReturn(List.of(candidateJob));

        JobCardResponse card = new JobCardResponse();
        card.setId(100L);
        List<JobRecommendationResponse> computed = List.of(new JobRecommendationResponse(card, 85.0));
        when(jobRecommender.recommendJobs(eq(user), any(), eq(10))).thenReturn(computed);

        List<JobRecommendationResponse> result = recommendationService.getRecommendations(user);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(recommendationRedisRepository).saveRecommendations(eq(10L), any());
        verify(lock).unlock();
    }
}
