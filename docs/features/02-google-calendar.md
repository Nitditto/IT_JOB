# Phase 2 — Google Calendar Integration

## Mục tiêu

Khi `Interview` được tạo/sửa/huỷ, tự tạo/sửa/xoá event thật trên Google Calendar của candidate + interviewer (nếu họ đã kết nối). Fallback `.ics` qua email nếu chưa kết nối — không phụ thuộc cứng vào OAuth.

## Điều kiện tiên quyết

Phase 0 (entity `Interview` tồn tại), Phase 1A (Email, để gửi `.ics` fallback).

## Kiến trúc / package structure

```
com.example.demo.calendar
├── GoogleOAuthController.java        # REST: bắt đầu OAuth flow, xử lý callback
├── GoogleCalendarService.java        # interface
├── GoogleCalendarServiceImpl.java    # gọi Google Calendar API
├── GoogleCalendarCredential.java     # entity — lưu access/refresh token đã mã hoá
└── IcsFileGenerator.java             # tạo file .ics cho fallback email
```

## Bước 1 — Đăng ký Google Cloud

Ngoài code: tạo project trên Google Cloud Console → enable **Google Calendar API** → tạo OAuth 2.0 Client ID (loại "Web application") → set Authorized redirect URI = `https://<domain>/calendar/oauth/callback` (hoặc `http://localhost:8080/...` cho dev). Lấy `client_id` + `client_secret`.

## Bước 2 — Entity `GoogleCalendarCredential`

```java
@Entity
@Table(name = "google_calendar_credentials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GoogleCalendarCredential {
    @Id
    private Long accountId;              // 1-1 với Account, dùng accountId làm PK luôn — không cần id riêng

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedAccessToken;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedRefreshToken;

    private Instant accessTokenExpiresAt;
}
```

**Mã hoá:** dùng `Jasypt` hoặc tự implement AES/GCM field-level encryption qua JPA `AttributeConverter<String, String>` — không lưu token dạng plaintext dù là trong DB nội bộ. Key mã hoá đọc từ biến môi trường (`APP_ENCRYPTION_KEY`), không hardcode, không commit.

```java
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    // AES/GCM encrypt/decrypt dùng key từ @Value hoặc Environment — xem code mẫu Jasypt docs
}
```
Áp `@Convert(converter = EncryptedStringConverter.class)` lên 2 field token.

Migration `V5__create_google_calendar_credentials.sql`.

## Bước 3 — OAuth2 flow

Dùng thư viện chính thức Google: `com.google.api-client:google-api-client`, `com.google.oauth-client:google-oauth-client-jetty` (hoặc tự build authorization URL bằng tay nếu muốn tránh dependency nặng — Calendar API chỉ cần REST đơn giản qua `RestClient`, không bắt buộc SDK).

1. `GET /calendar/oauth/authorize-url` (yêu cầu đăng nhập) → backend build URL:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=...&redirect_uri=...&response_type=code&
     scope=https://www.googleapis.com/auth/calendar.events&
     access_type=offline&prompt=consent&state=<accountId ký HMAC để verify callback>
   ```
   `access_type=offline` **bắt buộc** để nhận `refresh_token` (không có flag này Google chỉ trả `access_token` sống 1h, không refresh được).
2. Frontend redirect user sang URL đó.
3. Google redirect về `GET /calendar/oauth/callback?code=...&state=...` → verify `state` khớp accountId đăng nhập → backend đổi `code` lấy token:
   ```
   POST https://oauth2.googleapis.com/token
   grant_type=authorization_code&code=...&client_id=...&client_secret=...&redirect_uri=...
   ```
   → response có `access_token`, `refresh_token`, `expires_in` → mã hoá, lưu vào `GoogleCalendarCredential`.
4. `DELETE /calendar/oauth/disconnect` — cho user hủy kết nối, xoá record credential (không revoke token bên Google tự động, nhưng đủ để dừng đồng bộ; có thể gọi thêm `https://oauth2.googleapis.com/revoke?token=...` nếu muốn revoke triệt để).

