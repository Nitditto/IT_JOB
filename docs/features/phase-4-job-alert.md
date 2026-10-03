# Phase 4 — Job Alert (thông báo việc làm phù hợp)

> **Đối tượng đọc:** dev Backend (Spring Boot) và dev Frontend (React) triển khai độc lập.
>
> **Phụ thuộc:** [phase-1-notifications.md](phase-1-notifications.md) (event/notification/email/Telegram/WebSocket, bảng `shedlock`, `PageResponse<T>`). **Không** phụ thuộc Phase 2.
>
> ⚠️ **Phần "lưu bộ lọc" đã tồn tại trong repo** (commit `444da61 feat(backend): add job engagement APIs`, `3f8e113`...). Spec này **không** làm lại CRUD mà *mở rộng* nó. Đã có sẵn:
>
> | Thành phần | Vị trí | Trạng thái |
> |---|---|---|
> | Bảng `job_alerts`, `job_alert_tags` | `V3__add_job_engagement_features.sql` | ✅ có |
> | Entity `JobAlert` | `model/JobAlert.java` | ✅ có (thiếu `frequency`, mốc thời gian) |
> | CRUD `/job-alerts` + `GET /job-alerts/{id}/matches` (xem trước) | `JobAlertController`, `JobAlertServiceImpl` | ✅ có |
> | Hook/Service/Trang FE | `useJobAlerts.ts`, `jobEngagementService.ts`, `pages/dashboard/job-alerts/page.tsx`, `components/jobs/JobAlertForm.tsx` | ✅ có |
> | **Tự động tìm job mới + gửi thông báo** | — | ❌ **việc của phase này** |
> | Thiếu `jobs.published_at`, tần suất, chống gửi trùng, huỷ đăng ký 1 chạm | — | ❌ **việc của phase này** |

---

## 1. 🎯 Overview & Use Cases

### 1.1 Mục tiêu

Ứng viên lưu một hoặc nhiều **bộ lọc** (từ khoá, vị trí, lương, địa điểm, tag…). Hệ thống chạy nền theo lịch, tìm job **mới đăng** khớp bộ lọc, gom thành **một bản tin (digest)** cho mỗi alert và gửi qua kênh user đã chọn (Phase 1: IN_APP / EMAIL / TELEGRAM).

### 1.2 Luồng tổng quan

```
[Candidate] tạo/sửa alert  ──►  job_alerts (frequency, last_checked_at = now)
                                        │
 Company đăng job (status=published) ──► jobs.published_at = now()      (chỉ lần xuất bản đầu tiên)
                                        │
 @Scheduled (INSTANT 5' | DAILY 08:00 | WEEKLY T2 08:00), khoá ShedLock
   └─ JobAlertRunner.run(frequency)
        1. nạp job mới trong cửa sổ  [min(last_checked_at) − overlap, runStart]   (1 query, có EntityGraph)
        2. duyệt alert theo lô 500 (keyset theo id)
             a. JobAlertMatcher.matches(alert, job)  — thuần bộ nhớ, KHÔNG query theo alert
             b. loại job ứng viên đã nộp CV (1 query / lô)
             c. INSERT job_alert_matches ... ON CONFLICT DO NOTHING RETURNING job_id   → chỉ giữ job THỰC SỰ mới
        3. mỗi alert còn ≥ 1 job mới: tạo 1 Notification(JOB_ALERT) — cùng transaction với bước (c)
        4. cập nhật alert.last_checked_at = runStart, last_notified_at
   └─ sau commit ► DeliveryDispatcher (Phase 1) gửi IN_APP/EMAIL/TELEGRAM
```

### 1.3 Điều kiện kích hoạt (trigger)

| Trigger | Điều kiện | Kết quả |
|---|---|---|
| Cron `INSTANT` | mỗi 5 phút, alert `active=true`, `frequency=INSTANT` | Digest nếu có job mới khớp |
| Cron `DAILY` | 08:00 `Asia/Ho_Chi_Minh` hằng ngày | idem |
| Cron `WEEKLY` | 08:00 thứ Hai | idem |
| Job được xuất bản | `status = published` **lần đầu** (`published_at` đặt 1 lần) | Trở thành ứng viên cho kỳ chạy kế tiếp |
| Alert mới tạo | — | `last_checked_at = now()` ⇒ **không** gửi job cũ, chỉ job đăng sau thời điểm tạo |
| Admin kích hoạt thủ công | `POST /admin/job-alerts/run` (ROLE_ADMIN) | Chạy 1 vòng ngay (phục vụ test/vận hành) |

Một job được coi là "khớp & mới" khi **đồng thời**: `status=published`, (`deadline IS NULL` hoặc `deadline > now`), `published_at` nằm trong cửa sổ của alert, thoả mọi tiêu chí của alert (§3.4), ứng viên chưa nộp CV cho job đó, và cặp (alert, job) chưa từng được gửi.

### 1.4 Quyết định kiến trúc

**(a) `@Scheduled` + ShedLock, không dùng Quartz.**

| | `@Scheduled` + ShedLock **(chọn)** | Quartz |
|---|---|---|
| Hạ tầng | 1 bảng `shedlock` (đã tạo ở Phase 1) | ~11 bảng `QRTZ_*`, cấu hình cluster |
| Nhiều instance | Khoá theo tên job, 1 instance chạy | Cluster mode, tự quản |
| Lịch | Cố định theo cron (đủ cho 3 mức tần suất) | Lịch động từng user/từng alert |
| Phù hợp khi | Vài job định kỳ cố định | Cần lịch riêng cho từng bản ghi, misfire policy phức tạp |

Chuyển sang Quartz **chỉ khi** cần "mỗi user tự chọn giờ nhận". Khi đó giữ nguyên `JobAlertMatcher` và `JobAlertRunner`, chỉ đổi lớp kích hoạt.

**(b) Ghép "ngược" (job → alert), không truy vấn riêng cho từng alert.** Cách ngây thơ — gọi `JobSpecification` cho từng alert — là N query mỗi kỳ chạy (vi phạm "N+1" trong CLAUDE.md và không scale). Số job *mới* mỗi kỳ (K) nhỏ hơn rất nhiều số alert (N), nên: nạp K job **một lần**, duyệt N alert theo lô, so khớp trong bộ nhớ. Chi phí ≈ `O(K)` query + `O(N/500)` query lô + `O(N·K)` phép so khớp CPU thuần.

**(c) Watermark theo từng alert (`last_checked_at`), không dựa vào giờ chạy cron.** Hệ quả hay: server tắt lúc 08:00 thì lần chạy sau tự bù (cửa sổ kéo dài tới `last_checked_at`), không mất job. Đi kèm bảng chống trùng `job_alert_matches` để chạy lại/đè cửa sổ là **an toàn**.

**(d) 1 digest / alert / kỳ**, không gửi 1 thông báo / job (tránh spam). Danh sách job đầy đủ xem ở trang FE.

Nhiều alert cùng tài khoản có thể cùng chứa một job và tạo nhiều digest trong cùng kỳ. Đây là quyết định v1 để giữ tần suất, điều hướng và unsubscribe của từng alert rõ ràng; gom theo account để phase sau (§5.6).

**(e) Job "thoả thuận" không khai lương không khớp alert có lọc lương.** Giá trị lương chưa biết không được suy diễn là đạt mức tối thiểu/tối đa; Search, preview và scheduler phải giữ cùng hành vi.

**(f) Kênh gửi do preference tài khoản (Phase 1) quyết định**, loại `JOB_ALERT` — không thêm cấu hình kênh riêng cho từng alert ở v1 (giữ UX và schema đơn giản; mở rộng sau nếu có nhu cầu thật).

