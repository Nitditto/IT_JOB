package com.example.demo.redis.core.repository;

import java.lang.reflect.Field;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import com.example.demo.constants.RedisConstants;
import com.example.demo.constants.SyncStrategy;
import com.example.demo.redis.core.annotation.RedisEntity;
import com.example.demo.redis.core.annotation.RedisIndexed;
import com.example.demo.redis.core.entity.BaseRedisEntity;
import com.example.demo.redis.core.sync.DbSyncService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Base implementation dùng chung cho mọi Redis repository — đọc {@code @RedisEntity} trên
 * class entity (qua reflection, lúc constructor chạy) để biết key prefix/TTL/sync strategy,
 * rồi tự lo việc serialize JSON, quản lý secondary index ({@code @RedisIndexed}), và phối hợp
 * với {@code DbSyncService} theo strategy đã cấu hình.
 *
 * <p>Nguyên tắc chịu lỗi: Redis không sẵn sàng KHÔNG BAO GIỜ được làm hỏng tính đúng — mọi
 * operation đọc/ghi Redis đều có fallback thẳng xuống DB (qua {@code loadFromDb}/DbSyncService)
 * khi Redis lỗi. Xem từng method để biết fallback cụ thể.
 *
 * @param <T>  Redis entity, extends {@link BaseRedisEntity}
 * @param <ID> kiểu ID của entity
 */
@Slf4j
public abstract class AbstractRedisRepository<T extends BaseRedisEntity<ID>, ID> implements RedisJpaRepository<T, ID> {

    protected final RedisTemplate<String, String> redisTemplate;
    protected final ObjectMapper objectMapper;
    protected final DbSyncService dbSyncService;

    private final Class<T> entityClass;
    private final String keyPrefix;
    private final long defaultTtlSeconds;
    private final boolean autoSync;
    private final SyncStrategy syncStrategy;

    @SuppressWarnings("unchecked")
    protected AbstractRedisRepository(RedisTemplate<String, Object> redisTemplate,
            @Qualifier("redisObjectMapper") ObjectMapper objectMapper,
            DbSyncService dbSyncService) {
        // RedisTemplate<String,Object> ở bean chỉ dùng StringRedisSerializer cho value (xem
        // RedisCoreConfig) — cast an toàn về RedisTemplate<String,String> để làm rõ ý ở tầng này.
        this.redisTemplate = (RedisTemplate<String, String>) (RedisTemplate<?, ?>) redisTemplate;
        this.objectMapper = objectMapper;
        this.dbSyncService = dbSyncService;

        Class<?>[] typeArgs = GenericTypeResolver.resolveTypeArguments(getClass(), AbstractRedisRepository.class);
        if (typeArgs == null) {
            throw new IllegalStateException("Cannot resolve generic type arguments for " + getClass().getSimpleName()
                    + " — repository con phải extends AbstractRedisRepository<Entity, IdType> trực tiếp với type cụ thể.");
        }
        this.entityClass = (Class<T>) typeArgs[0];

        RedisEntity annotation = entityClass.getAnnotation(RedisEntity.class);
        if (annotation == null) {
            throw new IllegalStateException(entityClass.getSimpleName() + " phải có annotation @RedisEntity");
        }
        this.keyPrefix = annotation.value().isBlank() ? entityClass.getSimpleName().toLowerCase() : annotation.value();
        this.defaultTtlSeconds = annotation.timeToLive();
        this.autoSync = annotation.autoSync();
        this.syncStrategy = annotation.syncStrategy();
    }

    // ---- Abstract — repository con phải implement ----

    /** Sinh ID mới cho entity chưa có ID. Với entity có PK sinh bởi DB sequence (không phải
     *  client-generatable như UUID), override để throw {@code UnsupportedOperationException} —
     *  entity phải luôn được tạo từ 1 bản ghi DB đã tồn tại (xem {@code JobRedis}). */
    protected abstract ID generateId();

    /** Load entity từ DB khi cache-miss — repository con gọi JPA repository tương ứng. */
    protected abstract Optional<T> loadFromDb(ID id);

