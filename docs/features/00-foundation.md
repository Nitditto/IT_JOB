# Phase 0 — Foundation

## Mục tiêu

Dựng hạ tầng dùng chung cho mọi phase sau: schema versioning (Flyway), event bus nội bộ, và data model cho notification. Không phase nào ở sau nên bắt đầu trước khi phase này đạt Definition of Done.

## Điều kiện tiên quyết

Không có — đây là phase đầu tiên.

## Kiến trúc / package structure

```
com.example.demo
├── event/                          # MỚI
│   ├── JobCreatedEvent.java
│   ├── CvStatusChangedEvent.java
│   ├── InterviewScheduledEvent.java
│   └── InterviewCancelledEvent.java
├── notification/                   # MỚI — khung sườn, implement channel thật ở Phase 1
│   └── NotificationEventListener.java   # @EventListener, hiện tại chỉ log + tạo Notification record
├── model/
│   ├── Interview.java               # MỚI
│   ├── Notification.java            # MỚI
│   └── NotificationPreference.java  # MỚI
├── enums/
│   ├── CVStatus.java                 # SỬA — thêm state mới
│   ├── InterviewStatus.java          # MỚI
│   └── NotificationEventType.java    # MỚI
├── repository/
│   ├── InterviewRepository.java      # MỚI
│   ├── NotificationRepository.java   # MỚI
│   └── NotificationPreferenceRepository.java  # MỚI
└── config/
    └── AsyncConfig.java              # MỚI — bật @EnableAsync cho event listener
```

## Bước 1 — Flyway (migration versioning)

1. Thêm dependency vào `pom.xml`:
   ```xml
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-core</artifactId>
   </dependency>
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-mysql</artifactId>
   </dependency>
   ```
   `flyway-mysql` dùng được cho MariaDB (Flyway coi MariaDB tương thích MySQL dialect).

2. Kiểm tra `spring.jpa.hibernate.ddl-auto` hiện đang set gì (nhiều khả năng nằm trong `.env`, không có trong `application.properties` — file `.env` không commit nên phải tự check ở máy đang chạy). Nếu là `update`/`create`, đây là lúc dừng dùng Hibernate để quản lý schema.

3. Tạo baseline: chạy `mysqldump --no-data` (hoặc tool tương đương cho MariaDB) để lấy CREATE TABLE hiện tại → lưu thành `src/main/resources/db/migration/V1__baseline.sql`. Nếu không muốn dump tay, dùng `spring.flyway.baseline-on-migrate=true` + `spring.flyway.baseline-version=1` để Flyway coi schema hiện tại là đã ở version 1, không cần script baseline.

4. Set trong `application.properties`:
   ```properties
   spring.jpa.hibernate.ddl-auto=validate
   spring.flyway.enabled=true
   spring.flyway.baseline-on-migrate=true
   spring.flyway.baseline-version=1
   ```
   `ddl-auto=validate` bắt buộc — từ giờ Hibernate chỉ **kiểm tra** entity khớp schema, không tự sửa DB. Mọi thay đổi schema phải qua file migration mới.

5. Quy ước tên file: `V{n}__snake_case_description.sql`, ví dụ `V2__add_interview_and_notification_tables.sql`. Không sửa lại migration đã chạy trên môi trường nào rồi — luôn tạo file mới.

## Bước 2 — Mở rộng `CVStatus`

**File:** [`enums/CVStatus.java`](../../Backend/demo/src/main/java/com/example/demo/enums/CVStatus.java)

```java
public enum CVStatus {
    PENDING,
    APPROVED,
    REJECTED,
    INTERVIEW_SCHEDULED,
    INTERVIEW_DONE,
    OFFERED,
    WITHDRAWN
}
```

Vì `CV.status` map bằng `@Enumerated(EnumType.STRING)` (giá trị lưu là chuỗi tên hằng số), thêm hằng số mới **không cần migration schema** (cột vẫn là VARCHAR). Chỉ cần thêm hằng số vào enum Java.

Việc cần rà lại: mọi `switch`/`if-else` theo `CVStatus` trong code hiện tại (`CVController`, `CVServiceImpl`, frontend `renderStatusLabel`) — thêm case cho state mới hoặc đảm bảo `default` xử lý hợp lý, tránh rơi vào nhánh sai khi có status mới.

## Bước 3 — Entity `Interview`

Theo Entity Design Rule ở CLAUDE.md: `Interview` không có bảng lookup nhỏ nào để join qua relationship, còn CV/Account là aggregate root → dùng raw ID.

