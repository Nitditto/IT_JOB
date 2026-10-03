package com.example.demo.redis.core.sync;

import java.util.Map;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.example.demo.constants.SyncConstants;
import com.example.demo.redis.core.repository.AbstractRedisRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Chạy khi app khởi động — quét mọi {@code AbstractRedisRepository} bean, tìm entity còn
 * {@code synced=false} (nghĩa là lần trước app tắt/crash trước khi {@code DbSyncService}
 * kịp đồng bộ xong) và lên lịch đồng bộ lại. Chạy trên thread riêng để không chặn startup.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncRecoveryService {

    private final ApplicationContext applicationContext;

    @PostConstruct
    void recoverOnStartup() {
        Thread recoveryThread = new Thread(this::performRecovery, SyncConstants.RECOVERY_THREAD_NAME);
        recoveryThread.setDaemon(true);
        recoveryThread.start();
    }

    private void performRecovery() {
        try {
            Thread.sleep(SyncConstants.RECOVERY_STARTUP_DELAY_MS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return;
        }
        triggerRecovery();
    }

    /** Cho phép trigger tay (ví dụ từ 1 admin endpoint) ngoài lần chạy tự động lúc startup. */
    public void triggerRecovery() {
        Map<String, AbstractRedisRepository> repositories = applicationContext.getBeansOfType(AbstractRedisRepository.class);
        int totalRecovered = 0;
        for (Map.Entry<String, AbstractRedisRepository> entry : repositories.entrySet()) {
            try {
                int recovered = entry.getValue().recoverUnsynced();
                totalRecovered += recovered;
                if (recovered > 0) {
                    log.info("Recovered {} unsynced entities from repository bean '{}'", recovered, entry.getKey());
                }
            } catch (Exception ex) {
                log.error("Recovery failed for repository bean '{}': {}", entry.getKey(), ex.getMessage());
            }
        }
        log.info("Redis sync recovery finished — total {} entities re-scheduled for DB sync", totalRecovered);
    }
}
