# Phase 1 — Hệ thống Notification đa kênh

> **Đối tượng đọc:** dev Backend (Spring Boot) và dev Frontend (React) triển khai độc lập. Spec này là *hợp đồng chung* — BE và FE chỉ cần bám đúng schema, API contract và payload WebSocket ở đây.
>
> **Quan hệ với tài liệu cũ:** file này là bản chi tiết, *thay thế* [00-foundation.md](00-foundation.md) (phần event bus + notification schema) và [01-notifications.md](01-notifications.md) ở các điểm lệch sau:
> | Điểm | Tài liệu cũ | Spec này (dùng cái này) |
> |---|---|---|
> | Database | Ví dụ MySQL/MariaDB (`flyway-mysql`) | **PostgreSQL** (đúng với repo, Flyway đã có `V1`–`V3`) |
> | Chiến lược gửi | "Gửi được 1 kênh là đủ" + fallback | **Fan-out theo preference**: mỗi kênh 1 bản ghi delivery riêng, retry độc lập |
> | Principal WebSocket | `convertAndSendToUser(email, ...)` | Principal name = **`accountId`** (email có thể đổi, và là PII) |
> | `eventId` | Sinh trong listener | Sinh ở **nơi publish event** (để idempotency đúng nghĩa) |
> | Độ bền event | `ApplicationEventPublisher` thuần trong process | **Transactional outbox hybrid**: event được ghi cùng transaction nghiệp vụ; `AFTER_COMMIT + @Async` chỉ đánh thức processor, scheduler phục hồi khi crash |
> | Liên kết Telegram | Cột `telegram_chat_id` trên `accounts`, token tạm trên Redis | Bảng `telegram_links` + `telegram_link_tokens` (**DB**, vì Redis là optional theo CLAUDE.md) |

---

## 1. 🎯 Overview & Use Cases

### 1.1 Mục tiêu

Biến các thay đổi nghiệp vụ (CV được duyệt/từ chối, có CV mới, có job mới, lịch phỏng vấn) thành thông báo tới đúng người, qua đúng kênh, **không làm hỏng nghiệp vụ gốc** khi kênh gửi lỗi.

### 1.2 Kênh

| Kênh | Mô tả | Bắt buộc? |
|---|---|---|
| `IN_APP` | Bản ghi `notifications` + đẩy real-time qua WebSocket STOMP, hiển thị ở icon chuông | Luôn bật, user **không** tắt được |
| `EMAIL` | `spring-boot-starter-mail` + Thymeleaf template HTML | Theo preference |
| `TELEGRAM` | Bot Telegram, HR bấm nút **Duyệt / Từ chối** ngay trong chat | Theo preference + phải liên kết tài khoản |

SMS / Zalo **ngoài phạm vi** file này (giữ ở [01-notifications.md](01-notifications.md) Bước 5–6). Kiến trúc `NotificationChannel` (Strategy) cho phép thêm sau mà không sửa code cũ (nguyên tắc O của SOLID).

### 1.3 Trigger → Người nhận → Kênh mặc định

| Event (publish ở service) | Người nhận | IN_APP | EMAIL | TELEGRAM | Ghi chú |
|---|---|:-:|:-:|:-:|---|
| `CvSubmittedEvent` (`CVServiceImpl.addCV`) | **Company** chủ job (`job.companyID`) | ✅ | ⬜ | ✅ (kèm nút Duyệt/Từ chối) | Event **mới**, không có trong yêu cầu gốc nhưng bắt buộc để làm Telegram "CV mới" |
| `CvSubmittedEvent` | **Candidate** (người nộp) | ✅ | ✅ (xác nhận ứng tuyển) | ⬜ | Cùng event, 2 notification (2 người nhận) |
| `CvStatusChangedEvent` (`CVServiceImpl.updateCVStatus`) → `APPROVED` / `REJECTED` / `OFFERED`… | **Candidate** | ✅ | ✅ | ⬜ | **Không** tạo notification cho `INTERVIEW_SCHEDULED` — việc đó thuộc `InterviewScheduledEvent`, tránh bắn trùng |
| `CvWithdrawnEvent` ([Phase 2](phase-2-interview-calendar.md)) | **Company** chủ job | ✅ | ⬜ | ⬜ | Candidate rút hồ sơ; không gửi self-notification lại cho candidate |
| `JobCreatedEvent` (`JobServiceImpl.createJob`, status `published`) | Mọi follower của company (`company_follows`) | ✅ | ⬜ | ⬜ | Fan-out nhiều người nhận, xem §3.7 |
| `InterviewScheduledEvent` ([Phase 2](phase-2-interview-calendar.md)) | Candidate (+ Company) | ✅ | ✅ (kèm `.ics`) | ⬜ | Template email "mời phỏng vấn" định nghĩa ở file này, event phát ở Phase 2 |
| `InterviewResponseEvent` (Phase 2) | **Company** chủ job | ✅ | ⬜ | ⬜ | `INTERVIEW_RESPONSE` — ứng viên phản hồi lời mời |
| Google Calendar mất kết nối (Phase 2) | **Company** | ✅ | ✅ | ⬜ | `INTEGRATION_ACTION_REQUIRED`; sinh từ calendar processor, dedupe theo `connection + ngày` |
| Digest Job Alert ([Phase 4](phase-4-job-alert.md)) | Candidate (chủ alert) | ✅ | ✅ | ⬜ | `JOB_ALERT`; không đi qua outbox, tạo bởi `JobAlertRunner` qua `NotificationService.create` |

✅ = bật mặc định, ⬜ = tắt mặc định (user bật trong Settings). Ma trận mặc định nằm trong **một** class `NotificationDefaults` (§3.6) — không rải `if` khắp nơi.

### 1.4 Luồng tổng quan

```
[Service @Transactional]  save() + DomainEventPublisher.publish(XxxEvent)
        │                  └─ INSERT domain_event_outbox (cùng transaction)
        │  (commit nghiệp vụ + event cùng lúc)
        ▼
OutboxWakeupListener  (@Async + @TransactionalEventListener AFTER_COMMIT)
        │  đánh thức processor; OutboxRecoveryJob là đường phục hồi nếu signal bị mất
        ▼
DomainEventOutboxProcessor (claim SKIP LOCKED)
        │  load event → NotificationFactory → NotificationService.create(drafts)
        │  INSERT notifications + notification_deliveries + mark outbox PROCESSED
        ▼  (sau commit)
DeliveryDispatcher.dispatch(deliveryIds)
        ├─ InAppChannel   → SimpMessagingTemplate → /user/queue/notifications  → FE chuông
        ├─ EmailChannel   → JavaMailSender + Thymeleaf
        └─ TelegramChannel→ Bot API sendMessage (+ inline keyboard)
   lỗi tạm thời → RETRY_WAIT (+backoff) → DeliveryRetryJob quét lại → hết 3 lần → FAILED
```

Telegram chiều ngược lại: HR bấm nút → Telegram gọi webhook → lưu `telegram_update_inbox` theo `update_id` → trả `200` → processor gọi `TelegramUpdateHandler` → `CVService.updateCVStatus` → ghi `CvStatusChangedEvent` vào outbox → candidate nhận thông báo. Telegram **vừa là kênh gửi vừa là cửa vào** của nghiệp vụ duyệt CV, nên phải kiểm quyền và idempotency chặt (§3.9).

### 1.5 Ngoài phạm vi

- Broker ngoài (Kafka/RabbitMQ). Event bus vẫn ở trong process; PostgreSQL outbox chỉ đảm bảo event không mất khi process restart.
- Nhiều instance backend: simple broker của STOMP là in-memory → chỉ đúng khi 1 instance (xem §3.8, "Còn nợ" trong CLAUDE.md đã ghi tương tự cho rate limiter).
- Push notification trình duyệt (Web Push/FCM), SMS, Zalo.

### 1.6 ⚠️ Việc phải sửa TRƯỚC khi làm phase này (phát hiện khi đọc code)

| # | Vấn đề | Vị trí | Hậu quả nếu bỏ qua |
|---|---|---|---|
| P1 | `CVServiceImpl.editCV` gọi `cv.setStatus(request.getStatus())` — **ứng viên tự đặt được status CV của mình** | `CVEditRequest` / `CVServiceImpl.editCV` | Xoá hẳn field `status` khỏi request và bỏ setter; payload có field lạ phải bị Jackson bỏ qua theo cấu hình chung hoặc trả `400`, nhưng không bao giờ đổi status |
| P2 | `updateCVStatus(jobId, accountId, status)` không nhận actor và không kiểm tra chủ job | `CVController.updateStatus` / `CVServiceImpl.updateCVStatus` | Company A đổi được CV của company B. REST và Telegram phải dùng chung `UpdateCvStatusCommand` có `actorCompanyId` và ownership check trong service |
| P3 | Hai endpoint company đọc danh sách/chi tiết CV chỉ kiểm role, chưa kiểm ownership | `CVController.getJobCVs` / `getCVDetailForCompany` | Company A đọc được dữ liệu ứng viên của company B. Mọi query CV phía company phải nhận actor và kiểm `job.companyID` trước khi trả DTO |
| P4 | `JobService.editJob` chỉ nhận DTO, không nhận company hiện tại | `JobController.editJob` / `JobServiceImpl.editJob` | Company A có thể sửa job company B rồi phát `JobCreatedEvent` giả khi chuyển `draft → published`. Service phải nhận actor company và kiểm ownership trước khi mutate |
| P5 | Hai request Telegram/REST có thể cùng đọc `PENDING` rồi ghi hai kết quả khác nhau | `CV` / `updateCVStatus` | Thêm `@Version` cho CV hoặc atomic conditional update; chọn `@Version` + map conflict thành `409`, chỉ đúng một transition thắng |
| P6 | `CVStatus` mới chỉ có `PENDING, APPROVED, REJECTED` | `enums/CVStatus.java` | Phase 2 cần `INTERVIEW_SCHEDULED`, `INTERVIEW_DONE`, `OFFERED`, `WITHDRAWN`; rà mọi `switch` và TypeScript union |
| P7 | `spring.jpa.hibernate.ddl-auto=update` chạy song song Flyway, Docker Compose còn override bằng `SPRING_JPA_HIBERNATE_DDL_AUTO=update` | `application.properties` / `docker-compose.yml` | Sau khi V4 hoàn chỉnh, đổi cả hai nơi sang `validate`; test profile có thể dùng database riêng nhưng không được để runtime tự sửa schema |

