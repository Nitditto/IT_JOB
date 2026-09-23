package com.example.demo.redis.core.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;

import com.example.demo.constants.SyncStrategy;
import com.example.demo.redis.core.annotation.RedisEntity;
import com.example.demo.redis.core.annotation.RedisId;
import com.example.demo.redis.core.annotation.RedisIndexed;
import com.example.demo.redis.core.entity.BaseRedisEntity;
import com.example.demo.redis.core.sync.DbSyncService;
import com.example.demo.redis.core.sync.SyncCallback;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Test framework {@code AbstractRedisRepository} qua 1 entity giả lập (autoSync=true,
 * WRITE_BEHIND) — độc lập với {@code Job}. Xem {@code JobRedisRepositoryTest} cho case
 * autoSync=false/CACHE_ONLY.
 */
@ExtendWith(MockitoExtension.class)
class AbstractRedisRepositoryTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private SetOperations<String, String> setOperations;
    @Mock
    private DbSyncService dbSyncService;

    private ObjectMapper objectMapper;
    private TestEntityRepository repository;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule()); // BaseRedisEntity có field Instant
        lenient().doReturn(valueOperations).when(redisTemplate).opsForValue();
        lenient().doReturn(setOperations).when(redisTemplate).opsForSet();
        repository = new TestEntityRepository(redisTemplate, objectMapper, dbSyncService);
    }

    @RedisEntity(value = "testentity", timeToLive = 60, autoSync = true, syncStrategy = SyncStrategy.WRITE_BEHIND)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode(callSuper = true)
    static class TestEntity extends BaseRedisEntity<String> {
        @RedisId
        private String id;
        @RedisIndexed
        private String ownerId;
        private String name;
    }

    static class TestEntityRepository extends AbstractRedisRepository<TestEntity, String> {
        private final Map<String, TestEntity> dbFallbackStore = new HashMap<>();

        TestEntityRepository(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper, DbSyncService dbSyncService) {
            super(redisTemplate, objectMapper, dbSyncService);
        }

        void seedDbFallback(TestEntity entity) {
            dbFallbackStore.put(entity.getId(), entity);
        }

        @Override
        protected String generateId() {
            return UUID.randomUUID().toString();
        }

        @Override
        protected Optional<TestEntity> loadFromDb(String id) {
            return Optional.ofNullable(dbFallbackStore.get(id));
        }
    }

    private String toJson(TestEntity entity) throws Exception {
        return objectMapper.writeValueAsString(entity);
    }

    @Test
    void save_writeBehindStrategy_writesJsonWithTtl_updatesIndex_schedulesAsyncDbSync() {
        TestEntity entity = new TestEntity("e1", "owner-1", "Widget");

        TestEntity saved = repository.save(entity);

        assertThat(saved.getId()).isEqualTo("e1");
        verify(valueOperations).set(eq("testentity:e1"), org.mockito.ArgumentMatchers.contains("Widget"), eq(Duration.ofSeconds(60)));
        verify(setOperations).add(eq("testentity:idx:ownerId:owner-1"), eq("e1"));
        verify(dbSyncService).scheduleSync(eq(TestEntity.class), eq(entity), any());
    }

    @Test
    void save_generatesIdWhenMissing() {
        TestEntity entity = new TestEntity(null, "owner-2", "NoId");

        TestEntity saved = repository.save(entity);

        assertThat(saved.getId()).isNotNull();
    }

    @Test
    void save_callbackFromDbSync_reWritesEntityToRedis_toPersistSyncedFlag() throws Exception {
        TestEntity entity = new TestEntity("e2", "owner-2", "Gadget");
        when(valueOperations.get("testentity:e2")).thenReturn(toJson(entity));

        repository.save(entity);

        ArgumentCaptor<SyncCallback> callbackCaptor = ArgumentCaptor.forClass(SyncCallback.class);
        verify(dbSyncService).scheduleSync(eq(TestEntity.class), eq(entity), callbackCaptor.capture());

        callbackCaptor.getValue().onSyncComplete("e2", true, null);

        // 1 lần lúc save(), 1 lần lúc callback đánh dấu synced=true
        verify(valueOperations, times(2)).set(eq("testentity:e2"), anyString(), any(Duration.class));
    }

    @Test
    void save_whenRedisWriteFails_fallsBackToDirectSynchronousDbSync() {
        TestEntity entity = new TestEntity("e11", "owner-11", "Broken");
        doThrow(new RuntimeException("Redis down")).when(valueOperations).set(anyString(), anyString(), any(Duration.class));

        repository.save(entity);

        verify(dbSyncService).syncNow(TestEntity.class, entity);
        assertThat(entity.isSynced()).isTrue();
    }

    @Test
    void findById_cacheHit_returnsWithoutTouchingDb() throws Exception {
        TestEntity cached = new TestEntity("e4", "owner-4", "Cached");
        when(valueOperations.get("testentity:e4")).thenReturn(toJson(cached));

        Optional<TestEntity> result = repository.findById("e4");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Cached");
        verifyNoInteractions(dbSyncService);
    }

    @Test
    void findById_cacheMiss_fallsBackToDbAndRecachesResult() {
        TestEntity fromDb = new TestEntity("e3", "owner-3", "Recovered");
        repository.seedDbFallback(fromDb);
        when(valueOperations.get("testentity:e3")).thenReturn(null);

        Optional<TestEntity> result = repository.findById("e3");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Recovered");
        verify(valueOperations).set(eq("testentity:e3"), anyString(), any(Duration.class));
    }

    @Test
    void findById_cacheMissAndNotInDb_returnsEmpty() {
        when(valueOperations.get("testentity:missing")).thenReturn(null);

        Optional<TestEntity> result = repository.findById("missing");

        assertThat(result).isEmpty();
    }

    @Test
    void deleteById_removesFromRedisAndIndex_schedulesAsyncDbDelete() throws Exception {
        TestEntity existing = new TestEntity("e5", "owner-5", "ToDelete");
        when(valueOperations.get("testentity:e5")).thenReturn(toJson(existing));

        repository.deleteById("e5");

        verify(redisTemplate).delete("testentity:e5");
        verify(setOperations).remove("testentity:idx:ownerId:owner-5", "e5");
        verify(dbSyncService).scheduleDelete(TestEntity.class, "e5");
    }

    @Test
    void findByIndexedField_looksUpIndexSet_thenBatchFetchesByMultiGet() throws Exception {
        TestEntity e1 = new TestEntity("e6", "owner-x", "A");
        TestEntity e2 = new TestEntity("e7", "owner-x", "B");
        when(setOperations.members("testentity:idx:ownerId:owner-x")).thenReturn(Set.of("e6", "e7"));
        when(valueOperations.multiGet(anyList())).thenReturn(List.of(toJson(e1), toJson(e2)));

        List<TestEntity> results = repository.findByIndexedField("ownerId", "owner-x");

        assertThat(results).extracting(TestEntity::getName).containsExactlyInAnyOrder("A", "B");
    }

    @Test
    void findByIndexedField_emptyIndex_returnsEmptyList() {
        when(setOperations.members("testentity:idx:ownerId:none")).thenReturn(Set.of());

        List<TestEntity> results = repository.findByIndexedField("ownerId", "none");

        assertThat(results).isEmpty();
    }

    @Test
    void existsById_true_whenRedisHasKey() {
        when(redisTemplate.hasKey("testentity:e8")).thenReturn(true);

        assertThat(repository.existsById("e8")).isTrue();
    }

    @Test
    void existsById_fallsBackToDb_whenNotInRedis() {
        when(redisTemplate.hasKey("testentity:e9")).thenReturn(false);
        repository.seedDbFallback(new TestEntity("e9", "owner-9", "X"));

        assertThat(repository.existsById("e9")).isTrue();
    }

    @Test
    void recoverUnsynced_schedulesSyncForEntitiesStillMarkedUnsynced() throws Exception {
        TestEntity unsynced = new TestEntity("e10", "owner-10", "Stale");
        unsynced.setSynced(false);
        when(redisTemplate.keys("testentity:*")).thenReturn(Set.of("testentity:e10"));
        when(valueOperations.get("testentity:e10")).thenReturn(toJson(unsynced));

        int recovered = repository.recoverUnsynced();

        assertThat(recovered).isEqualTo(1);
        verify(dbSyncService).scheduleSync(eq(TestEntity.class), any(), any());
    }
}
