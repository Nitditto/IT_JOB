# Phase 2 — Quản lý lịch phỏng vấn & Google Calendar

> **Đối tượng đọc:** dev Backend (Spring Boot) và dev Frontend (React) triển khai độc lập.
>
> **Phụ thuộc:** [phase-1-notifications.md](phase-1-notifications.md) phải đạt Definition of Done trước (transactional outbox, `notifications`, template email, `shedlock`, và toàn bộ hardening P1–P7 ở §1.6). Spec này **bổ sung** cho [02-google-calendar.md](02-google-calendar.md) và [00-foundation.md](00-foundation.md) (phần entity `Interview`); khi lệch nhau thì dùng file này.
>
> **Khác biệt chính so với tài liệu cũ:**
> | Điểm | Tài liệu cũ | Spec này |
> |---|---|---|
> | DB | MySQL/MariaDB | **PostgreSQL** |
> | `Interview` | Gắn `accountId` + `jobId` rời, `interviewerAccountIds` | Gắn đúng khoá CV `(candidate, job)`; người phỏng vấn là **contact** (tên + email), không bắt buộc có tài khoản — vì mỗi company chỉ có **1** `Account` |
> | Calendar | Cả HR và ứng viên đều phải OAuth | **Chỉ HR (organizer) OAuth**; ứng viên nhận lời mời Google qua `attendees` (xem §1.3 — Quyết định kiến trúc) |

---

## 1. 🎯 Overview & Use Cases

### 1.1 Mục tiêu

Company (HR) đặt lịch phỏng vấn cho một CV đã được duyệt; ứng viên nhận lời mời, xác nhận/từ chối/đề nghị đổi giờ; sự kiện được tạo **tự động** trên Google Calendar của HR và xuất hiện trên Google Calendar của ứng viên, kèm nhắc lịch.

### 1.2 Luồng nghiệp vụ

```
HR mở CV (status APPROVED hoặc INTERVIEW_SCHEDULED) ─► "Lên lịch phỏng vấn"
  │ POST /jobs/{jobId}/cvs/accounts/{candidateId}/interviews
  ▼
InterviewService.schedule()   [@Transactional]
  ├─ kiểm quyền (job thuộc company), kiểm trạng thái CV, kiểm trùng giờ (ứng viên + company)
  ├─ INSERT interviews (+ interviewers), CV.status → INTERVIEW_SCHEDULED
  ├─ UPSERT interview_calendar_events(PENDING, UPSERT) nếu yêu cầu sync
  └─ ghi InterviewScheduledEvent vào domain_event_outbox
        │ (sau commit, worker async + recovery scheduler)
        ├─► Phase 1: Notification cho ứng viên (IN_APP + EMAIL kèm .ics) và company (IN_APP)
        └─► CalendarSyncProcessor claim task PENDING
              └─ Google Calendar: events.insert (organizer = HR, attendees = ứng viên + người phỏng vấn)
Ứng viên: POST /interviews/{id}/respond  ACCEPTED | DECLINED | RESCHEDULE_REQUESTED
  └─ phát InterviewResponseEvent ─► Notification cho HR
HR đổi giờ ─► PUT /interviews/{id} ─► events.patch ; HR huỷ ─► POST /interviews/{id}/cancel ─► events.delete
T-24h và T-1h: scheduler nhắc ─► Notification INTERVIEW_REMINDER (Phase 1)
```

### 1.3 🧭 Quyết định kiến trúc: Google Calendar — chỉ HR kết nối OAuth

Yêu cầu gốc: *"tự tạo sự kiện … trên Google Calendar của Ứng viên & HR"*. Có 2 cách:

| | A. HR là organizer + `attendees` **(chọn)** | B. Mỗi bên OAuth, tự `insert` vào lịch của mình |
|---|---|---|
| Ứng viên cần cấp quyền Google? | **Không** | Có — rào cản lớn, nhiều ứng viên bỏ giữa chừng |
| Lịch của ứng viên | Google gửi lời mời; nếu email ứng viên là Google/Workspace, sự kiện hiện trong lịch (`sendUpdates=all`) kèm nút RSVP | Tạo sự kiện thứ 2 độc lập, dễ **trùng** nếu cũng là attendee |
| Đổi/huỷ lịch | 1 sự kiện duy nhất, `patch/delete` là đủ, Google tự báo attendee | Phải đồng bộ N sự kiện |
| Ứng viên không dùng Google | Vẫn có `.ics` đính kèm email + nút "Thêm vào Google Calendar" | Không hỗ trợ |
| Rủi ro | Phụ thuộc HR đã kết nối | Phụ thuộc mọi bên đã kết nối |

→ **v1 làm cách A.** Nếu sau này cần ghi thẳng vào lịch ứng viên (cách B), thêm vào cùng bảng `google_calendar_connections` cho `ROLE_USER` và một dòng `interview_calendar_events` cho mỗi người — schema ở §2 đã đủ chỗ.

Hệ quả: HR **chưa** kết nối Google → đặt lịch vẫn thành công, task calendar ở `NOT_CONNECTED`, ứng viên vẫn nhận email + `.ics`; UI gợi ý "Kết nối Google Calendar". RSVP mà ứng viên bấm trong Google **không đồng bộ ngược** về IT_JOB ở v1; phản hồi trong IT_JOB là trạng thái nghiệp vụ chính.

### 1.4 Điều kiện kích hoạt

| Trigger | Ai | Điều kiện | Kết quả |
|---|---|---|---|
| Đặt lịch | Company chủ job | CV tồn tại, thuộc job của mình, status ∈ {`APPROVED`, `INTERVIEW_SCHEDULED`}; thời gian tương lai; không trùng lịch | `Interview` `SCHEDULED`, CV → `INTERVIEW_SCHEDULED` |
| Đổi lịch | Company | `status ∈ {SCHEDULED, CONFIRMED}`, chưa diễn ra | `RESCHEDULED` logic: cập nhật giờ, reset `candidate_response=PENDING`, `InterviewRescheduledEvent` |
| Huỷ | Company | chưa `COMPLETED` | `CANCELLED`, `InterviewCancelledEvent`; nếu không còn lịch active → CV về `APPROVED` |
| Phản hồi | Ứng viên | lịch của mình, chưa diễn ra, chưa huỷ | cập nhật `candidate_response`; `ACCEPTED` ⇒ `status=CONFIRMED` |
| Hoàn tất / vắng mặt | Company | sau giờ bắt đầu | `COMPLETED` / `NO_SHOW` |
| Nhắc lịch | Scheduler | T-24h, T-1h, status active | Notification `INTERVIEW_REMINDER`, mỗi mốc đúng 1 lần |
| Kết nối Google | Company | — | OAuth2 authorization-code (§3.7) |

### 1.5 Ngoài phạm vi

Video-call tự dựng, chọn slot rảnh tự động (free/busy), đồng bộ ngược từ Google về hệ thống (webhook `events.watch`), Outlook/Apple Calendar, đặt lịch đồng thời nhiều ứng viên (panel/group interview).

---

## 2. 🗄 Database Design

Quy ước giống Phase 1 (PostgreSQL, `TIMESTAMP WITH TIME ZONE`, sequence `INCREMENT BY 50`, `@SequenceGenerator` tường minh, ID tới `Account` là raw `Long`).

`Interview` tham chiếu `(candidate_account_id, job_id)` — chính là khoá chính của bảng `cv` (`accounts_id`, `jobs_id`). Không dùng `@ManyToOne` tới `CV` (CV đã dùng `@EmbeddedId`+`@MapsId`; ở đây chỉ cần raw ID và một FK composite ở DB).

### 2.1 Migration `V5__create_interviews_and_google_calendar.sql`

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- cần cho EXCLUDE constraint; cần quyền superuser/owner 1 lần

CREATE SEQUENCE IF NOT EXISTS interviews_seq                START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS interview_interviewers_seq    START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS interview_calendar_events_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS oauth_states_seq              START WITH 1 INCREMENT BY 50;

-- ============ interviews ============
CREATE TABLE interviews (
    id                    BIGINT       NOT NULL PRIMARY KEY,
    job_id                BIGINT       NOT NULL,
    candidate_account_id  BIGINT       NOT NULL,
    company_account_id    BIGINT       NOT NULL REFERENCES accounts(id),   -- = jobs.company_id, denormalize để phân quyền/lọc nhanh
    round_number          INT          NOT NULL DEFAULT 1,
    title                 VARCHAR(200) NOT NULL,
    start_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at                TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone              VARCHAR(64)  NOT NULL,                           -- IANA, ví dụ Asia/Ho_Chi_Minh (hiển thị/ICS/Google)
    mode                  VARCHAR(10)  NOT NULL,                           -- ONLINE | ONSITE
    meeting_url           VARCHAR(500),
    generate_meet_link    BOOLEAN      NOT NULL DEFAULT FALSE,
    sync_google_calendar  BOOLEAN      NOT NULL DEFAULT TRUE,
    location_address      VARCHAR(500),
    note                  VARCHAR(2000),
    status                VARCHAR(20)  NOT NULL,                           -- SCHEDULED | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
    candidate_response    VARCHAR(25)  NOT NULL DEFAULT 'PENDING',         -- PENDING | ACCEPTED | DECLINED | RESCHEDULE_REQUESTED
    candidate_response_note VARCHAR(1000),
    cancel_reason         VARCHAR(1000),
    reminder_24h_sent_at  TIMESTAMP WITH TIME ZONE,
    reminder_1h_sent_at   TIMESTAMP WITH TIME ZONE,
    version               BIGINT       NOT NULL DEFAULT 0,                 -- @Version, chống ghi đè khi 2 bên sửa cùng lúc
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT fk_interviews_cv FOREIGN KEY (candidate_account_id, job_id)
        REFERENCES cv (accounts_id, jobs_id) ON DELETE RESTRICT,           -- CV đã có lịch chỉ withdraw mềm; purge phải dọn integration trước
    CONSTRAINT ck_interviews_time CHECK (end_at > start_at),
    CONSTRAINT ck_interviews_mode CHECK (
        (mode = 'ONLINE' AND (meeting_url IS NOT NULL OR generate_meet_link = TRUE)) OR
        (mode = 'ONSITE' AND location_address IS NOT NULL) OR
        status IN ('CANCELLED')                                            -- cho phép dữ liệu cũ khi huỷ
    ),
    -- Ứng viên không thể có 2 buổi phỏng vấn active chồng giờ (kể cả khác công ty)
    CONSTRAINT ex_interviews_candidate_no_overlap EXCLUDE USING gist (
        candidate_account_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    ) WHERE (status IN ('SCHEDULED', 'CONFIRMED'))
);