### 1.5 Ngoài phạm vi

Xếp hạng theo độ phù hợp bằng ML/embedding (xem [04-search-and-recommendation.md](04-search-and-recommendation.md)), giờ nhận riêng từng user, gom digest xuyên nhiều alert của cùng 1 user (xem Rủi ro §5.6), push trình duyệt.

---

## 2. 🗄 Database Design

Quy ước giống Phase 1/2 (PostgreSQL, `TIMESTAMP WITH TIME ZONE`, ID tới `Account` là raw `Long`).

### 2.1 Migration `V6__job_alert_matching.sql`

> Đánh số lại nếu thứ tự merge khác. Tên cột thật của bảng `jobs` ở `V1` là `created_at`, `companyid`, `location_abbreviation`.

```sql
-- ============ jobs: thời điểm xuất bản lần đầu ============
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Backfill: job đang published coi như xuất bản lúc tạo
UPDATE jobs SET published_at = COALESCE(created_at, now())
WHERE status = 'published' AND published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_published_at
    ON jobs (published_at) WHERE status = 'published';

-- ============ job_alerts: tần suất + watermark ============
ALTER TABLE job_alerts
    ADD COLUMN IF NOT EXISTS frequency        VARCHAR(10) NOT NULL DEFAULT 'DAILY',   -- INSTANT | DAILY | WEEKLY
    ADD COLUMN IF NOT EXISTS last_checked_at  TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS unsubscribe_version BIGINT NOT NULL DEFAULT 0;

-- QUAN TRỌNG: alert đang tồn tại KHÔNG được nhận dồn toàn bộ job cũ ở lần chạy đầu tiên
UPDATE job_alerts SET last_checked_at = now() WHERE last_checked_at IS NULL;
ALTER TABLE job_alerts
    ALTER COLUMN last_checked_at SET NOT NULL,
    ALTER COLUMN last_checked_at SET DEFAULT now();

-- quét theo lô (keyset) chỉ các alert đang bật
CREATE INDEX IF NOT EXISTS idx_job_alerts_active_freq
    ON job_alerts (frequency, id) WHERE active = TRUE;

-- ============ job_alert_matches: sổ chống gửi trùng + lịch sử "việc mới" ============
CREATE TABLE job_alert_matches (
    alert_id        BIGINT NOT NULL REFERENCES job_alerts(id) ON DELETE CASCADE,
    job_id          BIGINT NOT NULL REFERENCES jobs(id)       ON DELETE CASCADE,
    matched_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notification_id BIGINT REFERENCES notifications(id) ON DELETE SET NULL,
    PRIMARY KEY (alert_id, job_id)                              -- 1 cặp chỉ được gửi 1 lần, mãi mãi
);
CREATE INDEX idx_job_alert_matches_alert_time ON job_alert_matches (alert_id, matched_at DESC);
CREATE INDEX idx_job_alert_matches_job        ON job_alert_matches (job_id);

-- ============ job_alert_runs: nhật ký mỗi lần chạy (vận hành/debug) ============
CREATE SEQUENCE IF NOT EXISTS job_alert_runs_seq START WITH 1 INCREMENT BY 50;
CREATE TABLE job_alert_runs (
    id               BIGINT NOT NULL PRIMARY KEY,
    frequency        VARCHAR(10) NOT NULL,
    started_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at      TIMESTAMP WITH TIME ZONE,
    window_from      TIMESTAMP WITH TIME ZONE,
    window_to        TIMESTAMP WITH TIME ZONE,
    jobs_considered  INT NOT NULL DEFAULT 0,
    alerts_scanned   INT NOT NULL DEFAULT 0,
    alerts_notified  INT NOT NULL DEFAULT 0,
    alerts_failed    INT NOT NULL DEFAULT 0,
    status           VARCHAR(15) NOT NULL,                      -- RUNNING | OK | PARTIAL | FAILED | SKIPPED
    error            VARCHAR(500)
);
CREATE INDEX idx_job_alert_runs_started ON job_alert_runs (started_at DESC);
```

**Vì sao cần `jobs.published_at`:** `createdAt` không đủ — job tạo ở trạng thái `draft` rồi mấy ngày sau mới `published` sẽ có `createdAt` cũ, nằm ngoài mọi cửa sổ và **không bao giờ** được thông báo. `published_at` đặt đúng 1 lần ở lần chuyển sang `published` đầu tiên (xem §3.2); `paused → published` lại **không** đặt lại để tránh báo lại job cũ.

**Vì sao khoá chính `(alert_id, job_id)`:** đây là cơ chế idempotency thật sự. Dù watermark bị lùi, job bị sửa, cron chạy 2 lần hay admin bấm chạy thủ công, một cặp (alert, job) không bao giờ ra thông báo lần hai.

### 2.2 Enum & Entity

```java
public enum AlertFrequency { INSTANT, DAILY, WEEKLY }
```

Mở rộng `JobAlert` (giữ nguyên field cũ):

```java
@Enumerated(EnumType.STRING) @Column(nullable = false)
private AlertFrequency frequency = AlertFrequency.DAILY;

@Column(nullable = false)
private Instant lastCheckedAt;                     // @PrePersist: = now() nếu null

private Instant lastNotifiedAt;

@Column(nullable = false)
private Long unsubscribeVersion = 0L;               // tăng khi active false → true

// Bản sao CHỈ-ĐỌC của FK để scheduler lấy accountId mà không phải nạp Account.
// (JobAlert hiện dùng @ManyToOne Account — lệch Entity Design Rule #2 của CLAUDE.md; KHÔNG sửa trong phase này.)
@Column(name = "account_id", insertable = false, updatable = false)
private Long accountId;
```

Entity mới `JobAlertMatch` (`@EmbeddedId JobAlertMatchId(alertId, jobId)`, `matchedAt`, `notificationId`) — chỉ dùng cho truy vấn đọc; **ghi bằng native SQL** (xem §3.5).

`Job` thêm `private Instant publishedAt;`.

### 2.3 Repository — query bắt buộc

```java
public interface JobAlertRepository extends JpaRepository<JobAlert, Long> {
    // (đã có) @EntityGraph(account) findByAccountOrderByCreatedAtDesc(Account)
    long countByAccount(Account account);                                   // giới hạn 10 alert / tài khoản

    // Bước 1 của quét lô: chỉ lấy ID (tránh phân trang trên collection fetch)
    @Query("select a.id from JobAlert a where a.active = true and a.frequency = :frequency and a.id > :afterId order by a.id")
    List<Long> findActiveIdsAfter(AlertFrequency frequency, Long afterId, Pageable pageable);

    // Bước 2: nạp đủ dữ liệu cho các ID đó, kèm tags (1 query, không N+1)
    @Query("select distinct a from JobAlert a left join fetch a.tags where a.id in :ids")
    List<JobAlert> findAllWithTagsByIdIn(Collection<Long> ids);

    @Query("select min(a.lastCheckedAt) from JobAlert a where a.active = true and a.frequency = :frequency")
    Optional<Instant> findOldestCheckpoint(AlertFrequency frequency);
}

public interface JobRepository ... {
    // Bước 1: ID job mới (giới hạn cứng) ; Bước 2: findAllWithRelationsByIdIn có @EntityGraph({"location","tags"})
    // Dùng tham số enum, KHÔNG so sánh enum với chuỗi literal trong JPQL (Hibernate 6 có thể ném SemanticException)
    @Query("select j.id from Job j where j.status = :status and j.publishedAt > :from and j.publishedAt <= :to "
         + "and (j.deadline is null or j.deadline > :now) order by j.publishedAt")
    List<Long> findNewPublishedIds(JobStatus status, Instant from, Instant to, Instant now, Pageable limit);
}

public interface CVRepository ... {
    // Bước (b): ứng viên nào đã nộp job nào — 1 query cho cả lô
    @Query("select c.id.accountID, c.id.jobID from CV c where c.id.accountID in :accountIds and c.id.jobID in :jobIds")
    List<Object[]> findAppliedPairs(Collection<Long> accountIds, Collection<Long> jobIds);
}
```