### 1.7 Bảng chuyển trạng thái CV (nguồn duy nhất)

`CVServiceImpl.updateCVStatus` (và mọi nơi đổi `CV.status`) phải kiểm bảng này; transition ngoài bảng ⇒ `BusinessException` 409. Đặt trong một class `CvStatusTransitions` (không rải `if`).

| Từ \ Sang | Ai được phép | Ghi chú |
|---|---|---|
| `PENDING → APPROVED` / `REJECTED` | Company chủ job (REST, Telegram) | Hai nút Telegram **chỉ** làm 2 transition này |
| `PENDING → WITHDRAWN` | Candidate | Rút hồ sơ |
| `APPROVED → INTERVIEW_SCHEDULED` | Hệ thống (khi `InterviewService.schedule`) | Không sinh notification `CV_STATUS_CHANGED` |
| `APPROVED → REJECTED` / `OFFERED` / `WITHDRAWN` | Company / Candidate (WITHDRAWN) | |
| `INTERVIEW_SCHEDULED → APPROVED` | Hệ thống (huỷ lịch cuối cùng) | Không sinh notification `CV_STATUS_CHANGED` |
| `INTERVIEW_SCHEDULED → INTERVIEW_DONE` / `REJECTED` / `WITHDRAWN` | Company / Candidate (WITHDRAWN) | |
| `INTERVIEW_DONE → OFFERED` / `REJECTED` / `WITHDRAWN` | Company / Candidate (WITHDRAWN) | |
| `OFFERED → WITHDRAWN` | Candidate | |
| `REJECTED`, `WITHDRAWN` | — | **Trạng thái cuối**, không chuyển tiếp |

Cùng trạng thái (`X → X`) là no-op: trả 200, không event. Candidate chỉ được phép các transition `→ WITHDRAWN`; company không được đặt `WITHDRAWN`.

---

## 2. 🗄 Database Design

Quy ước (theo CLAUDE.md + `V3__add_job_engagement_features.sql`): PostgreSQL, `TIMESTAMP WITH TIME ZONE`, khoá chính `BIGINT` từ sequence `INCREMENT BY 50`, FK tới `accounts` là **raw `Long` trong entity** (Account là aggregate root → không dùng `@ManyToOne`), nhưng **vẫn có FK constraint ở DB** để toàn vẹn dữ liệu.

> **Đặt tên sequence:** entity phải khai `@SequenceGenerator(name="notifications_seq", sequenceName="notifications_seq", allocationSize=50)` tường minh. Đừng dựa vào tên sequence mặc định của Hibernate — hiện `ddl-auto=update` đang che lỗi lệch tên này.

### 2.1 Migration `V4__create_notifications.sql`

> Nếu các phase merge theo thứ tự khác, đánh lại số — Flyway không cho chèn version nhỏ hơn version đã chạy.

```sql
-- ============ Sequences ============
CREATE SEQUENCE IF NOT EXISTS notifications_seq            START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS notification_deliveries_seq  START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS notification_preferences_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS telegram_link_tokens_seq     START WITH 1 INCREMENT BY 50;

-- Optimistic locking cho transition CV từ REST/Telegram.
ALTER TABLE cv ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- ============ transactional outbox: event được commit cùng nghiệp vụ gốc ============
CREATE TABLE domain_event_outbox (
    id             UUID         NOT NULL PRIMARY KEY,       -- chính là eventId
    event_type     VARCHAR(80)  NOT NULL,
    aggregate_type VARCHAR(40)  NOT NULL,
    aggregate_id   VARCHAR(100) NOT NULL,
    payload        JSONB        NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | RETRY_WAIT | PROCESSED | FAILED
    attempt_count  INT          NOT NULL DEFAULT 0,
    available_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processed_at   TIMESTAMP WITH TIME ZONE,
    last_error     VARCHAR(500),
    occurred_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_domain_event_outbox_due
    ON domain_event_outbox (available_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_WAIT');
CREATE INDEX idx_domain_event_outbox_stale
    ON domain_event_outbox (processing_started_at)
    WHERE status = 'PROCESSING';

-- ============ notifications: 1 dòng = 1 thông báo cho 1 người nhận (nội dung hiển thị ở chuông) ============
CREATE TABLE notifications (
    id                    BIGINT       NOT NULL PRIMARY KEY,
    recipient_account_id  BIGINT       NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type                  VARCHAR(40)  NOT NULL,   -- NotificationType enum (STRING)
    title                 VARCHAR(200) NOT NULL,
    body                  VARCHAR(1000) NOT NULL,
    link_url              VARCHAR(500),            -- route FE để điều hướng khi click, ví dụ /job/12/mycv
    payload               JSONB        NOT NULL DEFAULT '{}'::jsonb,  -- data thô cho template email/FE (jobName, status, ...)
    dedupe_key            VARCHAR(120) NOT NULL,   -- "<eventId>:<recipientAccountId>" — idempotency
    read_at               TIMESTAMP WITH TIME ZONE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uk_notifications_dedupe UNIQUE (dedupe_key)
);

-- danh sách mới nhất của 1 user (phân trang)
CREATE INDEX idx_notifications_recipient_created
    ON notifications (recipient_account_id, created_at DESC);
-- đếm chưa đọc: partial index nhỏ, rất nhanh
CREATE INDEX idx_notifications_recipient_unread
    ON notifications (recipient_account_id) WHERE read_at IS NULL;

-- ============ notification_deliveries: 1 dòng = 1 lần gửi qua 1 kênh ============
CREATE TABLE notification_deliveries (
    id                  BIGINT      NOT NULL PRIMARY KEY,
    notification_id     BIGINT      NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel             VARCHAR(20) NOT NULL,      -- IN_APP | EMAIL | TELEGRAM
    status              VARCHAR(20) NOT NULL,      -- PENDING | PROCESSING | SENT | RETRY_WAIT | FAILED | SKIPPED
    attempt_count       INT         NOT NULL DEFAULT 0,
    next_attempt_at     TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    last_error          VARCHAR(500),              -- KHÔNG ghi nội dung email / token vào đây
    provider_message_id VARCHAR(100),              -- Telegram message_id (để edit message sau khi HR bấm nút)
    sent_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uk_delivery_notification_channel UNIQUE (notification_id, channel)
);

-- dispatcher/retry sweeper quét hàng mới, retry đến hạn và PROCESSING bị treo
CREATE INDEX idx_deliveries_retry
    ON notification_deliveries (next_attempt_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_WAIT');
CREATE INDEX idx_deliveries_stale_processing
    ON notification_deliveries (processing_started_at) WHERE status = 'PROCESSING';

-- ============ notification_preferences: user tắt/bật kênh theo loại thông báo ============
-- Chỉ lưu khi user ĐỔI so với mặc định (NotificationDefaults) → bảng nhỏ.
CREATE TABLE notification_preferences (
    id          BIGINT      NOT NULL PRIMARY KEY,
    account_id  BIGINT      NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type        VARCHAR(40) NOT NULL,
    channel     VARCHAR(20) NOT NULL,
    enabled     BOOLEAN     NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uk_pref UNIQUE (account_id, type, channel),
    CONSTRAINT ck_pref_not_in_app CHECK (channel <> 'IN_APP')   -- IN_APP không tắt được
);

-- ============ Telegram ============
-- 1 account ↔ 1 chat; 1 chat chỉ gắn 1 account (tránh 1 người Telegram điều khiển nhiều tài khoản HR).
CREATE TABLE telegram_links (
    account_id        BIGINT      NOT NULL PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    chat_id           BIGINT      NOT NULL,
    telegram_username VARCHAR(64),
    active            BOOLEAN     NOT NULL DEFAULT TRUE,   -- false khi bot bị block (HTTP 403 từ Telegram)
    linked_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uk_telegram_links_chat UNIQUE (chat_id)
);

-- Token deep-link dùng 1 lần, sống 10 phút. Lưu HASH, không lưu token thô.
CREATE TABLE telegram_link_tokens (
    id          BIGINT       NOT NULL PRIMARY KEY,
    account_id  BIGINT       NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash  CHAR(64)     NOT NULL,                    -- SHA-256 hex của token thô
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_telegram_link_tokens_hash UNIQUE (token_hash)
);
CREATE INDEX idx_telegram_link_tokens_account ON telegram_link_tokens (account_id);

-- Webhook Telegram được xác nhận sau khi update đã nằm bền vững trong DB.
CREATE TABLE telegram_update_inbox (
    update_id       BIGINT       NOT NULL PRIMARY KEY,
    payload         JSONB        NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | RETRY_WAIT | PROCESSED | FAILED
    attempt_count   INT          NOT NULL DEFAULT 0,
    available_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processed_at    TIMESTAMP WITH TIME ZONE,
    last_error      VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_telegram_update_inbox_due
    ON telegram_update_inbox (available_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_WAIT');

-- ============ ShedLock: khoá scheduler khi chạy nhiều instance (dùng chung cho Phase 2, 4) ============
CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_by  VARCHAR(255) NOT NULL
);
```