CREATE INDEX idx_interviews_company_start   ON interviews (company_account_id, start_at);
CREATE INDEX idx_interviews_candidate_start ON interviews (candidate_account_id, start_at);
CREATE INDEX idx_interviews_job             ON interviews (job_id);
-- scheduler nhắc lịch chỉ quét lịch còn hiệu lực
CREATE INDEX idx_interviews_reminder_scan   ON interviews (start_at) WHERE status IN ('SCHEDULED', 'CONFIRMED');

-- ============ người phỏng vấn phía công ty (contact, không bắt buộc có tài khoản) ============
CREATE TABLE interview_interviewers (
    id           BIGINT       NOT NULL PRIMARY KEY,
    interview_id BIGINT       NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    name         VARCHAR(120) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    position     VARCHAR(120),                               -- vai trò: "Tech Lead", "HR"
    CONSTRAINT uk_interviewer_email UNIQUE (interview_id, email)
);
CREATE INDEX idx_interview_interviewers_interview ON interview_interviewers (interview_id);

-- ============ Google OAuth: kết nối của 1 account ============
CREATE TABLE google_calendar_connections (
    account_id               BIGINT       NOT NULL PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    google_email             VARCHAR(255) NOT NULL,
    refresh_token_encrypted  TEXT         NOT NULL,          -- AES-256-GCM, KHÔNG lưu thô
    access_token_encrypted   TEXT,
    access_token_expires_at  TIMESTAMP WITH TIME ZONE,
    granted_scopes           VARCHAR(500) NOT NULL,
    status                   VARCHAR(20)  NOT NULL,          -- ACTIVE | REVOKED | ERROR
    last_error               VARCHAR(300),
    connected_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- state OAuth chống CSRF/replay, gắn với account khởi tạo
CREATE TABLE oauth_states (
    id          BIGINT       NOT NULL PRIMARY KEY,
    state_hash  CHAR(64)     NOT NULL UNIQUE,                -- SHA-256 hex của state
    account_id  BIGINT       NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    provider    VARCHAR(20)  NOT NULL DEFAULT 'GOOGLE',
    code_verifier VARCHAR(128) NOT NULL,                     -- PKCE
    nonce_hash  CHAR(64)     NOT NULL,                       -- SHA-256 OIDC nonce gửi trong authorization request
    return_path VARCHAR(200),                                -- đường dẫn FE quay lại, đã whitelist
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_oauth_states_expires ON oauth_states (expires_at);

-- ============ Trạng thái đồng bộ sự kiện Google của mỗi lịch ============
CREATE TABLE interview_calendar_events (
    id               BIGINT       NOT NULL PRIMARY KEY,
    interview_id     BIGINT       NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    owner_account_id BIGINT       NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,  -- chủ lịch (HR). Chừa chỗ cho cách B
    google_event_id  VARCHAR(255),
    google_calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
    html_link        VARCHAR(500),
    meet_url         VARCHAR(500),
    sync_action      VARCHAR(10)  NOT NULL DEFAULT 'UPSERT', -- UPSERT | DELETE
    sync_status      VARCHAR(20)  NOT NULL,                  -- PENDING | PROCESSING | SYNCED | RETRY_WAIT | FAILED | NOT_CONNECTED | DELETED
    attempt_count    INT          NOT NULL DEFAULT 0,
    next_attempt_at  TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    last_error       VARCHAR(300),
    synced_at        TIMESTAMP WITH TIME ZONE,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uk_ice_interview_owner UNIQUE (interview_id, owner_account_id)
);
CREATE INDEX idx_ice_due ON interview_calendar_events (next_attempt_at, updated_at)
    WHERE sync_status IN ('PENDING', 'RETRY_WAIT');
CREATE INDEX idx_ice_stale ON interview_calendar_events (processing_started_at)
    WHERE sync_status = 'PROCESSING';
```

**Giải thích các lựa chọn:**
- `EXCLUDE USING gist … WHERE (status IN (...))` là **chốt chặn cuối** chống đặt trùng giờ kể cả khi 2 request chạy đồng thời. Deployment phải cấp cho database owner quyền cài `btree_gist` trước khi chạy V5; migration fail-fast nếu extension không cài được, không âm thầm hạ xuống kiểm tra application-level có race.
- Trùng giờ phía **company/người phỏng vấn** không dùng constraint (một người phỏng vấn có thể đứng nhiều panel, và danh tính họ chỉ là email) → kiểm ở service, **cảnh báo** (`warnings[]` trong response) chứ không chặn cứng.
- Token Google được **mã hoá ứng dụng** (AES-GCM, key từ env `GOOGLE_TOKEN_ENC_KEY`, 32 byte base64). **Không** tái dùng `jwt.secret`.
- `oauth_states` lưu hash của `state`, `code_verifier` PKCE và hash của OIDC nonce; callback claim `used_at` nguyên tử trước khi gọi Google; dọn dòng quá hạn bằng scheduler hằng ngày.

### 2.2 Enum

```java
public enum InterviewStatus { SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW }
public enum InterviewMode { ONLINE, ONSITE }
public enum CandidateResponse { PENDING, ACCEPTED, DECLINED, RESCHEDULE_REQUESTED }
public enum CalendarSyncStatus { PENDING, PROCESSING, SYNCED, RETRY_WAIT, FAILED, NOT_CONNECTED, DELETED }
public enum ConnectionStatus { ACTIVE, REVOKED, ERROR }
```

Mở rộng `CVStatus` (đã yêu cầu ở Phase 1): thêm bắt buộc **`INTERVIEW_SCHEDULED`, `INTERVIEW_DONE`, `OFFERED`, `WITHDRAWN`**. Cột là `VARCHAR` nên không cần migration enum; `WITHDRAWN` thay thế hard-delete khi hồ sơ đã bước vào quy trình tuyển dụng.

### 2.3 Entity (phần quyết định thiết kế)

```java
@Entity @Table(name = "interviews")
@Getter @Setter @NoArgsConstructor
public class Interview {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "interviews_seq")
    @SequenceGenerator(name = "interviews_seq", sequenceName = "interviews_seq", allocationSize = 50)
    private Long id;

    @Column(name = "job_id", nullable = false)               private Long jobId;
    @Column(name = "candidate_account_id", nullable = false) private Long candidateAccountId;
    @Column(name = "company_account_id", nullable = false)   private Long companyAccountId;
    private Integer roundNumber;
    private String title;
    private Instant startAt;
    private Instant endAt;
    private String timezone;
    @Enumerated(EnumType.STRING) private InterviewMode mode;
    private Boolean generateMeetLink;
    private Boolean syncGoogleCalendar;
    private String meetingUrl;
    private String locationAddress;
    private String note;
    @Enumerated(EnumType.STRING) private InterviewStatus status;
    @Enumerated(EnumType.STRING) private CandidateResponse candidateResponse;
    private String candidateResponseNote;
    private String cancelReason;
    private Instant reminder24hSentAt;
    private Instant reminder1hSentAt;
    @Version private Long version;
    @CreationTimestamp @Column(updatable = false) private Instant createdAt;
    @UpdateTimestamp private Instant updatedAt;

    @OneToMany(mappedBy = "interview", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InterviewInterviewer> interviewers = new ArrayList<>();   // aggregate con, cùng vòng đời — hợp lệ vì KHÔNG phải aggregate root khác
}
```
Quy tắc "mọi quan hệ phải LAZY + `@EntityGraph`" (CLAUDE.md): mọi repository method trả `Interview` kèm `interviewers` phải có `@EntityGraph(attributePaths = "interviewers")`.

`startAt/endAt` lưu `Instant` (UTC); `timezone` chỉ để **hiển thị** và dựng `.ics`/Google event — không dùng để tính toán thời điểm.

### 2.4 Repository — query bắt buộc

```java
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    @EntityGraph(attributePaths = "interviewers")
    Optional<Interview> findDetailedById(Long id);                                   // @Query hoặc derived

    @EntityGraph(attributePaths = "interviewers")
    List<Interview> findByCandidateAccountIdAndStartAtBetweenOrderByStartAt(Long accountId, Instant from, Instant to);

    @EntityGraph(attributePaths = "interviewers")
    List<Interview> findByCompanyAccountIdAndStartAtBetweenOrderByStartAt(Long companyId, Instant from, Instant to);

    List<Interview> findByJobIdOrderByStartAtDesc(Long jobId);

    // trùng giờ phía company (cảnh báo mềm)
    // Truyền ACTIVE_STATUSES = EnumSet.of(SCHEDULED, CONFIRMED) làm tham số; KHÔNG so sánh enum với chuỗi literal trong JPQL (Hibernate 6 có thể ném SemanticException)
    @Query("select count(i) from Interview i where i.companyAccountId = :companyId and i.status in :activeStatuses and i.startAt < :end and i.endAt > :start and (:excludeId is null or i.id <> :excludeId)")
    long countCompanyOverlaps(Long companyId, Collection<InterviewStatus> activeStatuses, Instant start, Instant end, Long excludeId);

    // claim nhắc lịch: UPDATE ... SET reminder_24h_sent_at = now() WHERE id = ? AND reminder_24h_sent_at IS NULL → 1 = giành được
    @Modifying @Query("update Interview i set i.reminder24hSentAt = :now where i.id = :id and i.reminder24hSentAt is null")
    int claimReminder24h(Long id, Instant now);
    // claimReminder1h tương tự
}
```

---

## 3. ⚙️ Backend Implementation Specs

### 3.1 Dependencies & cấu hình

Không thêm SDK Google: gọi REST API bằng `RestClient` đằng sau interface `CalendarGateway` (D của SOLID; dễ mock, ít transitive dependency).

```properties
# ===== Google Calendar (OAuth2) =====
app.google.enabled=${GOOGLE_ENABLED:false}
app.google.client-id=${GOOGLE_CLIENT_ID:}
app.google.client-secret=${GOOGLE_CLIENT_SECRET:}
app.google.redirect-uri=${GOOGLE_REDIRECT_URI:http://localhost:8080/integrations/google/callback}
app.google.scopes=https://www.googleapis.com/auth/calendar.events,openid,email
app.google.token-encryption-key=${GOOGLE_TOKEN_ENC_KEY:}
app.google.allowed-return-paths=/dashboard/settings/integrations,/dashboard/company/interviews

# ===== Interview =====
app.interview.min-lead-minutes=30            # không đặt lịch bắt đầu trong < 30 phút nữa
app.interview.max-duration-minutes=480
app.interview.reminder-offsets=PT24H,PT1H
# Thời gian tối đa chờ Google trả link Meet trước khi vẫn gửi email mời (kèm ghi chú "link gửi sau"). Xem §3.3
app.interview.meet-wait-timeout-minutes=${INTERVIEW_MEET_WAIT_TIMEOUT_MINUTES:10}
```
`app.google.enabled=false` (mặc định) → các endpoint `/integrations/google/*` trả `409 BusinessException("Google Calendar chưa được bật")`, mọi chỗ sync bỏ qua; **app và việc đặt lịch chạy bình thường không cần Google**.

### 3.2 Package structure

```
com.example.demo
├── event/  InterviewScheduledEvent, InterviewRescheduledEvent, InterviewCancelledEvent, InterviewResponseEvent
├── model/  Interview, InterviewInterviewer, GoogleCalendarConnection, InterviewCalendarEvent, OAuthState
├── enums/  (như §2.2)
├── repository/  Interview*, GoogleCalendarConnectionRepository, InterviewCalendarEventRepository, OAuthStateRepository
├── services/
│   ├── InterviewService (+ impl/InterviewServiceImpl)           # nghiệp vụ lịch
│   ├── InterviewQueryService (+ impl)                           # đọc/mapping DTO (giữ InterviewService < 200 dòng)
│   ├── InterviewReminderJob                                     # @Scheduled
│   └── IcsService (+ impl)                                      # dựng file .ics
├── calendar/
│   ├── CalendarGateway.java                # interface: createEvent / patchEvent / deleteEvent / findByPrivateProp
│   ├── GoogleCalendarGateway.java          # RestClient implementation
│   ├── CalendarSyncService.java (+ impl)   # gọi Google, phân loại lỗi, cập nhật trạng thái
│   ├── CalendarSyncProcessor.java          # claim PENDING/RETRY_WAIT; phục hồi PROCESSING treo
│   ├── CalendarSyncRetryJob.java
│   └── google/
│       ├── GoogleOAuthService.java         # authorize URL, exchange code, refresh, revoke
│       ├── GoogleTokenCrypto.java          # AES-GCM
│       └── GoogleApiException.java         # kèm httpStatus + reason
├── controller/ InterviewController, GoogleIntegrationController
└── dto/request, dto/response/ (như §3.8)
```

### 3.3 Event

```java
public record InterviewScheduledEvent(UUID eventId, Instant occurredAt, Long interviewId) implements DomainEvent {}
public record InterviewRescheduledEvent(UUID eventId, Instant occurredAt, Long interviewId, Instant oldStartAt) implements DomainEvent {}
public record InterviewCancelledEvent(UUID eventId, Instant occurredAt, Long interviewId, String reason) implements DomainEvent {}
public record InterviewResponseEvent(UUID eventId, Instant occurredAt, Long interviewId, CandidateResponse response) implements DomainEvent {}
public record InterviewUpdatedEvent(UUID eventId, Instant occurredAt, Long interviewId) implements DomainEvent {}   // phát khi meetUrl về muộn; gửi lại email/.ics (SEQUENCE tăng), dùng NotificationType INTERVIEW_RESCHEDULED với nội dung "cập nhật link"
```
Chỉ mang `interviewId`; outbox handler tự load `Interview` (có `@EntityGraph`) nên luôn đọc dữ liệu đã commit.

**Hai đường xử lý độc lập** (nguyên tắc S/O):

| Đường xử lý | Việc |
|---|---|
| `NotificationEventHandler` (Phase 1) | Từ domain outbox tạo notification + email `.ics` |
| `CalendarSyncProcessor` | Claim `interview_calendar_events` đã được tạo trong transaction interview rồi gọi `CalendarSyncService` |

Không dùng listener để tạo calendar task: process chết trước listener sẽ không làm mất việc sync. Google chết không ảnh hưởng notification và ngược lại.

#### Email mời phỏng vấn **không** được phụ thuộc Google, và không được thiếu link

Hai đường chạy độc lập nên email mời có thể đi trước khi Calendar sync xong. Quy tắc để không bao giờ gửi email thiếu link:
- Link online luôn có **tại thời điểm tạo lịch**: hoặc `meetingUrl` do HR nhập, hoặc (khi `generateMeetLink=true`) Google đã `ACTIVE` — nhưng URL Meet chỉ có **sau** `events.insert`. Vì vậy với lịch `generateMeetLink=true`, `NotificationEventHandler` **hoãn** tạo notification `INTERVIEW_SCHEDULED` cho ứng viên cho tới khi `interview_calendar_events.sync_status = SYNCED` (có `meet_url`) hoặc hết `app.interview.meet-wait-timeout-minutes` (mặc định 10 phút).
- Hết timeout mà chưa có link (Google lỗi): gửi email/notification với ghi chú "Link họp sẽ được gửi sau", đánh dấu interview cần cập nhật; khi `meetUrl` về sau, phát `InterviewUpdatedEvent` → email/notification cập nhật có link + `.ics` `SEQUENCE` tăng.
- Lịch dùng `meetingUrl` tự nhập hoặc `ONSITE` không bị trì hoãn.

### 3.4 `InterviewService` — nghiệp vụ

```java
public interface InterviewService {
    InterviewResponse schedule(ScheduleInterviewCommand cmd);     // gói tham số (CLAUDE: ≤ 3 tham số)
    InterviewResponse reschedule(RescheduleInterviewCommand cmd);
    InterviewResponse cancel(CancelInterviewCommand cmd);
    InterviewResponse respond(RespondInterviewCommand cmd);       // candidate
    InterviewResponse updateOutcome(Long interviewId, Long companyId, InterviewStatus outcome);  // COMPLETED | NO_SHOW
}
```

#### `schedule` — flow step-by-step

```
@Transactional
1. job = jobService.getJobByID(jobId) ?: 404
2. if job.companyID != actorCompanyId → AccessDeniedException (403)        # ownership
3. cv = cvService.getCVDetail(jobId, candidateId)  ?: 404
4. if cv.status ∉ {APPROVED, INTERVIEW_SCHEDULED} → BusinessException("Chỉ lên lịch cho CV đã được duyệt")
5. validate time: startAt ≥ now + min-lead ; duration ∈ [15, 480] ; endAt = startAt + duration
6. validate mode: ONLINE ⇒ meetingUrl (https) HOẶC generateMeetLink=true ; ONSITE ⇒ locationAddress
   generateMeetLink=true ⇒ mode phải ONLINE (400) VÀ company phải có google_calendar_connections.status=ACTIVE
   cùng app.google.enabled=true, nếu không ⇒ BusinessException 409 "Cần kết nối Google Calendar để tạo link Meet"
   (không chấp nhận lịch ONLINE "chưa có link" rồi hy vọng sync sau)
7. overlap candidate: nếu tồn tại lịch active chồng giờ → BusinessException (409)  [constraint DB là chốt cuối]
8. overlap company: countCompanyOverlaps > 0 → thêm vào warnings[] (KHÔNG chặn)
9. roundNumber = (số interview của CV, trừ CANCELLED) + 1
10. save Interview(+interviewers), status=SCHEDULED, candidateResponse=PENDING, lưu generateMeetLink/syncGoogleCalendar
11. nếu cv.status == APPROVED → cvService.updateCVStatus(→ INTERVIEW_SCHEDULED, bỏ qua notification CV_STATUS_CHANGED)   # transition hợp lệ theo Phase 1 §1.7
12. nếu syncGoogleCalendar=true: upsert CalendarEvent(syncAction=UPSERT, syncStatus=PENDING) trong cùng transaction
13. domainEventPublisher.publish(InterviewScheduledEvent.of(id))      # ghi domain_event_outbox cùng transaction
14. return InterviewResponse (+ warnings)
```
- Bắt `DataIntegrityViolationException` từ `ex_interviews_candidate_no_overlap` → `BusinessException("Ứng viên đã có lịch phỏng vấn khác trong khung giờ này")`.
- Bước 11 không được gây thông báo `CV_STATUS_CHANGED` thứ hai: Phase 1 §1.3 đã quy định `INTERVIEW_SCHEDULED` không tạo notification từ `CvStatusChangedEvent`.

#### `reschedule`

```
@Transactional
1. interview = load(id) ; ownership company ; status ∈ {SCHEDULED, CONFIRMED} ; start > now
2. so version client gửi với interview.version → lệch ⇒ BusinessException("Lịch đã bị thay đổi, vui lòng tải lại") (409)
3. áp dụng giá trị mới + lặp các validate 5–8 của schedule (bỏ qua chính nó khi kiểm trùng)
4. candidateResponse = PENDING ; status = SCHEDULED ; reminder_24h_sent_at = reminder_1h_sent_at = NULL
5. optimistic `version` tăng khi commit; reminder dedupe key sau đó dùng version mới
6. nếu syncGoogleCalendar=true: calendar row → `syncAction=UPSERT`, `syncStatus=PENDING`, reset attempt
7. ghi `InterviewRescheduledEvent(oldStartAt)` vào domain outbox
```

#### `cancel`

```
@Transactional
1. ownership company ; status ∈ {SCHEDULED, CONFIRMED} ; reason ≤ 1000
2. status = CANCELLED ; cancel_reason = reason
3. nếu CV không còn interview active nào → cvService.updateCVStatus(→ APPROVED)
4. calendar row hiện có → `syncAction=DELETE`, `syncStatus=PENDING`, reset attempt
5. ghi `InterviewCancelledEvent` vào domain outbox
```
Huỷ là idempotent: gọi lại khi đã `CANCELLED` → 200, không phát event thứ hai.

#### `respond` (ứng viên)

```
@Transactional
1. interview.candidateAccountId == principal.id ?: 403/404 ; status ∈ {SCHEDULED, CONFIRMED} ; start > now
2. response ∈ {ACCEPTED, DECLINED, RESCHEDULE_REQUESTED} ; note bắt buộc (≥ 5 ký tự) khi RESCHEDULE_REQUESTED/DECLINED
3. lưu candidate_response(+note) ; ACCEPTED ⇒ status = CONFIRMED ; các phản hồi khác giữ nguyên status
4. DECLINED KHÔNG tự huỷ lịch — HR quyết định (huỷ hoặc đề xuất giờ khác)
5. ghi `InterviewResponseEvent` vào domain outbox → HR nhận notification
```

#### `withdrawCv` (ứng viên)

`DELETE /jobs/{jobId}/cvs` giữ endpoint để tương thích nhưng hành vi là **withdraw mềm** khi CV đã phát sinh xử lý:

```
@Transactional
1. load CV của principal; nếu đã WITHDRAWN → 200 idempotent
2. mọi interview active → CANCELLED với reason="Candidate withdrew application"
3. calendar row tương ứng → DELETE/PENDING; ghi InterviewCancelledEvent cho từng lịch
4. CV.status = WITHDRAWN; ghi CvWithdrawnEvent để báo company (không gửi self-notification cho candidate)
5. giữ CV/interview/calendar row để worker xoá Google event và để audit
```

CV `PENDING` chưa có lịch có thể cũng chuyển `WITHDRAWN` để contract nhất quán; việc purge vật lý là retention/admin job ngoài phạm vi. FK `RESTRICT` ngăn code cũ vô tình xoá cascade lịch trước khi integration cleanup hoàn tất.

#### Xoá job / xoá tài khoản khi đã có lịch (FK `RESTRICT` không được gây 500)

`interviews → cv` là `ON DELETE RESTRICT`, trong khi `cv → jobs/accounts` là `CASCADE`. Hai luồng xoá hiện có (`JobService.deleteJob`, xoá tài khoản qua `DeleteAccountRequest`) sẽ vi phạm FK nếu còn interview. Quy tắc:

```
deleteJob(jobId, companyId)  @Transactional
1. ownership check như hiện có
2. nếu job có interview ở trạng thái active (SCHEDULED/CONFIRMED, start > now)
       ⇒ BusinessException 409 "Job còn lịch phỏng vấn đang hiệu lực — huỷ lịch hoặc đóng job (status=closed) thay vì xoá"
3. không còn lịch active nhưng còn interview lịch sử (CANCELLED/COMPLETED/NO_SHOW) hoặc calendar row chưa DELETED
       ⇒ KHÔNG hard-delete; chuyển job.status = closed (soft delete) và để retention/admin purge sau khi calendar row đã DELETED
4. không có interview nào ⇒ xoá như hiện nay

deleteAccount(candidate)
   ⇒ withdrawCv cho mọi CV còn hiệu lực (huỷ lịch, xoá Google event bất đồng bộ) → anonymize account (xoá PII), không DELETE hàng accounts khi còn interview
deleteAccount(company)
   ⇒ 409 nếu còn lịch active; ngược lại đóng mọi job (closed), huỷ calendar integration (DELETE /integrations/google), rồi anonymize
```
Mục tiêu: không bao giờ trả 500 do FK, không mất dữ liệu audit, và Google event luôn được dọn. Test E33–E34 ở §5.3.

### 3.5 Đồng bộ Google Calendar — `CalendarSyncService`

Nguyên tắc: **best-effort, bất đồng bộ, có trạng thái, idempotent.** Đặt lịch thành công là sự thật nghiệp vụ; Google chỉ là bản chiếu.

```java
public interface CalendarGateway {
    GoogleEvent createEvent(String accessToken, EventSpec spec);        // POST   /calendars/{id}/events
    GoogleEvent patchEvent(String accessToken, String eventId, EventSpec spec); // PATCH
    void deleteEvent(String accessToken, String eventId);               // DELETE
    Optional<GoogleEvent> findByPrivateProperty(String accessToken, String key, String value); // GET ?privateExtendedProperty=
}
```

`CalendarSyncProcessor` claim row `PENDING/RETRY_WAIT → PROCESSING` bằng `FOR UPDATE SKIP LOCKED`, sau đó gọi `sync(rowId)`. Action được đọc từ row đã lưu bền vững, không truyền qua signal in-memory:

```
row = calendarEventRepo.findById(rowId) ; action = row.syncAction
interview = interviewRepo.findDetailedById(row.interviewId)
connection = connectionRepo.findById(row.ownerAccountId)
if (!app.google.enabled): row.sync_status = NOT_CONNECTED ; return
if connection == null or status != ACTIVE:
    row.sync_status = NOT_CONNECTED ; return                                  # UI hiển thị gợi ý kết nối

try:
    accessToken = googleOAuthService.getValidAccessToken(connection)           # tự refresh khi còn < 60s
    UPSERT:
       if row.googleEventId == null:
           existing = gateway.findByPrivateProperty("itjobInterviewId", interviewId)   # tránh tạo trùng sau timeout ở lần trước
           ev = existing ?: gateway.createEvent(...)
       else:
           ev = gateway.patchEvent(row.googleEventId, ...)                      # 404/410 ⇒ createEvent lại
       row ← googleEventId, htmlLink, meetUrl, sync_status = SYNCED
       nếu ev.meetUrl != null && interview.meetingUrl == null ⇒ interview.meetingUrl = ev.meetUrl
    DELETE:
       if row.googleEventId != null: gateway.deleteEvent(...)                  # 404/410 ⇒ coi như đã xoá
       row.sync_status = DELETED
catch GoogleApiException e: classify(e)  → xem bảng dưới
```

**Phân loại lỗi Google** (`GoogleApiException.httpStatus` + `reason`):

| Lỗi | Hành động |
|---|---|
| `401` | Refresh access token 1 lần rồi thử lại; refresh trả `invalid_grant` → `connection.status=REVOKED`, `sync_status=NOT_CONNECTED`, **gửi notification cho HR** "Cần kết nối lại Google Calendar" |
| `403` `insufficientPermissions` / `forbidden` | `connection.status=ERROR`, `FAILED` (không retry), thông báo HR kết nối lại và cấp đủ quyền |
| `403` `rateLimitExceeded` / `userRateLimitExceeded`, `429` | `RETRY_WAIT`, backoff có jitter; tôn trọng `Retry-After` |
| `404`/`410` khi `patch` | Sự kiện bị xoá bên Google → tạo mới |
| `404`/`410` khi `delete` | Thành công (idempotent) |
| `400` (dữ liệu sai: email attendee lỗi…) | `FAILED`, ghi `last_error` — retry vô ích |
| `5xx`, timeout, `IOException` | `RETRY_WAIT` |

**Retry**: tối đa 5 lần, delay `1m → 5m → 15m → 1h → 6h`; sau đó `FAILED`. `CalendarSyncRetryJob` `@Scheduled(fixedDelay=60s)` + `@SchedulerLock("calendar-sync-retry")` claim cả `PENDING`, `RETRY_WAIT` đến hạn và phục hồi `PROCESSING` quá timeout. HR bấm "Đồng bộ lại" ⇒ `POST /interviews/{id}/calendar/resync` đặt `syncAction` theo trạng thái interview, `PENDING`, `attempt_count=0`.

Signal `AFTER_COMMIT + @Async` chỉ gọi processor sớm; nếu signal mất, retry job vẫn thấy row. Không gọi Google trong transaction schedule/reschedule/cancel và không tạo row calendar lần đầu ở listener.

**Nội dung sự kiện** (`EventSpec` → body `events.insert`):

```jsonc
{
  "summary": "Phỏng vấn Backend Java Developer — Nguyễn Văn A (Vòng 1)",
  "description": "Công ty ABC phỏng vấn vị trí ...\nXem chi tiết: https://<FE>/job/12/mycv",
  "location": "Tầng 5, 123 Nguyễn Huệ, Q1",                  // chỉ khi ONSITE
  "start": { "dateTime": "2026-10-10T09:00:00+07:00", "timeZone": "Asia/Ho_Chi_Minh" },
  "end":   { "dateTime": "2026-10-10T10:00:00+07:00", "timeZone": "Asia/Ho_Chi_Minh" },
  "attendees": [
    { "email": "candidate@mail.com", "displayName": "Nguyễn Văn A" },
    { "email": "tech.lead@abc.com",  "displayName": "Trần B" }
  ],
  "reminders": { "useDefault": false, "overrides": [
      { "method": "popup", "minutes": 60 }, { "method": "email", "minutes": 1440 } ] },
  "conferenceData": { "createRequest": { "requestId": "<uuid>",
      "conferenceSolutionKey": { "type": "hangoutsMeet" } } },        // chỉ khi mode=ONLINE & generateMeetLink
  "extendedProperties": { "private": { "itjobInterviewId": "123" } },  // khoá idempotency
  "guestsCanModify": false, "guestsCanInviteOthers": false
}
```
Query: `?sendUpdates=all&conferenceDataVersion=1`. `calendarId=primary`.

> Email ứng viên lấy từ `CV.email` (email ứng viên chủ động nhập khi ứng tuyển), **không** lấy từ `Account.email` nếu khác nhau — ưu tiên email ứng viên muốn dùng nhận lời mời. Validate định dạng email attendee trước khi gọi Google.

### 3.6 `.ics` — cho ứng viên không dùng Google

`IcsService.build(interview)` dựng iCalendar (RFC 5545): `METHOD:REQUEST`, `UID:interview-{id}@itjob`, `SEQUENCE` = `interview.version` (tăng khi đổi lịch để client cập nhật thay vì tạo trùng), `DTSTART/DTEND` ở **UTC** (`...Z`), `SUMMARY`, `LOCATION`/`URL`, `ORGANIZER`, `ATTENDEE`, `VALARM` (-PT60M). Escape `, ; \ \n` đúng chuẩn; gập dòng ≤ 75 octet.
- Đính kèm vào email `interview-invitation` / `interview-reschedule` (`text/calendar; method=REQUEST`); huỷ → `METHOD:CANCEL` cùng `UID`.
- Tải trực tiếp: `GET /interviews/{id}/ics` (§3.8).

### 3.7 Google OAuth2 — luồng kết nối của HR

Dùng luồng **authorization code + PKCE**, **tự cài** (không dùng `spring-security-oauth2-client` vì app dùng JWT stateless riêng — không có login qua Google, chỉ *liên kết* tài khoản đã đăng nhập).

**Cấu hình Google Cloud Console** (làm 1 lần, ngoài code):
1. Bật *Google Calendar API*. Tạo OAuth client type **Web application**.
2. *Authorized redirect URIs* = đúng giá trị `app.google.redirect-uri` (khớp từng ký tự).
3. OAuth consent screen: scope `calendar.events` (**không** xin `calendar` full), `openid`, `email`.
4. ⚠️ **App ở trạng thái "Testing": tối đa 100 test user và *refresh token hết hạn sau 7 ngày***. Production phải chuyển "In production" + qua verification (scope nhạy cảm). Trong lúc chờ, coi "refresh token chết" là chuyện thường (đã có luồng `invalid_grant` ở §3.5).

```
(1) FE: POST /integrations/google/connect  {returnPath}               (ROLE_COMPANY, có JWT)
(2) BE: state = random 32B ; verifier = random ; challenge = BASE64URL(SHA256(verifier)); nonce = random 32B
        lưu oauth_states{hash(state), account_id, code_verifier, hash(nonce), return_path whitelist, expires_at=now+10m}
        trả { authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id=…&redirect_uri=…
              &response_type=code&scope=…&access_type=offline&prompt=consent&include_granted_scopes=true
              &state=<state>&nonce=<nonce>&code_challenge=<challenge>&code_challenge_method=S256" }
(3) FE: window.location.href = authorizationUrl
(4) Google → trình duyệt → GET {redirect-uri}?code=…&state=…        ← KHÔNG có header Authorization
(5) BE GoogleIntegrationController.callback (public):
        - có ?error=access_denied ⇒ redirect FE ?google=denied
        - atomic claim: UPDATE oauth_states SET used_at=now WHERE state_hash=? AND used_at IS NULL AND expires_at>now RETURNING ...
          không trả row ⇒ state sai/hết hạn/replay; đây là cách duy nhất biết account vì callback không có JWT
        - POST https://oauth2.googleapis.com/token {code, client_id, client_secret, redirect_uri, grant_type, code_verifier}
        - kiểm granted scope có calendar.events (người dùng có thể bỏ tick) ⇒ thiếu: redirect ?google=insufficient_scope
        - xác minh id_token: chữ ký Google/JWKS, issuer, audience=client_id, exp và hash(nonce); sau đó mới đọc email
        - refresh_token có ⇒ mã hoá & upsert google_calendar_connections(ACTIVE)
          (không có refresh_token ⇒ dùng lại cái cũ nếu còn; nếu không ⇒ ?google=no_refresh_token)
        - redirect FE: {FRONTEND_URL}{return_path}?google=connected
(6) Sau khi kết nối: tìm các interview tương lai chưa sync của company → đưa vào hàng đợi sync (PENDING)
```

Các điểm bắt buộc:
- `GET /integrations/google/callback` phải `permitAll()`; GET không cần CSRF exemption. Bảo vệ thực sự = state claim một lần + PKCE S256 + OIDC nonce/ID-token validation.
- `return_path` chỉ chấp nhận giá trị ∈ `app.google.allowed-return-paths` (chống **open redirect**). Không bao giờ redirect tới URL do client truyền thẳng.
- `getValidAccessToken`: nếu `access_token_expires_at < now+60s` → khoá dòng connection bằng `SELECT … FOR UPDATE`, kiểm tra expiry lần hai rồi mới refresh. Không dùng lock in-memory vì không bảo vệ nhiều instance.
- `DELETE /integrations/google`: gọi `POST https://oauth2.googleapis.com/revoke?token=<refresh>` (lỗi revoke chỉ log, vẫn xoá dòng DB), **không** xoá sự kiện đã tạo trên Google (chỉ xoá `google_calendar_connections`, các `interview_calendar_events` chuyển `NOT_CONNECTED`).
- Mã hoá: `GoogleTokenCrypto` AES-256-GCM, IV ngẫu nhiên 12B ghép trước ciphertext, key từ `app.google.token-encryption-key`; thiếu key khi `google.enabled=true` → **fail-fast lúc khởi động**.
- **Không log** `code`, `state`, `access_token`, `refresh_token`, `client_secret`.

### 3.8 API Contract

Mọi response bọc `ApiResponse<T>`. Role dùng đúng `hasRole('COMPANY')` / `hasRole('USER')` như `CVController`. Thời điểm ISO-8601 có offset (`2026-10-10T09:00:00+07:00`) hoặc `Z`.

#### Company

| Method & Endpoint | Request | Response `data` |
|---|---|---|
| `POST /jobs/{jobId}/cvs/accounts/{candidateId}/interviews` | `ScheduleInterviewRequest` | **201** `InterviewResponse` |
| `PUT /interviews/{id}` | `RescheduleInterviewRequest` (kèm `version`) | `InterviewResponse` |
| `POST /interviews/{id}/cancel` | `{ "reason": "..." }` | `InterviewResponse` |
| `PATCH /interviews/{id}/outcome` | `{ "outcome": "COMPLETED" \| "NO_SHOW" }` | `InterviewResponse` |
| `GET /interviews/company?from=&to=&status=` | query | `List<InterviewResponse>` (mặc định: 30 ngày tới; `to-from` ≤ 92 ngày) |
| `GET /jobs/{jobId}/interviews` | — | `List<InterviewResponse>` (job phải thuộc company) |
| `POST /interviews/{id}/calendar/resync` | — | `InterviewResponse` (`calendar.status=PENDING`) |

#### Candidate

| Method & Endpoint | Request | Response |
|---|---|---|
| `GET /interviews/me?from=&to=&status=` | query | `List<InterviewResponse>` (lịch của mình, `from` mặc định = hôm nay) |
| `POST /interviews/{id}/respond` | `RespondInterviewRequest` | `InterviewResponse` |

#### Dùng chung (cả 2 bên — kiểm là người liên quan)

| Method & Endpoint | Response |
|---|---|
| `GET /interviews/{id}` | `InterviewResponse` (không phải bên liên quan → **404**) |
| `GET /interviews/{id}/ics` | `200 text/calendar; charset=utf-8`, `Content-Disposition: attachment; filename="interview-{id}.ics"` — **không** bọc `ApiResponse` (là file) |

#### Google integration (`ROLE_COMPANY`, trừ callback)

| Method & Endpoint | Request | Response |
|---|---|---|
| `GET /integrations/google/status` | — | `{ enabled, connected, googleEmail, status, connectedAt }` |
| `POST /integrations/google/connect` | `{ "returnPath": "/dashboard/settings/integrations" }` | `{ "authorizationUrl": "..." }` |
| `GET /integrations/google/callback?code=&state=` | public | `302` redirect FE |
| `DELETE /integrations/google` | — | `null` + "Đã ngắt kết nối Google Calendar" |

#### DTO & Validation

```java
public record ScheduleInterviewRequest(
    @Size(max = 200) String title,                                   // mặc định: "Phỏng vấn {jobName} — {candidateName}"
    @NotNull @Future Instant startAt,
    @NotNull @Min(15) @Max(480) Integer durationMinutes,
    @NotBlank @Size(max = 64) String timezone,                       // phải là ZoneId hợp lệ → sai: BadRequestException
    @NotNull InterviewMode mode,
    @Size(max = 500) @Pattern(regexp = "^https://.+") String meetingUrl,   // ONLINE: bắt buộc nếu !generateMeetLink
    @Size(max = 500) String locationAddress,                         // ONSITE: bắt buộc
    boolean generateMeetLink,                                       // mặc định false; chỉ hợp lệ khi mode=ONLINE và Google đã kết nối
    @Size(max = 2000) String note,
    @Size(max = 10) List<@Valid InterviewerInput> interviewers,
    Boolean syncGoogleCalendar                                       // null từ client cũ ⇒ service mặc định true
) {}

public record InterviewerInput(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Email @Size(max = 255) String email,
    @Size(max = 120) String position) {}

public record RescheduleInterviewRequest(
    @NotNull Long version,                       // optimistic locking
    @NotNull @Future Instant startAt, @NotNull @Min(15) @Max(480) Integer durationMinutes,
    @NotBlank String timezone, InterviewMode mode, String meetingUrl, String locationAddress,
    @Size(max = 2000) String note, @Size(max = 10) List<@Valid InterviewerInput> interviewers) {}

public record RespondInterviewRequest(
    @NotNull CandidateResponse response,         // PENDING → 400
    @Size(max = 1000) String note) {}            // bắt buộc (≥ 5 ký tự) khi DECLINED / RESCHEDULE_REQUESTED

public record InterviewResponse(
    Long id, Long jobId, String jobName, Long candidateAccountId, String candidateName,
    Long companyAccountId, String companyName, int roundNumber, String title,
    Instant startAt, Instant endAt, String timezone, InterviewMode mode,
    String meetingUrl, String locationAddress, String note,
    InterviewStatus status, CandidateResponse candidateResponse, String candidateResponseNote, String cancelReason,
    List<InterviewerResponse> interviewers,
    CalendarInfo calendar,                       // chỉ trả đầy đủ cho company; candidate chỉ thấy htmlLink nếu có
    List<String> warnings,                       // ví dụ ["Người phỏng vấn có thể trùng lịch khác"]
    Long version, Instant createdAt) {}

public record CalendarInfo(CalendarSyncStatus status, String htmlLink, String meetUrl, String lastError, Instant syncedAt) {}
```

**Quy tắc ánh xạ lỗi:** không phải chủ job → `AccessDeniedException` (403); không thấy CV/lịch hoặc không phải bên liên quan → `ResourceNotFoundException` (404); sai trạng thái, trùng giờ, `version` lệch, Google chưa bật → `BusinessException` (409); `timezone` không hợp lệ, `generateMeetLink` mà mode ≠ ONLINE → `BadRequestException` (400).

**N+1:** `toDTOList` batch-load `Job`, candidate/company `Account` bằng `findAllById` → `Map<Long, …>` (tham khảo `CVServiceImpl.toDTOList`); không gọi repository trong vòng lặp.

### 3.9 Scheduler nhắc lịch

```java
@Scheduled(cron = "0 * * * * *", zone = "Asia/Ho_Chi_Minh")          // mỗi phút
@SchedulerLock(name = "interview-reminder", lockAtMostFor = "PT5M", lockAtLeastFor = "PT20S")
public void sendReminders() {
    Instant now = Instant.now();
    for (ReminderWindow w : List.of(H24, H1)) {
        // lịch có start_at ∈ (now, now + offset] và chưa nhắc mốc này (cửa sổ rộng để chịu được downtime ngắn)
        List<Interview> due = interviewRepository.findDueForReminder(w, now);
        for (Interview i : due) {
            reminderService.claimAndEnqueue(i.getId(), i.getVersion(), w, now);
            // @Transactional REQUIRES_NEW: conditional UPDATE reminder flag + INSERT outbox cùng transaction
        }
    }
}
```
- `claimAndEnqueue` chỉ ghi event khi conditional UPDATE trả `1`; dedupe key cố định `interview-reminder:{interviewId}:{version}:{window}`. Nếu outbox insert lỗi thì reminder flag rollback để kỳ sau thử lại.
- Lịch tạo **sau** mốc (ví dụ đặt lúc còn 3 giờ) → bỏ qua mốc 24h; **không** gửi bù mốc đã trôi qua (`start_at > now + offset` mới thuộc cửa sổ của mốc đó, và mốc đã quá hạn bị đánh dấu đã gửi lúc tạo để tránh bắn nhắc ngay).
- Nhắc lịch gửi cho **cả** ứng viên và company (IN_APP + EMAIL theo preference Phase 1).
- Dọn `oauth_states` quá hạn: `@Scheduled(cron = "0 0 3 * * *")` + ShedLock.
- Retention: `interview_calendar_events` đã `DELETED` và interview `CANCELLED/COMPLETED/NO_SHOW` quá 365 ngày được purge bởi job riêng (ShedLock `interview-retention`), chỉ khi mọi calendar row đã `DELETED`.

### 3.10 Ảnh hưởng tới code hiện có

| File | Thay đổi |
|---|---|
| `enums/CVStatus.java` | Thêm `INTERVIEW_SCHEDULED`, `INTERVIEW_DONE`, `OFFERED`, `WITHDRAWN` |
| `services/CVService` / `CVServiceImpl` | `updateCVStatus` nhận `UpdateCvStatusCommand`; `deleteCV` chuyển thành withdraw mềm và huỷ lịch active |
| `SecurityConfig` | `permitAll` cho `GET /integrations/google/callback`; không cần CSRF exemption cho GET |
| `application.properties` | Khối `app.google.*`, `app.interview.*` |
| FE `CVResponse` / `renderStatusLabel` | Thêm nhãn "Đã lên lịch phỏng vấn" |

---

## 4. 🖥 Frontend Integration Specs

Dùng sẵn: `@radix-ui/react-dialog`, `react-day-picker`, `date-fns`, `lucide-react`, `framer-motion`, axios `api`. Không cần thêm thư viện lịch ở v1 (danh sách theo ngày/tuần là đủ); nếu muốn lưới lịch tháng thì dùng `react-day-picker` đã có, không kéo `fullcalendar`.

### 4.1 Cấu trúc file

```
src/
├── types.ts                                   # Interview*, Calendar*, enum
├── services/interviewService.ts               # REST (mẫu jobEngagementService.ts)
├── services/googleIntegrationService.ts
├── hooks/useInterviews.ts, useGoogleCalendar.ts
├── components/interview/
│   ├── ScheduleInterviewDialog.tsx            # form đặt/đổi lịch (company)
│   ├── InterviewCard.tsx                      # thẻ lịch (dùng cả 2 phía)
│   ├── InterviewStatusBadge.tsx
│   ├── CandidateResponseActions.tsx           # Chấp nhận / Từ chối / Đề nghị đổi giờ
│   ├── RescheduleRequestDialog.tsx
│   ├── CancelInterviewDialog.tsx
│   ├── AddToCalendarMenu.tsx                  # Google link + tải .ics
│   └── GoogleCalendarConnectCard.tsx
└── pages/dashboard/
    ├── company/interviews/page.tsx            # lịch của company
    ├── interviews/page.tsx                    # lịch của ứng viên
    └── settings/integrations/page.tsx         # kết nối Google
```
Route đăng ký trong `routes.ts` dưới `/dashboard`; thêm mục sidebar theo role (company: "Lịch phỏng vấn"; candidate: "Lịch phỏng vấn của tôi").

### 4.2 Company — đặt & quản lý lịch

**Điểm vào:** trang chi tiết CV của company (`pages/dashboard/company/cv/detail`): nút **"Lên lịch phỏng vấn"** — chỉ hiện khi `cv.status ∈ {APPROVED, INTERVIEW_SCHEDULED}`; disable + tooltip "Duyệt CV trước khi lên lịch" khi `PENDING`; ẩn khi `REJECTED`. Bên dưới là danh sách lịch của CV đó (`GET /jobs/{jobId}/interviews` lọc theo ứng viên).

**`ScheduleInterviewDialog`** (Radix Dialog, tái dùng cho "Đổi lịch" — truyền `interview` để prefill + `version`):

```
┌ Lên lịch phỏng vấn — Nguyễn Văn A · Backend Java Developer ──────────────┐
│ Tiêu đề        [Phỏng vấn kỹ thuật vòng 1                          ]    │
│ Ngày           [📅 10/10/2026 ▾]   Giờ bắt đầu [09:00 ▾]  Thời lượng [60 phút ▾] │
│ Múi giờ        [Asia/Ho_Chi_Minh (GMT+7) ▾]  (mặc định = múi giờ trình duyệt)   │
│ Hình thức      (●) Online   ( ) Trực tiếp                                │
│   Online:      [https://meet… ]   ☐ Tạo link Google Meet tự động *        │
│   Trực tiếp:   [Địa chỉ phòng phỏng vấn                           ]     │
│ Người phỏng vấn  [+ Thêm]  Trần B · tech.lead@abc.com · Tech Lead  [x]   │
│ Ghi chú cho ứng viên [                                              ]    │
│ ☑ Đồng bộ lên Google Calendar của tôi                                    │
│                                          [Huỷ]  [Gửi lời mời]            │
└─────────────────────────────────────────────────────────────────────────┘
* chỉ bật được khi Google đã kết nối; nếu chưa: hiện link "Kết nối Google Calendar"
```

Validate phía FE (bắt buộc trùng quy tắc BE để lỗi hiện sớm, nhưng **BE là nguồn đúng**):
- Giờ bắt đầu ≥ hiện tại + 30 phút (so theo **múi giờ đã chọn**, không theo múi giờ máy); thời lượng 15–480.
- Online: URL `https://` hoặc tick Meet; Trực tiếp: địa chỉ bắt buộc.
- Email người phỏng vấn đúng định dạng, không trùng; tối đa 10.
- Ghép `startAt` từ (ngày, giờ, múi giờ) bằng `date-fns-tz`/`Temporal`-tương đương rồi gửi ISO có offset — **không** gửi chuỗi giờ local trần.
- Submit: disable nút + spinner; lỗi `409` hiển thị inline dưới form (ví dụ "Ứng viên đã có lịch khác trong khung giờ này"); `warnings[]` hiển thị banner vàng sau khi tạo thành công, không chặn.
- Đổi lịch: gửi kèm `version`; `409 "Lịch đã bị thay đổi"` → hiện nút "Tải lại".

**`/dashboard/company/interviews`**: bộ lọc (khoảng ngày, trạng thái, job); danh sách nhóm theo ngày (`Hôm nay`, `Ngày mai`, …); mỗi `InterviewCard` có menu: *Đổi lịch · Huỷ · Đánh dấu hoàn tất / Vắng mặt (sau giờ bắt đầu) · Đồng bộ lại Google*. Badge đồng bộ Google: ✅ Đã đồng bộ (link mở sự kiện) / ⏳ Đang đồng bộ / ⚠ Lỗi — [Thử lại] / ⛓ Chưa kết nối.

### 4.3 Candidate — xem & phản hồi

- Nhận thông báo (chuông Phase 1) loại `INTERVIEW_SCHEDULED` → click mở `/dashboard/interviews?focus={id}`.
- `/dashboard/interviews`: tab *Sắp tới / Đã qua*. `InterviewCard` hiển thị công ty, vị trí, vòng, thời gian **theo múi giờ của lịch** kèm "(giờ của bạn: …)" nếu khác múi giờ máy, hình thức, link/địa chỉ, người phỏng vấn, ghi chú, trạng thái phản hồi.
- `CandidateResponseActions` (chỉ khi `status ∈ {SCHEDULED, CONFIRMED}` và chưa diễn ra):
  - **Chấp nhận** → `POST respond {ACCEPTED}` ngay.
  - **Từ chối** / **Đề nghị đổi giờ** → mở `RescheduleRequestDialog` bắt buộc nhập lý do (≥ 5 ký tự).
  - Hiện trạng thái hiện tại ("Bạn đã chấp nhận lúc …"), cho phép đổi ý khi chưa diễn ra.
- `AddToCalendarMenu`: **Thêm vào Google Calendar** (link `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=YYYYMMDDTHHmmssZ/…&details=…&location=…` — UTC; `encodeURIComponent` toàn bộ), **Tải .ics** (`GET /interviews/{id}/ics`, dùng `api.get(..., {responseType:'blob'})` vì cần header JWT, không dùng thẻ `<a href>` trần), ẩn nếu `CANCELLED`.
  - Nếu Google đã gửi lời mời vào lịch thật của ứng viên thì link "Thêm vào Google Calendar" có thể tạo bản trùng → khi `calendar.htmlLink` có giá trị hiển thị "Đã có lời mời trong Google Calendar của bạn" thay vì nút thêm.

### 4.4 Kết nối Google — `/dashboard/settings/integrations`

`GoogleCalendarConnectCard`, 4 trạng thái từ `GET /integrations/google/status`:

| Trạng thái | UI |
|---|---|
| `enabled=false` | Ẩn card (hoặc "Tính năng chưa bật") |
| Chưa kết nối | Mô tả quyền xin (chỉ tạo/sửa sự kiện), nút **Kết nối Google Calendar** → `POST connect` → `window.location.href = authorizationUrl` |
| `ACTIVE` | "Đã kết nối `abc@gmail.com`", nút **Ngắt kết nối** (xác nhận) |
| `REVOKED`/`ERROR` | Banner cảnh báo "Kết nối Google hết hiệu lực" + nút **Kết nối lại** |

Xử lý redirect về: đọc `?google=connected|denied|insufficient_scope|no_refresh_token` → toast tương ứng rồi **xoá query khỏi URL** (`navigate(..., {replace:true})`). `insufficient_scope` ⇒ giải thích "cần tick quyền quản lý sự kiện".

### 4.5 Notification liên quan (dùng hạ tầng Phase 1)

| `NotificationType` | Ai nhận | `linkUrl` |
|---|---|---|
| `INTERVIEW_SCHEDULED` / `RESCHEDULED` / `CANCELLED` / `REMINDER` | Ứng viên | `/dashboard/interviews?focus={id}` |
| Phản hồi của ứng viên (`INTERVIEW_RESPONSE`*) | Company | `/dashboard/company/interviews?focus={id}` |
| "Cần kết nối lại Google" | Company | `/dashboard/settings/integrations` |

`INTERVIEW_RESPONSE` và `INTEGRATION_ACTION_REQUIRED` đã được định nghĩa trong `NotificationType` ở Phase 1 (§2.2, ma trận §1.3).

### 4.6 Types (rút gọn)

```ts
export type InterviewStatus = 'SCHEDULED'|'CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';
export type InterviewMode = 'ONLINE'|'ONSITE';
export type CandidateResponse = 'PENDING'|'ACCEPTED'|'DECLINED'|'RESCHEDULE_REQUESTED';
export type CalendarSyncStatus = 'PENDING'|'PROCESSING'|'SYNCED'|'RETRY_WAIT'|'FAILED'|'NOT_CONNECTED'|'DELETED';
export type CvStatus = 'PENDING'|'APPROVED'|'REJECTED'|'INTERVIEW_SCHEDULED'|'INTERVIEW_DONE'|'OFFERED'|'WITHDRAWN';
export interface InterviewResponse { /* khớp record InterviewResponse ở §3.8; startAt/endAt: string ISO */ }
```

---

## 5. ✅ Acceptance Criteria & Test Checklist

### 5.1 Acceptance Criteria (Definition of Done)

- [ ] Company đặt lịch cho CV `APPROVED` → `201`; CV chuyển `INTERVIEW_SCHEDULED`; ứng viên nhận IN_APP + email có `.ics` đúng giờ/múi giờ.
- [ ] Nếu HR đã kết nối Google: trong ≤ 30 giây có sự kiện trên Google Calendar HR, ứng viên nhận lời mời Google (`sendUpdates=all`), có nhắc 60 phút & 24 giờ; `calendar.status=SYNCED`.
- [ ] HR **chưa** kết nối Google: đặt lịch vẫn thành công; `calendar.status=NOT_CONNECTED`; UI gợi ý kết nối; không lỗi 5xx.
- [ ] Đổi lịch → sự kiện Google **được sửa** (không tạo mới), email/`.ics` mới có `SEQUENCE` tăng, `candidate_response` về `PENDING`, mốc nhắc được reset.
- [ ] Huỷ lịch → sự kiện Google bị xoá, ứng viên nhận thông báo huỷ, CV về `APPROVED` nếu không còn lịch active.
- [ ] Ứng viên Chấp nhận/Từ chối/Đề nghị đổi giờ → HR nhận notification; `ACCEPTED` ⇒ `CONFIRMED`.
- [ ] Không thể đặt 2 lịch active chồng giờ cho cùng ứng viên, kể cả khi 2 request đồng thời.
- [ ] Nhắc lịch T-24h/T-1h gửi **đúng 1 lần** dù chạy nhiều instance.
- [ ] Process chết sau commit interview nhưng trước async listener không làm mất notification hoặc Calendar sync; task `PENDING` được recovery job xử lý.
- [ ] Candidate rút CV có lịch → CV `WITHDRAWN`, lịch `CANCELLED`, Google event được xoá bất đồng bộ; dữ liệu audit không bị cascade mất.
- [ ] Mọi API kiểm quyền: company khác không đọc/sửa được lịch; ứng viên khác không đọc được lịch.
- [ ] Token Google lưu mã hoá; không có secret/token trong log.
- [ ] Không test nào gọi Google/SMTP thật.

### 5.2 Happy path

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| H1 | Đặt lịch ONLINE, tick Meet, HR đã kết nối | Sự kiện có `conferenceData`; `interviews.meeting_url` được điền từ `meetUrl`; email mời tới ứng viên **sau khi** có link Meet (hoãn tới `SYNCED`, §3.3) |
| H2 | Đặt lịch ONSITE | `location` trong Google event + `.ics`; không có Meet |
| H3 | Ứng viên Chấp nhận | `status=CONFIRMED`, HR nhận notification |
| H4 | Đổi giờ từ 09:00 → 14:00 | Cùng `google_event_id`; `attempt_count` về 0; reminder cũ không bắn ở giờ cũ |
| H5 | Tải `.ics` | Mở được bằng Google/Apple/Outlook, `UID` ổn định giữa các lần |
| H6 | Kết nối Google lần đầu | `google_calendar_connections.status=ACTIVE`, refresh token **đã mã hoá** (đọc DB không thấy chuỗi `1//…`) |
| H7 | Sau khi kết nối, các lịch tương lai trước đó | Được đồng bộ bù (`NOT_CONNECTED → PENDING → SYNCED`) |

### 5.3 Edge cases & lỗi bên thứ ba

| # | Tình huống | Kỳ vọng |
|---|---|---|
| E1 | `startAt` trong quá khứ / < 30 phút nữa | 400 |
| E2 | CV `PENDING` hoặc `REJECTED` | 409, không tạo lịch |
| E3 | Company A đặt lịch cho job của B | 403 |
| E4 | Hai HR/hai tab đặt trùng giờ cùng ứng viên cùng lúc | 1 thành công, 1 nhận 409 (nhờ `EXCLUDE`), không có 500 |
| E5 | Trùng giờ phía người phỏng vấn | Tạo được, response có `warnings` |
| E6 | `PUT` với `version` cũ | 409 "Lịch đã bị thay đổi" |
| E7 | Cancel hai lần | Lần 2: 200, không phát event thứ hai |
| E8 | Ứng viên respond lịch đã qua / đã huỷ / của người khác | 409 / 409 / 404 |
| E9 | `RESCHEDULE_REQUESTED` không kèm note | 400 |
| E10 | Google trả 5xx / timeout khi `insert` | `RETRY_WAIT`; **lịch nghiệp vụ vẫn tồn tại**; retry 1m→5m→15m→1h→6h rồi `FAILED`; nút "Đồng bộ lại" hoạt động |
| E11 | Timeout **sau khi Google đã tạo event** (response mất) rồi retry | Dò bằng `privateExtendedProperty` → **không tạo bản sao** |
| E12 | Google `401` (access token hết hạn) | Tự refresh 1 lần, thử lại, thành công |
| E13 | `invalid_grant` khi refresh (user thu hồi quyền / app Testing hết 7 ngày) | `connection.status=REVOKED`; sync → `NOT_CONNECTED`; HR nhận notification "kết nối lại"; không retry vô hạn |
| E14 | Google `403 rateLimitExceeded` | Backoff + jitter, không `FAILED` ngay |
| E15 | `patch` sự kiện đã bị xoá thủ công trên Google (404/410) | Tạo lại sự kiện, cập nhật `google_event_id` |
| E16 | `delete` sự kiện không còn (404/410) | Coi là thành công, `DELETED` |
| E17 | Email ứng viên không phải Google | Vẫn nhận lời mời email thường + `.ics`; không lỗi |
| E18 | Email attendee sai định dạng | Chặn ở validate; nếu Google vẫn trả 400 → `FAILED` có `last_error` rõ |
| E19 | OAuth: `state` sai / đã dùng / quá hạn / hai callback replay đồng thời | Atomic claim cho đúng một callback; callback còn lại bị từ chối, không lưu token |
| E19b | `id_token` sai signature/issuer/audience/expiry/nonce | Từ chối kết nối, không lưu email hoặc token |
| E20 | OAuth: người dùng bấm "Từ chối" (`error=access_denied`) | Redirect `?google=denied`, không lỗi 500 |
| E21 | OAuth: bỏ tick quyền Calendar | `?google=insufficient_scope`, không lưu |
| E22 | OAuth: Google không trả `refresh_token` (đã cấp trước đó) | Dùng lại token cũ nếu còn, nếu không ⇒ `?google=no_refresh_token` + hướng dẫn kết nối lại |
| E23 | `returnPath` ngoài whitelist (open redirect) | 400, không tạo `state` |
| E24 | 2 instance cùng refresh token một lúc | Chỉ 1 lời gọi `/token` nhờ row lock và double-check expiry |
| E25 | Rút CV (`DELETE /jobs/{id}/cvs`) khi có lịch | CV `WITHDRAWN`; lịch active `CANCELLED`; calendar row `DELETE/PENDING`; event Google được xoá rồi row chuyển `DELETED` |
| E26 | DST / múi giờ: đặt 09:00 `Asia/Ho_Chi_Minh`, ứng viên ở múi giờ khác | `start_at` lưu UTC đúng; UI hiển thị theo `timezone` của lịch + giờ địa phương |
| E27 | Reminder: đặt lịch còn 3 giờ nữa | Không bắn nhắc 24h; có nhắc 1h |
| E28 | Reminder: 2 instance cùng quét | Mỗi mốc đúng 1 lần (`claimReminder*` trả 1 chỉ ở 1 bên) |
| E29 | `app.google.enabled=false` | Không có lời gọi Google nào; API integration trả 409; luồng đặt lịch bình thường |
| E30 | `.ics` ký tự đặc biệt (`,` `;` xuống dòng) trong tên/ghi chú | Được escape, file hợp lệ |
| E31 | Process chết sau khi interview/calendar row commit nhưng trước signal async | Recovery claim calendar `PENDING`; không mất sync, không tạo duplicate Google event |
| E33 | `generateMeetLink=true` khi Google chưa kết nối / `REVOKED` | `409`, không tạo lịch |
| E34 | Xoá job / tài khoản company còn lịch active | `409`; còn lịch lịch sử ⇒ job chuyển `closed`; không có `500` do FK |
| E35 | Xoá tài khoản candidate có CV + lịch | CV `WITHDRAWN`, lịch `CANCELLED`, Google event bị xoá, tài khoản được anonymize, không `500` |
| E36 | Lịch `generateMeetLink=true`, sync chậm/Google lỗi quá `meet-wait-timeout-minutes` | Ứng viên nhận thông báo "link sẽ gửi sau"; khi có `meetUrl` nhận bản cập nhật có link; không bao giờ gửi mời ONLINE trống link mà không ghi chú |
| E32 | Candidate RSVP trong Google Calendar | Không tự đổi `candidate_response` trong IT_JOB; UI tiếp tục yêu cầu phản hồi trong ứng dụng |

> **E25 — quyết định:** không hard-delete CV đã có tiến trình tuyển dụng. `WITHDRAWN` giữ interview và calendar task để integration cleanup chạy được; purge vật lý chỉ thực hiện bởi retention/admin flow sau khi mọi calendar row đã `DELETED` hoặc hết thời hạn lưu trữ.

### 5.4 Test plan

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Unit | JUnit5 + Mockito | `InterviewServiceImpl`, soft withdraw, `CalendarSyncService`, OAuth state/PKCE/nonce/ID-token checks, ICS, AES-GCM crypto |
| Repository | Testcontainers PostgreSQL | Flyway `V1→V5` + Hibernate `validate`; `btree_gist`/EXCLUDE; calendar claim/stale recovery; reminder flag + outbox atomicity |
| Integration | `@SpringBootTest` + WireMock | Google insert/patch/delete, crash-recovery task, 401→refresh, 429, 410, timeout, invalid OIDC token |
| Concurrency | `ExecutorService` + `CountDownLatch` | 2 request đặt trùng giờ; OAuth callback replay; refresh token ở 2 instance; 2 scheduler cùng quét |
| API | `MockMvc` | Contract `ApiResponse<T>`, 400/403/404/409, `/ics` content-type & không bọc `ApiResponse` |
| E2E thủ công | Google test user | Kết nối thật bằng tài khoản test; đặt/đổi/huỷ lịch; kiểm ứng viên (Gmail) nhận lời mời; để app ở Testing qua 7 ngày xem `invalid_grant` được xử lý |
| FE | Vitest + Testing Library | Form validate theo múi giờ, ẩn/hiện nút theo `cv.status`, xử lý `?google=` query, hiển thị `warnings` |

### 5.5 Thứ tự triển khai gợi ý

1. `CVStatus` + `V5` migration + entity/repository + Flyway/`EXCLUDE` test.
2. `InterviewService` (schedule/cancel/respond/reschedule/withdraw) + durable outbox event; FE đặt/xem/phản hồi lịch.
3. Template email + `.ics` + reminder claim/outbox atomicity.
4. `GoogleOAuthService` + PKCE/state/nonce/ID-token validation + crypto + FE card.
5. Durable calendar task/processor + `CalendarGateway` + retry/stale recovery + badge FE.
6. Bộ test edge case (E10–E16, E19–E24), kiểm thử thủ công với Google test user.

### 5.6 Rủi ro / lưu ý

- **Google OAuth ở chế độ Testing**: refresh token chết sau 7 ngày, giới hạn 100 user — lập kế hoạch verify app trước khi mở cho khách thật; luồng `invalid_grant` phải tốt từ ngày đầu.
- **Quyền riêng tư**: lời mời Google chứa tên/email ứng viên và người phỏng vấn; không đưa lương mong muốn, SĐT hay nội dung CV vào `description`.
- **`sendUpdates=all`** khiến Google gửi email thật tới ứng viên — môi trường dev/staging phải dùng `app.google.enabled=false` hoặc tài khoản test, tránh gửi lời mời tới người thật.
- **Hạn mức Calendar API** (mặc định ~ 1.000.000 req/ngày/project, 600 req/phút/user): dư thừa cho quy mô hiện tại, nhưng vẫn cần backoff cho `403 rateLimitExceeded`.
- **Đồng bộ một chiều**: RSVP của ứng viên trên Google **không** tự về hệ thống ở v1 — ứng viên phải phản hồi trên web (ghi rõ trong email: "Vui lòng xác nhận tại …"). Đồng bộ ngược cần `events.watch` + endpoint webhook công khai, để Phase sau.