---

## 3. ⚙️ Backend Implementation Specs

### 3.1 Cấu hình

```properties
# ===== Job Alert =====
app.job-alert.enabled=${JOB_ALERT_ENABLED:true}                 # kill switch
app.job-alert.max-alerts-per-account=10
app.job-alert.batch-size=500
app.job-alert.max-jobs-per-run=5000                             # chặn cứng; vượt → log WARN, kỳ sau xử lý tiếp phần còn lại
app.job-alert.max-notifications-per-run=20000                   # cầu chì chống bão thông báo do bug
app.job-alert.overlap-minutes=5                                 # lùi cửa sổ để bù độ trễ commit & lệch đồng hồ
app.job-alert.digest-top-jobs=5                                 # số job nêu tên trong nội dung thông báo
app.job-alert.digest-max-job-ids=20                             # số jobId nhét vào payload
app.job-alert.unsubscribe-secret=${JOB_ALERT_UNSUBSCRIBE_SECRET:}   # HMAC; thiếu khi enabled=true → fail-fast khi khởi động
spring.task.scheduling.pool.size=4                              # mặc định chỉ 1 thread: job-alert chạy lâu sẽ chặn cả retry job của Phase 1/2
```

Thêm bean `java.time.Clock` (`Clock.systemUTC()`) và **inject `Clock`** vào `JobAlertRunner`/`JobServiceImpl` thay vì gọi `Instant.now()` trực tiếp — để test điều khiển được thời gian.

### 3.2 Đặt `jobs.published_at`

Trong `JobServiceImpl` (đã có `createJob`, `editJob`):

```
createJob:  if (status == published) job.publishedAt = clock.instant()
editJob:    if (job.publishedAt == null && newStatus == published) job.publishedAt = clock.instant()
            // KHÔNG đặt lại khi paused/closed → published (tránh báo lại job cũ)
```
Giữ nguyên quy tắc CLAUDE.md: `JobRedis` là cache đọc; sau khi ghi JPA vẫn `jobRedisRepository.save(JobRedis.fromJpaEntity(saved))`. Nếu `JobRedis` serialize toàn bộ field thì thêm `publishedAt`, hoặc loại khỏi cache — **scheduler luôn đọc từ PostgreSQL qua `JobRepository`, không bao giờ đọc qua Redis** (cùng lý do với cảnh báo `getJobByID` vs `getCachedJobResponse` trong CLAUDE.md).

`JobCreationRequest` hiện gắn `@NotNull` cho cả `minSalary/maxSalary`, mâu thuẫn với `salaryNegotiable`. Thay bằng validation cấp class dùng chung cho create/edit:

- `salaryNegotiable=true`: cho phép cả hai mức lương null; nếu có nhập thì vẫn phải không âm và `max >= min`.
- `salaryNegotiable!=true`: bắt buộc cả hai mức lương và `max >= min`.
- Không tự điền `0` cho job thoả thuận vì sẽ làm sai Search/Alert.

### 3.3 Package structure

```
com.example.demo
├── jobalert/
│   ├── JobAlertMatcher.java            # thuần: matches(JobAlert, Job) — KHÔNG I/O, test được 100% bằng unit test
│   ├── JobAlertRunner.java             # điều phối 1 kỳ chạy (nạp job → quét lô → ghi)
│   ├── JobAlertBatchProcessor.java     # xử lý 1 lô trong từng transaction
│   ├── JobAlertScheduler.java          # chỉ @Scheduled, gọi coordinator (KHÔNG @SchedulerLock)
│   ├── JobAlertRunCoordinator.java     # nơi DUY NHẤT lấy ShedLock (LockingTaskExecutor); scheduler + admin dùng chung
│   ├── JobAlertDigestFactory.java      # (alert, danh sách job) → NotificationDraft
│   ├── JobAlertMatchJdbcRepository.java# INSERT ... ON CONFLICT DO NOTHING RETURNING
│   └── UnsubscribeTokenService.java    # HMAC ký/kiểm token huỷ đăng ký
├── controller/ JobAlertController (sửa), JobAlertAdminController (mới)
├── services/  JobAlertService (+ impl, sửa) ; JobAlertQueryService (mới — new-matches, mapping DTO; giữ ServiceImpl < 200 dòng)
├── enums/ AlertFrequency
└── dto/request, dto/response/ (sửa JobAlertRequest/Response)
```

### 3.4 Quy tắc ghép — `JobAlertMatcher`

Phải cho kết quả **y hệt** `JobSpecification.withFilters` mà endpoint xem trước (`GET /job-alerts/{id}/matches`) và trang Search đang dùng — nếu lệch, người dùng thấy "xem trước ra 12 việc nhưng không bao giờ nhận thông báo". `JobSpecification` được sửa để public Search/preview **luôn** áp visibility `status=published AND (deadline IS NULL OR deadline > clock.instant())`; không cho client public dùng filter `status` để xem draft/closed. Bảng dưới là hợp đồng:

| Tiêu chí alert | Điều kiện trên `Job` | Ghi chú / hành vi với giá trị null |
|---|---|---|
| (bỏ trống) | — | Tiêu chí `null`/rỗng ⇒ **không lọc** |
| `query` | chứa (không phân biệt hoa thường, substring) trong `name` **hoặc** `industry` **hoặc** `category` | **Không** tìm trong `description` |
| `location` | `job.location.abbreviation == location` | Job không có location ⇒ không khớp |
| `position`, `workstyle`, `employmentType` | bằng đúng enum | Job null ⇒ không khớp |
| `category`, `industry` | bằng, không phân biệt hoa thường | |
| `minSalary` | `job.maxSalary >= alert.minSalary` | **`job.maxSalary == null` ⇒ không khớp** (SQL `null >= x` là không đúng) |
| `maxSalary` | `job.minSalary <= alert.maxSalary` | **`job.minSalary == null` ⇒ không khớp** |
| `tags` | job có **ít nhất 1** tag trùng (OR), so khớp **phân biệt hoa thường** | |
| luôn áp dụng | `status == published`, `deadline == null \|\| deadline > now` | Search, preview và runner đều dùng cùng thời điểm từ `Clock` |

> Khoảng lương là **giao nhau** (`[job.min, job.max] ∩ [alert.min, alert.max] ≠ ∅`), không phải "nằm trong". Job "thoả thuận" không khai lương ⇒ **không khớp** bộ lọc có lương. Đây là quyết định sản phẩm v1; thay đổi sau này phải sửa đồng thời `JobSpecification`, matcher, preview và parity test.

**Chống lệch về sau:** đặt bộ test *parity* — cùng 1 tập job mẫu (≥ 30 job phủ mọi nhánh null) × ≥ 20 alert; kết quả `JobAlertMatcher` phải bằng kết quả `jobRepository.findAll(JobSpecification.withFilters(...))` trên PostgreSQL thật (Testcontainers). Test này fail khi ai đó sửa 1 bên mà quên bên kia.

### 3.5 Thuật toán `JobAlertRunner.run(frequency)`