### 2.2 Enum (package `enums/`)

```java
public enum NotificationType {
    CV_SUBMITTED,          // company nhận: có CV mới
    CV_APPLICATION_RECEIVED, // candidate nhận: đã nộp thành công (xác nhận ứng tuyển)
    CV_STATUS_CHANGED,
    CV_WITHDRAWN,
    JOB_CREATED,
    INTERVIEW_SCHEDULED,
    INTERVIEW_RESCHEDULED,
    INTERVIEW_CANCELLED,
    INTERVIEW_REMINDER,
    INTERVIEW_RESPONSE,    // company nhận: ứng viên chấp nhận/từ chối/đề nghị đổi giờ (Phase 2)
    INTEGRATION_ACTION_REQUIRED, // cần kết nối lại Google Calendar (Phase 2)
    JOB_ALERT              // Phase 4
}

public enum NotificationChannelType { IN_APP, EMAIL, TELEGRAM }

public enum DeliveryStatus { PENDING, PROCESSING, SENT, RETRY_WAIT, FAILED, SKIPPED }
public enum ProcessingStatus { PENDING, PROCESSING, RETRY_WAIT, PROCESSED, FAILED }
```

Dùng `@Enumerated(EnumType.STRING)` — thêm hằng số mới không cần migration vì cột là `VARCHAR`.

### 2.3 Entity (rút gọn — chỉ phần quyết định thiết kế)

```java
@Entity @Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notifications_seq")
    @SequenceGenerator(name = "notifications_seq", sequenceName = "notifications_seq", allocationSize = 50)
    private Long id;

    @Column(name = "recipient_account_id", nullable = false)
    private Long recipientAccountId;                // raw ID — Account là aggregate root

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private NotificationType type;

    private String title;
    private String body;
    private String linkUrl;

    @JdbcTypeCode(SqlTypes.JSON)                    // Hibernate 6 → JSONB
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> payload;

    @Column(nullable = false, updatable = false)
    private String dedupeKey;

    private Instant readAt;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
```

`NotificationDelivery`, `NotificationPreference`, `TelegramLink`, `TelegramLinkToken` map 1-1 theo DDL, cùng quy ước raw ID. `NotificationDelivery.notificationId` là `Long` thô (Notification là aggregate riêng, không phải bảng lookup → không `@ManyToOne`).

### 2.4 Repository — query bắt buộc có

```java
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientAccountId(Long accountId, Pageable pageable);
    Page<Notification> findByRecipientAccountIdAndReadAtIsNull(Long accountId, Pageable pageable);
    long countByRecipientAccountIdAndReadAtIsNull(Long accountId);
    boolean existsByDedupeKey(String dedupeKey);

    @Modifying @Query("update Notification n set n.readAt = :now where n.id = :id and n.recipientAccountId = :accountId and n.readAt is null")
    int markRead(@Param("id") Long id, @Param("accountId") Long accountId, @Param("now") Instant now);

    @Modifying @Query("update Notification n set n.readAt = :now where n.recipientAccountId = :accountId and n.readAt is null")
    int markAllRead(@Param("accountId") Long accountId, @Param("now") Instant now);
}
```

`markRead` gộp điều kiện `recipientAccountId` vào UPDATE: vừa idempotent, vừa chặn đọc/đánh dấu thông báo của người khác (trả `0` → controller map 404, không lộ sự tồn tại của notification).

---

## 3. ⚙️ Backend Implementation Specs

### 3.1 Dependencies (`pom.xml`)

```xml
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-mail</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-thymeleaf</artifactId></dependency>
<dependency><groupId>net.javacrumbs.shedlock</groupId><artifactId>shedlock-spring</artifactId><version>5.16.0</version></dependency>
<dependency><groupId>net.javacrumbs.shedlock</groupId><artifactId>shedlock-provider-jdbc-template</artifactId><version>5.16.0</version></dependency>
<!-- test -->
<dependency><groupId>com.icegreen</groupId><artifactId>greenmail-junit5</artifactId><scope>test</scope></dependency>
```

Telegram **không** thêm thư viện `telegrambots` — gọi Bot API bằng `RestClient` (đơn giản, dễ mock, không kéo dependency nặng).

### 3.2 Package structure

```
com.example.demo
├── event/                              # record, immutable
│   ├── DomainEvent.java                # interface { UUID eventId(); Instant occurredAt(); }
│   ├── DomainEventPublisher.java       # ghi outbox trong transaction hiện tại + phát wake-up signal
│   ├── DomainEventOutboxProcessor.java # claim/process event; idempotent theo eventId
│   ├── OutboxRecoveryJob.java          # phục hồi PENDING/RETRY_WAIT/PROCESSING bị treo
│   ├── CvSubmittedEvent.java
│   ├── CvStatusChangedEvent.java
│   ├── CvWithdrawnEvent.java             # Phase 2 phát khi candidate rút hồ sơ
│   ├── JobCreatedEvent.java
│   └── InterviewScheduledEvent.java    # phát ở Phase 2
├── notification/
│   ├── NotificationEventHandler.java   # outbox event → drafts
│   ├── NotificationDefaults.java       # ma trận (type × channel) mặc định
│   ├── NotificationDraft.java          # record: recipientId, type, title, body, linkUrl, payload, dedupeKey
│   ├── NotificationFactory.java        # event → List<NotificationDraft>  (không biết kênh)
│   ├── channel/
│   │   ├── NotificationChannel.java    # interface: type(), send(DeliveryContext) throws NotificationDeliveryException
│   │   ├── InAppNotificationChannel.java
│   │   ├── EmailNotificationChannel.java
│   │   └── TelegramNotificationChannel.java
│   ├── delivery/
│   │   ├── DeliveryDispatcher.java     # gọi channel, ghi trạng thái, tính backoff
│   │   └── DeliveryRetryJob.java       # quét PENDING/RETRY_WAIT và PROCESSING bị treo
│   └── telegram/
│       ├── TelegramClient.java         # interface (sendMessage, answerCallbackQuery, editMessage…)
│       ├── RestTelegramClient.java
│       ├── TelegramUpdateHandler.java  # /start <token>, callback_query
│       ├── TelegramUpdateInboxProcessor.java
│       ├── TelegramWebhookController.java
│       ├── TelegramPoller.java         # dev only (mode=polling)
│       └── TelegramWebhookRegistrar.java
├── services/NotificationService.java (+ impl/)   # create drafts, list, markRead, preferences
├── controller/NotificationController.java
├── controller/TelegramLinkController.java
├── config/AsyncConfig.java, WebSocketConfig.java, SchedulingConfig.java, StompAuthChannelInterceptor.java
└── constants/NotificationConstants.java          # retry delays, max attempts, topic names, callback prefixes
```

Controller/Service khác chỉ inject qua **interface** (`NotificationService`, `TelegramClient`, `NotificationChannel`) — đúng nguyên tắc D trong CLAUDE.md.

### 3.3 Event Bus + Transactional Outbox

#### 3.3.1 Event class (record, dữ liệu tối thiểu)

```java
public interface DomainEvent {
    UUID eventId();          // sinh ở NƠI PUBLISH
    Instant occurredAt();
}

public record CvSubmittedEvent(UUID eventId, Instant occurredAt, Long candidateAccountId, Long jobId) implements DomainEvent {
    public static CvSubmittedEvent of(Long candidateAccountId, Long jobId) {
        return new CvSubmittedEvent(UUID.randomUUID(), Instant.now(), candidateAccountId, jobId);
    }
}

public record CvStatusChangedEvent(UUID eventId, Instant occurredAt, Long candidateAccountId, Long jobId,
                                   CVStatus oldStatus, CVStatus newStatus) implements DomainEvent { /* of(...) */ }

public record JobCreatedEvent(UUID eventId, Instant occurredAt, Long jobId, Long companyId) implements DomainEvent { /* of(...) */ }
```

**Quy tắc:** event chỉ mang **ID + giá trị đổi** (old/new status). Processor tự load entity khi cần. Không nhét `Entity` vào event — entity lazy sẽ ném `LazyInitializationException` ở thread async, và đối tượng detached dễ bị stale. `eventId` đồng thời là PK của `domain_event_outbox`.

#### 3.3.2 Publish — đúng chỗ, đúng thời điểm

| Nơi publish | Điều kiện |
|---|---|
| `CVServiceImpl.addCV` | sau `cvRepository.save(cv)`, gọi `domainEventPublisher.publish(...)` trong cùng transaction |
| `CVServiceImpl.updateCVStatus` | sau transition thành công, **chỉ khi `oldStatus != newStatus`**; outbox rollback cùng CV nếu transaction lỗi |
| `JobServiceImpl.createJob` | sau `save`, **chỉ khi `status == published`**. Nếu `editJob` chuyển `draft→published` cũng ghi event (cần `published_at`, xem Phase 4) |

Service nghiệp vụ chỉ inject interface `DomainEventPublisher`; implementation serialize event thành JSONB và `INSERT domain_event_outbox` bằng transaction hiện tại. Không gọi trực tiếp `ApplicationEventPublisher` với domain event vì signal in-memory có thể mất sau commit.