## Bước 4 — Tạo/sửa/huỷ event khi Interview thay đổi

`GoogleCalendarServiceImpl`:
```java
public interface GoogleCalendarService {
    Optional<String> createEvent(Interview interview);   // trả googleEventId nếu thành công
    void updateEvent(Interview interview);
    void deleteEvent(Interview interview);
}
```

Gọi Calendar API v3 REST trực tiếp (không cần SDK để giảm dependency):
```
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
Authorization: Bearer <access_token>
{
  "summary": "Phỏng vấn: <jobName>",
  "start": {"dateTime": "...", "timeZone": interview.getTimezone()},
  "end": {...},
  "location": interview.getLocation(),
  "attendees": [{"email": candidateEmail}, {"email": interviewer1Email}, ...],
  "reminders": {"useDefault": false, "overrides": [{"method": "popup", "minutes": 30}]}
}
```
Response có `id` → lưu vào `Interview.googleEventId`.

**Trigger đúng chỗ:** lắng nghe `InterviewScheduledEvent`/`InterviewCancelledEvent` từ Phase 0 (tương tự `NotificationEventListener`) — tạo `GoogleCalendarEventListener` riêng, `@Async` + `AFTER_COMMIT`, **không gọi trực tiếp trong `InterviewService`** để giữ service không phụ thuộc Google API (dễ test, dễ tắt/bật).

```java
@Component
@RequiredArgsConstructor
public class GoogleCalendarEventListener {
    private final GoogleCalendarService googleCalendarService;
    private final GoogleCalendarCredentialRepository credentialRepository;
    private final InterviewRepository interviewRepository;
    private final IcsFileGenerator icsFileGenerator;
    private final EmailNotificationChannel emailChannel; // dùng lại từ Phase 1

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onInterviewScheduled(InterviewScheduledEvent event) {
        Interview interview = interviewRepository.findById(event.interviewId()).orElseThrow();
        boolean hasCandidateCalendar = credentialRepository.existsById(interview.getAccountId());

        if (hasCandidateCalendar) {
            googleCalendarService.createEvent(interview)
                .ifPresent(eventId -> { interview.setGoogleEventId(eventId); interviewRepository.save(interview); });
        } else {
            // Bước 8: fallback .ics — không phụ thuộc cứng vào OAuth
            sendIcsFallback(interview);
        }
    }
}
```

## Bước 5 — Refresh access token khi hết hạn

Access token Google sống ~1h. Trước mỗi lần gọi Calendar API, check `accessTokenExpiresAt`:
```java
if (credential.getAccessTokenExpiresAt().isBefore(Instant.now().plusSeconds(60))) {
    refreshAccessToken(credential); // POST oauth2.googleapis.com/token với grant_type=refresh_token
}
```
Xử lý lỗi:
- HTTP 401 từ Google → refresh_token đã bị revoke (user tự rút quyền bên Google Account settings) → xoá `GoogleCalendarCredential`, coi như chưa kết nối, chuyển fallback `.ics` cho lần sau.
- HTTP 429 (quota) → retry với backoff (giống pattern ở `NotificationDispatcher`), tối đa 3 lần rồi fallback `.ics`.

## Bước 6 — Timezone & Multi-interviewer

- `Interview.timezone` (đã có từ Phase 0) dùng trực tiếp trong field `start.timeZone`/`end.timeZone` của Calendar API — Google tự hiển thị đúng giờ local cho mỗi attendee dựa trên timezone của **họ**, không cần tính toán offset tay.
- Multi-interviewer: `Interview.interviewerAccountIds` (Set, đã có từ Phase 0) → map từng ID sang email qua `AccountRepository.findAllById(...)` (batch, đúng pattern chống N+1 đã dùng ở CVServiceImpl) → add vào mảng `attendees`.

## Bước 7 — Reminder buffer

