# Phase 6 — Scaling & Infra

## Mục tiêu

Redis (cache + rate limiter phân tán), Scheduler, Load balancing, Observability, CI/CD, DB tuning. Chạy **xen kẽ** suốt các phase khác — không phải làm 1 lần cuối cùng, một số mục (6.1, 6.2) là điều kiện tiên quyết cho Phase 4.2/4.4.

## Điều kiện tiên quyết

Không bắt buộc phase nào trước, nhưng nên làm 6.1/6.2 **trước hoặc cùng lúc** Phase 4 nếu muốn làm 4.2 (cache TF-IDF)/4.4 (Job Alert).

## Bước 1 — 6.1. Redis

1. Thêm dependency: `spring-boot-starter-data-redis`.
2. Config:
   ```properties
   spring.data.redis.host=${REDIS_HOST:localhost}
   spring.data.redis.port=${REDIS_PORT:6379}
   spring.data.redis.password=${REDIS_PASSWORD:}
   ```
3. **Cache job listing/recommendation** — dùng Spring Cache abstraction (`@EnableCaching`, `@Cacheable`), không tự viết cache logic tay:
   ```java
   @Cacheable(value = "jobRecommendations", key = "#currentUser.id")
   public List<JobRecommendationResponse> getRecommendations(Account currentUser) { ... }
   ```
   TTL cấu hình qua `RedisCacheManager` bean (ví dụ 2 giờ cho recommendation — không cần real-time tuyệt đối, job list không đổi từng giây).
   **Invalidate đúng lúc**: khi job mới được tạo (`JobCreatedEvent`), evict cache liên quan (`@CacheEvict` hoặc xoá key thủ công qua `RedisTemplate`) — nếu không, candidate không thấy job mới trong TTL cache.

4. **Rate limiter phân tán** — hiện tại [`RateLimitingFilter`](../../Backend/demo/src/main/java/com/example/demo/config/filter/RateLimitingFilter.java) dùng Bucket4j **in-memory**, sai logic khi chạy nhiều instance (mỗi instance có bucket riêng, tổng rate limit thực tế = số instance × limit dự kiến). Đổi sang Bucket4j + Redis backend:
   ```xml
   <dependency>
       <groupId>com.bucket4j</groupId>
       <artifactId>bucket4j-redis</artifactId>
   </dependency>
   ```
   Bucket4j hỗ trợ sẵn `LettuceBasedProxyManager`/`RedisClientBasedProxyManager` — thay `Bucket4j.builder()...build()` (in-memory) bằng proxy manager trỏ Redis, giữ nguyên toàn bộ logic limit/refill hiện có trong `RateLimitingFilter`, chỉ đổi nơi lưu state bucket.

## Bước 2 — 6.2. Scheduled Job

1. Thêm `@EnableScheduling` (dùng chung `AsyncConfig` đã tạo ở Phase 0, hoặc tạo `SchedulingConfig` riêng nếu muốn tách rõ).
2. Danh sách job cần có, mỗi job 1 `@Component` riêng (không dồn hết vào 1 class để dễ test/maintain riêng):

   ```java
   @Component
   @RequiredArgsConstructor
   public class ExpiredJobCleanupTask {
       @Scheduled(cron = "0 0 2 * * *")   // 2h sáng mỗi ngày, tránh giờ cao điểm
       public void expireOldJobs() {
           // định nghĩa "hết hạn" — ví dụ job tạo > 60 ngày và appliedCount = 0,
           // hoặc thêm cột expiresAt cho company tự chọn (quyết định nghiệp vụ, không tự chọn thay ở đây)
       }
   }

   @Component
   @RequiredArgsConstructor
   public class InterviewReminderTask {
       @Scheduled(cron = "0 0 8 * * *")
       public void remindUpcomingInterviews() {
           Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);
           List<Interview> upcoming = interviewRepository
               .findByScheduledAtBetweenAndStatus(tomorrow.minusHours(1), tomorrow.plusHours(1), InterviewStatus.SCHEDULED);
           upcoming.forEach(i -> eventPublisher.publishEvent(new InterviewReminderEvent(i.getId())));
       }
   }

   // JobAlertScheduledTask — xem chi tiết đầy đủ ở 04-search-and-recommendation.md bước 3
   ```
3. **Chạy nhiều instance**: `@Scheduled` mặc định chạy trên **mọi** instance — nếu scale ngang (Phase 6.3), job sẽ chạy trùng N lần. Cần lock phân tán: dùng `ShedLock` (`net.javacrumbs.shedlock`) với Redis/DB backend:
   ```java
   @Scheduled(cron = "0 0 8 * * *")
   @SchedulerLock(name = "interviewReminderTask", lockAtMostFor = "10m")
   public void remindUpcomingInterviews() { ... }
   ```
   Chỉ cần thêm khi thật sự chạy nhiều instance (Phase 6.3) — nếu vẫn 1 instance, chưa cần ShedLock, nhưng nên thiết kế method idempotent ngay từ đầu (chạy lại không gây trùng lặp) để thêm ShedLock sau không phải sửa logic.

## Bước 3 — 6.3. Load Balancing

1. JWT stateless (đã đúng từ đầu) → không cần sticky session, request nào tới instance nào cũng xử lý được.
2. Setup Nginx (hoặc cloud LB) trước N instance backend, round-robin đơn giản là đủ.
3. **Bắt buộc làm 6.1 (Redis rate limiter) trước bước này** — nếu chưa, rate limit sẽ sai như đã nêu ở Bước 1.
4. Health check endpoint cho LB dùng: `GET /actuator/health` (đã có sẵn qua `spring-boot-starter-actuator`).