```java
public RunResult run(final AlertFrequency frequency) {
    if (!props.isEnabled()) { return RunResult.skipped(); }
    final Instant runStart = clock.instant();
    final JobAlertRun runLog = runLogService.start(frequency, runStart);          // REQUIRES_NEW, để thấy kỳ chạy ngay cả khi crash

    final Optional<Instant> oldest = alertRepository.findOldestCheckpoint(frequency);
    if (oldest.isEmpty()) { return runLogService.finish(runLog, OK); }            // không có alert nào

    final Instant from = oldest.get().minus(props.getOverlap());
    final List<Job> newJobs = jobLoader.loadNewPublished(from, runStart, props.getMaxJobsPerRun());   // 2-step: ids → entity+graph
    // newJobs rỗng: vẫn phải nâng last_checked_at (xem dưới) để cửa sổ không phình mãi

    Long afterId = 0L;
    while (true) {
        final List<Long> ids = alertRepository.findActiveIdsAfter(frequency, afterId, PageRequest.ofSize(batchSize));
        if (ids.isEmpty()) { break; }
        afterId = ids.get(ids.size() - 1);
        this.batchProcessor.process(ids, newJobs, runStart, runLog);              // mỗi alert 1 transaction riêng, xem dưới
        if (runLog.getAlertsNotified() >= props.getMaxNotificationsPerRun()) { runLog.markPartial("breaker"); break; }
    }
    return runLogService.finish(runLog);
}
```

`JobAlertBatchProcessor.process(ids, newJobs, runStart)`:

```
alerts       = alertRepository.findAllWithTagsByIdIn(ids)                       # 1 query
applied      = Set<(accountId, jobId)> từ cvRepository.findAppliedPairs(accountIds, newJobIds)   # 1 query / lô
for alert in alerts:                                                            # vòng for, không Stream (CLAUDE.md: code nóng)
    try:  new TransactionTemplate(REQUIRES_NEW).execute(tx -> processOne(alert, newJobs, applied, runStart))
    catch RuntimeException e:  log.error(alertId, e) ; runLog.alertsFailed++ ; continue     # 1 alert lỗi KHÔNG làm hỏng cả lô,
                                                                                            # và last_checked_at KHÔNG được nâng ⇒ kỳ sau thử lại
processOne(alert, newJobs, applied, runStart):
    candidates = [ j in newJobs
                   if j.publishedAt > alert.lastCheckedAt - overlap
                   and !applied.contains(alert.accountId, j.id)
                   and matcher.matches(alert, j) ]
    fresh = candidates.isEmpty() ? [] : matchRepo.insertIgnoreReturning(alert.id, candidates.ids)   # chỉ job CHƯA từng gửi
    if fresh non-empty:
        draft = digestFactory.build(alert, fresh)                              # xem 3.6
        created = notificationService.create(List.of(draft)).get(0)             # THAM GIA transaction hiện tại (REQUIRED); trả CreatedNotification(notificationId, deliveryIds)
        matchRepo.attachNotification(alert.id, fresh.ids, created.notificationId())
        alert.lastNotifiedAt = runStart
    alert.lastCheckedAt = runStart                                              # luôn nâng khi xử lý thành công, kể cả 0 job
    alertRepository.save(alert)
```

Điểm bắt buộc:

1. **Atomic**: `INSERT job_alert_matches` + tạo `Notification` + cập nhật `last_checked_at` nằm **cùng 1 transaction**. Nếu tách, có thể "đánh dấu đã khớp mà chưa tạo thông báo" ⇒ mất thông báo vĩnh viễn (PK chặn gửi lại).
2. **Gửi ngoài transaction.** Dùng `NotificationService.create(draft)` đã định nghĩa ở Phase 1; method tham gia transaction hiện tại và tạo delivery `PENDING`. Signal `AFTER_COMMIT` chỉ đánh thức dispatcher, còn delivery recovery job bảo đảm signal mất không làm mất lượt gửi. **Không** gọi SMTP/HTTP trong transaction runner.
3. **Cửa sổ có chồng lấn (`overlap`)**: `published_at` được gán lúc ghi nhưng chỉ nhìn thấy sau commit; kỳ chạy rơi vào khoảng đó sẽ bỏ lỡ job nếu cửa sổ bắt đầu đúng tại `last_checked_at`. Lùi `overlap` 5 phút + sổ `job_alert_matches` ⇒ job nào đã gửi sẽ bị bỏ qua, job lỡ sẽ được bắt kỳ sau.
4. **Alert bị xoá/tắt giữa chừng**: `findAllWithTagsByIdIn` chỉ trả alert còn tồn tại; nếu alert bị xoá giữa lúc `INSERT` ⇒ vi phạm FK ⇒ bắt `DataIntegrityViolationException`, coi là bình thường (log `debug`), không tính là lỗi.
5. `insertIgnoreReturning` (native, `NamedParameterJdbcTemplate`):
   ```sql
   INSERT INTO job_alert_matches (alert_id, job_id, matched_at)
   SELECT :alertId, unnest(:jobIds::bigint[]), now()
   ON CONFLICT (alert_id, job_id) DO NOTHING
   RETURNING job_id
   ```
6. **Khi bị cắt bởi `max-jobs-per-run`** (có nhiều job mới hơn giới hạn): runner chỉ xử lý K job đầu (sắp theo `published_at`) và đặt `alert.lastCheckedAt = publishedAt` của job cuối đã xử lý thay vì `runStart`, để phần còn lại được xử lý ở kỳ sau — không bỏ sót.
7. **Không bao giờ query bên trong vòng lặp alert/job** (CLAUDE.md "N+1 Query Prevention"): mọi dữ liệu (alert+tags, job+location+tags, cặp đã nộp CV, tên công ty) đã được nạp theo lô trước vòng lặp.

### 3.6 Nội dung thông báo (digest)

`JobAlertDigestFactory` → `NotificationDraft` (Phase 1):

| Trường | Giá trị |
|---|---|
| `recipientAccountId` | `alert.accountId` |
| `type` | `JOB_ALERT` |
| `title` | `"{n} việc làm mới phù hợp với \"{alertName}\""` (cắt `alertName` ≤ 60 ký tự) |
| `body` | Tối đa 3 dòng: `"{jobName} — {companyName}"` + `"…và {n-3} việc khác"` nếu còn |
| `linkUrl` | `/dashboard/job-alerts?alert={alertId}` |
| `dedupeKey` | `"job-alert:{alertId}:{sha256(sortedFreshJobIds)}"` — ổn định theo đúng tập job mới, không phụ thuộc giờ chạy |
| `payload` | `{ alertId, alertName, total, jobs:[{id,name,companyName,location,salaryText}] (≤ top 5), jobIds:[…] (≤ 20), unsubscribeToken }` |

- `n` = số job **mới thực sự** (`fresh`), không phải tổng khớp.
- Hash dedupe tính từ toàn bộ `fresh job IDs` đã sort tăng dần trước khi giới hạn `jobIds` trong payload; không hash từ top 20 bị cắt.
- Sắp xếp job trong digest: `featured desc, urgent desc, publishedAt desc` (cùng thứ tự mặc định của Search).
- `companyName`: batch `userService.getUsersByIds(companyIds)` cho **toàn lô**, không gọi từng job.
- Email dùng template `job-alert-digest.html` (Phase 1 §3.5.2) — thêm header `List-Unsubscribe` (xem §3.9).
- `JOB_ALERT` thêm vào ma trận mặc định của Phase 1: **IN_APP ✅, EMAIL ✅** (người dùng đã chủ động tạo alert nên mặc định gửi email), TELEGRAM ⬜.

### 3.7 Scheduler