#### 3.3.3 Wake-up listener — `AFTER_COMMIT` + `@Async`

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxWakeupListener {
    private final DomainEventOutboxProcessor processor;
    @Qualifier("notificationExecutor") private final Executor notificationExecutor;

    // KHÔNG dùng @Async: executor từ chối sẽ ném TaskRejectedException ngay trong callback afterCommit,
    // exception đó có thể lan ngược về người gọi dù transaction đã commit ⇒ request trả 500 oan.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOutboxCommitted(final OutboxCommittedSignal signal) {
        try {
            notificationExecutor.execute(() -> processor.processById(signal.eventId()));
        } catch (RejectedExecutionException ex) {
            log.warn("Outbox wake-up dropped for event {}; recovery job sẽ xử lý", signal.eventId());
        }
    }
}
```

`AFTER_COMMIT` đảm bảo chỉ đánh thức processor sau khi outbox đã commit; việc đẩy sang executor không làm chậm request và **mọi lỗi từ chối đều bị nuốt có chủ đích**. Signal chỉ là tối ưu độ trễ: nếu process chết, executor đầy hoặc listener lỗi, `OutboxRecoveryJob` vẫn claim lại event từ DB. Listener không mang trách nhiệm durability.

`DomainEventOutboxProcessor` claim bằng `FOR UPDATE SKIP LOCKED`, đổi `PENDING/RETRY_WAIT → PROCESSING`, deserialize theo allow-list `event_type`, gọi handler tương ứng và đánh dấu `PROCESSED`. Lỗi transient chuyển `RETRY_WAIT`; lỗi payload/event type không hỗ trợ chuyển `FAILED`. `PROCESSING` quá timeout được recovery job đưa lại `RETRY_WAIT`.

#### 3.3.4 `AsyncConfig`

```java
@Configuration @EnableAsync
public class AsyncConfig {
    @Bean("notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2); ex.setMaxPoolSize(8); ex.setQueueCapacity(500);
        ex.setThreadNamePrefix("notif-");
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy()); // OutboxWakeupListener bắt RejectedExecutionException; recovery job mới là bảo đảm
        return ex;
    }
}
```

### 3.4 `NotificationService` — tạo + idempotency + fan-out kênh

```java
public interface NotificationService {
    List<CreatedNotification> create(List<NotificationDraft> drafts);   // tham gia transaction của caller (processor outbox, JobAlertRunner...)
    PageResponse<NotificationResponse> list(Long accountId, boolean unreadOnly, int page, int size);
    long countUnread(Long accountId);
    void markRead(Long accountId, Long notificationId);      // 0 row → ResourceNotFoundException
    int markAllRead(Long accountId);
    List<PreferenceResponse> getPreferences(Long accountId);
    void updatePreferences(Long accountId, UpdatePreferencesRequest request);
}
```

`create` chạy trong transaction xử lý outbox; notification, delivery và trạng thái outbox commit cùng nhau:

```
for draft in drafts:
    INSERT notification ON CONFLICT (dedupe_key) DO NOTHING RETURNING id
    nếu đã tồn tại: lấy id hiện có, không tạo delivery thứ hai
    channels = resolveChannels(recipientAccountId, type)
    INSERT delivery(channel, PENDING) ON CONFLICT (notification_id, channel) DO NOTHING
return CreatedNotification(notificationId, deliveryIds mới tạo)      # notificationId luôn có, kể cả khi bản ghi đã tồn tại từ trước
after caller commit: phát DeliveryReadySignal(deliveryIds) để dispatch async
```

```java
public record CreatedNotification(Long notificationId, List<Long> deliveryIds) {}
```
Caller cần `notificationId` (vd. Phase 4 gắn vào `job_alert_matches.notification_id`). `DeliveryReadySignal` dùng cùng cơ chế "AFTER_COMMIT + nuốt `RejectedExecutionException`" như `OutboxWakeupListener`.

- Ưu tiên native `INSERT ... ON CONFLICT ... RETURNING` thay vì `exists + insert` để không có race giữa hai worker.
- **Không gửi email/HTTP bên trong transaction** — giữ connection DB trong lúc chờ SMTP là cách nhanh nhất để cạn pool.
- `dedupe_key = eventId + ":" + recipientAccountId` (một event có thể sinh nhiều notification cho nhiều người).
- Nếu `DeliveryReadySignal` bị mất, `DeliveryRetryJob` vẫn tìm thấy delivery `PENDING` trong DB.

### 3.5 Channel & Dispatcher

```java
public interface NotificationChannel {
    NotificationChannelType type();
    void send(DeliveryContext ctx) throws NotificationDeliveryException;
}

public record DeliveryContext(Notification notification, NotificationDelivery delivery, Account recipient) {}

public class NotificationDeliveryException extends RuntimeException {
    private final boolean permanent;   // true: retry vô ích (chưa liên kết Telegram, email sai định dạng, bot bị block)
    private final Duration retryAfter; // nullable — Telegram 429 trả retry_after
}
```

Spring tự inject `List<NotificationChannel>` vào `DeliveryDispatcher`, dựng `Map<NotificationChannelType, NotificationChannel>` trong `@PostConstruct` (không cần factory thủ công).

#### Máy trạng thái của 1 delivery

```
PENDING / RETRY_WAIT đến hạn ──claim──► PROCESSING ──send ok──► SENT
                                          │
                                          ├─ lỗi permanent ──► SKIPPED / FAILED
                                          ├─ lỗi transient ──► RETRY_WAIT(next_attempt_at)
                                          └─ worker chết ─────► stale timeout → RETRY_WAIT
```

**Retry policy** (hằng số trong `NotificationConstants`): tối đa **3 lần**, delay giữa các lần **1 phút → 5 phút** (lần 3 thất bại = `FAILED`). Riêng Telegram `429` dùng `retry_after` server trả về nếu lớn hơn delay mặc định.

`DeliveryRetryJob`:

```java
@Scheduled(fixedDelay = 30_000)
@SchedulerLock(name = "notification-delivery-retry", lockAtMostFor = "PT2M", lockAtLeastFor = "PT10S")
public void retryDue() {
    List<Long> ids = deliveryRepository.claimDue(Instant.now(), 50);   // PENDING/RETRY_WAIT → PROCESSING
    deliveryDispatcher.dispatch(ids);
}
```

`claimDue` dùng `FOR UPDATE SKIP LOCKED` + `LIMIT 50` để nhiều instance không bốc trùng một dòng; recovery đưa `PROCESSING` quá timeout về `RETRY_WAIT`. ShedLock là lớp giảm tải, còn claim + unique constraint mới là chốt đúng dữ liệu.

**Delivery có semantics at-least-once.** Database không tạo trùng notification/delivery, nhưng SMTP hoặc Telegram có thể đã nhận request rồi backend chết trước khi ghi `SENT`; lần phục hồi có thể gửi lại. Đặt `Message-ID` email ổn định theo delivery ID và lưu `provider_message_id` khi provider trả về để giảm/quan sát duplicate, nhưng không tuyên bố exactly-once với hệ thống bên ngoài.

**Timeout bắt buộc** cho mọi I/O ra ngoài (CLAUDE: "đừng để 1 channel lỗi làm chậm toàn hệ thống"):

```properties
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
```
`RestClient` cho Telegram: connect 3s, read 5s.

#### 3.5.1 `InAppNotificationChannel`

Không gọi API ngoài — bản ghi `notifications` đã tồn tại. `send()` chỉ đẩy WebSocket:

```java
messagingTemplate.convertAndSendToUser(
    String.valueOf(n.getRecipientAccountId()),          // principal name = accountId
    NotificationConstants.USER_QUEUE_NOTIFICATIONS,     // "/queue/notifications"
    new NotificationPushMessage("NOTIFICATION_CREATED", toResponse(n), unreadCount));
```
User đang offline → `convertAndSendToUser` không lỗi, không ai nhận; user sẽ thấy khi mở lại app (FE refetch). Vì vậy IN_APP delivery coi là `SENT` ngay khi đã lưu DB; **không retry** WebSocket.

#### 3.5.2 `EmailNotificationChannel`

```java
MimeMessagePreparator p = mime -> {
    MimeMessageHelper h = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());
    h.setFrom(appMailFrom, "IT.JOB");
    h.setTo(recipient.getEmail());
    h.setSubject(subjectFor(n));
    h.setText(templateEngine.process("email/" + templateFor(n.getType()), ctxFrom(n.getPayload())), true);
};
try { mailSender.send(p); } catch (MailException ex) { throw classify(ex); }
```

- `MailAuthenticationException` / `MailParseException` / địa chỉ không hợp lệ → `permanent=true`. `MailSendException` (timeout, SMTP 4xx) → transient.
- Template `src/main/resources/templates/email/` — **mọi biến người dùng nhập (tên, lời nhắn…) chỉ dùng `th:text`**, không bao giờ `th:utext` (chống HTML injection trong email):

| Template | Dùng cho `NotificationType` | Biến chính |
|---|---|---|
| `application-received.html` | `CV_APPLICATION_RECEIVED` | `candidateName, jobName, companyName, appliedAt, jobUrl` |
| `cv-status-changed.html` | `CV_STATUS_CHANGED` | `candidateName, jobName, companyName, newStatus, statusLabel, jobUrl` |
| `interview-invitation.html` | `INTERVIEW_SCHEDULED` | `candidateName, jobName, companyName, startAt, timezone, mode, meetingUrl, address, interviewers, respondUrl` |
| `interview-reschedule.html` / `interview-cancelled.html` / `interview-reminder.html` | tương ứng | Phase 2 |
| `new-application.html` | `CV_SUBMITTED` (nếu company bật email) | `candidateName, jobName, cvUrl` |
| `job-alert-digest.html` | `JOB_ALERT` | Phase 4 |

- Link trong email = `app.frontend-url` (`FRONTEND_URL`, đã có) + `link_url`. Không tự dựng từ `Host` header.
- Cấu hình:

```properties
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.mail.from=${MAIL_FROM:no-reply@itjob.local}
app.mail.enabled=${MAIL_ENABLED:false}
```
`app.mail.enabled=false` (mặc định dev) → channel đánh dấu delivery `SKIPPED`, app **boot được không cần SMTP**. Production dùng SendGrid/Mailgun/SES, không dùng Gmail cá nhân (rate limit ~500 mail/ngày).

#### 3.5.3 `TelegramNotificationChannel`

```
send(ctx):
    link = telegramLinkRepository.findByAccountIdAndActiveTrue(recipient.id)
        → không có ⇒ throw permanent("Chưa liên kết Telegram")         # delivery = SKIPPED
    text, keyboard = TelegramMessageRenderer.render(notification)
    resp = telegramClient.sendMessage(link.chatId, text, keyboard)
    delivery.providerMessageId = resp.messageId
    lỗi 403 (bot bị chặn / user xoá chat) ⇒ link.active=false + permanent
    lỗi 429 ⇒ transient với retryAfter