## Bước 4 — 6.4. Observability

1. Thêm `micrometer-registry-prometheus`.
2. `application.properties`:
   ```properties
   management.endpoints.web.exposure.include=health,info,prometheus
   management.metrics.tags.application=itjob-backend
   ```
3. Custom metric cho các chỗ hay lỗi — ví dụ đếm notification failed:
   ```java
   @Component
   @RequiredArgsConstructor
   public class NotificationMetrics {
       private final MeterRegistry registry;
       public void recordFailure(NotificationChannelType channel) {
           registry.counter("notification.delivery.failed", "channel", channel.name()).increment();
       }
   }
   ```
   Gọi từ `NotificationDispatcher` (Phase 1) khi hết retry.
4. Grafana đọc từ Prometheus (`/actuator/prometheus`) — setup dashboard cơ bản: latency p95/p99, error rate, notification/webhook failure rate.

## Bước 5 — 6.5. CI

1. Kiểm tra `.github/workflows` hiện có (project đã có sẵn folder này với 1 file liên quan Java upgrade — xem có tận dụng được không, hoặc thêm workflow mới riêng cho build+test).
2. Workflow tối thiểu:
   ```yaml
   name: CI
   on: [pull_request]
   jobs:
     backend:
       runs-on: ubuntu-latest
       services:
         mariadb:
           image: mariadb:11
           env: { MARIADB_ROOT_PASSWORD: test, MARIADB_DATABASE: itjob_test }
           ports: ["3306:3306"]
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-java@v4
           with: { java-version: '17', distribution: 'temurin' }
         - run: ./mvnw test
           working-directory: Backend/demo
     frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '24' }
         - run: npm ci && npx tsc --noEmit
           working-directory: Frontend/itjob
   ```
   **Điều kiện để bước này có nghĩa**: project cần có test suite thật trước (hiện tại theo REFACTOR_PLAN.md, project **chưa có test tự động**) — viết CI chạy `mvnw test` mà không có test nào thì chỉ verify compile, không verify hành vi. Nên viết thêm test song song với các phase khác trước khi đầu tư nhiều vào CI.
3. CD (auto deploy khi merge `main`) — làm sau CI ổn định, phụ thuộc hạ tầng deploy thật (chưa xác định ở tài liệu này, cần biết trước sẽ deploy lên đâu — VPS, cloud provider nào).

## Bước 6 — 6.6. DB tuning

1. HikariCP (mặc định đi kèm Spring Boot, không cần thêm dependency) — tune pool size theo tải thật, không đoán trước:
   ```properties
   spring.datasource.hikari.maximum-pool-size=${DB_POOL_SIZE:10}
   spring.datasource.hikari.minimum-idle=2
   ```
2. Read replica — chỉ xem xét khi đã đo được tải đọc (search/recommend) là bottleneck thật qua Observability (Bước 4), không làm trước khi có số liệu.

## Config tổng hợp

```properties
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
management.endpoints.web.exposure.include=health,info,prometheus
spring.datasource.hikari.maximum-pool-size=${DB_POOL_SIZE:10}
```

## Testing checklist

- [ ] Test cache: gọi `getRecommendations` 2 lần liên tiếp, verify lần 2 không query DB (dùng `@SpyBean`/log SQL để kiểm chứng cache hit).
- [ ] Test cache eviction: tạo job mới, verify cache liên quan bị evict đúng.
- [ ] Test rate limiter Redis: chạy tích hợp với Redis test container (Testcontainers), verify limit đúng khi giả lập nhiều "instance" (nhiều thread) cùng gọi.
- [ ] Test scheduled job: gọi method trực tiếp trong unit test (không chờ cron thật), verify logic đúng với dữ liệu edge case (interview đúng ranh giới "ngày mai").
- [ ] Chạy CI workflow thử trên 1 PR nhỏ, xác nhận pass/fail đúng như kỳ vọng.

## Definition of Done

- [ ] Redis chạy, cache hoạt động đúng (hit/miss/evict), rate limiter chuyển sang Redis backend.
- [ ] Scheduled job chạy đúng giờ, idempotent (chạy lại không gây trùng lặp dữ liệu/thông báo).
- [ ] `/actuator/prometheus` expose được metrics, Grafana dashboard hiển thị được ít nhất latency + error rate.
- [ ] CI chạy được trên mỗi PR (dù test suite còn ít, quan trọng là pipeline hoạt động).

## Rủi ro / lưu ý

- Đừng cache dữ liệu nhạy cảm (token, thông tin CV cá nhân) trong Redis mà không có TTL ngắn hoặc mã hoá — Redis mặc định không mã hoá data at-rest.
- Redis là single point of failure mới nếu không có failover — với quy mô hiện tại, 1 Redis instance là đủ, nhưng cần đảm bảo app **không crash** nếu Redis down tạm thời (cache miss thì fallback query DB trực tiếp, không throw exception — Spring Cache mặc định đã hành xử vậy nếu cấu hình đúng, nhưng rate limiter Redis cần tự xử lý fallback rõ ràng, quyết định: nếu Redis down, có cho request đi qua luôn (fail-open) hay chặn hết (fail-closed)? Đây là quyết định bảo mật/UX cần cân nhắc, không tự chọn thay ở đây.