```java
@Component @RequiredArgsConstructor @Slf4j
public class JobAlertScheduler {
    private final JobAlertRunCoordinator coordinator;

    @Scheduled(fixedDelayString = "${app.job-alert.instant-interval-ms:300000}", initialDelay = 60_000)
    public void runInstant() { coordinator.runWithLock(AlertFrequency.INSTANT); }

    @Scheduled(cron = "${app.job-alert.daily-cron:0 0 8 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void runDaily() { coordinator.runWithLock(AlertFrequency.DAILY); }

    @Scheduled(cron = "${app.job-alert.weekly-cron:0 0 8 * * MON}", zone = "Asia/Ho_Chi_Minh")
    public void runWeekly() { coordinator.runWithLock(AlertFrequency.WEEKLY); }
}

@Component @RequiredArgsConstructor
public class JobAlertRunCoordinator {
    private final LockingTaskExecutor lockingExecutor;   // bean từ SchedulingConfig (Phase 1)
    private final JobAlertRunner runner;

    // lockAtMostFor: INSTANT PT10M, DAILY/WEEKLY PT30M; lockAtLeastFor: PT30S / PT1M
    public Optional<RunResult> runWithLock(final AlertFrequency frequency) { /* executeWithLock, name = "job-alert-" + frequency */ }
}
```

> ⚠️ **Không** gắn `@SchedulerLock` lên các method `@Scheduled` ở trên. ShedLock **không reentrant**: annotation đã giữ khoá `job-alert-daily`, rồi `runWithLock` xin lại đúng khoá đó ⇒ luôn thất bại và kỳ chạy bị bỏ qua êm. Khoá chỉ được lấy **một** nơi duy nhất là `JobAlertRunCoordinator` (dùng chung với endpoint admin).

- `fixedDelay` (không phải `fixedRate`): kỳ sau chỉ bắt đầu khi kỳ trước kết thúc ⇒ không chồng chéo trong 1 instance; ShedLock chặn chồng chéo giữa các instance.
- Scheduler và `POST /admin/job-alerts/run` đều đi qua `JobAlertRunCoordinator`/`LockingTaskExecutor` với cùng lock name theo frequency. Admin gọi khi lock đang giữ nhận `409`, không chạy vòng ngoài khoá.
- `lockAtMostFor` phải **lớn hơn** thời gian chạy xấu nhất; hết hạn khoá khi runner còn chạy ⇒ 2 instance cùng chạy. Dù vậy dữ liệu vẫn đúng nhờ khoá chính `job_alert_matches`.
- Chạy bù: nhờ watermark, lỡ giờ cron không mất job; **không** cần logic "catch-up khi khởi động".

### 3.8 API Contract

Mọi response bọc `ApiResponse<T>`. `/job-alerts/**` yêu cầu `hasRole('USER')` (đã có ở class-level `@PreAuthorize`).

#### Giữ nguyên (không đổi contract)

`GET /job-alerts` · `DELETE /job-alerts/{alertId}` · `GET /job-alerts/{alertId}/matches` (xem trước **toàn bộ job đang khớp**, không phải "mới").

#### Thay đổi

| Method & Endpoint | Thay đổi |
|---|---|
| `POST /job-alerts` | Request thêm `frequency`; áp các luật validate mới bên dưới; `201` |
| `PUT /job-alerts/{alertId}` | Request thêm `frequency`. **Đổi tiêu chí** ⇒ đặt `last_checked_at = now()` (không gửi dồn job cũ theo tiêu chí mới) |
| `GET /job-alerts`, `POST`, `PUT` (response) | `JobAlertResponse` thêm `frequency`, `lastNotifiedAt`, `newMatchesLast7Days` |

#### Mới

| Method & Endpoint | Role | Request | Response `data` |
|---|---|---|---|
| `GET /job-alerts/{alertId}/new-matches?page=0&size=20` | USER (chủ alert) | query; `size` clamp 1–50 | `PageResponse<JobCardResponse>` — job đã được gửi cho alert này, `matched_at DESC`. Không phải chủ ⇒ **404** |
| `POST /job-alerts/unsubscribe?token=…` | **public** (token là xác thực) | query `token`; chấp nhận form field `List-Unsubscribe=One-Click` cho mail provider | `null` + "Đã tắt thông báo việc làm này". Idempotent; token sai/hỏng/version cũ ⇒ `400` |
| `POST /admin/job-alerts/run?frequency=DAILY` | `hasRole('ADMIN')` | query | chạy đồng bộ qua cùng ShedLock; đang có run cùng frequency ⇒ `409`; nếu chạy được trả thống kê |
| `GET /admin/job-alerts/runs?limit=20` | ADMIN | — | danh sách `job_alert_runs` gần nhất |

> Thêm `POST /job-alerts/unsubscribe` vào `permitAll()` và `csrf.ignoringRequestMatchers` trong `SecurityConfig` (không có cookie/JWT; xác thực bằng token ký HMAC). `GET /job-alerts/{id}/new-matches` khai báo trước `/{alertId}` nếu trùng pattern; `unsubscribe` là literal nên không nhầm với `{alertId}` khi ràng buộc `{alertId:\\d+}`.

#### DTO

```java
// JobAlertRequest — THÊM (field cũ giữ nguyên)
AlertFrequency frequency;                              // optional cho client cũ; null ⇒ DAILY ở service

// JobAlertRequest — SIẾT validation (hiện chỉ có @NotBlank name)
@NotBlank @Size(max = 100) String name;
@Size(max = 255) String query;
@Size(max = 255) String location;                      // phải tồn tại trong bảng location (abbreviation) ⇒ BadRequestException
@Size(max = 255) String category, industry;
@Min(0) Long minSalary;  @Min(0) Long maxSalary;
@Size(max = 20) List<@NotBlank @Size(max = 50) String> tags;

// JobAlertResponse — THÊM (lưu ý class dùng @AllArgsConstructor theo vị trí: cập nhật toResponse() tương ứng)
AlertFrequency frequency; Instant lastNotifiedAt; long newMatchesLast7Days;
```

**Luật nghiệp vụ ngoài bean validation** (đặt trong `JobAlertServiceImpl`, ném exception chuẩn):

| Luật | Exception |
|---|---|
| `minSalary > maxSalary` (cả hai khác null) | `BadRequestException` 400 |
| Không có **tiêu chí nào** (query/location/category/industry/position/workstyle/employmentType/tags/lương đều trống) — alert "khớp tất cả" sẽ spam | `BadRequestException` 400 "Vui lòng chọn ít nhất 1 tiêu chí" |
| Tài khoản đã có ≥ 10 alert | `BusinessException` 409 |
| `location` không có trong bảng `location` | `BadRequestException` 400 |
| Alert của người khác | `AccessDeniedException` 403 (hành vi hiện có) |

**N+1:** `newMatchesLast7Days` của danh sách alert phải lấy bằng **1 query gộp** (`select alert_id, count(*) from job_alert_matches where alert_id in :ids and matched_at > :since group by alert_id`), không đếm từng alert. `new-matches` nạp job theo `findAllById` rồi `jobService.toCardList(...)` (đã batch).

### 3.9 Huỷ đăng ký 1 chạm (email)

Token = `base64url(alertId + "." + accountId + "." + unsubscribeVersion) + "." + base64url(HMAC-SHA256(secret, alertId.accountId.unsubscribeVersion.JOB_ALERT_UNSUB))`. Token không hết hạn trong cùng version, so khớp chữ ký bằng `MessageDigest.isEqual` và chỉ tác dụng với đúng alert/account/version.

- Tắt alert không đổi version; gọi unsubscribe nhiều lần vẫn `200`.
- Khi user chủ động bật lại (`active: false → true`), service tăng `unsubscribe_version` và đặt `last_checked_at=now()`. Link từ email cũ sau đó không thể vô tình tắt alert vừa bật lại.