```java
package com.example.demo.model;

@Entity
@Table(name = "interviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private Long accountId;      // candidate — raw ID, theo Entity Design Rule

    @Column(nullable = false)
    private Long jobId;          // raw ID

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    private Integer durationMinutes;

    private String timezone;          // ví dụ "Asia/Ho_Chi_Minh"
    private String location;          // onsite address, null nếu remote
    private String meetingLink;        // remote link, null nếu onsite

    @ElementCollection
    @CollectionTable(name = "interview_interviewers", joinColumns = @JoinColumn(name = "interview_id"))
    @Column(name = "interviewer_account_id")
    private Set<Long> interviewerAccountIds;

    private String googleEventId;      // null cho tới khi Phase 2 tích hợp Calendar

    @Enumerated(EnumType.STRING)
    private InterviewStatus status;

    @CreationTimestamp
    private Instant createdAt;
}
```

`InterviewStatus`: `SCHEDULED, DONE, CANCELLED`.

Migration `V2__create_interviews.sql` tạo bảng `interviews` + `interview_interviewers`, index trên `(account_id, job_id)`.

`InterviewRepository`:
```java
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByAccountIdAndJobId(Long accountId, Long jobId);
    List<Interview> findByScheduledAtBetweenAndStatus(Instant from, Instant to, InterviewStatus status);
}
```
Method thứ 2 dùng cho scheduled job nhắc lịch ở Phase 6.

## Bước 4 — Event bus nội bộ

Dùng `ApplicationEventPublisher` có sẵn của Spring — **không cần** thêm message broker (Kafka/RabbitMQ) ở quy mô hiện tại, publish/subscribe trong-process là đủ.

1. Bật async cho listener (để publish event không block request chính):
   ```java
   @Configuration
   @EnableAsync
   public class AsyncConfig {
       @Bean
       public Executor notificationExecutor() {
           ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
           executor.setCorePoolSize(2);
           executor.setMaxPoolSize(5);
           executor.setQueueCapacity(100);
           executor.setThreadNamePrefix("notif-");
           executor.initialize();
           return executor;
       }
   }
   ```

2. Định nghĩa event là POJO thường (không cần extends `ApplicationEvent`, Spring 4.2+ hỗ trợ publish POJO trực tiếp):
   ```java
   public record CvStatusChangedEvent(Long accountId, Long jobId, CVStatus oldStatus, CVStatus newStatus) {}
   public record JobCreatedEvent(Long jobId, Long companyId) {}
   public record InterviewScheduledEvent(Long interviewId) {}
   public record InterviewCancelledEvent(Long interviewId) {}
   ```
   Dùng `record` — không cần Lombok, immutable tự nhiên, đúng bản chất 1 event.

3. Publish event **trong service, sau khi transaction thành công** — inject `ApplicationEventPublisher`:
   ```java
   @Service
   @RequiredArgsConstructor
   public class CVServiceImpl implements CVService {
       private final ApplicationEventPublisher eventPublisher;
       ...
       @Override
       @Transactional(rollbackFor = Exception.class)
       public CV updateCVStatus(Long jobId, Long accountId, CVStatus newStatus) {
           CV cv = ...; // load + validate như code hiện tại
           CVStatus oldStatus = cv.getStatus();
           cv.setStatus(newStatus);
           CV saved = cvRepository.save(cv);
           eventPublisher.publishEvent(new CvStatusChangedEvent(accountId, jobId, oldStatus, newStatus));
           return saved;
       }
   }
   ```
   **Lưu ý quan trọng:** publish event bên trong method `@Transactional` nghĩa là listener mặc định (`@EventListener` không khai `@Async`) chạy **đồng bộ, trong cùng transaction** — nếu listener throw, transaction gốc rollback theo. Vì notification KHÔNG nên làm rollback nghiệp vụ chính (ví dụ: gửi email lỗi không được làm hỏng việc đổi status CV), listener ở Phase 0 phải dùng `@Async` + `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` — nghĩa là listener chỉ chạy SAU KHI transaction gốc commit thành công, và chạy trên thread riêng (không throw ngược lại được nữa).