```

Nội dung `CV_SUBMITTED` gửi HR:

```
📥 CV mới cho "Backend Java Developer"
Ứng viên: Nguyễn Văn A
Lương mong muốn: 25.000.000 VND
Nộp lúc: 14:05 02/10/2026
[✅ Duyệt] [❌ Từ chối] [🔗 Xem CV]
```
- `parse_mode=HTML` và **escape toàn bộ dữ liệu người dùng** (`&`, `<`, `>`) — tên ứng viên là input không tin cậy; `Markdown` của Telegram rất dễ vỡ vì ký tự đặc biệt.
- Nút inline: hai nút callback + một nút `url` mở FE.
- `callback_data` = `cv:a:{jobId}:{candidateId}` (Duyệt) / `cv:r:{jobId}:{candidateId}` (Từ chối) — giới hạn Telegram là **64 byte**, định dạng trên < 40 byte.

### 3.6 Preference & mặc định

```java
@Component
public class NotificationDefaults {
    // Map<NotificationType, Set<NotificationChannelType>> — nguồn duy nhất cho ma trận ở §1.3
    public Set<NotificationChannelType> defaultChannels(NotificationType type) { ... }
}
```

`resolveChannels(accountId, type)`:
1. Bắt đầu từ `defaults(type)` ∪ `{IN_APP}`.
2. Áp từng dòng `notification_preferences` của user (`enabled=true` thêm, `false` bỏ). `IN_APP` bị bỏ qua dù có dòng (đã có CHECK ở DB).
3. `TELEGRAM` chỉ giữ nếu user có `telegram_links.active`; ngược lại tạo delivery `SKIPPED` ngay (để UI/log biết lý do) thay vì thử gửi.

### 3.7 `JobCreatedEvent` — fan-out follower (chống N+1)

Một company có thể có hàng nghìn follower. Cấm vòng lặp `save()` từng người:

```
followerIds = companyFollowRepository.findFollowerIdsByCompanyId(companyId)   // chỉ cột account_id
for chunk in partition(followerIds, 500):
    drafts = chunk.map(id -> draft(id, job))                                  // dedupe_key = eventId:id
    notificationService.create(drafts)                                        // ĐI QUA create: ON CONFLICT dedupe + resolveChannels + delivery