Email `job-alert-digest.html` có:
- Nút/link "Huỷ nhận thông báo này" → **trang FE** `/job-alerts/unsubscribe?token=…` (trang xác nhận, *không* tự huỷ khi mở).
- Header `List-Unsubscribe: <https://{API}/job-alerts/unsubscribe?token=…>` và `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; mail provider gửi POST tới API.

API không cung cấp GET có side effect. Nút trong nội dung email mở trang FE xác nhận; bộ quét link chỉ tải trang này. Chỉ POST từ người dùng hoặc one-click mail provider mới thay đổi dữ liệu.

### 3.10 Quan sát & vận hành

Micrometer (actuator đã có): `jobalert.run.duration{frequency}`, `jobalert.jobs.considered`, `jobalert.alerts.scanned`, `jobalert.alerts.notified`, `jobalert.alerts.failed`. Log mỗi kỳ 1 dòng tổng kết: `frequency, window, jobs, scanned, notified, failed, durationMs`. Không log nội dung bộ lọc của user ở mức `INFO` (có thể là dữ liệu cá nhân — nghề nghiệp/địa điểm mong muốn).

**Retention:** `job_alert_runs` giữ 90 ngày; `job_alert_matches` giữ theo vòng đời alert (cascade). Job dọn chạy hằng ngày, dưới ShedLock `job-alert-retention`, xoá theo lô (≤ 1.000 dòng/lần) để không khoá bảng lâu.

Cảnh báo (khi có hệ thống alert): kỳ `INSTANT` không hoàn tất > 15 phút; `alerts_failed / alerts_scanned > 5%`; `status = FAILED`.

---

## 4. 🖥 Frontend Integration Specs

Hiện có: `JobAlertsPage` (form trái, danh sách phải, nút xem trước), `JobAlertForm`, `useJobAlerts`, `jobEngagementService`, `validateJobAlert`. Tận dụng và **mở rộng**, không viết lại.

### 4.1 Cấu trúc file (✏ sửa / ➕ mới)

```
src/
├── types.ts                                          ✏ JobAlertRequest/Response thêm frequency, lastNotifiedAt, newMatchesLast7Days; AlertFrequency
├── services/jobEngagementService.ts                  ✏ thêm getNewMatches(alertId,page,size), unsubscribeJobAlert(token)
├── hooks/useJobAlerts.ts                             ✏ validateJobAlert thêm luật; thêm loadNewMatches, state phân trang
├── components/jobs/JobAlertForm.tsx                  ✏ chọn tần suất, báo thiếu tiêu chí, gợi ý kênh nhận
├── components/jobs/JobAlertCard.tsx                  ➕ thẻ alert (tách khỏi page cho gọn)
├── components/jobs/JobAlertFrequencySelect.tsx       ➕
├── components/jobs/SaveSearchAsAlertButton.tsx       ➕ dùng ở trang Search
├── pages/dashboard/job-alerts/page.tsx               ✏ đọc ?alert=&new=1, tab "Việc mới" / "Đang khớp"
├── pages/search/page.tsx                             ✏ gắn SaveSearchAsAlertButton
└── pages/job-alerts/unsubscribe/page.tsx             ➕ trang công khai xác nhận huỷ (route ngoài /dashboard)
```
`routes.ts`: thêm `route("/job-alerts/unsubscribe", "./pages/job-alerts/unsubscribe/page.tsx")` — **công khai**, không bọc `ProtectedRoute`.

### 4.2 Component tree & UI flow

```
JobAlertsPage  (/dashboard/job-alerts[?alert=ID][&new=1&query=…])
├─ InlineNotice (toast)
├─ Cột trái:  JobAlertForm                                   ← tạo / sửa
└─ Cột phải:  danh sách JobAlertCard
      ├─ tên, tóm tắt tiêu chí (chip: 📍HN · 💰 ≥ 20tr · #java #spring)
      ├─ chip tần suất ("Hằng ngày 08:00"), "Lần gửi gần nhất: 2 giờ trước"
      ├─ badge "+3 việc mới (7 ngày)"  (từ newMatchesLast7Days)
      ├─ Switch Bật/Tắt  (PUT active)       ├─ Sửa · Xoá (confirm)
      └─ Tabs:  [Việc mới]  [Đang khớp]
            Việc mới   → GET /job-alerts/{id}/new-matches  (phân trang, nút "Tải thêm")
            Đang khớp  → GET /job-alerts/{id}/matches      (xem trước hiện có)
```

**`JobAlertForm`** (sửa):
- Thêm **Tần suất** (radio 3 lựa chọn): *Ngay khi có (gom mỗi ~5 phút)* · *Hằng ngày lúc 08:00* · *Hằng tuần, sáng thứ Hai 08:00*. Mặc định *Hằng ngày*.
- **Kênh nhận** hiển thị dạng thông tin (không phải input): "Bạn sẽ nhận qua: Trong ứng dụng, Email" lấy từ preference Phase 1 + link "Thay đổi trong Cài đặt thông báo". Nếu email đang tắt: nhắc nhẹ "Bạn chưa bật email — bạn sẽ chỉ thấy thông báo trong ứng dụng".
- Validate (`validateJobAlert`, hiện kiểm tên + lương) **thêm**:
  - Ít nhất 1 tiêu chí ⇒ lỗi tổng "Chọn ít nhất 1 tiêu chí (từ khoá, địa điểm, kỹ năng, lương…)".
  - `name` ≤ 100; tags ≤ 20 và mỗi tag ≤ 50; số lương ≥ 0, `max ≥ min` (đã có).
- Lỗi BE `409` ("tối đa 10 thông báo") hiển thị rõ cạnh nút Tạo; khi đã đủ 10 thì **disable** nút Tạo + tooltip.
- Sửa tiêu chí → hiển thị ghi chú nhỏ "Chỉ áp dụng cho việc làm đăng từ bây giờ".
- Nút *Xem thử việc đang khớp* giữ nguyên (gọi `/matches` sau khi lưu).

**`SaveSearchAsAlertButton`** (trang Search): nút "🔔 Nhận thông báo cho tìm kiếm này" cạnh thanh bộ lọc, **ẩn** khi chưa có tiêu chí nào. Click → nếu chưa đăng nhập đi `/login?redirect=…`; nếu đã đăng nhập `navigate('/dashboard/job-alerts?new=1&query=…&location=HN&tags=java,spring&minSalary=…')`. `JobAlertsPage` đọc query string → prefill form (đã validate/làm sạch: bỏ giá trị lạ, giới hạn độ dài), `scrollIntoView` form. Không auto-submit.

**Chuông thông báo (Phase 1) cho `JOB_ALERT`:** icon 🔔/💼, tiêu đề "5 việc làm mới phù hợp với "Java HN"", click → `/dashboard/job-alerts?alert={id}` ⇒ trang mở sẵn tab **Việc mới** của alert đó, cuộn tới thẻ và nhấn nổi bật 2 giây.

**`/job-alerts/unsubscribe?token=…`** (công khai, không cần đăng nhập): màn hình xác nhận "Bạn muốn ngừng nhận thông báo này?" → nút **Xác nhận** → `POST /job-alerts/unsubscribe?token=…` → trạng thái *Thành công* ("Đã tắt. Bạn có thể bật lại bất cứ lúc nào trong Tài khoản → Thông báo việc làm") / *Link không hợp lệ*. Dùng `axios` thường (không phụ thuộc JWT); tự động không gọi khi thiếu `token`.

### 4.3 State & API

| Hành động | API | Ghi chú |
|---|---|---|
| Tải danh sách | `GET /job-alerts` | đã có |
| Tạo / sửa | `POST` / `PUT /job-alerts[/{id}]` | payload thêm `frequency` |
| Bật/tắt nhanh | `PUT` với `active` | optimistic UI + rollback khi lỗi |
| Việc mới | `GET /job-alerts/{id}/new-matches?page&size=20` | gộp trang; dedupe theo `job.id` |
| Xem thử đang khớp | `GET /job-alerts/{id}/matches` | đã có |
| Huỷ từ email | `POST /job-alerts/unsubscribe?token=` | công khai |

Cập nhật `useJobAlerts`: thêm `newMatches: Record<number, {items, page, hasNext, loading}>` và `loadNewMatches(alertId, page)`. Khi nhận push WebSocket loại `JOB_ALERT` (qua `NotificationContext` Phase 1) và đang mở đúng alert đó ⇒ `reload` badge/tab Việc mới.

### 4.4 Types

```ts
export type AlertFrequency = 'INSTANT' | 'DAILY' | 'WEEKLY';
export interface JobAlertRequest { /* hiện có */ frequency?: AlertFrequency; }
export interface JobAlertResponse extends JobAlertRequest {
  /* hiện có */ frequency: AlertFrequency; lastNotifiedAt?: string; newMatchesLast7Days: number;
}
```

### 4.5 Khả năng truy cập & UX

Switch/Radio có label và `aria-checked`; badge "+3" có `aria-label="3 việc mới trong 7 ngày"`; tab dùng `role="tablist"`; trạng thái rỗng: *Việc mới* → "Chưa có việc mới phù hợp. Chúng tôi sẽ thông báo ngay khi có."; *Đang khớp* → "Hiện chưa có việc nào khớp — thử nới tiêu chí".

---

## 5. ✅ Acceptance Criteria & Test Checklist

### 5.1 Acceptance Criteria (Definition of Done)

- [ ] Tạo alert (tần suất `INSTANT`), company đăng job khớp → trong ≤ 10 phút candidate có **1** thông báo `JOB_ALERT` (chuông real-time; email nếu đã bật) nêu đúng số lượng và tên job.
- [ ] Job đăng **trước** khi tạo alert **không** sinh thông báo.
- [ ] Job `draft` → `published` sau vài ngày vẫn được thông báo (nhờ `published_at`).
- [ ] Cùng một (alert, job) **không bao giờ** thông báo lần 2, dù chạy lại kỳ, admin chạy thủ công, hoặc job bị sửa.
- [ ] Alert có sẵn trước migration **không** nhận dồn job cũ ở lần chạy đầu.
- [ ] Kết quả `JobAlertMatcher` ≡ `JobSpecification` trên bộ dữ liệu parity.
- [ ] Public Search, preview và scheduler đều loại job không `published` hoặc đã hết deadline; job thoả thuận không khớp khi có filter lương.
- [ ] 1 alert lỗi không làm hỏng các alert khác trong lô; alert đó được thử lại ở kỳ sau.
- [ ] 2 instance chạy đồng thời ⇒ mỗi kỳ chỉ 1 instance xử lý (ShedLock), không có thông báo trùng.
- [ ] Runner không phát sinh query theo từng alert/job (kiểm bằng đếm query ≤ hằng số theo lô).
- [ ] Huỷ đăng ký từ email hoạt động 1 chạm, không cần đăng nhập, an toàn trước bộ quét link.
- [ ] `app.job-alert.enabled=false` ⇒ không có thông báo nào được sinh; API CRUD vẫn hoạt động.
- [ ] Không test nào gọi SMTP/Telegram thật.

### 5.2 Happy path

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| H1 | 1 alert, 3 job mới khớp | 1 `notifications` (`JOB_ALERT`), `payload.total=3`, 3 dòng `job_alert_matches`, `last_checked_at` = giờ chạy |
| H2 | `DAILY` 08:00 | Chạy đúng giờ `Asia/Ho_Chi_Minh`; digest gom job của 24h |
| H3 | Không có job khớp | Không tạo thông báo; `last_checked_at` vẫn được nâng |
| H4 | Nhiều alert khớp cùng 1 job (khác alert) | Mỗi alert 1 digest riêng (cùng job nằm ở cả hai, `job_alert_matches` có 2 dòng) |
| H5 | `GET /job-alerts/{id}/new-matches` | Đúng job đã gửi, `matched_at DESC`, phân trang |
| H6 | Sửa tiêu chí alert | `last_checked_at = now()`; không gửi job cũ theo tiêu chí mới |
| H7 | User tắt EMAIL cho `JOB_ALERT` (Phase 1 settings) | Chỉ IN_APP; vẫn tạo `job_alert_matches` |
| H8 | Admin `POST /admin/job-alerts/run` | Lấy cùng ShedLock với scheduler, trả thống kê và có dòng trong `job_alert_runs` |

### 5.3 Edge cases & lỗi

| # | Tình huống | Kỳ vọng |
|---|---|---|
| E1 | Server tắt qua 08:00, bật lại 10:00 | Kỳ chạy kế (`INSTANT` hoặc `DAILY` hôm sau) bù đủ job nhờ watermark, không mất job |
| E2 | Job commit *sau* khi runner đọc (độ trễ commit) | Kỳ sau bắt được nhờ `overlap`; không gửi trùng nhờ khoá chính |
| E3 | Cron chạy 2 lần liên tiếp (hoặc admin chạy chồng) | Lần 2: `INSERT … ON CONFLICT` không trả dòng ⇒ không thông báo |
| E4 | Lỗi giữa chừng khi tạo `Notification` | Transaction của alert đó rollback (cả `job_alert_matches`); `last_checked_at` không đổi; kỳ sau gửi đúng 1 lần |
| E5 | Lỗi `NotificationService` cho 1 alert trong lô 500 | 499 alert còn lại xử lý bình thường; `alerts_failed=1`; run `PARTIAL` |
| E6 | Job `paused → published` lại | `published_at` không đổi ⇒ không báo lại |
| E7 | Job `deadline` đã qua | Không khớp |
| E8 | Job `closed`/`expired`/`draft` | Không khớp |
| E9 | Job bị sửa (đổi tag) sau khi đã gửi | Không gửi lại; nếu sau sửa mới khớp một alert *khác* chưa từng gửi và còn trong cửa sổ ⇒ có thể gửi 1 lần (chấp nhận) |
| E10 | Ứng viên đã nộp CV cho job khớp | Job bị loại khỏi digest; vẫn không tạo `job_alert_matches` cho cặp đó |
| E11 | Alert bị xoá giữa lúc runner đang xử lý | Bỏ qua êm (FK), không ghi lỗi, không sinh thông báo mồ côi |
| E12 | Alert bị tắt (`active=false`) giữa kỳ | Không được xử lý ở kỳ sau. Quy ước: **bật lại** đặt `last_checked_at = now()` (tắt = không muốn nhận, không bù job đăng trong lúc tắt) |
| E13 | Tài khoản bị xoá | `ON DELETE CASCADE` dọn alert, matches |
| E14 | Alert không tiêu chí (dữ liệu cũ) | Runner bỏ qua alert rỗng (đánh dấu log), không "khớp tất cả" |
| E15 | `minSalary` đặt, job không khai lương | Không khớp (đúng hành vi Search) |
| E16 | Có > `max-jobs-per-run` job mới | Chỉ xử lý phần giới hạn, log WARN; `last_checked_at` chỉ nâng tới `published_at` của job cuối được xử lý ⇒ phần còn lại kỳ sau (không mất) |
| E17 | Vượt `max-notifications-per-run` | Dừng, run `PARTIAL`, log ERROR (cầu chì chống bug gây bão thông báo) |
| E18 | 2 instance cùng chạy | Chỉ 1 chiếm khoá; nếu `lockAtMostFor` hết hạn giữa chừng, dữ liệu vẫn đúng nhờ khoá chính |
| E19 | Kỳ chạy kéo dài hơn khoảng `INSTANT` | `fixedDelay` ⇒ không chồng chéo; ShedLock chặn nhiều instance |
| E20 | Tạo alert thứ 11 | `409` |
| E21 | `minSalary > maxSalary`, `location` lạ, không tiêu chí | `400` |
| E22 | Unsubscribe: token sai chữ ký / bị sửa / của alert khác | `400`, không đổi dữ liệu |
| E23 | Unsubscribe bấm 2 lần | Cả 2 `200`, alert vẫn `active=false` |
| E24 | Bộ quét link `GET` trang unsubscribe | Chỉ hiện trang xác nhận, **không** huỷ |
| E24b | User bật lại alert rồi click link email cũ | `unsubscribeVersion` cũ bị từ chối; alert vẫn active |
| E25 | Email chặn/hỏng | Theo Phase 1: `RETRY_WAIT` → `FAILED`; IN_APP vẫn tới; `job_alert_matches` giữ nguyên (không gửi lại job) |
| E26 | `JobRedis` cache lệch | Runner đọc PostgreSQL, không bị ảnh hưởng |
| E27 | Candidate đổi sang role khác / tài khoản company có alert (dữ liệu bẩn) | Alert không được xử lý nếu account không phải `ROLE_USER` |
| E28 | Đồng hồ lệch giữa instance ≤ 5 phút | Không mất/trùng (overlap + PK) |
| E29 | 10.000 alert × 500 job mới | Hoàn tất trong ngân sách thời gian đã định (xem 5.4 hiệu năng); số query ≈ `2 + 3·(N/500)` |
| E30 | `app.job-alert.enabled=false` | Scheduler return sớm, ghi run `SKIPPED` |
| E31 | Admin manual run khi scheduler cùng frequency đang giữ lock | `409`, không tạo run thứ hai |
| E32 | Tạo/sửa job `salaryNegotiable=true`, lương null | Hợp lệ; Search/Alert có filter lương không khớp job đó |

### 5.4 Test plan

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Unit | JUnit5 (không Spring) | Matcher; digest + hash dedupe trên toàn bộ sorted IDs; salary conditional validation; unsubscribe round-trip/sai chữ ký/sai version |
| **Parity** | Testcontainers PostgreSQL | `JobAlertMatcher` ≡ `JobSpecification` trên ≥ 30 job × ≥ 20 alert phủ mọi nhánh null/enum/tag/lương |
| Repository | Testcontainers | Chạy Flyway tuần tự `V1→V6` rồi Hibernate `validate`; native insert returning, keyset, watermark, backfill và query visibility/deadline |
| Integration | `@SpringBootTest` + `Clock` giả (`MutableClock`) | Kịch bản E1–E6, E10–E12, E16: tạo job/alert, tiến giờ, gọi `runner.run(...)`, kiểm `notifications` & `job_alert_matches` |
| Transaction | `@SpringBootTest` | E4/E5: ép `NotificationService` ném lỗi cho 1 alert ⇒ chỉ alert đó rollback; kiểm không có `job_alert_matches` mồ côi |
| Concurrency | `ExecutorService` | Hai runner/admin+scheduler: cùng lock hoặc unique match bảo đảm một digest cho mỗi tập job; manual run bận trả 409 |
| Hiệu năng / N+1 | Hibernate `Statistics` hoặc `datasource-proxy` | Seed 10.000 alert, 500 job: `prepareStatementCount` ≤ ngưỡng cố định theo lô; thời gian chạy trong ngân sách (đặt sau lần đo đầu) |
| API | `MockMvc` | Validation 400/409/403/404, frequency null→DAILY, new-matches, unsubscribe query/form/version + CSRF exemption, admin role/lock conflict |
| FE | Vitest + Testing Library | Bổ sung runner/dependencies; validation, prefill, frequency luôn có khi submit, active optimistic rollback, unsubscribe 3 trạng thái |
| Thủ công | — | Tạo alert `INSTANT`, đăng job khớp bằng tài khoản company, đợi ≤ 5 phút: chuông nhảy + email Mailtrap; bấm link huỷ trong email |

### 5.5 Thứ tự triển khai gợi ý (mỗi bước commit riêng)

1. `V6` migration + `Job.publishedAt` + `JobAlert` (frequency, watermark, unsubscribe version) + test Flyway `V1→V6`/Hibernate validate.
2. Đặt `published_at` + conditional salary validation trong create/edit job + test.
3. Sửa public `JobSpecification` visibility/deadline; làm `JobAlertMatcher` + parity test sớm.
4. Dùng `NotificationService.create` và delivery recovery đã hoàn thành ở Phase 1 để giữ runner atomic.
5. `JobAlertRunner` + `JobAlertBatchProcessor` + native insert + test tích hợp với `Clock` giả.
6. `JobAlertRunCoordinator` + ShedLock dùng chung cho scheduler/admin + số liệu/log.
7. API: validation mới, `frequency`, `new-matches`, `newMatchesLast7Days` (1 query gộp).
8. FE: types/service/hook → form (tần suất, validate) → thẻ + tab "Việc mới" → nút lưu từ Search → trang unsubscribe.
9. Versioned unsubscribe token + API query/form + header `List-Unsubscribe` + template email.
10. Bộ test edge case & hiệu năng.

### 5.6 Rủi ro / lưu ý

- **Spam khi 1 user có nhiều alert chồng nhau**: v1 gửi 1 digest/alert (tối đa 10/kỳ/user). Nếu phản hồi người dùng xấu, bước tiếp theo là **gom theo tài khoản** (1 digest/user/kỳ liệt kê theo alert). Thiết kế `job_alert_matches` đã cho phép đổi mà không migrate.
- **Trùng với `JobCreatedEvent` (follower)**: ứng viên vừa follow công ty vừa có alert khớp sẽ nhận 2 thông báo cho cùng job. Chưa xử lý ở v1; hướng giảm: bỏ qua job của công ty user đang follow trong digest alert, hoặc ngược lại.
- **Quy mô ghép**: `O(N·K)` so khớp CPU là ổn tới vài chục nghìn alert. Vượt ngưỡng đó, tiền lọc theo `(location, position)` bằng index trên bảng alert hoặc chuyển sang cơ chế percolator (Elasticsearch — xem [04-search-and-recommendation.md](04-search-and-recommendation.md)); `JobAlertMatcher` giữ vai trò kiểm tra cuối.
- **Semantics bị khoá bởi `JobSpecification`**: tìm theo `query` chỉ khớp `name/industry/category`, tag phân biệt hoa thường, job không khai lương bị loại khi có lọc lương. Đây là hành vi Search hiện tại — cải thiện (chuẩn hoá tag, tìm `description`, job thoả thuận) là thay đổi **chung** cho Search + Alert, làm ở phase Search.
- **Dữ liệu cá nhân**: bộ lọc (nghề, địa điểm, lương mong muốn) phản ánh ý định tìm việc — chỉ chủ tài khoản đọc được; không đưa vào log mức `INFO`; xoá cascade khi xoá tài khoản.
- **Email/Spam compliance**: header `List-Unsubscribe` + huỷ 1 chạm là yêu cầu của Gmail/Yahoo với email hàng loạt; thiếu sẽ bị đẩy vào spam.
- **Múi giờ**: cron cố định `Asia/Ho_Chi_Minh` (không có DST); mọi mốc lưu UTC (`TIMESTAMP WITH TIME ZONE`). Nếu mở rộng sang quốc tế, giờ nhận phải theo user (→ cân nhắc Quartz, §1.4a).