Google tự nhắc theo `reminders.overrides` (bước 4). Kết hợp thêm: `InterviewReminderScheduledJob` ở Phase 6.2 tự bắn `NotificationEventType.INTERVIEW_REMINDER` qua Notification system (Phase 1) trước 1 ngày — 2 lớp nhắc (Google popup + app notification) cho chắc, vì Google Calendar reminder chỉ hoạt động nếu user có mở Google Calendar app/web.

## Bước 8 — Fallback `.ics`

```java
public class IcsFileGenerator {
    public String generate(Interview interview, String candidateName, String jobName) {
        return """
            BEGIN:VCALENDAR
            VERSION:2.0
            BEGIN:VEVENT
            SUMMARY:Phỏng vấn: %s
            DTSTART:%s
            DTEND:%s
            LOCATION:%s
            END:VEVENT
            END:VCALENDAR
            """.formatted(jobName, toIcsDate(interview.getScheduledAt()), ..., interview.getLocation());
    }
}
```
Đính kèm file này vào email `interview-scheduled` (template đã có từ Phase 1A) qua `MimeMessageHelper.addAttachment(...)`.

## Nâng cao (optional, không bắt buộc cho Definition of Done)

- **2.9 Google push notification**: đăng ký `watch` channel qua Calendar API để nhận webhook khi user tự sửa event bên Google — đồng bộ ngược lại `Interview.status`. Phức tạp (cần verify channel, renew mỗi 7 ngày), chỉ làm khi có nhu cầu thật.
- **2.10 Outlook/Microsoft Graph**: cùng pattern OAuth2 + REST, khác endpoint (`login.microsoftonline.com`, `graph.microsoft.com/v1.0/me/events`) — làm sau khi Google ổn định, tái sử dụng gần hết kiến trúc (`CalendarService` interface chung, thêm `MicrosoftCalendarServiceImpl`).

## Config cần thêm

```properties
app.google.client-id=${GOOGLE_CLIENT_ID:}
app.google.client-secret=${GOOGLE_CLIENT_SECRET:}
app.google.redirect-uri=${GOOGLE_REDIRECT_URI:http://localhost:8080/calendar/oauth/callback}
app.encryption.key=${APP_ENCRYPTION_KEY:}   # AES key cho EncryptedStringConverter
```

## Testing checklist

- [ ] Unit test `EncryptedStringConverter` — encrypt rồi decrypt ra đúng giá trị gốc.
- [ ] Unit test `GoogleCalendarEventListener` — mock `GoogleCalendarService`, verify nhánh "có credential" gọi `createEvent`, nhánh "chưa có" gọi fallback `.ics`.
- [ ] Mock toàn bộ HTTP call ra Google trong test (không gọi Google API thật trong CI — cần tài khoản Google test riêng nếu muốn test thật, làm tay không phải CI).
- [ ] Test tay: connect Google Calendar thật (tài khoản dev), tạo Interview, confirm event xuất hiện trên Google Calendar thật với đúng giờ/timezone.
- [ ] Test tay: revoke quyền truy cập app từ Google Account settings → tạo Interview mới → confirm hệ thống fallback `.ics` đúng, không crash.

## Definition of Done

- [ ] User connect Google Calendar thành công, token lưu mã hoá.
- [ ] Tạo Interview → event xuất hiện đúng trên Google Calendar của candidate (và interviewer nếu họ cũng connect).
- [ ] Huỷ Interview → event bị xoá trên Google Calendar.
- [ ] User chưa connect → nhận được `.ics` qua email, không lỗi, không exception rơi ra ngoài.

## Rủi ro / lưu ý

- **Không bao giờ log access/refresh token** ra console/log file dù ở môi trường dev.
- Google Calendar API free tier có quota (mặc định khá cao nhưng vẫn có) — nếu app scale lớn, theo dõi quota qua Google Cloud Console, cần thì xin tăng quota trước khi hết.
- `state` param trong OAuth flow phải ký (HMAC) hoặc mã hoá — nếu chỉ truyền `accountId` trần, ai đó có thể giả mạo callback gán token của mình vào account người khác (CSRF-like attack trên OAuth flow).
