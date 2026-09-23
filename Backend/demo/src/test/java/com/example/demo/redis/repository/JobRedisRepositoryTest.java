package com.example.demo.redis.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;

import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;
import com.example.demo.model.Job;
import com.example.demo.model.Location;
import com.example.demo.redis.core.sync.DbSyncService;
import com.example.demo.redis.entity.JobRedis;
import com.example.demo.repository.JobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Test riêng cho {@code JobRedisRepository} — trọng tâm là xác nhận đúng quyết định thiết kế
 * "Job.id sinh bởi DB sequence → CACHE_ONLY + autoSync=false, Redis chỉ cache đọc, KHÔNG bao
 * giờ tự ghi/xoá MariaDB" (xem CLAUDE.md phần Redis Caching Framework). Đây là điểm dễ regress
 * nhất nếu ai đó sau này đổi annotation trên {@code JobRedis} mà không hiểu lý do.
 */
@ExtendWith(MockitoExtension.class)
class JobRedisRepositoryTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private SetOperations<String, String> setOperations;
    @Mock
    private DbSyncService dbSyncService;
    @Mock
    private JobRepository jobRepository;

    private JobRedisRepository repository;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        lenient().doReturn(valueOperations).when(redisTemplate).opsForValue();
        lenient().doReturn(setOperations).when(redisTemplate).opsForSet();
        repository = new JobRedisRepository(redisTemplate, objectMapper, dbSyncService, jobRepository);
    }

    private Job sampleJob() {
        return Job.builder()
                .id(99L)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .companyID(5L)
                .name("Backend Developer")
                .minSalary(1000L)
                .maxSalary(2000L)
                .position(JobPosition.junior)
                .workstyle(JobWorkstyle.remote)
                .location(new Location("HN", "Hà Nội"))
                .address("123 Đường ABC")
                .tags(Set.of("java", "spring"))
                .images(Set.of())
                .description("Mô tả job")
                .appliedCount(3)
                .build();
    }

    @Test
    void generateId_throwsBecauseJobIdIsDbGenerated_notClientGeneratable() {
        assertThatThrownBy(repository::generateId)
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("DB sequence");
    }

    @Test
    void save_withNullId_propagatesGenerateIdFailure_beforeTouchingRedis() {
        JobRedis entityWithoutId = new JobRedis();

        assertThatThrownBy(() -> repository.save(entityWithoutId))
                .isInstanceOf(UnsupportedOperationException.class);
        verifyNoInteractions(redisTemplate, dbSyncService);
    }

    @Test
    void loadFromDb_delegatesToJobRepository_andMapsFieldsToJobRedis() {
        when(jobRepository.findById(99L)).thenReturn(Optional.of(sampleJob()));

        Optional<JobRedis> result = repository.loadFromDb(99L);

        assertThat(result).isPresent();
        JobRedis jobRedis = result.get();
        assertThat(jobRedis.getId()).isEqualTo(99L);
        assertThat(jobRedis.getCompanyID()).isEqualTo(5L);
        assertThat(jobRedis.getName()).isEqualTo("Backend Developer");
        assertThat(jobRedis.getTags()).containsExactlyInAnyOrder("java", "spring");
        assertThat(jobRedis.isSynced()).isTrue(); // đọc thẳng từ DB nên coi như đã đồng bộ
    }

    @Test
    void loadFromDb_returnsEmpty_whenJobNotFoundInDb() {
        when(jobRepository.findById(404L)).thenReturn(Optional.empty());

        assertThat(repository.loadFromDb(404L)).isEmpty();
    }

    @Test
    void convertId_acceptsLongDirectly() {
        assertThat(repository.convertId(42L)).isEqualTo(42L);
    }

    @Test
    void convertId_parsesStringToLong() {
        assertThat(repository.convertId("42")).isEqualTo(42L);
    }

    @Test
    void save_neverTriggersDbSync_becauseAutoSyncIsFalse() {
        JobRedis jobRedis = JobRedis.fromJpaEntity(sampleJob());

        repository.save(jobRedis);

        verifyNoInteractions(dbSyncService);
        verify(valueOperations).set(anyString(), anyString(), any());
    }

    @Test
    void findById_cacheMiss_fallsBackToJobRepository_andCachesResult_withoutTouchingDbSync() {
        when(valueOperations.get("job:99")).thenReturn(null);
        when(jobRepository.findById(99L)).thenReturn(Optional.of(sampleJob()));

        Optional<JobRedis> result = repository.findById(99L);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Backend Developer");
        verify(valueOperations).set(anyString(), anyString(), any());
        verifyNoInteractions(dbSyncService);
    }

    @Test
    void deleteById_removesFromRedisOnly_neverSchedulesDbDelete() {
        when(valueOperations.get("job:99")).thenReturn(null);

        repository.deleteById(99L);

        verify(redisTemplate).delete("job:99");
        verifyNoInteractions(dbSyncService);
    }

    @Test
    void recoverUnsynced_isNoOp_becauseAutoSyncIsFalse() {
        int recovered = repository.recoverUnsynced();

        assertThat(recovered).isZero();
        verifyNoInteractions(dbSyncService);
        verify(redisTemplate, never()).keys(anyString()); // no-op ngay, không cần quét Redis
    }

    @Test
    void syncAllToDb_isNoOp_becauseAutoSyncIsFalse() {
        int synced = repository.syncAllToDb();

        assertThat(synced).isZero();
        verifyNoInteractions(dbSyncService);
    }
}