4. Listener khung sườn (chưa gửi thật, chỉ tạo `Notification` record + log — implement channel thật ở Phase 1):
   ```java
   @Component
   @RequiredArgsConstructor
   @Slf4j
   public class NotificationEventListener {
       private final NotificationRepository notificationRepository;

       @Async("notificationExecutor")
       @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
       public void onCvStatusChanged(CvStatusChangedEvent event) {
           log.info("CV status changed: {}", event);
           // Phase 0: chỉ ghi nhận, chưa gửi qua channel nào
           Notification n = Notification.builder()
               .recipientAccountId(event.accountId())
               .eventType(NotificationEventType.CV_STATUS_CHANGED)
               .payload(/* JSON của event, xem bước 5 */ "")
               .build();
           notificationRepository.save(n);
       }
   }
   ```

## Bước 5 — Entity `Notification` + `NotificationPreference`

```java
@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private Long recipientAccountId;

    @Enumerated(EnumType.STRING)
    private NotificationEventType eventType;

    @Column(unique = true, nullable = false)
    private String eventId;          // UUID — dùng cho idempotency, xem Phase 1F.3

    @Lob
    private String payload;          // JSON string, chứa data cần cho template (jobName, status...)

    @Enumerated(EnumType.STRING)
    private NotificationChannelType channel;   // set khi Phase 1 implement dispatch thật

    @Enumerated(EnumType.STRING)
    private NotificationDeliveryStatus deliveryStatus;  // PENDING, SENT, FAILED

    private Instant readAt;          // null = chưa đọc (cho in-app), dùng ở Phase 1C

    @CreationTimestamp
    private Instant createdAt;
}
```

```java
@Entity
@Table(name = "notification_preferences",
       uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "event_type", "channel"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class NotificationPreference {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    private NotificationEventType eventType;

    @Enumerated(EnumType.STRING)
    private NotificationChannelType channel;

    private boolean enabled;
}
```

`NotificationEventType`: `CV_STATUS_CHANGED, JOB_CREATED, INTERVIEW_SCHEDULED, INTERVIEW_CANCELLED, INTERVIEW_REMINDER, JOB_ALERT` (mục cuối dùng ở Phase 4.4).

`NotificationChannelType`: `EMAIL, SMS, ZALO, TELEGRAM, IN_APP`.

`NotificationDeliveryStatus`: `PENDING, SENT, FAILED`.

Migration `V3__create_notifications.sql` tạo 2 bảng trên, index `(recipient_account_id, read_at)` cho query "danh sách chưa đọc" ở Phase 1C.

## Config cần thêm

Không có property mới ở phase này ngoài Flyway (bước 1). Config cho từng channel (SMTP, Telegram token...) thêm ở Phase 1.

## Testing checklist

- [ ] `./mvnw clean compile` build sạch.
- [ ] Chạy app với DB thật, Flyway tự chạy migration, log không có `FlywayException`.
- [ ] Insert thử 1 CV, gọi `updateCVStatus` → confirm có 1 row mới trong bảng `notifications` sau khi transaction chính commit (query DB trực tiếp hoặc thêm log tạm).
- [ ] Test transaction rollback: giả lập lỗi trong `NotificationEventListener` (throw exception tạm) → xác nhận CV status **vẫn được lưu** (listener lỗi không rollback nghiệp vụ chính) — đúng vì dùng `AFTER_COMMIT` + `@Async`.
- [ ] Unit test: mock `ApplicationEventPublisher`, verify `CVServiceImpl.updateCVStatus` gọi `publishEvent` với đúng field.

## Definition of Done

- [ ] Flyway chạy, `ddl-auto=validate`, có ít nhất 1 migration file ngoài baseline.
- [ ] `Interview`, `Notification`, `NotificationPreference` entity + repository tồn tại, compile sạch.
- [ ] 4 event class (`JobCreatedEvent`, `CvStatusChangedEvent`, `InterviewScheduledEvent`, `InterviewCancelledEvent`) được publish đúng chỗ trong service tương ứng (tối thiểu `CvStatusChangedEvent` trong `CVServiceImpl.updateCVStatus` — đây là event dùng nhiều nhất ở Phase 1).
- [ ] `NotificationEventListener` nhận event, tạo được `Notification` record (chưa cần gửi qua channel nào — đó là việc của Phase 1).

## Rủi ro / lưu ý

- Đừng publish event **trước** khi `save()` — nếu save fail, event vẫn "phát" ra là sai (dùng `AFTER_COMMIT` để tự động tránh việc này, nhưng vẫn nên gọi `publishEvent` sau `repository.save()` trong code cho rõ ý).
- `eventId` (UUID) phải sinh ra ở nơi TẠO Notification (trong listener, bước 4), không sinh lại mỗi lần gửi — nếu không sẽ mất tác dụng idempotency ở Phase 1F.3.
