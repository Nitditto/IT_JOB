package com.example.demo.redis.core.sync;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.demo.redis.core.annotation.LinkedJpaEntity;
import com.example.demo.redis.core.exception.RedisSyncException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Chỉ test phần đồng bộ (synchronous, gọi trực tiếp) của DbSyncService — {@code syncNow} và
 * {@code deleteNow}. Hàng đợi async (`scheduleSync`/`processSyncQueue`, chạy trên
 * ScheduledExecutorService nội bộ) không test ở đây vì phụ thuộc timing, phù hợp hơn với
 * integration test có Redis/DB thật — xem REFACTOR_PLAN.md phần "chưa làm".
 */
@ExtendWith(MockitoExtension.class)
class DbSyncServiceTest {

    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private TransactionTemplate transactionTemplate;
    @Mock
    private EntityManager entityManager;
    @Mock
    private Query query;

    private DbSyncService service;

    @BeforeEach
    void setUp() {
        service = new DbSyncService(applicationContext, new ObjectMapper(), transactionTemplate);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);

        // TransactionTemplate.executeWithoutResult(...) — chạy consumer ngay, không cần transaction thật
        // lenient(): chỉ syncNow() dùng transactionTemplate, deleteNow() không đụng tới — tránh
        // UnnecessaryStubbingException cho các test chỉ gọi deleteNow().
        lenient().doAnswer(invocation -> {
            Consumer<TransactionStatus> action = invocation.getArgument(0);
            action.accept(mock(TransactionStatus.class));
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    @Table(name = "widgets")
    static class WidgetJpaEntity {
        private Long id;
        private String name;
        @Column(name = "qty")
        private Integer quantity;
    }

    @LinkedJpaEntity(WidgetJpaEntity.class)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class WidgetRedisLike {
        private Long id;
        private String name;
        private Integer quantity;
    }

    interface WidgetJpaRepository extends JpaRepository<WidgetJpaEntity, Long> {
    }

    @Test
    void syncNow_buildsMariaDbUpsertSql_andExecutesIt() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        WidgetRedisLike widget = new WidgetRedisLike(1L, "Bolt", 42);

        service.syncNow(WidgetRedisLike.class, widget);

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createNativeQuery(sqlCaptor.capture());
        String sql = sqlCaptor.getValue();

        assertThat(sql)
                .startsWith("INSERT INTO widgets")
                .contains("ON DUPLICATE KEY UPDATE") // MariaDB syntax, KHÔNG phải Postgres "ON CONFLICT"
                .doesNotContain("ON CONFLICT")
                .doesNotContain("::jsonb") // Postgres-specific cast không cần cho MariaDB
                .contains("qty = VALUES(qty)"); // @Column(name="qty") trên field `quantity`
        verify(query).executeUpdate();
    }

    @Test
    void syncNow_wrapsFailureInRedisSyncException() {
        when(entityManager.createNativeQuery(anyString())).thenThrow(new RuntimeException("DB down"));
        WidgetRedisLike widget = new WidgetRedisLike(1L, "Bolt", 42);

        assertThatThrownBy(() -> service.syncNow(WidgetRedisLike.class, widget))
                .isInstanceOf(RedisSyncException.class)
                .hasCauseInstanceOf(RuntimeException.class);
    }

    @Test
    void deleteNow_findsMatchingJpaRepositoryByGenericType_andDeletes() {
        WidgetJpaRepository widgetRepo = mock(WidgetJpaRepository.class);
        doReturn(Map.of("widgetJpaRepository", widgetRepo)).when(applicationContext).getBeansOfType(JpaRepository.class);

        service.deleteNow(WidgetRedisLike.class, 7L);

        verify(widgetRepo).deleteById(7L);
    }

    @Test
    void deleteNow_throwsRedisSyncException_whenNoMatchingRepositoryFound() {
        doReturn(Map.of()).when(applicationContext).getBeansOfType(JpaRepository.class);

        assertThatThrownBy(() -> service.deleteNow(WidgetRedisLike.class, 1L))
                .isInstanceOf(RedisSyncException.class)
                .hasCauseInstanceOf(IllegalStateException.class);
    }
}