    /** Coerce giá trị đọc từ Redis SET (String) về đúng kiểu ID. Mặc định unchecked cast —
     *  override khi ID không phải String (ví dụ Long, UUID). */
    @SuppressWarnings("unchecked")
    protected ID convertId(Object rawId) {
        return (ID) rawId;
    }

    // ---- Key building ----

    private String buildKey(ID id) {
        return keyPrefix + RedisConstants.KEY_SEPARATOR + id;
    }

    private String buildIndexKey(String fieldName, Object value) {
        return keyPrefix + RedisConstants.INDEX_KEY_MARKER + fieldName + RedisConstants.KEY_SEPARATOR + value;
    }

    private String getAllKeysPattern() {
        return keyPrefix + RedisConstants.KEY_SEPARATOR + "*";
    }

    // ---- CRUD ----

    @Override
    public T save(T entity) {
        if (entity.getId() == null) {
            entity.setId(generateId());
        }
        entity.prePersist();

        try {
            writeToRedis(entity);
            updateIndexes(entity);
            if (autoSync) {
                handleSync(entity);
            }
        } catch (Exception ex) {
            log.error("Redis write failed for {} id={}, falling back to direct DB write: {}",
                    entityClass.getSimpleName(), entity.getId(), ex.getMessage());
            if (syncStrategy != SyncStrategy.CACHE_ONLY) {
                dbSyncService.syncNow(entityClass, entity);
                entity.setSynced(true);
            }
        }
        return entity;
    }

    /** Ghi lại Redis + index nhưng KHÔNG trigger sync — dùng nội bộ để tránh double-schedule
     *  (ví dụ sau khi {@code markAsSynced} vừa chạy xong). */
    private void saveWithoutSync(T entity) {
        try {
            writeToRedis(entity);
            updateIndexes(entity);
        } catch (Exception ex) {
            log.warn("saveWithoutSync failed for {} id={}: {}", entityClass.getSimpleName(), entity.getId(), ex.getMessage());
        }
    }

    private void writeToRedis(T entity) throws Exception {
        String key = buildKey(entity.getId());
        String json = objectMapper.writeValueAsString(entity);
        ValueOperations<String, String> valueOps = redisTemplate.opsForValue();
        if (defaultTtlSeconds > 0) {
            valueOps.set(key, json, Duration.ofSeconds(defaultTtlSeconds));
        } else {
            valueOps.set(key, json);
        }
    }

    private void handleSync(T entity) {
        switch (syncStrategy) {
            case WRITE_THROUGH -> {
                dbSyncService.syncNow(entityClass, entity);
                entity.setSynced(true);
                saveWithoutSync(entity);
            }
            case WRITE_BEHIND -> dbSyncService.scheduleSync(entityClass, entity,
                    (entityId, success, error) -> { if (success) { markAsSynced((ID) entityId); } });
            case CACHE_ONLY -> entity.setSynced(true);
            case DB_FIRST -> log.warn("SyncStrategy.DB_FIRST chưa được hỗ trợ ở AbstractRedisRepository — "
                    + "entity {} chỉ được cache, không tự ghi DB. Ghi DB trước qua service riêng rồi mới gọi save() để cache.",
                    entityClass.getSimpleName());
            default -> throw new IllegalStateException("Unknown sync strategy: " + syncStrategy);
        }
    }

