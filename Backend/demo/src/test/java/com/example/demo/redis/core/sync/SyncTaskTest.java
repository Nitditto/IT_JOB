package com.example.demo.redis.core.sync;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.example.demo.constants.SyncOperation;

class SyncTaskTest {

    @Test
    void withIncrementedRetry_returnsNewInstance_doesNotMutateOriginal() {
        SyncTask original = new SyncTask(SyncOperation.SAVE, String.class, "entity", 1L);

        SyncTask retried = original.withIncrementedRetry();

        assertThat(original.getRetryCount()).isZero();
        assertThat(retried.getRetryCount()).isEqualTo(1);
        assertThat(retried).isNotSameAs(original);
        // các field khác giữ nguyên khi tăng retry
        assertThat(retried.getOperation()).isEqualTo(original.getOperation());
        assertThat(retried.getEntityClass()).isEqualTo(original.getEntityClass());
        assertThat(retried.getEntity()).isEqualTo(original.getEntity());
        assertThat(retried.getId()).isEqualTo(original.getId());
    }

    @Test
    void hasCallback_reflectsWhetherCallbackWasProvided() {
        SyncTask withoutCallback = new SyncTask(SyncOperation.DELETE, String.class, null, 1L);
        SyncTask withCallback = new SyncTask(SyncOperation.SAVE, String.class, "entity", 1L,
                (id, success, error) -> { });

        assertThat(withoutCallback.hasCallback()).isFalse();
        assertThat(withCallback.hasCallback()).isTrue();
    }

    @Test
    void chainedIncrements_accumulateRetryCount() {
        SyncTask task = new SyncTask(SyncOperation.SAVE, String.class, "entity", 1L);

        SyncTask afterThreeRetries = task.withIncrementedRetry().withIncrementedRetry().withIncrementedRetry();

        assertThat(afterThreeRetries.getRetryCount()).isEqualTo(3);
        assertThat(task.getRetryCount()).isZero();
    }
}
