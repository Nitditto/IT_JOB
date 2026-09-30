package com.example.demo.redis.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.example.demo.dto.response.JobRecommendationItemDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@ExtendWith(MockitoExtension.class)
class RecommendationRedisRepositoryTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private ValueOperations<String, Object> valueOperations;

    private RecommendationRedisRepository repository;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        lenient().doReturn(valueOperations).when(redisTemplate).opsForValue();
        repository = new RecommendationRedisRepository(redisTemplate, objectMapper);
    }

    @Test
    void getRecommendations_returnsEmpty_whenCacheMiss() {
        when(valueOperations.get("recommendation:user:1")).thenReturn(null);

        Optional<List<JobRecommendationItemDto>> result = repository.getRecommendations(1L);

        assertThat(result).isEmpty();
    }

    @Test
    void getRecommendations_returnsDeserializedCompactItems_whenCacheHit() {
        JobRecommendationItemDto item = new JobRecommendationItemDto(10L, 88.5);
        List<JobRecommendationItemDto> items = List.of(item);
        when(valueOperations.get("recommendation:user:1")).thenReturn(items);

        Optional<List<JobRecommendationItemDto>> result = repository.getRecommendations(1L);

        assertThat(result).isPresent();
        assertThat(result.get()).hasSize(1);
        assertThat(result.get().get(0).getJobId()).isEqualTo(10L);
        assertThat(result.get().get(0).getMatchPercentage()).isEqualTo(88.5);
    }

    @Test
    void saveRecommendations_appliesTtlJitter() {
        JobRecommendationItemDto item = new JobRecommendationItemDto(10L, 92.0);
        List<JobRecommendationItemDto> items = List.of(item);

        repository.saveRecommendations(1L, items);

        ArgumentCaptor<Long> ttlCaptor = ArgumentCaptor.forClass(Long.class);
        verify(valueOperations).set(eq("recommendation:user:1"), eq(items), ttlCaptor.capture(), eq(TimeUnit.SECONDS));

        // TTL should be between BASE_TTL (3600) and BASE_TTL + MAX_JITTER (4200)
        assertThat(ttlCaptor.getValue()).isBetween(3600L, 4200L);
    }

    @Test
    void evictUserRecommendations_deletesSingleKey() {
        repository.evictUserRecommendations(5L);

        verify(redisTemplate).delete("recommendation:user:5");
    }
}