    @Override
    public List<T> saveAllBatch(List<T> entities) {
        if (entities.isEmpty()) {
            return entities;
        }
        Map<String, String> keyToJson = new java.util.HashMap<>();
        for (T entity : entities) {
            if (entity.getId() == null) {
                entity.setId(generateId());
            }
            entity.prePersist();
            try {
                keyToJson.put(buildKey(entity.getId()), objectMapper.writeValueAsString(entity));
            } catch (Exception ex) {
                log.error("Failed to serialize {} id={} for batch save: {}", entityClass.getSimpleName(), entity.getId(), ex.getMessage());
            }
        }

        redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (Map.Entry<String, String> entry : keyToJson.entrySet()) {
                byte[] keyBytes = entry.getKey().getBytes();
                byte[] valueBytes = entry.getValue().getBytes();
                if (defaultTtlSeconds > 0) {
                    connection.stringCommands().setEx(keyBytes, defaultTtlSeconds, valueBytes);
                } else {
                    connection.stringCommands().set(keyBytes, valueBytes);
                }
            }
            return null;
        });

        for (T entity : entities) {
            updateIndexesPipelined(entity);
        }
        return entities;
    }

    @Override
    public Optional<T> findById(ID id) {
        try {
            String json = redisTemplate.opsForValue().get(buildKey(id));
            if (json != null) {
                return Optional.of(deserialize(json));
            }
        } catch (Exception ex) {
            log.warn("Redis read failed for {} id={}, falling back to DB: {}", entityClass.getSimpleName(), id, ex.getMessage());
        }

        Optional<T> fromDb = loadFromDb(id);
        fromDb.ifPresent(entity -> {
            try {
                save(entity);
            } catch (Exception ex) {
                log.warn("Failed to cache {} id={} back into Redis after DB fallback: {}", entityClass.getSimpleName(), id, ex.getMessage());
            }
        });
        return fromDb;
    }

    @Override
    public List<T> findAllById(List<ID> ids) {
        return findAllByIdsBatch(ids);
    }

    @Override
    public List<T> findAllByIdsBatch(List<ID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        List<String> keys = ids.stream().map(this::buildKey).toList();
        try {
            List<String> jsonValues = redisTemplate.opsForValue().multiGet(keys);
            if (jsonValues == null) {
                return List.of();
            }
            return jsonValues.stream()
                    .filter(java.util.Objects::nonNull)
                    .map(this::deserialize)
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            log.warn("Redis batch read failed for {}, returning empty: {}", entityClass.getSimpleName(), ex.getMessage());
            return List.of();
        }
    }

    @Override
    public List<T> findAll() {
        try {
            Set<String> keys = redisTemplate.keys(getAllKeysPattern());
            if (keys == null || keys.isEmpty()) {
                return List.of();
            }
            return keys.stream()
                    .filter(k -> !k.contains(RedisConstants.INDEX_KEY_MARKER))
                    .map(k -> redisTemplate.opsForValue().get(k))
                    .filter(java.util.Objects::nonNull)
                    .map(this::deserialize)
                    .collect(Collectors.toList());
        } catch (Exception ex) {
            log.warn("Redis scan failed for {}: {}", entityClass.getSimpleName(), ex.getMessage());
            return List.of();
        }
    }

    @Override
    public boolean existsById(ID id) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(buildKey(id))) || loadFromDb(id).isPresent();
        } catch (Exception ex) {
            return loadFromDb(id).isPresent();
        }
    }

    @Override
    public long count() {
        return findAll().size();
    }

    @Override
    public void deleteById(ID id) {
        try {
            findById(id).ifPresent(this::removeIndexes);
            redisTemplate.delete(buildKey(id));
        } catch (Exception ex) {
            log.warn("Redis delete failed for {} id={}: {}", entityClass.getSimpleName(), id, ex.getMessage());
        }
        if (autoSync && syncStrategy != SyncStrategy.CACHE_ONLY) {
            dbSyncService.scheduleDelete(entityClass, id);
        }
    }

    @Override
    public void delete(T entity) {
        deleteById(entity.getId());
    }

    @Override
    public void deleteAllById(List<ID> ids) {
        ids.forEach(this::deleteById);
    }

    @Override
    public void deleteAll() {
        findAll().forEach(entity -> deleteById(entity.getId()));
    }

    @Override
    public T refresh(ID id) {
        redisTemplate.delete(buildKey(id));
        return loadFromDb(id).map(entity -> { save(entity); return entity; }).orElse(null);
    }

    @Override
    public void expire(ID id, Duration ttl) {
        redisTemplate.expire(buildKey(id), ttl);
    }

    @Override
    public Duration getTimeToLive(ID id) {
        Long seconds = redisTemplate.getExpire(buildKey(id));
        return seconds != null && seconds >= 0 ? Duration.ofSeconds(seconds) : Duration.ZERO;
    }

    // ---- Sync-facing operations ----

    @Override
    public void syncToDb(ID id) {
        findById(id).ifPresent(entity -> {
            dbSyncService.syncNow(entityClass, entity);
            markAsSynced(id);
        });
    }

    @Override
    public void syncToDbAsync(ID id) {
        findById(id).ifPresent(entity -> dbSyncService.scheduleSync(entityClass, entity,
                (entityId, success, error) -> { if (success) { markAsSynced((ID) entityId); } }));
    }

    @Override
    public int syncAllToDb() {
        if (!autoSync) {
            log.debug("syncAllToDb() no-op for {} — autoSync=false (entity chỉ cache đọc, DB là nơi ghi duy nhất)",
                    entityClass.getSimpleName());
            return 0;
        }
        List<T> unsynced = findAll().stream().filter(e -> !e.isSynced()).toList();
        unsynced.forEach(entity -> dbSyncService.scheduleSync(entityClass, entity,
                (entityId, success, error) -> { if (success) { markAsSynced((ID) entityId); } }));
        return unsynced.size();
    }

    @Override
    public List<T> saveAllAndSync(List<T> entities) {
        List<T> saved = saveAllBatch(entities);
        saved.forEach(entity -> dbSyncService.scheduleSync(entityClass, entity,
                (entityId, success, error) -> { if (success) { markAsSynced((ID) entityId); } }));
        return saved;
    }

    /** Được gọi bởi {@code SyncRecoveryService} lúc startup — tìm entity còn {@code synced=false}
     *  (app tắt/crash trước khi kịp đồng bộ xong ở lượt trước) và lên lịch đồng bộ lại. No-op nếu
     *  {@code autoSync=false} (ví dụ {@code JobRedis}) — entity loại này không bao giờ tự ghi DB,
     *  {@code synced} luôn là {@code false} sau {@code prePersist()} nên không mang ý nghĩa gì để
     *  "recover". */
    public int recoverUnsynced() {
        if (!autoSync) {
            return 0;
        }
        List<T> unsynced = findUnsynced();
        for (T entity : unsynced) {
            dbSyncService.scheduleSync(entityClass, entity,
                    (entityId, success, error) -> { if (success) { markAsSynced((ID) entityId); } });
        }
        return unsynced.size();
    }

    private List<T> findUnsynced() {
        return findAll().stream().filter(e -> !e.isSynced()).toList();
    }

    private void markAsSynced(ID id) {
        try {
            String json = redisTemplate.opsForValue().get(buildKey(id));
            if (json == null) {
                return;
            }
            T entity = deserialize(json);
            entity.setSynced(true);
            String updatedJson = objectMapper.writeValueAsString(entity);
            if (defaultTtlSeconds > 0) {
                redisTemplate.opsForValue().set(buildKey(id), updatedJson, Duration.ofSeconds(defaultTtlSeconds));
            } else {
                redisTemplate.opsForValue().set(buildKey(id), updatedJson);
            }
        } catch (Exception ex) {
            log.warn("Failed to mark {} id={} as synced (best-effort, không ảnh hưởng tính đúng): {}",
                    entityClass.getSimpleName(), id, ex.getMessage());
        }
    }

    // ---- Secondary index (@RedisIndexed) ----

    @Override
    public List<T> findByIndexedField(String fieldName, Object value) {
        try {
            String indexKey = buildIndexKey(fieldName, value);
            Set<String> rawIds = redisTemplate.opsForSet().members(indexKey);
            if (rawIds == null || rawIds.isEmpty()) {
                return List.of();
            }
            List<ID> ids = rawIds.stream().map(this::convertId).collect(Collectors.toList());
            List<T> found = findAllByIdsBatch(ids);

            if (found.size() < ids.size()) {
                cleanStaleIndexEntries(indexKey, ids, found);
            }
            return found;
        } catch (Exception ex) {
            log.warn("Redis index lookup failed for {}.{}={}: {}", entityClass.getSimpleName(), fieldName, value, ex.getMessage());
            return List.of();
        }
    }

    private void cleanStaleIndexEntries(String indexKey, List<ID> requestedIds, List<T> found) {
        Set<ID> foundIds = found.stream().map(BaseRedisEntity::getId).collect(Collectors.toSet());
        List<String> staleIds = requestedIds.stream()
                .filter(id -> !foundIds.contains(id))
                .map(String::valueOf)
                .toList();
        if (!staleIds.isEmpty()) {
            redisTemplate.opsForSet().remove(indexKey, staleIds.toArray());
        }
    }

    private void updateIndexes(T entity) {
        long indexTtl = defaultTtlSeconds > 0 ? defaultTtlSeconds + 60 : RedisConstants.NO_TTL;
        for (Field field : getIndexedFields()) {
            Object value = readField(field, entity);
            if (value == null) {
                continue;
            }
            RedisIndexed indexAnnotation = field.getAnnotation(RedisIndexed.class);
            String fieldName = indexAnnotation.name().isBlank() ? field.getName() : indexAnnotation.name();
            String indexKey = buildIndexKey(fieldName, value);
            redisTemplate.opsForSet().add(indexKey, String.valueOf(entity.getId()));
            if (indexTtl > 0) {
                redisTemplate.expire(indexKey, Duration.ofSeconds(indexTtl));
            }
        }
    }

    private void updateIndexesPipelined(T entity) {
        long indexTtl = defaultTtlSeconds > 0 ? defaultTtlSeconds + 60 : RedisConstants.NO_TTL;
        for (Field field : getIndexedFields()) {
            Object value = readField(field, entity);
            if (value == null) {
                continue;
            }
            RedisIndexed indexAnnotation = field.getAnnotation(RedisIndexed.class);
            String fieldName = indexAnnotation.name().isBlank() ? field.getName() : indexAnnotation.name();
            String indexKey = buildIndexKey(fieldName, value);
            redisTemplate.execute((RedisCallback<Object>) connection -> {
                connection.setCommands().sAdd(indexKey.getBytes(), String.valueOf(entity.getId()).getBytes());
                if (indexTtl > 0) {
                    connection.keyCommands().expire(indexKey.getBytes(), indexTtl);
                }
                return null;
            });
        }
    }

    private void removeIndexes(T entity) {
        for (Field field : getIndexedFields()) {
            Object value = readField(field, entity);
            if (value == null) {
                continue;
            }
            RedisIndexed indexAnnotation = field.getAnnotation(RedisIndexed.class);
            String fieldName = indexAnnotation.name().isBlank() ? field.getName() : indexAnnotation.name();
            redisTemplate.opsForSet().remove(buildIndexKey(fieldName, value), String.valueOf(entity.getId()));
        }
    }

    private List<Field> getIndexedFields() {
        return getAllFields(entityClass).stream()
                .filter(f -> f.isAnnotationPresent(RedisIndexed.class))
                .toList();
    }

    private List<Field> getAllFields(Class<?> clazz) {
        List<Field> fields = new ArrayList<>();
        Class<?> current = clazz;
        while (current != null && current != Object.class) {
            fields.addAll(List.of(current.getDeclaredFields()));
            current = current.getSuperclass();
        }
        return fields;
    }

    private Object readField(Field field, T entity) {
        try {
            field.setAccessible(true);
            return field.get(entity);
        } catch (IllegalAccessException ex) {
            log.warn("Cannot read field {} of {}: {}", field.getName(), entityClass.getSimpleName(), ex.getMessage());
            return null;
        }
    }

    private T deserialize(String json) {
        try {
            return objectMapper.readValue(json, entityClass);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot deserialize " + entityClass.getSimpleName() + " from Redis JSON", ex);
        }
    }
}
