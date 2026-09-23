package com.example.demo.redis.core.sync;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.demo.constants.SyncConstants;
import com.example.demo.constants.SyncOperation;
import com.example.demo.redis.core.annotation.LinkedJpaEntity;
import com.example.demo.redis.core.exception.RedisSyncException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Đồng bộ Redis entity xuống MariaDB (nguồn sự thật). Chạy generic qua reflection +
 * {@code @LinkedJpaEntity} — không biết trước entity cụ thể nào. Chỉ dùng đúng cho entity
 * map 1-1 vào 1 bảng flat (không có {@code @ElementCollection}/{@code @OneToMany}) — xem
 * {@code JobRedis} (dùng {@code SyncStrategy.CACHE_ONLY}, không đi qua engine này) để biết
 * vì sao entity có collection con phải tránh WRITE_BEHIND/WRITE_THROUGH ở bản đầu.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DbSyncService {

    private final ApplicationContext applicationContext;
    @Qualifier("redisObjectMapper")
    private final ObjectMapper redisObjectMapper;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    private final BlockingQueue<SyncTask> syncQueue = new LinkedBlockingQueue<>();
    private ScheduledExecutorService scheduler;
    private ExecutorService syncExecutor;

    @PostConstruct
    void init() {
        scheduler = Executors.newScheduledThreadPool(SyncConstants.SCHEDULER_THREAD_POOL_SIZE);
        syncExecutor = Executors.newFixedThreadPool(SyncConstants.SYNC_THREAD_POOL_SIZE);
        scheduler.scheduleWithFixedDelay(this::processSyncQueue,
                SyncConstants.SCHEDULER_INITIAL_DELAY_SECONDS, SyncConstants.SCHEDULER_PERIOD_SECONDS,
                TimeUnit.SECONDS);
    }

    @PreDestroy
    void shutdown() {
        flushSyncQueue();
        shutdownExecutor(scheduler);
        shutdownExecutor(syncExecutor);
    }

    private void shutdownExecutor(ExecutorService executor) {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(SyncConstants.SHUTDOWN_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException ex) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /** Đồng bộ ngay, đồng bộ (blocking) — dùng cho {@code SyncStrategy.WRITE_THROUGH}. */
    public void syncNow(Class<?> entityClass, Object redisEntity) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                Class<?> jpaEntityClass = resolveJpaEntityClass(entityClass);
                Object entityId = getEntityId(redisEntity);
                executeUpsert(jpaEntityClass, redisEntity, entityId);
            });
        } catch (Exception ex) {
            throw new RedisSyncException("Sync to DB failed for " + entityClass.getSimpleName(), ex);
        }
    }

    /** Đưa vào hàng đợi, xử lý bởi worker thread — dùng cho {@code SyncStrategy.WRITE_BEHIND}. */
    public void scheduleSync(Class<?> entityClass, Object redisEntity, SyncCallback callback) {
        Object id = getEntityId(redisEntity);
        SyncTask task = new SyncTask(SyncOperation.SAVE, entityClass, redisEntity, id, callback);
        if (!syncQueue.offer(task)) {
            log.warn("Sync queue full, falling back to synchronous sync for {}", entityClass.getSimpleName());
            try {
                syncNow(entityClass, redisEntity);
                if (callback != null) {
                    callback.onSyncComplete(id, true, null);
                }
            } catch (Exception ex) {
                if (callback != null) {
                    callback.onSyncComplete(id, false, ex.getMessage());
                }
            }
        }
    }

    public void scheduleDelete(Class<?> entityClass, Object id) {
        SyncTask task = new SyncTask(SyncOperation.DELETE, entityClass, null, id);
        if (!syncQueue.offer(task)) {
            log.warn("Sync queue full, falling back to synchronous delete for {}", entityClass.getSimpleName());
            deleteNow(entityClass, id);
        }
    }

    public void deleteNow(Class<?> entityClass, Object id) {
        try {
            JpaRepository<Object, Object> jpaRepo = findJpaRepository(entityClass);
            jpaRepo.deleteById(id);
        } catch (Exception ex) {
            throw new RedisSyncException("Delete from DB failed for " + entityClass.getSimpleName(), ex);
        }
    }

    private void processSyncQueue() {
        List<SyncTask> batch = new ArrayList<>();
        for (int i = 0; i < SyncConstants.BATCH_SIZE; i++) {
            SyncTask task = syncQueue.poll();
            if (task == null) {
                break;
            }
            batch.add(task);
        }
        if (batch.isEmpty()) {
            return;
        }
        Map<Class<?>, List<SyncTask>> byEntityClass = batch.stream()
                .collect(Collectors.groupingBy(SyncTask::getEntityClass));
        byEntityClass.forEach((entityClass, tasks) -> syncExecutor.submit(() -> processBatch(entityClass, tasks)));
    }

    private void processBatch(Class<?> entityClass, List<SyncTask> tasks) {
        for (SyncTask task : tasks) {
            try {
                if (task.getOperation() == SyncOperation.SAVE) {
                    syncSingleEntity(entityClass, task.getEntity(), task.getId());
                } else {
                    deleteNow(entityClass, task.getId());
                }
                notifyCallback(task, true, null);
            } catch (Exception ex) {
                log.error("Sync task failed for {} id={}: {}", entityClass.getSimpleName(), task.getId(), ex.getMessage());
                if (task.getRetryCount() < SyncConstants.MAX_RETRY_COUNT) {
                    syncQueue.offer(task.withIncrementedRetry());
                } else {
                    log.error("Max retry reached for {} id={} — giving up, will be picked up by SyncRecoveryService on next restart",
                            entityClass.getSimpleName(), task.getId());
                    notifyCallback(task, false, ex.getMessage());
                }
            }
        }
    }

    private void syncSingleEntity(Class<?> entityClass, Object redisEntity, Object id) {
        transactionTemplate.executeWithoutResult(status -> {
            Class<?> jpaEntityClass = resolveJpaEntityClass(entityClass);
            executeUpsert(jpaEntityClass, redisEntity, id);
        });
    }

    private void notifyCallback(SyncTask task, boolean success, String error) {
        if (task.hasCallback()) {
            task.getCallback().onSyncComplete(task.getId(), success, error);
        }
    }

    /** Chạy khi shutdown — xử lý hết task còn trong hàng đợi 1 cách đồng bộ, không mất data. */
    private void flushSyncQueue() {
        SyncTask task;
        while ((task = syncQueue.poll()) != null) {
            try {
                if (task.getOperation() == SyncOperation.SAVE) {
                    syncNow(task.getEntityClass(), task.getEntity());
                } else {
                    deleteNow(task.getEntityClass(), task.getId());
                }
            } catch (Exception ex) {
                log.error("Failed to flush sync task on shutdown for {}: {}", task.getEntityClass(), ex.getMessage());
            }
        }
    }

    // ---- UPSERT (MariaDB: INSERT ... ON DUPLICATE KEY UPDATE) ----

    @SuppressWarnings("unchecked")
    private void executeUpsert(Class<?> jpaEntityClass, Object redisEntity, Object entityId) {
        String tableName = resolveTableName(jpaEntityClass);
        Map<String, ColumnMapping> columnMappings = getColumnMappings(jpaEntityClass);
        Map<String, Object> values = redisObjectMapper.convertValue(redisEntity, Map.class);

        List<String> columns = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        for (Map.Entry<String, ColumnMapping> entry : columnMappings.entrySet()) {
            String fieldName = entry.getKey();
            if (SyncConstants.SKIP_SYNC_FIELDS.contains(fieldName) || !values.containsKey(fieldName)) {
                continue;
            }
            columns.add(entry.getValue().columnName());
            params.add(convertValueForDb(values.get(fieldName), entry.getValue().javaType()));
        }
        if (columns.isEmpty()) {
            log.warn("No column to sync for {} id={}", jpaEntityClass.getSimpleName(), entityId);
            return;
        }

        String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(", "));
        String updateClause = columns.stream()
                .filter(c -> !c.equalsIgnoreCase("id"))
                .map(c -> c + " = VALUES(" + c + ")")
                .collect(Collectors.joining(", "));
        String sql = "INSERT INTO %s (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s".formatted(
                tableName, String.join(", ", columns), placeholders, updateClause);

        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }
        query.executeUpdate();
    }

    private record ColumnMapping(String columnName, Class<?> javaType) {
    }

    private Map<String, ColumnMapping> getColumnMappings(Class<?> jpaEntityClass) {
        Map<String, ColumnMapping> mappings = new HashMap<>();
        for (Field field : getAllFields(jpaEntityClass)) {
            if (field.isAnnotationPresent(jakarta.persistence.Transient.class)
                    || java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                continue;
            }
            Column column = field.getAnnotation(Column.class);
            String columnName = (column != null && !column.name().isBlank())
                    ? column.name()
                    : camelToSnake(field.getName());
            mappings.put(field.getName(), new ColumnMapping(columnName, field.getType()));
        }
        return mappings;
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

    private String resolveTableName(Class<?> jpaEntityClass) {
        Table table = jpaEntityClass.getAnnotation(Table.class);
        if (table != null && !table.name().isBlank()) {
            return table.name();
        }
        return camelToSnake(jpaEntityClass.getSimpleName()) + "s";
    }

    private String camelToSnake(String input) {
        return input.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    private Object convertValueForDb(Object value, Class<?> targetType) {
        if (value == null) {
            return null;
        }
        if (targetType == UUID.class && value instanceof String s) {
            return UUID.fromString(s);
        }
        if (targetType == Instant.class && value instanceof String s) {
            return java.sql.Timestamp.from(Instant.parse(s));
        }
        if (targetType == LocalDateTime.class && value instanceof String s) {
            return java.sql.Timestamp.valueOf(LocalDateTime.parse(s));
        }
        if (targetType == LocalDate.class && value instanceof String s) {
            return java.sql.Date.valueOf(LocalDate.parse(s));
        }
        return value;
    }

    // ---- Reflection helpers: entity id, JPA entity class, JPA repository lookup ----

    private Object getEntityId(Object redisEntity) {
        try {
            return redisEntity.getClass().getMethod("getId").invoke(redisEntity);
        } catch (ReflectiveOperationException ex) {
            throw new RedisSyncException("Cannot resolve id of " + redisEntity.getClass().getSimpleName(), ex);
        }
    }

    private Class<?> resolveJpaEntityClass(Class<?> redisEntityClass) {
        LinkedJpaEntity annotation = redisEntityClass.getAnnotation(LinkedJpaEntity.class);
        return annotation != null ? annotation.value() : redisEntityClass;
    }

    @SuppressWarnings("unchecked")
    private JpaRepository<Object, Object> findJpaRepository(Class<?> redisEntityClass) {
        Class<?> jpaEntityClass = resolveJpaEntityClass(redisEntityClass);
        Map<String, JpaRepository> repositories = applicationContext.getBeansOfType(JpaRepository.class);
        for (JpaRepository<?, ?> repo : repositories.values()) {
            Class<?>[] typeArgs = GenericTypeResolver.resolveTypeArguments(repo.getClass(), JpaRepository.class);
            if (typeArgs != null && typeArgs[0] == jpaEntityClass) {
                return (JpaRepository<Object, Object>) repo;
            }
        }
        throw new IllegalStateException("No JpaRepository found for entity " + jpaEntityClass.getSimpleName());
    }
}