```
Không gọi `notificationRepository.saveAll` trực tiếp — sẽ lách qua `ON CONFLICT`, preference và delivery. `create` phải batch bên trong (một lần `resolveChannels` cho cả lô: nạp preference + `telegram_links` của các account bằng `IN (...)`, không query theo từng người). Mỗi chunk 1 transaction; chunk lỗi được outbox retry, các chunk đã commit bị bỏ qua nhờ `dedupe_key`.
Chỉ tạo `IN_APP` mặc định cho `JOB_CREATED`; không tạo delivery `EMAIL` trừ khi user chủ động bật.

### 3.8 WebSocket STOMP

#### 3.8.1 `WebSocketConfig`

```java
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final StompAuthChannelInterceptor authInterceptor;
    @Value("${allowed.cors.origins}") private String allowedOrigins;

    @Override public void registerStompEndpoints(StompEndpointRegistry r) {
        r.addEndpoint("/ws")
         .setAllowedOriginPatterns(allowedOrigins.split(","));          // dùng lại biến CORS đã có
    }

    @Override public void configureMessageBroker(MessageBrokerRegistry r) {
        r.enableSimpleBroker("/queue")
         .setHeartbeatValue(new long[]{10_000, 10_000})
         .setTaskScheduler(heartbeatScheduler());
        r.setUserDestinationPrefix("/user");
        r.setApplicationDestinationPrefixes("/app");                    // hiện chưa có @MessageMapping
    }

    @Override public void configureClientInboundChannel(ChannelRegistration reg) {
        reg.interceptors(authInterceptor);
    }
}
```
Native WebSocket, **không SockJS** (mọi trình duyệt hiện đại hỗ trợ; tránh thêm lớp fallback và thư viện FE).

#### 3.8.2 Xác thực: HTTP filter KHÔNG áp dụng cho STOMP frame

`JwtAuthenticationFilter` chỉ chạy ở bước handshake HTTP; trình duyệt **không** cho `WebSocket` API gửi header `Authorization`. Do đó:

1. `SecurityConfig`: `permitAll()` cho `/ws/**` ở tầng HTTP (handshake), và loại `/ws/**` khỏi CSRF (`csrf.ignoringRequestMatchers("/ws/**", "/webhooks/telegram")`). Bảo vệ thật nằm ở bước 2 + kiểm Origin ở `setAllowedOriginPatterns`.
2. FE gửi JWT trong **header của frame STOMP `CONNECT`**: `Authorization: Bearer <token>`. `StompAuthChannelInterceptor.preSend`:

```
if accessor.command == CONNECT:
    token = accessor.getFirstNativeHeader("Authorization") (bỏ "Bearer ")
    email = jwtService.extractUsername(token); account = userDetailsService.loadUserByUsername(email)
    if !jwtService.isTokenValid(token, account): throw MessagingException("Unauthorized")  # server đóng kết nối
    accessor.setUser(new StompPrincipal(String.valueOf(account.getId())))                  # principal name = accountId
if accessor.command == SUBSCRIBE:
    chỉ cho phép destination bắt đầu bằng "/user/queue/"   # chặn subscribe "/queue/..." trực tiếp để nghe người khác
if accessor.command == SEND:
    throw MessagingException("Client SEND is not supported")
```
3. **Không** dựa vào việc thiếu `@MessageMapping` để chặn gửi: interceptor từ chối mọi frame `SEND`, kể cả destination `/queue/**` mà simple broker có thể nhận trực tiếp.

Access token sống 15 phút (`jwt.expiration=900000`) và STOMP chỉ xác thực ở `CONNECT`. `NotificationContext` phải đóng session hiện tại ngay khi access token được refresh/clear rồi reconnect bằng token mới; logout luôn disconnect trước khi xoá auth state. Server có thể lưu `exp` trong session và đóng kết nối quá hạn như lớp phòng thủ bổ sung.

#### 3.8.3 Payload server → client

Destination client subscribe: **`/user/queue/notifications`** (Spring tự resolve thành queue riêng của principal).

```jsonc
{
  "type": "NOTIFICATION_CREATED",
  "notification": {
    "id": 1024,
    "type": "CV_STATUS_CHANGED",
    "title": "CV của bạn đã được duyệt",
    "body": "Công ty ABC đã duyệt CV ứng tuyển vị trí Backend Java Developer.",
    "linkUrl": "/job/12/mycv",
    "payload": { "jobId": 12, "newStatus": "APPROVED" },
    "read": false,
    "createdAt": "2026-10-02T07:05:11Z"
  },
  "unreadCount": 4
}
```
`unreadCount` đi kèm để FE cập nhật badge không cần gọi lại API.

`NotificationPushMessage` là DTO public riêng; tuyệt đối không serialize entity. Payload không chứa `dedupeKey`, delivery status, `providerMessageId`, `lastError`, token Telegram hoặc dữ liệu template nội bộ.

### 3.9 Telegram Bot

#### 3.9.1 Cấu hình

```properties
app.telegram.mode=${TELEGRAM_MODE:disabled}            # disabled | webhook | polling
app.telegram.bot-token=${TELEGRAM_BOT_TOKEN:}
app.telegram.bot-username=${TELEGRAM_BOT_USERNAME:}
app.telegram.webhook-url=${TELEGRAM_WEBHOOK_URL:}      # https://<domain>/api/webhooks/telegram
app.telegram.webhook-secret=${TELEGRAM_WEBHOOK_SECRET:}# 32+ ký tự ngẫu nhiên
```
`mode=disabled` là mặc định → app chạy bình thường không cần bot (giống tinh thần "Redis là optional").

| Mode | Dùng khi | Cách hoạt động |
|---|---|---|
| `webhook` | staging/production | `TelegramWebhookRegistrar` (`ApplicationRunner`) gọi `setWebhook` với `url`, `secret_token`, `allowed_updates=["message","callback_query"]`. Telegram POST tới `/webhooks/telegram` |
| `polling` | dev local (không có domain HTTPS) | `TelegramPoller` `@Scheduled` gọi `getUpdates(offset)`, **chạy `deleteWebhook` trước** (Telegram không cho dùng song song). Chỉ 1 instance. Mỗi update **cũng ghi vào `telegram_update_inbox`** (cùng `ON CONFLICT (update_id) DO NOTHING`) rồi mới nâng `offset`; xử lý nghiệp vụ đi qua `TelegramUpdateInboxProcessor` giống webhook, không có đường xử lý riêng |

#### 3.9.2 Webhook endpoint

```
POST /webhooks/telegram        (public — thêm vào permitAll và csrf.ignoringRequestMatchers)
Header bắt buộc: X-Telegram-Bot-Api-Secret-Token == app.telegram.webhook-secret   (so sánh constant-time)
Body: Telegram Update JSON
Response: chỉ 200 sau khi `INSERT telegram_update_inbox(update_id, payload) ON CONFLICT DO NOTHING` commit; xử lý nặng chạy async sau đó
```
Header sai/thiếu → `401`, không lưu. Cùng `update_id` gửi lại vẫn trả `200` và không xử lý nghiệp vụ lần hai. `TelegramUpdateInboxProcessor` claim/retry tương tự outbox; controller chỉ xác thực HTTP và ghi inbox, không parse nghiệp vụ.

#### 3.9.3 Liên kết tài khoản (deep-link)

```
1. FE: POST /notifications/telegram/link-token          (đã đăng nhập)
2. BE: token = 32 byte SecureRandom base64url; lưu SHA-256(token) + expires_at = now+10 phút vào telegram_link_tokens
       trả { deepLink: "https://t.me/<bot_username>?start=<token>", expiresAt }
3. User bấm link → Telegram gửi "/start <token>" tới bot
4. TelegramUpdateHandler: hash token → tìm dòng chưa dùng, chưa hết hạn
       ✓ → upsert telegram_links(account_id, chat_id, username), set used_at, trả lời "✅ Đã kết nối với IT.JOB…"
       ✗ → trả lời "Link không hợp lệ hoặc đã hết hạn" (không nói rõ lý do cụ thể)
5. FE poll GET /notifications/telegram/status (3s/lần, tối đa 10 phút) đến khi linked=true
```
Edge: `chat_id` đã gắn account khác → từ chối (ràng buộc `uk_telegram_links_chat`), báo user huỷ liên kết tài khoản cũ trước. Chỉ chấp nhận `/start` trong **chat private** (`chat.type == "private"`), bỏ qua group.

#### 3.9.4 Callback "Duyệt / Từ chối" — kiểm quyền (BẮT BUỘC)

```
handleCallback(update.callback_query):
    chatId = callback.message.chat.id ; data = callback.data
    parse "cv:{a|r}:{jobId}:{candidateId}"  → sai format ⇒ answerCallbackQuery("Dữ liệu không hợp lệ") (không throw)
    link = telegramLinkRepository.findByChatIdAndActiveTrue(chatId)        → không có ⇒ "Chưa liên kết tài khoản"
    account = accountRepository.findById(link.accountId) ; yêu cầu role == ROLE_COMPANY
    cv = cvService.getCVDetail(jobId, candidateId)
    if cv.job.companyID != account.id ⇒ answerCallbackQuery("Bạn không có quyền với CV này")   # chống chat khác bấm nút giả mạo
    if cv.status != PENDING ⇒ answerCallbackQuery("CV đã được xử lý: " + cv.status) ; edit message bỏ nút ; return
    cvService.updateCVStatus(UpdateCvStatusCommand(jobId, candidateId, newStatus, account.id))
    editMessageText: "…\n✅ Đã duyệt bởi bạn lúc 14:07"  (bỏ inline keyboard)
    answerCallbackQuery("Đã duyệt CV")                                    # luôn gọi để tắt vòng quay trên nút
```

- Chống **double click / hai thiết bị bấm cùng lúc**: `CV.@Version` bảo vệ transition trong cùng transaction. Hai request cùng đọc `PENDING` thì đúng một request commit; request còn lại nhận optimistic-lock conflict và được map thành thông báo "CV đã được xử lý".
- Nút **chỉ** xử lý `PENDING → APPROVED/REJECTED`. Các chuyển trạng thái khác (phỏng vấn, offer) làm trên web.
- Sửa lỗ hổng **P2 (§1.6)** ở `CVService`: `updateCVStatus` nhận thêm `actorCompanyId` và kiểm `job.companyID`. Vì CLAUDE.md giới hạn ≤ 3 tham số → gói vào `UpdateCvStatusCommand(jobId, candidateId, newStatus, actorCompanyId)`. REST và Telegram dùng chung đường này, **không** có đường vòng nào bỏ qua kiểm quyền.

### 3.10 API Contract

Tất cả trả `ResponseEntity<ApiResponse<T>>` (CLAUDE.md). Tất cả yêu cầu đăng nhập (`anyRequest().authenticated()` đã đủ) trừ webhook Telegram. Lỗi theo `GlobalExceptionHandler` hiện có (`ResourceNotFoundException` 404, `BadRequestException` 400, `BusinessException` 409, `AccessDeniedException` 403).

> **Pagination:** CLAUDE.md ghi list API hiện *chưa* phân trang ("Còn nợ"). `/notifications` tăng không giới hạn nên **phải phân trang ngay từ đầu** — đây sẽ là endpoint đầu tiên dùng `PageResponse<T>` (DTO mới trong `dto/response/`), không ảnh hưởng contract cũ.

```java
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, boolean hasNext) {}
```

| # | Method & Endpoint | Role | Request | Response `data` |
|---|---|---|---|---|
| 1 | `GET /notifications?page=0&size=20&unreadOnly=false` | any | query: `page` ≥ 0 (mặc định 0), `size` 1–50 (mặc định 20, **clamp** không vượt 50), `unreadOnly` | `PageResponse<NotificationResponse>` sắp xếp `createdAt DESC` |
| 2 | `GET /notifications/unread-count` | any | — | `{ "count": 4 }` |
| 3 | `PATCH /notifications/{id}/read` | any | — | `null` + message. Không phải của mình hoặc không tồn tại → **404** (không phân biệt, tránh dò ID). Đã đọc rồi → vẫn 200 (idempotent) |
| 4 | `PATCH /notifications/read-all` | any | — | `{ "updated": 3 }` |
| 5 | `GET /notifications/preferences` | any | — | `PreferencesResponse` |
| 6 | `PUT /notifications/preferences` | any | `UpdatePreferencesRequest` | `PreferencesResponse` |
| 7 | `POST /notifications/telegram/link-token` | any | — | `{ "deepLink": "...", "expiresAt": "..." }`. Rate limit: tối đa 5 token/giờ/account (409 `BusinessException` nếu vượt) |
| 8 | `GET /notifications/telegram/status` | any | — | `{ "linked": true, "telegramUsername": "abc", "linkedAt": "..." }` |
| 9 | `DELETE /notifications/telegram/link` | any | — | `null` + "Đã huỷ liên kết Telegram" (xoá `telegram_links`) |
| 10 | `POST /webhooks/telegram` | public + secret header | Telegram Update | `200` rỗng |

> Path `/notifications/read-all`, `/notifications/preferences`, `/notifications/telegram/...` là literal; khai báo trong controller **trước** `/{id}/read`, hoặc dùng `{id:\\d+}` để tránh nhầm `read-all` với `{id}`.

**DTO**

```java
public record NotificationResponse(
    Long id, NotificationType type, String title, String body, String linkUrl,
    Map<String, Object> payload, boolean read, Instant createdAt) {}

public record PreferencesResponse(List<PreferenceItem> items) {}
public record PreferenceItem(NotificationType type, NotificationChannelType channel,
                             boolean enabled, boolean locked) {}   // locked=true: IN_APP, không sửa được

public record UpdatePreferencesRequest(
    @NotNull @Size(min = 1, max = 50) List<@Valid PreferenceUpdate> items) {}
public record PreferenceUpdate(
    @NotNull NotificationType type,
    @NotNull NotificationChannelType channel,       // IN_APP → 400 BadRequestException
    boolean enabled) {}
```

**Validation / business rule ngoài bean validation**
- `PreferenceUpdate.channel == IN_APP` → `BadRequestException("Không thể tắt thông báo trong ứng dụng")`.
- Bật `TELEGRAM` khi chưa liên kết → vẫn lưu được (người dùng liên kết sau), nhưng `GET` trả thêm cờ `telegramLinked` để FE nhắc.
- Loại thông báo không áp dụng cho role (candidate bật `CV_SUBMITTED`) → bỏ qua im lặng khi resolve, hoặc `BadRequestException`; chọn **bỏ qua** để API không phụ thuộc role.
- Response không bao giờ chứa `dedupe_key`, `provider_message_id`, `last_error`.

### 3.11 Retention (dọn dữ liệu kỹ thuật)

Job `NotificationRetentionJob` chạy hằng ngày dưới ShedLock `notification-retention`, xoá theo lô ≤ 1.000 dòng/lần (không giữ khoá bảng lâu):

| Bảng | Điều kiện xoá |
|---|---|
| `domain_event_outbox` | `status = 'PROCESSED'` và `processed_at < now() - 14 ngày` (`FAILED` giữ 90 ngày để điều tra) |
| `telegram_update_inbox` | `status = 'PROCESSED'` và `processed_at < now() - 14 ngày` |
| `notification_deliveries` / `notifications` | Theo chính sách sản phẩm (đề xuất: thông báo **đã đọc** > 180 ngày, delivery đi theo cascade); thông báo chưa đọc không xoá tự động |
| `telegram_link_tokens` | `expires_at < now() - 1 ngày` |

Quy định retention của `interviews`/`job_alert_runs` nằm ở Phase 2 / Phase 4.

### 3.12 Logging & bảo mật dữ liệu

- Log theo `eventId` + `notificationId`; **không** log nội dung email, token Telegram, `link token`, `webhook-secret`.
- `last_error` cắt 500 ký tự, đã loại bỏ URL có token (Bot API URL chứa `bot<token>` — `RestClient` exception message có thể chứa URL → sanitize trước khi lưu/log).
- `telegram_username`/`chat_id` là dữ liệu cá nhân: chỉ lưu khi user chủ động liên kết; `DELETE /notifications/telegram/link` xoá hẳn.

---

## 4. 🖥 Frontend Integration Specs

Stack hiện có: React 19, React Router 7, Tailwind 4, Radix UI (`dialog`, `popover`, `scroll-area` đã cài), `lucide-react`, `axios` instance `api` (`baseURL: '/api'`, tự unwrap `ApiResponse`), JWT ở `localStorage.token`.

Thêm dependency: `@stomp/stompjs` (không cần `sockjs-client`).

### 4.1 Cấu trúc file

```
src/
├── types.ts                               # thêm NotificationResponse, PageResponse<T>, Preference*, ...
├── services/notificationService.ts        # REST — theo mẫu jobEngagementService.ts
├── context/NotificationContext.tsx        # state + STOMP client (1 instance cho cả app)
├── hooks/useNotifications.ts              # hook đọc context
├── components/notification/
│   ├── NotificationBell.tsx               # icon chuông + badge — gắn vào Header.tsx
│   ├── NotificationDropdown.tsx           # Radix Popover, 10 mục mới nhất
│   ├── NotificationItem.tsx
│   ├── NotificationDetailDialog.tsx       # Radix Dialog xem chi tiết
│   └── TelegramLinkCard.tsx
└── pages/dashboard/notifications/page.tsx # "Xem tất cả": danh sách phân trang + tab Tất cả/Chưa đọc
└── pages/dashboard/settings/notifications/page.tsx   # ma trận kênh + liên kết Telegram
```
Đăng ký route trong [routes.ts](../../Frontend/itjob/src/routes.ts) dưới nhánh `/dashboard` (cùng chỗ với `job-alerts`, `saved-jobs`) và thêm mục vào `Sidebar.tsx`.

### 4.2 Component tree & UI flow

```
<AuthProvider>
  <NotificationProvider>            ← chỉ kết nối khi isAuthenticated
    <Header>
      <NotificationBell>            ← badge = unreadCount (hiển thị "9+" nếu >9, ẩn nếu 0)
        <NotificationDropdown>      ← mở khi click chuông
          header: "Thông báo"  [Đánh dấu tất cả đã đọc]
          <ScrollArea>
            <NotificationItem × ≤10>
          footer: <Link to="/dashboard/notifications">Xem tất cả</Link>
```

**Hành vi `NotificationBell`**
- Có `aria-label="Thông báo, N chưa đọc"`; badge là `aria-live="polite"`.
- Mount: `GET /notifications/unread-count` + `GET /notifications?size=10`.
- Nhận push: tăng `unreadCount` theo giá trị server gửi (`unreadCount`), chèn item mới lên đầu list, hiển thị toast ngắn (dùng `useToastMessage` có sẵn) cho loại `CV_STATUS_CHANGED`, `INTERVIEW_*`.

**Hành vi `NotificationItem`**
- Chưa đọc: nền nhấn + chấm xanh. Hiển thị icon theo `type`, `title`, `body` (cắt 2 dòng), thời gian tương đối (`date-fns` `formatDistanceToNow` locale `vi`).
- Click: (1) optimistic đặt `read=true`, `unreadCount-1`; (2) `PATCH /notifications/{id}/read`; (3) nếu `linkUrl` → `navigate(linkUrl)`, ngược lại mở `NotificationDetailDialog`.
- PATCH lỗi → rollback optimistic + toast lỗi.

**`NotificationDetailDialog`** (Radix Dialog): tiêu đề, nội dung đầy đủ, thời gian tuyệt đối, nút "Đi tới" nếu có `linkUrl`. Dùng cho thông báo không có đích điều hướng và để xem full `body`.

**Trang `/dashboard/notifications`**: tab *Tất cả / Chưa đọc*, danh sách phân trang (page/size), nút "Đánh dấu tất cả đã đọc", empty state "Bạn chưa có thông báo nào".

**Trang cài đặt `/dashboard/settings/notifications`**
- Bảng: hàng = loại thông báo (lọc theo role hiện tại: candidate không thấy `CV_SUBMITTED`; company không thấy `CV_STATUS_CHANGED`), cột = `Trong ứng dụng` (checkbox **disabled + checked**), `Email`, `Telegram`.
- Cột Telegram bị vô hiệu + tooltip "Kết nối Telegram trước" khi chưa liên kết.
- Lưu: nút "Lưu thay đổi" gọi `PUT /notifications/preferences`; trạng thái `saving`, báo lỗi theo `getApiErrorMessage`.
- `TelegramLinkCard`: 3 trạng thái — *Chưa kết nối* (nút "Kết nối Telegram" → gọi link-token → `window.open(deepLink)` + poll `status`, countdown hết hạn) / *Đang chờ* / *Đã kết nối @username* (nút "Huỷ kết nối" có xác nhận).

### 4.3 WebSocket

**URL:** `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`. Đi qua cùng proxy `/api` của Vite → cần **bật `ws: true`** ở [vite.config.ts](../../Frontend/itjob/vite.config.ts):

```ts
proxy: { '/api': { target: process.env.PROXY_TARGET || 'http://localhost:8080', changeOrigin: true,
                   ws: true, rewrite: (p) => p.replace(/^\/api/, '') } }
```
Production (nginx/ingress) phải bật `proxy_set_header Upgrade $http_upgrade; Connection "upgrade"` và `proxy_read_timeout` > 2× heartbeat.

```ts
const client = new Client({
  brokerURL: wsUrl,
  heartbeatIncoming: 10000, heartbeatOutgoing: 10000,
  reconnectDelay: 3000,                              // stompjs tự reconnect; tăng dần bằng onWebSocketClose nếu cần
  beforeConnect: () => { client.connectHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` }; },
  onConnect: () => {
    client.subscribe('/user/queue/notifications', (msg) => handlePush(JSON.parse(msg.body)));
    refetchAfterReconnect();                         // bù thông báo bị lỡ khi mất kết nối
  },
});
```

| Chủ đề | Quy tắc |
|---|---|
| Topic subscribe | **Chỉ** `/user/queue/notifications` |
| Auth | JWT trong `connectHeaders` (không đưa token lên query string — lộ trong log proxy) |
| Token refresh | Khi interceptor refresh token xong → `client.deactivate()` rồi `activate()` để reconnect với token mới |
| Logout | `deactivate()`, xoá state notification |
| Reconnect | Sau mỗi `onConnect` (kể cả lần reconnect) gọi lại `unread-count` + trang đầu |
| Dedupe | Bỏ qua push có `notification.id` đã tồn tại trong list |
| Nhiều tab | Mỗi tab 1 kết nối là chấp nhận được; badge đồng bộ nhờ server gửi `unreadCount` |
| Fallback | Nếu WS lỗi liên tục (≥ 3 lần) → poll `unread-count` mỗi 30s cho tới khi kết nối lại |

### 4.4 Type (thêm vào `types.ts`)

```ts
export type NotificationType = 'CV_SUBMITTED'|'CV_APPLICATION_RECEIVED'|'CV_STATUS_CHANGED'|'JOB_CREATED'
  |'CV_WITHDRAWN'|'INTERVIEW_SCHEDULED'|'INTERVIEW_RESCHEDULED'|'INTERVIEW_CANCELLED'|'INTERVIEW_REMINDER'
  |'INTERVIEW_RESPONSE'|'INTEGRATION_ACTION_REQUIRED'|'JOB_ALERT';
export type NotificationChannelType = 'IN_APP'|'EMAIL'|'TELEGRAM';

export interface NotificationResponse {
  id: number; type: NotificationType; title: string; body: string;
  linkUrl?: string; payload: Record<string, unknown>; read: boolean; createdAt: string;
}
export interface PageResponse<T> { items: T[]; page: number; size: number; totalElements: number; hasNext: boolean; }
export interface NotificationPushMessage { type: 'NOTIFICATION_CREATED'; notification: NotificationResponse; unreadCount: number; }
```

### 4.5 Việc FE phải làm do thay đổi `CVStatus`

Khi BE thêm hằng số mới vào `CVStatus`, rà mọi nơi FE hiển thị trạng thái CV (`renderStatusLabel` & các badge) — thêm nhãn tiếng Việt cho từng giá trị, và `default` hiển thị trung tính thay vì rơi vào nhánh "Từ chối".

---

## 5. ✅ Acceptance Criteria & Test Checklist

### 5.1 Acceptance Criteria (Definition of Done)

- [ ] Company đổi CV `PENDING → APPROVED` → candidate thấy **trong < 3 giây** chuông tăng badge (WebSocket) và có email `cv-status-changed`.
- [ ] Candidate nộp CV → candidate nhận email xác nhận; company nhận IN_APP; nếu company đã liên kết Telegram → nhận tin kèm 2 nút.
- [ ] HR bấm **Duyệt** trên Telegram → CV chuyển `APPROVED`, tin nhắn được sửa (bỏ nút, ghi "Đã duyệt"), candidate nhận thông báo như đi qua REST.
- [ ] Lỗi SMTP/Telegram **không** làm API đổi status CV thất bại hay chậm (kiểm bằng cách tắt SMTP).
- [ ] User tự bật/tắt Email/Telegram theo loại thông báo; `IN_APP` không tắt được; Dispatcher tôn trọng lựa chọn.
- [ ] App khởi động bình thường khi **không** cấu hình SMTP, Telegram, hoặc Redis.
- [ ] Không có test nào gọi SMTP/Telegram thật.
- [ ] Toàn bộ P1–P7 (§1.6) đã được sửa và có test ownership/concurrency tương ứng.
- [ ] Backend bị dừng sau khi commit nghiệp vụ nhưng trước listener vẫn xử lý được event từ outbox khi khởi động lại.

### 5.2 Happy path

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| H1 | `PATCH .../status?status=APPROVED` | 1 `notifications` (candidate), 2–3 `notification_deliveries` (`IN_APP` SENT, `EMAIL` SENT) |
| H2 | `GET /notifications` | `createdAt DESC`, đúng phân trang, `read=false` cho thông báo mới |
| H3 | `PATCH /notifications/{id}/read` hai lần liên tiếp | Cả hai 200; `readAt` không đổi ở lần 2; `unread-count` giảm đúng 1 |
| H4 | `read-all` | `unread-count = 0`; `{updated}` bằng số chưa đọc trước đó |
| H5 | Liên kết Telegram bằng deep-link hợp lệ | `telegram_links` có dòng mới; `GET status` → `linked:true` |
| H6 | Tạo job `published` có 3 follower | 3 notification `JOB_CREATED`, không có N+1 (đếm query ≤ hằng số) |
| H7 | Cập nhật preference tắt `EMAIL` cho `CV_STATUS_CHANGED` | Lần sau không có delivery `EMAIL` |

### 5.3 Edge cases & lỗi bên thứ ba

| # | Tình huống | Kỳ vọng |
|---|---|---|
| E1 | Cùng `eventId` được outbox processor xử lý 2 lần | Chỉ 1 notification/delivery nhờ unique key; lần xử lý lại không tạo bản ghi DB trùng |
| E2 | Hai thread cùng insert 1 `dedupe_key` | 1 thread thắng, thread kia bắt `DataIntegrityViolation` và bỏ qua, không ném lỗi |
| E3 | `updateCVStatus` cùng status cũ | Không publish event, không notification |
| E4 | `updateCVStatus` rollback sau khi ghi outbox | Cả CV và outbox rollback; không có notification |
| E5 | Process chết sau commit nhưng trước `AFTER_COMMIT` listener | Outbox còn `PENDING`; recovery job xử lý sau restart |
| E6 | SMTP timeout (>5s) | delivery `RETRY_WAIT`, `next_attempt_at = +1 phút`; request gốc không bị chậm |
| E7 | SMTP lỗi 3 lần liên tiếp | delivery `FAILED`, `attempt_count = 3`; **IN_APP vẫn SENT** |
| E8 | Địa chỉ email sai định dạng | Permanent → `FAILED` ngay, không retry |
| E9 | Telegram `429 retry_after=40` | Retry sau `max(40s, backoff)` |
| E10 | Telegram `403 Forbidden: bot was blocked` | `telegram_links.active=false`, delivery `SKIPPED`/`FAILED`, **không** retry; Settings hiển thị "Cần kết nối lại" |
| E11 | Webhook thiếu/sai `X-Telegram-Bot-Api-Secret-Token` | 401, không xử lý |
| E12 | `/start <token>` hết hạn / đã dùng / sai | Bot trả lời chung chung, không tạo link |
| E13 | Chat A (HR công ty A) bấm nút CV của job công ty B (callback giả) | Từ chối "không có quyền", CV không đổi |
| E14 | HR bấm "Duyệt" sau khi CV đã `REJECTED` bằng web | `answerCallbackQuery("CV đã được xử lý")`, bỏ nút, không đổi status |
| E15 | 2 HR bấm Duyệt và Từ chối gần như đồng thời | Đúng 1 thao tác thắng, thao tác còn lại nhận thông báo "đã xử lý" |
| E16 | Tên ứng viên chứa `<b>`, `&`, `*` | Telegram/Email hiển thị nguyên văn, không vỡ định dạng, không chèn HTML |
| E17 | WebSocket CONNECT không có/ sai JWT | Server từ chối kết nối |
| E18 | User A subscribe `/queue/notifications` (không có `/user`) hoặc destination của người khác | Bị `StompAuthChannelInterceptor` chặn |
| E18b | Client gửi frame `SEND` tới `/queue/**` hoặc `/app/**` | Bị interceptor từ chối, broker không nhận message từ client |
| E19 | `PATCH /notifications/{id}/read` với id của người khác / không tồn tại | 404 giống nhau |
| E20 | `GET /notifications?size=1000` | Bị clamp về 50 |
| E21 | Mất mạng 2 phút rồi có lại (FE) | Reconnect, refetch, không mất thông báo, không trùng item |
| E22 | Redis tắt | Notification hoạt động bình thường (không phụ thuộc Redis) |
| E23 | 2 instance cùng chạy `DeliveryRetryJob` | Một instance claim delivery tại một thời điểm (`SKIP LOCKED`); stale `PROCESSING` được phục hồi |
| E24 | Executor từ chối wake-up signal (queue đầy) hoặc backend restart | `OutboxWakeupListener` bắt `RejectedExecutionException`, request nghiệp vụ vẫn trả thành công (có test ép executor đầy và assert không có exception lan ra người gọi); outbox recovery xử lý event sau đó |
| E33 | Transition CV ngoài §1.7 (vd. `REJECTED → APPROVED`, company đặt `WITHDRAWN`) | `409`, status không đổi, không event |
| E25 | Candidate gọi `PUT /jobs/{id}/cvs` kèm `status=APPROVED` | Field không thuộc DTO; status không đổi, không phát event |
| E26 | Company A gọi list/detail/status CV của job company B | `403`, không trả dữ liệu và không mutate CV |
| E27 | Company A gọi edit job của company B | `403`, job/cache không đổi và không ghi `JobCreatedEvent` |
| E28 | Telegram gửi lại cùng `update_id` | Inbox chỉ có một dòng, callback nghiệp vụ chạy tối đa một lần |
| E29 | SMTP/Telegram đã nhận nhưng process chết trước khi lưu `SENT` | Delivery được retry theo at-least-once; duplicate ngoài hệ thống được ghi nhận là giới hạn, không tạo notification DB thứ hai |

### 5.4 Test plan (theo tầng)

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Unit | JUnit5 + Mockito | `NotificationDefaults`, `resolveChannels`, state machine & backoff của `DeliveryDispatcher` (mock `NotificationChannel`), `TelegramUpdateHandler` (parse callback, kiểm quyền, idempotent), `NotificationFactory` (event → drafts) |
| Repository | `@DataJpaTest` + Testcontainers PostgreSQL | Outbox/inbox unique, atomic claim, stale recovery, `dedupe_key`, `markRead`, `SKIP LOCKED`, partial index; **không dùng H2** |
| Integration | `@SpringBootTest` + GreenMail | Commit/rollback/crash-replay outbox; email qua SMTP in-memory; Telegram qua `MockRestServiceServer`; optimistic-lock CV |
| WebSocket | `@SpringBootTest(webEnvironment=RANDOM_PORT)` + `WebSocketStompClient` | CONNECT có/không JWT, nhận đúng user, chặn SUBSCRIBE trái phép và mọi SEND, reconnect sau token refresh |
| API | `MockMvc` | `ApiResponse<T>`, ownership CV/job, webhook inbox duplicate, 404/400/403, clamp `size`, route literal vs `{id}` |
| FE | Vitest + Testing Library | Bổ sung test runner/dependencies; badge, optimistic read + rollback, dedupe push, reconnect token và disabled checkbox IN_APP |
| Thủ công | — | Bot Telegram thật + `mode=polling`: liên kết, nhận tin, bấm Duyệt; Gmail/Mailtrap thật gửi 1 email |

### 5.5 Thứ tự triển khai gợi ý (mỗi bước commit riêng)

1. Sửa P1–P7 + test ownership/transition/concurrency (không phụ thuộc phần còn lại).
2. `V4` migration + notification/outbox/inbox entity/repository + test Flyway `V1→V4` và Hibernate `validate`.
3. `DomainEventPublisher` + outbox processor/recovery + `NotificationService.create` (chưa có kênh) + test commit/rollback/replay.
4. `NotificationController` + `InAppNotificationChannel` + `WebSocketConfig` (BE xong real-time).
5. FE: service, context, chuông, dropdown, trang danh sách.
6. `EmailNotificationChannel` + template + preference API + FE settings.
7. Telegram: client, link, durable webhook inbox, channel, callback.
8. Delivery/outbox/inbox recovery jobs + ShedLock + bộ test edge case.

### 5.6 Rủi ro / lưu ý

- **Simple broker in-memory**: chạy ≥ 2 instance backend thì push chỉ tới user đang kết nối đúng instance. Khi scale ngang cần STOMP broker relay (RabbitMQ) hoặc Redis pub/sub; ghi vào "Còn nợ" của CLAUDE.md khi quyết định.
- **Giới hạn Telegram**: ~30 tin/giây toàn bot, ~1 tin/giây/chat — nếu sau này gửi hàng loạt phải có hàng đợi tốc độ.
- **`@Async` + `ThreadLocal`**: `SecurityContext` không truyền sang thread async; listener **không** được dùng `SecurityContextHolder`. Mọi dữ liệu cần thiết phải nằm trong event/draft.
- **Không có exactly-once qua SMTP/Telegram**: unique key bảo vệ dữ liệu nội bộ; external send là at-least-once như mô tả ở §3.5.
- Email chứa dữ liệu cá nhân: không đưa số điện thoại/lương mong muốn của ứng viên vào email gửi cho bên thứ ba ngoài người có quyền.
