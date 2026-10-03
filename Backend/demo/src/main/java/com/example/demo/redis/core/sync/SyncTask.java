package com.example.demo.redis.core.sync;

import com.example.demo.constants.SyncOperation;

/**
 * 1 tác vụ đồng bộ Redis → DB nằm trong hàng đợi của {@code DbSyncService}. Immutable —
 * {@link #withIncrementedRetry()} trả về bản copy mới, không sửa instance cũ (tránh race
 * condition khi nhiều thread cùng đọc/ghi retryCount).
 */
public final class SyncTask {

    private final SyncOperation operation;
    private final Class<?> entityClass;
    private final Object entity;
    private final Object id;
    private final int retryCount;
    private final SyncCallback callback;

    public SyncTask(SyncOperation operation, Class<?> entityClass, Object entity, Object id) {
        this(operation, entityClass, entity, id, 0, null);
    }

    public SyncTask(SyncOperation operation, Class<?> entityClass, Object entity, Object id, SyncCallback callback) {
        this(operation, entityClass, entity, id, 0, callback);
    }

    public SyncTask(SyncOperation operation, Class<?> entityClass, Object entity, Object id,
            int retryCount, SyncCallback callback) {
        this.operation = operation;
        this.entityClass = entityClass;
        this.entity = entity;
        this.id = id;
        this.retryCount = retryCount;
        this.callback = callback;
    }

    public SyncTask withIncrementedRetry() {
        return new SyncTask(operation, entityClass, entity, id, retryCount + 1, callback);
    }

    public boolean hasCallback() {
        return callback != null;
    }

    public SyncOperation getOperation() {
        return operation;
    }

    public Class<?> getEntityClass() {
        return entityClass;
    }

    public Object getEntity() {
        return entity;
    }

    public Object getId() {
        return id;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public SyncCallback getCallback() {
        return callback;
    }
}
